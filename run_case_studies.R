# =============================================================================
# Reproduktion der Fallstudien aus Balona & Richman (2020) + Erweiterungen (R)
#
# Aufruf (im Ordner R/):
#   Rscript run_case_studies.R            # alles (ca. 3-4 Minuten)
#   Rscript run_case_studies.R --quick    # ohne Bayes'sche Optimierung
#   Rscript run_case_studies.R --trials 300
#
# Ergebnisse (CSV, PNG, REPORT.md) landen im Ordner ./results_R
# Benoetigt nur Basis-R (>= 4.0), keine Zusatzpakete.
# =============================================================================

args <- commandArgs(trailingOnly = FALSE)
script_dir <- {
  f <- sub("^--file=", "", args[grepl("^--file=", args)])
  if (length(f)) dirname(normalizePath(f)) else getwd()
}
source(file.path(script_dir, "data.R"))
source(file.path(script_dir, "ibnr_ml.R"))

targs <- commandArgs(trailingOnly = TRUE)
QUICK <- "--quick" %in% targs
N_TRIALS <- if ("--trials" %in% targs) as.integer(targs[which(targs == "--trials") + 1]) else 200L

OUT <- file.path(script_dir, "results_R")
dir.create(OUT, showWarnings = FALSE)

# Farben (validierte Referenzpalette, Slots 1-3) und neutrale Toene
C_BASIC <- "#2a78d6"; C_AVE <- "#eb6834"; C_CDR <- "#1baf7a"
C_TEXT <- "#0b0b0b"; C_MUTED <- "#52514e"; C_GRID <- "#e4e3df"; C_SURF <- "#fcfcfb"

# -----------------------------------------------------------------------------
# Fallstudien-Definitionen (Abschnitte 4 und 5 des Papers)
# -----------------------------------------------------------------------------
LR_SWISS <- round(seq(50, 70) / 100, 2)     # Tabelle 5
LR_Q <- round(seq(40, 60) / 100, 2)         # Tabelle 15
DECAY <- round(seq(0, 20) * 0.05, 2)        # Tabellen 10 / 15

CASES <- list(
  swiss = list(title = "Swiss Private Liability (jaehrlich)",
               full = SWISS_TRIANGLE, premium = SWISS_PREMIUM, origins = SWISS_ORIGINS,
               K = 18, k_train = 5,                # Fits 1984..1996, Scores 1985..1997
               n_periods = 10:19, lr = LR_SWISS, lr_range = c(0.50, 0.70)),
  long_tail = list(title = "Long-Tail Liability (quartalsweise, Incurred)",
                   full = LONG_TAIL_TRIANGLE, premium = LONG_TAIL_PREMIUM,
                   origins = LONG_TAIL_ORIGINS, K = 19, k_train = 8,
                   # Tabelle 15 nennt n in [5..21]; Modellanzahl 1 848 = 4 x 11 x (21 + 21)
                   # und gewaehlte Parameter passen zu n in [10..20] mit BF + GCC.
                   n_periods = 10:20, lr = LR_Q, lr_range = c(0.40, 0.60)),
  short_tail = list(title = "Short-Tail Property (quartalsweise, Incurred)",
                    full = SHORT_TAIL_TRIANGLE, premium = SHORT_TAIL_PREMIUM,
                    origins = SHORT_TAIL_ORIGINS, K = 19, k_train = 8,
                    n_periods = 10:20, lr = LR_Q, lr_range = c(0.40, 0.60))
)

# Referenzwerte aus dem Paper (RMSE der Endschaeden)
PAPER <- list(
  swiss_CL = c(Basic = 669.69, `Minimise AvE` = 675.38, `Minimise CDR` = 617.81),
  swiss_BF = c(Basic = 576.38, `Minimise AvE` = 537.27, `Minimise CDR` = 527.90),
  swiss_BF60 = c(Basic = 576.37, `Minimise AvE` = 516.29, `Minimise CDR` = 509.74),
  swiss_GCC = c(Basic = 604.27, `Minimise AvE` = 670.69, `Minimise CDR` = 580.21),
  long_tail = c(Basic = 3170.88, `Minimise AvE` = 2552.39, `Minimise CDR` = 2893.23),
  short_tail = c(Basic = 638.38, `Minimise AvE` = 626.73, `Minimise CDR` = 794.65)
)

