# =============================================================================
# Machine-Learning-Ansatz zur IBNR-Reservierung  (R-Version, nur Basis-R)
# =============================================================================
#
# Nachbau von Balona, C. & Richman, R. (2020): "The Actuary and IBNR Techniques:
# A Machine Learning Approach" (SSRN 3697256), Abschnitte 2-5, plus Erweiterungen.
# Inhaltlich identisch zur Python-Version ibnr_ml.py.
#
# Grundidee
# ---------
# Klassische Verfahren (Chain Ladder, Bornhuetter-Ferguson, Generalised Cape Cod)
# haben "Hyperparameter" (Anzahl Perioden fuer die LDFs, Ausreisser-Ausschluss,
# A-priori-Schadenquote, Decay ...). Statt diese per Expertenschaetzung zu setzen,
# wird das Dreieck Kalenderperiode fuer Kalenderperiode "nachreserviert":
# Fit auf Delta^k, Prognose der naechsten Diagonale, Vergleich mit der tatsaechlich
# eingetretenen Diagonale k+1 (out of sample). Gewaehlt wird die Parameter-
# kombination mit dem kleinsten mittleren Score.
#
#   AvE_i^{k+1} = X_{i,j*} - Xhat^{k}_{i,j*}
#   CDR_i^{k+1} = Chat^{k+1}_{i,J} - Chat^{k}_{i,J} = AvE + dR            (Gl. 1)
#   Score_k     = sqrt( sum_i |X_ij*| e_i^2 / sum_i |X_ij*| )             (Gl. 2)
#   S^M         = Mittelwert der Score_k ueber die Trainings-Kalenderperioden
#
# Erweiterungen (Standard = Paper-Verhalten)
# ------------------------------------------
# 1. CDR_alpha = AvE + alpha * dR                     (Abschn. 2.2)
# 2. Bias-Strafterm im Score                          (Abschn. 4.2)
# 3. LDF-Optionen: simple / median, Anfalljahresgewichte (Abschn. 2.3.1)
# 4. Zwei-Stufen-Suche                                (Abschn. 4.2)
# 5. Bayes'sche Optimierung (TPE, eigene Implementierung) inkl.
#    anfalljahresabhaengiger A-priori-Schadenquoten    (Abschn. 6)
# 6. Bias-Varianz-Zerlegung des Out-of-Sample-MSE     (Abschn. 6)
# 7. Mack-Variationskoeffizient -> Metrikwahl         (Abschn. 6)
# 8. Zeitliche Holdout-Validierung der Metrik (alpha)
#
# Konventionen
# ------------
# * Dreiecke: Matrix (Anfallperioden x Entwicklungsperioden), kumuliert, NA = unbeobachtet.
# * Kalenderindex c ist 0-basiert wie im Paper/Python: Zelle [i, j] (R-Indizes, 1-basiert)
#   liegt auf Diagonale c = (i - 1) + (j - 1). Delta^c = {C_ij : c(i, j) <= c}.
# * Kein Tail-Faktor: nicht schaetzbare LDFs = 1 (wie chainladder ohne Tail).
# =============================================================================


# -----------------------------------------------------------------------------
# 1. Hilfsfunktionen fuer Dreiecke
# -----------------------------------------------------------------------------

#' Delta^c: nur Zellen mit (i-1)+(j-1) <= c bleiben sichtbar
triangle_at <- function(full, c) {
  out <- full
  out[(row(full) - 1) + (col(full) - 1) > c] <- NA
  out
}

#' Letzter beobachteter Wert und Entwicklungsindex (1-basiert, 0 = keine Beobachtung)
latest_diagonal <- function(tri) {
  j_last <- apply(!is.na(tri), 1, function(r) if (any(r)) max(which(r)) else 0L)
  vals <- rep(NA_real_, nrow(tri))
  has <- j_last > 0
  vals[has] <- tri[cbind(which(has), j_last[has])]
  list(value = vals, j = j_last)
}

to_incremental <- function(cum) {
  inc <- cum
  inc[, -1] <- cum[, -1] - cum[, -ncol(cum)]
  inc
}

#' Praemiensimulation wie im Paper (Abschn. 4): Regression der Endschaeden auf das
#' Anfalljahr, Residuen einmal bootstrappen, Praemie = (C_iJ + eps*) / LR.
simulate_premium <- function(ultimates, target_lr = 0.60, seed = 0) {
  set.seed(seed)
  t <- seq_along(ultimates) - 1
  resid <- residuals(lm(ultimates ~ t))
  (ultimates + sample(resid, length(resid), replace = TRUE)) / target_lr
}


# -----------------------------------------------------------------------------
# 2. Modellspezifikation
# -----------------------------------------------------------------------------