make_problem <- function(case, expectation = "chainladder") {
  triangle_problem(case$full, case$premium, valuation_c = case$K, first_fit_c = case$k_train,
                   origins = case$origins, expectation = expectation)
}

# --- Markdown-Tabelle (ohne knitr) ---------------------------------------------
fmt <- function(df) {
  out <- df
  for (cn in names(out)) {
    x <- out[[cn]]
    if (startsWith(cn, "Delta")) {
      out[[cn]] <- ifelse(is.na(x), "", sprintf("%+.1f%%", 100 * x))
    } else if (is.numeric(x) && !cn %in% c("alpha", "lambda") && !anyNA(x)) {
      out[[cn]] <- if (any(x %% 1 != 0)) formatC(x, format = "f", digits = 2, big.mark = ",")
                   else formatC(round(x), format = "d", big.mark = ",")
    } else {
      out[[cn]] <- ifelse(is.na(x), "", as.character(x))
    }
  }
  head <- paste0("| ", paste(names(out), collapse = " | "), " |")
  sep <- paste0("|", paste(rep(" --- ", ncol(out)), collapse = "|"), "|")
  body <- apply(out, 1, function(r) paste0("| ", paste(r, collapse = " | "), " |"))
  paste(c(head, sep, body), collapse = "\n")
}

add_paper <- function(tab, ref) {
  pos <- which(names(tab) == "RMSE")
  tab[["RMSE Paper"]] <- unname(ref[tab$Model])
  tab[, c(names(tab)[1:pos], "RMSE Paper", names(tab)[(pos + 1):(ncol(tab) - 1)])]
}

report <- c("# Machine Learning Approach to IBNR Reserving - Ergebnisse (R)\n",
            paste("Nachbau von Balona & Richman (2020). RMSE = Wurzel des mittleren quadratischen",
                  "Fehlers der Endschaeden je Anfallperiode gegenueber den tatsaechlichen",
                  "Endschaeden. Delta = relative Veraenderung ggue. Basismodell.",
                  "bias/variance = Zerlegung des MSE (Erweiterung).\n"))
t_start <- Sys.time()

# -----------------------------------------------------------------------------
# Teil A: Reproduktion
# -----------------------------------------------------------------------------
report <- c(report, "## Teil A - Reproduktion der Paper-Ergebnisse\n")
results <- list()

case <- CASES$swiss
P <- make_problem(case)
NP <- case$n_periods
blocks <- list(
  CL = list(specs = grid_specs("CL", NP), basic = model_spec("CL", n_periods = 19)),
  BF = list(specs = grid_specs("BF", NP, apriori = case$lr),
            basic = model_spec("BF", n_periods = 19, apriori = 0.60)),
  GCC = list(specs = grid_specs("GCC", NP, decay = DECAY),
             basic = model_spec("GCC", n_periods = 19, decay = 0.75)))
swiss <- list()
for (nm in names(blocks)) {
  cat("Swiss", nm, "...\n")
  df <- run_search(P, blocks[[nm]]$specs)
  swiss[[nm]] <- df
  tab <- add_paper(summary_table(df, blocks[[nm]]$basic), PAPER[[paste0("swiss_", nm)]])
  report <- c(report, sprintf("### Swiss - %s (%d Modelle)\n", nm, nrow(df)), fmt(tab), "")
  if (nm == "BF") {
    narrow <- rerank(df[!is.na(df$apriori) & df$apriori == 0.60, ])
    tab <- add_paper(summary_table(narrow, blocks$BF$basic), PAPER$swiss_BF60)
    report <- c(report, sprintf("### Swiss - BF mit fixer Quote 60 %% (Tabelle 9, %d Modelle)\n",
                                nrow(narrow)), fmt(tab), "")
  }
}
best <- data.frame(Verfahren = names(swiss),
                   AvE = sapply(swiss, function(d) min(d$score_AvE)),
                   CDR = sapply(swiss, function(d) min(d$score_CDR)))
report <- c(report, "### Swiss - niedrigste Trainings-Scores je Verfahren (Tabelle 14)\n",
            fmt(best), "")
results$swiss <- list(problem = P, df = rerank(do.call(rbind, swiss)), blocks = swiss,
                      basic = model_spec("CL", n_periods = 19))

for (key in c("long_tail", "short_tail")) {
  cat(key, "...\n")
  case <- CASES[[key]]
  P <- make_problem(case)
  basic <- model_spec("GCC", n_periods = 21, decay = 0.75)
  specs <- c(grid_specs("BF", case$n_periods, apriori = case$lr),
             grid_specs("GCC", case$n_periods, decay = DECAY), list(basic))
  df <- run_search(P, specs)
  tab <- add_paper(summary_table(df, basic), PAPER[[key]])
  report <- c(report, sprintf("### %s - BF + GCC (%d Modelle + Basis-GCC)\n", case$title,
                              nrow(df) - 1), fmt(tab), "")
  results[[key]] <- list(problem = P, df = df, basic = basic)
}
for (key in names(results)) {
  write.csv(results[[key]]$df, file.path(OUT, paste0(key, "_grid.csv")), row.names = FALSE)
}

# -----------------------------------------------------------------------------
# Teil B: Erweiterungen
# -----------------------------------------------------------------------------
selection_row <- function(df, col) {
  r <- df[which.min(df[[col]]), ]
  data.frame(Spec = r$label, RMSE = r$RMSE, Rank = sprintf("%d/%d", r$RMSE_rank, nrow(df)),
             bias = r$bias, IBNR = r$IBNR, stringsAsFactors = FALSE)
}