#' Ein Punkt im Modellraum M
#'
#' method    : "CL", "BF" oder "GCC"
#' n_periods : Anzahl juengster Faktoren je Spalte fuer die LDFs (-1 = alle)
#' drop_high : hoechsten Faktor je Spalte ausschliessen
#' drop_low  : niedrigsten Faktor je Spalte ausschliessen
#' average   : "volume" (Paper), "simple" oder "median"              [Erweiterung]
#' ay_decay  : Gewicht decay^(Alter) je Faktor (1 = aus)              [Erweiterung]
#' apriori   : A-priori-Schadenquote (BF), Skalar oder Vektor je AJ   [Erweiterung]
#' decay     : Decay gamma des Generalised Cape Cod (0 -> CL, 1 -> Cape Cod)
model_spec <- function(method = "CL", n_periods = -1L, drop_high = FALSE, drop_low = FALSE,
                       average = "volume", ay_decay = 1, apriori = NULL, decay = NULL) {
  list(method = method, n_periods = as.integer(n_periods), drop_high = drop_high,
       drop_low = drop_low, average = average, ay_decay = ay_decay,
       apriori = apriori, decay = decay)
}

.pybool <- function(x) if (isTRUE(x)) "True" else "False"

spec_label <- function(s) {
  out <- sprintf("%s(n=%d, dh=%s, dl=%s", s$method, s$n_periods, .pybool(s$drop_high),
                 .pybool(s$drop_low))
  if (s$average != "volume") out <- paste0(out, ", avg=", s$average)
  if (s$ay_decay != 1) out <- paste0(out, ", ay_decay=", sprintf("%g", s$ay_decay))
  if (s$method == "BF") {
    out <- paste0(out, if (length(s$apriori) > 1) ", apriori=vector"
                  else sprintf(", apriori=%.2f", s$apriori))
  }
  if (s$method == "GCC") out <- paste0(out, sprintf(", decay=%.2f", s$decay))
  paste0(out, ")")
}

spec_key <- function(s) {
  paste(s$method, s$n_periods, s$drop_high, s$drop_low, s$average,
        sprintf("%.10g", s$ay_decay),
        paste(sprintf("%.10g", s$apriori), collapse = "/"),
        paste(sprintf("%.10g", s$decay), collapse = "/"), sep = "|")
}

ldf_key <- function(s) {
  paste(s$n_periods, s$drop_high, s$drop_low, s$average, sprintf("%.10g", s$ay_decay), sep = "|")
}


# -----------------------------------------------------------------------------
# 3. Reservierungsverfahren (Abschn. 2.3)
# -----------------------------------------------------------------------------

#' Loss Development Factors f_j (Gl. 3 / Gl. 4)
#'
#' drop_scope = "all"   : Hoechst-/Tiefstwert unter ALLEN Faktoren der Spalte, Ausschluss nur
#'                        bei >= min_factors_for_drop (3) Faktoren -- exakt chainladder 0.7.x,
#'                        womit das Paper gerechnet hat.
#' drop_scope = "window": Hoechst-/Tiefstwert innerhalb des n_periods-Fensters.
estimate_ldfs <- function(tri, n_periods = -1L, drop_high = FALSE, drop_low = FALSE,
                          average = "volume", ay_decay = 1, drop_scope = "all",
                          min_factors_for_drop = 3L) {
  n_dev <- ncol(tri)
  f <- rep(1, n_dev - 1)
  for (j in seq_len(n_dev - 1)) {
    rows_all <- which(!is.na(tri[, j + 1]) & !is.na(tri[, j]) & tri[, j] != 0)
    if (length(rows_all) == 0) next
    rows <- if (!is.null(n_periods) && n_periods > 0) tail(rows_all, n_periods) else rows_all
    num_all <- tri[rows_all, j + 1]
    den_all <- tri[rows_all, j]
    lr_all <- num_all / den_all
    w <- as.numeric(rows_all %in% rows)
    if (ay_decay != 1) w <- w * ay_decay^(max(rows_all) - rows_all)
    pool <- if (drop_scope == "all") rep(TRUE, length(rows_all)) else w > 0
    if (sum(pool) >= min_factors_for_drop) {
      pidx <- which(pool)
      if (drop_high) w[pidx[which.max(lr_all[pool])]] <- 0
      if (drop_low)  w[pidx[which.min(lr_all[pool])]] <- 0
    }
    keep <- w > 0
    if (!any(keep)) next
    num <- num_all[keep]; den <- den_all[keep]; wk <- w[keep]
    f[j] <- switch(average,
                   volume = sum(wk * num) / sum(wk * den),
                   simple = sum(wk * num / den) / sum(wk),
                   median = median(num / den),
                   stop("unbekannter average-Typ: ", average))
  }
  f
}