report <- c(report, "## Teil B - Erweiterungen\n")
ext <- list()
for (key in names(results)) {
  cat("Erweiterungen", key, "...\n")
  case <- CASES[[key]]
  res <- results[[key]]
  P <- res$problem
  df <- res$df
  specs <- lapply(seq_len(nrow(df)), function(r) spec_from_row(df[r, ]))
  recs <- lapply(specs, function(s) backtest(P, s)$records)
  base_rmse <- df$RMSE[df$label == spec_label(res$basic)][1]
  report <- c(report, sprintf("### %s\n", case$title),
              sprintf("Basismodell `%s`: RMSE %s; bestes Modell im Suchraum (Orakel): RMSE %s\n",
                      spec_label(res$basic), formatC(base_rmse, format = "f", digits = 2, big.mark = ","),
                      formatC(min(df$RMSE), format = "f", digits = 2, big.mark = ",")))
  ext[[key]] <- list()

  # B1: CDR_alpha
  alphas <- c(0, 0.25, 0.5, 0.75, 1, 1.5)
  tab <- do.call(rbind, lapply(alphas, function(a) {
    col <- paste0("s_a", a)
    df[[col]] <<- sapply(recs, score_records, alpha = a)
    cbind(alpha = a, selection_row(df, col))
  }))
  ext[[key]]$alpha <- tab
  report <- c(report, "**B1 - CDR_alpha = AvE + alpha * dR** (alpha=0: AvE, alpha=1: CDR)\n",
              fmt(tab), "")

  # B2: Bias-Strafterm
  tab <- do.call(rbind, lapply(list(c("AvE", 0), c("CDR", 1)), function(ma) {
    do.call(rbind, lapply(c(0, 0.5, 1, 2), function(lam) {
      col <- sprintf("s_%s_l%s", ma[1], lam)
      df[[col]] <<- sapply(recs, score_records, alpha = as.numeric(ma[2]), bias_penalty = lam)
      cbind(Metrik = ma[1], lambda = lam, selection_row(df, col))
    }))
  }))
  report <- c(report, "**B2 - Score + lambda * |mittlerer gewichteter Fehler|** (Bias-Strafterm)\n",
              fmt(tab), "")

  # B3: konsistente Erwartung
  Pc <- make_problem(case, expectation = "consistent")
  dfc <- run_search(Pc, specs)
  tab <- do.call(rbind, lapply(c("AvE", "CDR"), function(m)
    cbind(Metrik = m, selection_row(dfc, paste0("score_", m)))))
  report <- c(report, paste("**B3 - verfahrenskonsistente Erwartung der naechsten Diagonale**",
                            "(BF/GCC: C + (beta_j+1 - beta_j) * U statt Ult * beta_j+1)\n"),
              fmt(tab), "")

  # B4: erweiterte LDF-Optionen (CL)
  dfe <- rerank(run_search(P, grid_specs("CL", case$n_periods,
                                         average = c("volume", "simple", "median"),
                                         ay_decay = c(1, 0.9, 0.8))))
  dfb <- rerank(run_search(P, grid_specs("CL", case$n_periods)))
  tab <- do.call(rbind, lapply(c("AvE", "CDR"), function(m) rbind(
    cbind(Suchraum = sprintf("CL Standard (%d)", nrow(dfb)), Metrik = m,
          selection_row(dfb, paste0("score_", m))),
    cbind(Suchraum = sprintf("CL erweitert (%d)", nrow(dfe)), Metrik = m,
          selection_row(dfe, paste0("score_", m))))))
  report <- c(report, paste("**B4 - erweiterte LDF-Optionen** (volume/simple/median,",
                            "exponentielle Anfalljahresgewichte 1.0/0.9/0.8)\n"), fmt(tab), "")

  # B5: Zwei-Stufen-Suche
  n_ldf <- length(grid_specs("CL", case$n_periods))
  tab <- do.call(rbind, lapply(c("AvE", "CDR"), function(m) {
    do.call(rbind, lapply(list(list("BF", case$lr), list("GCC", DECAY)), function(mv) {
      ts <- two_step_search(P, grid_specs("CL", case$n_periods), mv[[1]], mv[[2]], metric = m)
      ev <- evaluate_projection(P, backtest(P, ts$spec)$final)
      sub <- df[df$method == mv[[1]] & df$label != spec_label(res$basic), ]
      fs <- select_best(sub, m)
      data.frame(Metrik = m, Verfahren = mv[[1]], `Zwei-Stufen` = spec_label(ts$spec),
                 `RMSE 2-Stufen` = ev$RMSE, Backtests = n_ldf + length(mv[[2]]),
                 `Volles Grid` = fs$label, `RMSE Grid` = fs$RMSE,
                 `Backtests Grid` = n_ldf * length(mv[[2]]), check.names = FALSE,
                 stringsAsFactors = FALSE)
    }))
  }))
  report <- c(report, "**B5 - Zwei-Stufen-Suche** (erst CL-Variante, dann Quote/Decay)\n",
              fmt(tab), "")

  # B6: Mack-CoV
  mc <- mack_cov(tri_at(P, P$K))
  rec <- recommend_metric(mc$cov)
  ave_rmse <- select_best(df, "AvE")$RMSE
  cdr_rmse <- select_best(df, "CDR")$RMSE
  better <- if (ave_rmse < cdr_rmse) "AvE" else "CDR"
  report <- c(report, sprintf(paste(
    "**B6 - Mack-CoV als Entscheidungsregel:** CoV = %.3f (Mack-SE %s auf CL-Reserve %s) ->",
    "Empfehlung **%s**; out of sample war tatsaechlich **%s** besser (RMSE AvE %.1f vs. CDR %.1f).\n"),
    mc$cov, formatC(round(mc$mack_se), format = "d", big.mark = ","),
    formatC(round(mc$reserve), format = "d", big.mark = ","), rec, better, ave_rmse, cdr_rmse))

  # B7: Holdout-Wahl von alpha
  ho <- holdout_metric_selection(P, specs, alphas = c(0, 0.25, 0.5, 0.75, 1), holdout = 3)
  a_star <- ho$alpha[which.min(ho$holdout_RMSE)]
  chosen <- selection_row(df, paste0("s_a", a_star))
  report <- c(report, paste("**B7 - Holdout-Validierung der Metrik** (letzte 3 Diagonalen",
                            "zurueckgehalten, Mehrperioden-Prognose)\n"), fmt(ho), "",
              sprintf("-> gewaehltes alpha = %s; Modell auf vollem Dreieck: `%s`, RMSE %.2f (Rang %s).\n",
                      a_star, chosen$Spec, chosen$RMSE, chosen$Rank))

  # B8: Bayes'sche Optimierung (TPE)
  if (!QUICK) {
    rows <- list()
    for (m in c("AvE", "CDR")) {
      for (kn in c(0, 3)) {
        t0 <- Sys.time()
        bs <- bayes_search(P, n_trials = N_TRIALS, metric = m, n_periods = range(case$n_periods),
                           lr_range = case$lr_range, n_lr_knots = kn, seed = 1)
        ev <- evaluate_projection(P, backtest(P, bs$best)$final)
        lbl <- spec_label(bs$best)
        if (kn > 0 && length(bs$best$apriori) > 1) {
          lbl <- paste0(lbl, " LR: ", paste(sprintf("%.2f", unlist(bs$best_params[paste0("lr_", 0:(kn - 1))])),
                                            collapse = "/"))
        }
        rows[[length(rows) + 1]] <- data.frame(
          Metrik = m, Suchraum = if (kn == 0) "CL/BF/GCC stetig + erweiterte LDF-Optionen"
                                 else "... + anfalljahresabh. Schadenquote (3 Stuetzstellen)",
          Spec = lbl, Score = bs$best_value, RMSE = ev$RMSE, bias = ev$bias, IBNR = ev$IBNR,
          Sek. = as.numeric(difftime(Sys.time(), t0, units = "secs")), stringsAsFactors = FALSE)
      }
    }
    report <- c(report, sprintf("**B8 - Bayes'sche Optimierung (TPE, %d Trials)**\n", N_TRIALS),
                fmt(do.call(rbind, rows)), "")
  }
  results[[key]]$df_ext <- df
}