#' Transparenz: welche individuellen Faktoren f_ij flossen in die LDFs ein?
#'
#' Gleiche Logik wie estimate_ldfs(). Liefert je Zelle (Anfallperiode x Uebergang j -> j+1):
#'   ratio  : individueller Faktor C_{i,j+1} / C_{i,j}
#'   status : "verwendet", "ausserhalb" (nicht in den juengsten n_periods),
#'            "hoch" (als hoechster Faktor ausgeschlossen), "niedrig" (als niedrigster ausgeschlossen)
#'   weight : Gewicht im Mittel (0 = nicht verwendet)
#'   in_window : liegt der Faktor im n_periods-Fenster? (Ein ausgeschlossener Hoechst-/Tiefstwert
#'               ausserhalb des Fensters veraendert die LDFs nicht -- Paper-/chainladder-0.7-Logik.)
#' sowie die daraus berechneten LDFs (identisch mit estimate_ldfs).
ldf_selection <- function(tri, n_periods = -1L, drop_high = FALSE, drop_low = FALSE,
                          average = "volume", ay_decay = 1, drop_scope = "all",
                          min_factors_for_drop = 3L) {
  n_dev <- ncol(tri)
  ratio <- matrix(NA_real_, nrow(tri), n_dev - 1)
  status <- matrix(NA_character_, nrow(tri), n_dev - 1)
  weight <- matrix(NA_real_, nrow(tri), n_dev - 1)
  in_window <- matrix(NA, nrow(tri), n_dev - 1)
  for (j in seq_len(n_dev - 1)) {
    rows_all <- which(!is.na(tri[, j + 1]) & !is.na(tri[, j]) & tri[, j] != 0)
    if (length(rows_all) == 0) next
    rows <- if (!is.null(n_periods) && n_periods > 0) tail(rows_all, n_periods) else rows_all
    lr_all <- tri[rows_all, j + 1] / tri[rows_all, j]
    w <- as.numeric(rows_all %in% rows)
    in_window[rows_all, j] <- w > 0
    st <- ifelse(w > 0, "verwendet", "ausserhalb")
    if (ay_decay != 1) w <- w * ay_decay^(max(rows_all) - rows_all)
    pool <- if (drop_scope == "all") rep(TRUE, length(rows_all)) else w > 0
    if (sum(pool) >= min_factors_for_drop) {
      pidx <- which(pool)
      if (drop_high) { k <- pidx[which.max(lr_all[pool])]; w[k] <- 0; st[k] <- "hoch" }
      if (drop_low)  { k <- pidx[which.min(lr_all[pool])]; w[k] <- 0; st[k] <- "niedrig" }
    }
    ratio[rows_all, j] <- lr_all
    status[rows_all, j] <- st
    weight[rows_all, j] <- w
  }
  list(ratio = ratio, status = status, weight = weight, in_window = in_window,
       ldf = estimate_ldfs(tri, n_periods, drop_high, drop_low, average, ay_decay,
                           drop_scope, min_factors_for_drop))
}

#' Gemeldeter Anteil beta_j = 1 / F_{j,J}
pattern_from_ldfs <- function(f) 1 / c(rev(cumprod(rev(f))), 1)

#' Endschaetzung nach CL, BF oder GCC:  Chat_iJ = C_ij* + (1 - beta_j*) * U_i
#'   CL : U_i = C_ij* / beta_j*
#'   BF : U_i = ULR_i * pi_i
#'   GCC: U_i = ULR_i^GCC * pi_i  (Gl. 6)
project <- function(tri, spec, premium = NULL, ldf = NULL) {
  if (is.null(ldf)) {
    ldf <- estimate_ldfs(tri, spec$n_periods, spec$drop_high, spec$drop_low,
                         spec$average, spec$ay_decay)
  }
  beta <- pattern_from_ldfs(ldf)
  ld <- latest_diagonal(tri)
  latest <- ld$value
  jl <- ld$j
  present <- jl > 0
  b <- rep(NA_real_, length(latest))
  b[present] <- beta[jl[present]]
  U <- switch(spec$method,
    CL = latest / b,
    BF = {
      if (is.null(premium)) stop("BF benoetigt Praemien")
      spec$apriori * premium
    },
    GCC = {
      if (is.null(premium)) stop("GCC benoetigt Praemien")
      idx <- which(present)
      used <- premium[idx] * b[idx]                   # "verbrauchte" Praemie
      u <- rep(NA_real_, length(latest))
      for (i in idx) {
        w <- spec$decay^abs(i - idx)                   # 0^0 = 1 -> gamma=0 liefert CL
        u[i] <- sum(latest[idx] * w) / sum(used * w) * premium[i]
      }
      u
    },
    stop("unbekannte Methode: ", spec$method))
  U[!present] <- NA
  list(ultimate = latest + (1 - b) * U, latest = latest, j_latest = jl, U = U,
       beta = beta, ldf = ldf)
}