# -----------------------------------------------------------------------------
# Grafiken (Basis-R)
# -----------------------------------------------------------------------------
setup_par <- function(...) {
  par(bg = C_SURF, fg = C_MUTED, col.axis = C_MUTED, col.lab = C_TEXT, col.main = C_TEXT,
      las = 1, bty = "l", cex.axis = 0.8, font.main = 1, ...)
}
grid_lines <- function() grid(nx = NA, ny = NULL, col = C_GRID, lty = 1)

# Abb. 4: CL-Scores ueber n_periods
png(file.path(OUT, "swiss_cl_scores.png"), width = 1350, height = 520, res = 150)
setup_par(mfrow = c(1, 2), mar = c(4.5, 4.5, 2.5, 1), oma = c(3.5, 0, 0, 0))
df <- results$swiss$blocks$CL
combos <- list(c(FALSE, FALSE), c(TRUE, FALSE), c(FALSE, TRUE), c(TRUE, TRUE))
cols <- c("#2a78d6", "#eb6834", "#1baf7a", "#4a3aa7")
yl <- range(c(df$score_AvE, df$score_CDR))
for (m in c("AvE", "CDR")) {
  plot(NA, xlim = range(df$n_periods), ylim = yl, xlab = "n_periods",
       ylab = if (m == "AvE") "Score (Trainingsdaten)" else "", main = paste0("Minimiere ", m, "-Score"),
       adj = 0)
  grid_lines()
  for (k in seq_along(combos)) {
    s <- df[df$drop_high == combos[[k]][1] & df$drop_low == combos[[k]][2], ]
    s <- s[order(s$n_periods), ]
    lines(s$n_periods, s[[paste0("score_", m)]], col = cols[k], lwd = 2)
  }
}
par(fig = c(0, 1, 0, 1), oma = c(0, 0, 0, 0), mar = c(0, 0, 0, 0), new = TRUE)
plot.new()
legend("bottom", legend = sapply(combos, function(cb) sprintf("drop_high=%s, drop_low=%s",
       .pybool(cb[1]), .pybool(cb[2]))), col = cols, lwd = 2, ncol = 2, bty = "n", cex = 0.8,
       text.col = C_TEXT)