ibnr <- function(p) p$ultimate - p$latest

#' Erwarteter kumulierter Wert C_ij fuer zukuenftiges j (vektorisiert)
#'   mode = "chainladder" (Paper): Chat_iJ * beta_j   (full_triangle_ von chainladder)
#'   mode = "consistent"          : C_ij* + (beta_j - beta_j*) * U_i
expected_cumulative <- function(p, i, j, mode = "chainladder") {
  if (mode == "chainladder") return(p$ultimate[i] * p$beta[j])
  p$latest[i] + (p$beta[j] - p$beta[p$j_latest[i]]) * p$U[i]
}


# -----------------------------------------------------------------------------
# 4. Dynamischer Backtest und Scores (Abschn. 2.2 und 3)
# -----------------------------------------------------------------------------

#' Problem-Objekt (Environment) mit Dreieck, Praemie, Trainings-/Testaufteilung
#'
#' full        : vollstaendiges Rechteck ODER nur das beobachtete Dreieck
#' valuation_c : Kalenderindex K der letzten beobachteten Diagonale
#' first_fit_c : erste Fit-Periode k_train -> Scores fuer Diagonalen k_train+1 .. K
#' expectation : "chainladder" (Paper) oder "consistent"
triangle_problem <- function(full, premium, valuation_c, first_fit_c, origins = NULL,
                             name = "", expectation = "chainladder") {
  P <- new.env()
  P$full <- full
  P$premium <- premium
  P$K <- valuation_c
  P$k_train <- first_fit_c
  P$origins <- if (is.null(origins)) as.character(seq_len(nrow(full)) - 1) else origins
  P$name <- name
  P$expectation <- expectation
  P$tri_cache <- new.env()
  P$ldf_cache <- new.env()
  P$bt_cache <- new.env()
  P
}

tri_at <- function(P, c) {
  k <- as.character(c)
  if (is.null(P$tri_cache[[k]])) P$tri_cache[[k]] <- triangle_at(P$full, c)
  P$tri_cache[[k]]
}

ldf_at <- function(P, c, spec) {
  k <- paste(c, ldf_key(spec))
  if (is.null(P$ldf_cache[[k]])) {
    P$ldf_cache[[k]] <- estimate_ldfs(tri_at(P, c), spec$n_periods, spec$drop_high,
                                      spec$drop_low, spec$average, spec$ay_decay)
  }
  P$ldf_cache[[k]]
}

true_ultimate <- function(P) P$full[, ncol(P$full)]
has_future <- function(P) !anyNA(P$full[, ncol(P$full)])

#' Nachreservierung ueber alle Trainings-Kalenderperioden (Algorithmus Abschn. 3).
#' Ergebnis wird je Spezifikation gecacht.
backtest <- function(P, spec) {
  key <- spec_key(spec)
  if (!is.null(P$bt_cache[[key]])) return(P$bt_cache[[key]])
  cals <- P$k_train:P$K
  proj <- lapply(cals, function(c) project(tri_at(P, c), spec, P$premium, ldf_at(P, c, spec)))
  names(proj) <- as.character(cals)
  n_orig <- nrow(P$full); n_dev <- ncol(P$full)
  recs <- vector("list", P$K - P$k_train)
  for (c in P$k_train:(P$K - 1)) {
    p0 <- proj[[as.character(c)]]; p1 <- proj[[as.character(c + 1)]]
    i0 <- 0:min(c, n_orig - 1)                     # 0-basiert
    j0 <- c + 1 - i0
    ok <- j0 >= 1 & j0 < n_dev                     # neue Anfallperioden ohne Vorprognose
    i <- i0[ok] + 1; j <- j0[ok] + 1               # R-Indizes
    prev <- P$full[cbind(i, j - 1)]
    actual <- P$full[cbind(i, j)] - prev
    expected <- expected_cumulative(p0, i, j, P$expectation) - prev
    ave <- actual - expected
    cdr <- p1$ultimate[i] - p0$ultimate[i]
    recs[[c - P$k_train + 1]] <- data.frame(calendar = c + 1, origin = i - 1, dev = j - 1,
                                            actual = actual, expected = expected, AvE = ave,
                                            CDR = cdr, dR = cdr - ave)
  }
  res <- list(spec = spec, records = do.call(rbind, recs), final = proj[[as.character(P$K)]])
  P$bt_cache[[key]] <- res
  res
}

#' Out-of-Sample-Bewertung gegen die tatsaechlichen Endschaeden (gelber Bereich Abb. 1)
evaluate_projection <- function(P, final) {
  err <- true_ultimate(P) - final$ultimate
  err <- err[!is.na(err)]                  # nur Anfallperioden, die zum Stichtag existieren
  mse <- mean(err^2)
  list(RMSE = sqrt(mse), bias = mean(err), variance = mean((err - mean(err))^2),
       MSE = mse, IBNR = sum(ibnr(final), na.rm = TRUE))
}

#' Mittlerer gewichteter RMSE-Score (Gl. 2)
#'   metric = "AvE" / "CDR"; alpha ueberschreibt metric (e = AvE + alpha * dR)
#'   bias_penalty: + lambda * |mittlerer gewichteter Fehler|
score_records <- function(rec, metric = "CDR", alpha = NULL, bias_penalty = 0) {
  if (is.null(alpha)) alpha <- c(AVE = 0, CDR = 1)[[toupper(metric)]]
  e <- rec$AvE + alpha * rec$dR
  w <- abs(rec$actual)
  scores <- c(); biases <- c()
  for (k in sort(unique(rec$calendar))) {
    m <- rec$calendar == k
    sw <- sum(w[m])
    if (sw == 0) next
    scores <- c(scores, sqrt(sum(w[m] * e[m]^2) / sw))
    biases <- c(biases, sum(w[m] * e[m]) / sw)
  }
  s <- mean(scores)
  if (bias_penalty != 0) s <- s + bias_penalty * abs(mean(biases))
  s
}


# -----------------------------------------------------------------------------
# 5. Suchraeume und Grid Search (Abschn. 4 und 5)
# -----------------------------------------------------------------------------

#' Kartesisches Produkt (Tabellen 1, 5, 10, 15). Reihenfolge wie in der Python-Version,
#' damit bei Gleichstand dasselbe Modell gewaehlt wird.
grid_specs <- function(method, n_periods, drop_high = c(TRUE, FALSE), drop_low = c(TRUE, FALSE),
                       apriori = NULL, decay = NULL, average = "volume", ay_decay = 1) {
  extra <- switch(method, CL = NA, BF = apriori, GCC = decay)
  g <- expand.grid(x = extra, ad = ay_decay, avg = average, n = n_periods, dl = drop_low,
                   dh = drop_high, stringsAsFactors = FALSE)
  lapply(seq_len(nrow(g)), function(r) {
    model_spec(method, g$n[r], g$dh[r], g$dl[r], g$avg[r], g$ad[r],
               apriori = if (method == "BF") round(g$x[r], 4) else NULL,
               decay = if (method == "GCC") round(g$x[r], 4) else NULL)
  })
}

spec_row <- function(s) {
  data.frame(method = s$method, n_periods = s$n_periods, drop_high = s$drop_high,
             drop_low = s$drop_low, average = s$average, ay_decay = s$ay_decay,
             apriori = if (is.null(s$apriori) || length(s$apriori) > 1) NA_real_ else s$apriori,
             decay = if (is.null(s$decay)) NA_real_ else s$decay,
             label = spec_label(s), stringsAsFactors = FALSE)
}

#' Bewertet alle Kandidaten: Trainings-Scores und (falls Zukunft bekannt) Out-of-Sample-RMSE
run_search <- function(P, specs, alphas = c(AvE = 0, CDR = 1), bias_penalty = 0,
                       evaluate = TRUE) {
  rows <- lapply(specs, function(s) {
    bt <- backtest(P, s)
    r <- spec_row(s)
    for (nm in names(alphas)) {
      r[[paste0("score_", nm)]] <- score_records(bt$records, alpha = alphas[[nm]],
                                                 bias_penalty = bias_penalty)
    }
    if (evaluate && has_future(P)) {
      ev <- evaluate_projection(P, bt$final)
      for (nm in names(ev)) r[[nm]] <- ev[[nm]]
    } else {
      r$IBNR <- sum(ibnr(bt$final), na.rm = TRUE)
    }
    r
  })
  df <- do.call(rbind, rows)
  if ("RMSE" %in% names(df)) df$RMSE_rank <- as.integer(rank(df$RMSE, ties.method = "min"))
  df
}

#' M_opt = argmin S^M
select_best <- function(df, metric) df[which.min(df[[paste0("score_", metric)]]), , drop = FALSE]

spec_from_row <- function(r) {
  model_spec(r$method, r$n_periods, r$drop_high, r$drop_low, r$average, r$ay_decay,
             apriori = if (r$method == "BF") r$apriori else NULL,
             decay = if (r$method == "GCC") r$decay else NULL)
}