dev.off()

# Abb. 5-7 je Dreieck
for (key in names(results)) {
  res <- results[[key]]; P <- res$problem; df <- res$df
  sel <- list(Basis = res$basic, `Min. AvE` = spec_from_row(select_best(df, "AvE")),
              `Min. CDR` = spec_from_row(select_best(df, "CDR")))
  colv <- c(C_BASIC, C_AVE, C_CDR)
  finals <- lapply(sel, function(s) backtest(P, s)$final)
  png(file.path(OUT, paste0(key, "_overview.png")), width = 1950, height = 600, res = 150)
  setup_par(mar = c(5, 4.5, 3, 1), oma = c(0, 0, 1.5, 0))
  layout(matrix(1:3, 1), widths = c(1, 2.4, 2.4))
  boxplot(df$RMSE, outline = FALSE, col = NA, border = C_MUTED, axes = FALSE,
          ylab = "RMSE Endschaden (out of sample)", main = sprintf("RMSE aller %d Modelle", nrow(df)))
  axis(2); grid_lines()
  for (k in seq_along(sel)) {
    points(0.9 + 0.1 * (k - 1), df$RMSE[df$label == spec_label(sel[[k]])][1], pch = 21,
           bg = colv[k], col = C_SURF, cex = 1.6)
  }
  legend("topright", names(sel), pt.bg = colv, pch = 21, col = C_SURF, bty = "n", cex = 0.8)
  err <- do.call(rbind, lapply(finals, function(f) true_ultimate(P) - f$ultimate))
  barplot(err, beside = TRUE, col = colv, border = NA, names.arg = P$origins, las = 2,
          cex.names = 0.6, main = "Tatsaechlicher minus prognostizierter Endschaden")
  abline(h = 0, col = C_MUTED)
  legend("topleft", names(sel), fill = colv, border = NA, bty = "n", cex = 0.8)
  ib <- do.call(rbind, lapply(finals, ibnr))
  barplot(ib, beside = TRUE, col = colv, border = NA, names.arg = P$origins, las = 2,
          cex.names = 0.6, main = "IBNR je Anfallperiode (Summe in Legende)")
  abline(h = 0, col = C_MUTED)
  legend("topleft", sprintf("%s: %s", names(sel), formatC(round(rowSums(ib, na.rm = TRUE)), format = "d",
         big.mark = ".", decimal.mark = ",")), fill = colv, border = NA, bty = "n", cex = 0.8)
  mtext(CASES[[key]]$title, outer = TRUE, adj = 0.01, col = C_TEXT)
  dev.off()
}

# alpha-Sweep
png(file.path(OUT, "alpha_sweep.png"), width = 1800, height = 480, res = 150)
setup_par(mfrow = c(1, 3), mar = c(4.5, 4.5, 2.5, 1))
for (key in names(ext)) {
  t <- ext[[key]]$alpha
  base <- results[[key]]$df
  b <- base$RMSE[base$label == spec_label(results[[key]]$basic)][1]
  plot(t$alpha, t$RMSE, type = "o", pch = 19, col = C_BASIC, lwd = 2,
       ylim = range(c(t$RMSE, b)), xlab = "alpha  (0 = AvE, 1 = CDR)",
       ylab = if (key == "swiss") "RMSE Endschaden (out of sample)" else "",
       main = sub(" \\(.*", "", CASES[[key]]$title))
  grid_lines()
  abline(h = b, lty = 2, col = C_MUTED)
  if (key == "swiss") legend("right", c("gewaehltes Modell", "Basismodell"), col = c(C_BASIC, C_MUTED),
                             lty = c(1, 2), pch = c(19, NA), bty = "n", cex = 0.8)
}
dev.off()

report <- c(report, sprintf("\n_Laufzeit: %.0f s_\n",
                            as.numeric(difftime(Sys.time(), t_start, units = "secs"))))
writeLines(report, file.path(OUT, "REPORT.md"), useBytes = TRUE)
cat(report, sep = "\n")