rerank <- function(df) {
  df$RMSE_rank <- as.integer(rank(df$RMSE, ties.method = "min"))
  df
}

#' Tabellen 3/7/12 des Papers: Basismodell vs. optimierte Modelle
summary_table <- function(df, basic, metrics = c("AvE", "CDR")) {
  base <- df[df$label == spec_label(basic), , drop = FALSE]
  rows <- list()
  if (nrow(base)) rows[["Basic"]] <- base[1, ]
  for (m in metrics) rows[[paste("Minimise", m)]] <- select_best(df, m)
  base_rmse <- if (nrow(base)) base$RMSE[1] else NA
  base_ibnr <- if (nrow(base)) base$IBNR[1] else NA
  out <- lapply(names(rows), function(nm) {
    r <- rows[[nm]]
    d <- data.frame(Model = nm, Spec = r$label, stringsAsFactors = FALSE)
    for (m in metrics) d[[paste0("score_", m)]] <- r[[paste0("score_", m)]]
    if (!is.null(r$RMSE)) {
      d$RMSE <- r$RMSE
      d$`Delta RMSE` <- if (nm == "Basic") NA else r$RMSE / base_rmse - 1
      d$Rank <- sprintf("%d of %d", r$RMSE_rank, nrow(df))
      d$bias <- r$bias
      d$variance <- r$variance
    }
    d$IBNR <- r$IBNR
    d$`Delta IBNR` <- if (nm == "Basic") NA else r$IBNR / base_ibnr - 1
    d
  })
  do.call(rbind, out)
}


# -----------------------------------------------------------------------------
# 6. Erweiterungen
# -----------------------------------------------------------------------------

# --- 6a. Zwei-Stufen-Suche (Abschn. 4.2) -------------------------------------
two_step_search <- function(P, cl_specs, method, values, metric = "CDR", bias_penalty = 0) {
  a <- setNames(c(AVE = 0, CDR = 1)[[toupper(metric)]], metric)
  cl_df <- run_search(P, cl_specs, alphas = a, bias_penalty = bias_penalty, evaluate = FALSE)
  best_cl <- spec_from_row(select_best(cl_df, metric))
  stage2 <- lapply(values, function(v) {
    s <- best_cl; s$method <- method
    if (method == "BF") s$apriori <- round(v, 4) else s$decay <- round(v, 4)
    s
  })
  df <- run_search(P, stage2, alphas = a, bias_penalty = bias_penalty)
  list(spec = spec_from_row(select_best(df, metric)), df = df)
}

# --- 6b. Bayes'sche Optimierung: Tree-structured Parzen Estimator (Abschn. 6) --

#' Stueckweise lineare Schadenquotenkurve ueber die Anfallperioden (Stuetzstellen)
ay_loss_ratios <- function(knot_values, n_origins) {
  knots <- seq(0, n_origins - 1, length.out = length(knot_values))
  round(approx(knots, knot_values, xout = 0:(n_origins - 1))$y, 5)
}

# TPE-Hilfen: Dichte l(x) (gute Trials) / g(x) (restliche Trials) je Parameter
.tpe_num_density <- function(obs, lo, hi) {
  n <- length(obs)
  sig <- max(0.05 * (hi - lo), if (n > 1) 1.06 * sd(obs) * n^(-1 / 5) else 0.25 * (hi - lo))
  function(x) (sapply(x, function(v) sum(dnorm(v, obs, sig))) + 1 / (hi - lo)) / (n + 1)
}
.tpe_num_sample <- function(obs, lo, hi, n) {
  sig <- max(0.05 * (hi - lo), if (length(obs) > 1) 1.06 * sd(obs) * length(obs)^(-1 / 5)
             else 0.25 * (hi - lo))
  x <- ifelse(runif(n) < 1 / (length(obs) + 1), runif(n, lo, hi),
              rnorm(n, sample(obs, n, replace = TRUE), sig))
  pmin(pmax(x, lo), hi)
}

#' Bayes'sche Hyperparameter-Optimierung (TPE, univariat wie Optuna-Standard) ueber
#' einen gemeinsamen Raum aus CL/BF/GCC. n_lr_knots > 0 aktiviert anfalljahresabhaengige
#' A-priori-Schadenquoten fuer BF (Erweiterung aus Abschn. 6).
bayes_search <- function(P, n_trials = 200, metric = "CDR", alpha = NULL, bias_penalty = 0,
                         methods = c("CL", "BF", "GCC"), n_periods = c(5L, 21L),
                         lr_range = c(0.40, 0.80), n_lr_knots = 0, smooth_penalty = 0,
                         extended_ldf_options = TRUE, n_startup = 20, gamma = 0.15,
                         n_candidates = 24, seed = 0, verbose = FALSE) {
  set.seed(seed)
  a <- if (is.null(alpha)) c(AVE = 0, CDR = 1)[[toupper(metric)]] else alpha
  n_orig <- nrow(P$full)
  # Parameterraum: name -> list(type, domain, condition)
  space <- list(
    method = list(type = "cat", levels = methods),
    n_periods = list(type = "int", lo = n_periods[1], hi = n_periods[2]),
    drop_high = list(type = "cat", levels = c(FALSE, TRUE)),
    drop_low = list(type = "cat", levels = c(FALSE, TRUE)))
  if (extended_ldf_options) {
    space$average <- list(type = "cat", levels = c("volume", "simple", "median"))
    space$ay_decay <- list(type = "num", lo = 0.5, hi = 1.0)
  }
  if ("BF" %in% methods) {
    if (n_lr_knots > 0) {
      for (q in seq_len(n_lr_knots) - 1) {
        space[[paste0("lr_", q)]] <- list(type = "num", lo = lr_range[1], hi = lr_range[2], cond = "BF")
      }
    } else {
      space$apriori <- list(type = "num", lo = lr_range[1], hi = lr_range[2], cond = "BF")
    }
  }
  if ("GCC" %in% methods) space$decay <- list(type = "num", lo = 0, hi = 1, cond = "GCC")

  trials <- list(); values <- c()

  suggest <- function(name, d, n_done) {
    active <- vapply(trials, function(t) !is.null(t[[name]]), logical(1))
    rand <- function() switch(d$type,
      cat = d$levels[sample.int(length(d$levels), 1)],
      int = if (d$lo == d$hi) d$lo else sample(d$lo:d$hi, 1),
      num = runif(1, d$lo, d$hi))
    if (n_done < n_startup || sum(active) < 4) return(rand())
    v <- values[active]
    obs <- lapply(trials[active], `[[`, name)
    n_good <- max(1, ceiling(gamma * length(v)))
    good <- order(v)[seq_len(n_good)]
    if (d$type == "cat") {
      lv <- as.character(d$levels)
      o <- vapply(obs, as.character, character(1))
      pl <- (table(factor(o[good], lv)) + 1) / (n_good + length(lv))
      pg <- (table(factor(o[-good], lv)) + 1) / (length(o) - n_good + length(lv))
      cand <- sample(lv, n_candidates, replace = TRUE, prob = pl)
      best <- cand[which.max(pl[cand] / pg[cand])]
      return(d$levels[match(best, lv)])
    }
    o <- unlist(obs)
    lo <- d$lo; hi <- d$hi
    lden <- .tpe_num_density(o[good], lo, hi)
    gden <- .tpe_num_density(if (length(o) > n_good) o[-good] else o, lo, hi)
    cand <- .tpe_num_sample(o[good], lo, hi, n_candidates)
    if (d$type == "int") cand <- round(cand)
    cand[which.max(lden(cand) / gden(cand))]
  }

  best_spec <- NULL
  for (t in seq_len(n_trials)) {
    par <- list()
    par$method <- suggest("method", space$method, t - 1)
    for (nm in setdiff(names(space), "method")) {
      d <- space[[nm]]
      if (!is.null(d$cond) && d$cond != par$method) next
      par[[nm]] <- suggest(nm, d, t - 1)
    }
    spec <- model_spec(par$method, par$n_periods, par$drop_high, par$drop_low,
                       if (is.null(par$average)) "volume" else par$average,
                       if (is.null(par$ay_decay)) 1 else par$ay_decay)
    if (par$method == "BF") {
      spec$apriori <- if (n_lr_knots > 0)
        ay_loss_ratios(unlist(par[paste0("lr_", seq_len(n_lr_knots) - 1)]), n_orig)
      else par$apriori
    }
    if (par$method == "GCC") spec$decay <- par$decay
    s <- score_records(backtest(P, spec)$records, alpha = a, bias_penalty = bias_penalty)
    if (smooth_penalty != 0 && length(spec$apriori) > 1) {
      kv <- unlist(par[paste0("lr_", seq_len(n_lr_knots) - 1)])
      s <- s + smooth_penalty * sum(abs(diff(kv))) * 100
    }
    trials[[t]] <- par
    values[t] <- s
    if (s == min(values)) best_spec <- spec
    if (verbose) cat(sprintf("Trial %3d: %.2f  %s\n", t, s, spec_label(spec)))
  }
  list(best = best_spec, best_value = min(values), best_params = trials[[which.min(values)]],
       values = values, trials = trials)
}

# --- 6c. Mack-Standardfehler und Variationskoeffizient (Abschn. 6) -----------

#' Mack (1993): Standardfehler der CL-Gesamtreserve und CoV. Sigma^2-Extrapolation
#' log-linear (wie chainladder.MackChainladder).
mack_cov <- function(tri) {
  n_orig <- nrow(tri); n_dev <- ncol(tri)
  f <- estimate_ldfs(tri)
  ld <- latest_diagonal(tri)
  sig2 <- rep(0, n_dev - 1); n_fac <- integer(n_dev - 1)
  for (j in seq_len(n_dev - 1)) {
    r <- which(!is.na(tri[, j + 1]))
    n_fac[j] <- length(r)
    if (length(r) > 1) {
      c0 <- tri[r, j]; c1 <- tri[r, j + 1]
      sig2[j] <- sum(c0 * (c1 / c0 - f[j])^2) / (length(r) - 1)
    }
  }
  ok <- n_fac > 1 & sig2 > 0
  if (sum(ok) >= 2) {
    cf <- coef(lm(log(sig2[ok]) ~ which(ok)))
    for (j in which(n_fac == 1)) sig2[j] <- exp(cf[1] + cf[2] * j)
  }
  full <- tri
  for (j in 2:n_dev) {
    m <- is.na(full[, j])
    full[m, j] <- full[m, j - 1] * f[j - 1]
  }
  colsum <- sapply(seq_len(n_dev - 1), function(j) sum(tri[!is.na(tri[, j + 1]), j]))
  ult <- full[, n_dev]
  reserves <- ult - ld$value
  mse_i <- numeric(n_orig)
  for (i in seq_len(n_orig)) {
    s <- 0
    if (ld$j[i] <= n_dev - 1) for (j in ld$j[i]:(n_dev - 1)) {
      if (f[j] == 0) next
      s <- s + sig2[j] / f[j]^2 * (1 / full[i, j] + if (colsum[j] > 0) 1 / colsum[j] else 0)
    }
    mse_i[i] <- ult[i]^2 * s
  }
  total <- sum(mse_i)
  for (i in seq_len(n_orig - 1)) {           # gemeinsame Zukunft ab Entwicklung der aelteren AJ
    js <- if (ld$j[i] <= n_dev - 1) ld$j[i]:(n_dev - 1) else integer(0)
    js <- js[colsum[js] > 0 & f[js] != 0]
    s <- sum(sig2[js] / f[js]^2 / colsum[js])
    total <- total + 2 * ult[i] * sum(ult[(i + 1):n_orig]) * s
  }
  se <- sqrt(max(total, 0))
  R <- sum(reserves, na.rm = TRUE)
  list(reserve = R, mack_se = se, cov = if (R != 0) se / R else NA)
}

#' Heuristik Abschn. 6: geringe Reservevolatilitaet -> CDR, hohe -> AvE (Schwelle = Annahme)
recommend_metric <- function(cov, threshold = 0.3) if (cov < threshold) "CDR" else "AvE"

# --- 6d. Zeitliche Holdout-Validierung der Metrik (alpha) --------------------

#' Letzte `holdout` Diagonalen zurueckhalten, je alpha Modell per CDR_alpha waehlen und
#' dessen Mehrperioden-Prognose auf der Diagonale K gegen die Ist-Werte pruefen.
holdout_metric_selection <- function(P, specs, alphas = c(0, 0.25, 0.5, 0.75, 1),
                                     holdout = 3, bias_penalty = 0) {
  K_in <- P$K - holdout
  inner <- triangle_problem(triangle_at(P$full, P$K), P$premium, valuation_c = K_in,
                            first_fit_c = P$k_train, origins = P$origins,
                            expectation = P$expectation)
  res <- run_search(inner, specs, alphas = setNames(alphas, paste0("a", alphas)),
                    bias_penalty = bias_penalty, evaluate = FALSE)
  tri_K <- tri_at(P, P$K)
  n_orig <- nrow(P$full); n_dev <- ncol(P$full)
  out <- lapply(alphas, function(a) {
    best <- spec_from_row(select_best(res, paste0("a", a)))
    p <- project(tri_at(inner, K_in), best, P$premium)
    i0 <- 0:(n_orig - 1); j0 <- P$K - i0
    ok <- i0 <= K_in & j0 >= 1 & j0 < n_dev
    i <- i0[ok] + 1; j <- j0[ok] + 1
    actual <- tri_K[cbind(i, j)]
    errs <- actual - expected_cumulative(p, i, j, P$expectation)
    w <- abs(actual - tri_K[cbind(i, p$j_latest[i])])
    data.frame(alpha = a, selected = spec_label(best),
               holdout_RMSE = sqrt(sum(w * errs^2) / sum(w)),
               holdout_bias = sum(w * errs) / sum(w), stringsAsFactors = FALSE)
  })
  do.call(rbind, out)
}
