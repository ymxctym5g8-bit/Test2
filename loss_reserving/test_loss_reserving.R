# =============================================================================
# Kurzer Selbsttest fuer loss_reserving.R
# Start (im Ordner loss_reserving):  Rscript test_loss_reserving.R
# =============================================================================

source("loss_reserving.R", encoding = "UTF-8")

n_ok <- 0
check <- function(name, cond) {
  if (!isTRUE(cond)) stop("FEHLGESCHLAGEN: ", name, call. = FALSE)
  n_ok <<- n_ok + 1
  cat("ok  ", name, "\n")
}

# --- RAA-Referenzwerte (Mack 1993) --------------------------------------------
tri <- demo_triangle()
r <- compute_all(tri, DEMO_PREMIUMS, elr = DEMO_ELR, n_sims = 500, seed = 1)
check("CL-Reserve RAA = 52.135", round(sum(r$cl$reserve)) == 52135)
check("Mack-SE gesamt RAA = 26.909", round(r$mk$se_total) == 26909)
check("Mack-SE 1990 = 24.566", round(r$mk$se[10]) == 24566)
check("Aeltestes Anfalljahr ohne Reserve", r$cl$reserve[1] == 0)

# --- Identitaet ohne A-priori-Quote: ELR = BF = Cape Cod (gesamt) -------------
r_cc <- compute_all(tri, DEMO_PREMIUMS, elr = NULL, n_sims = 0)
tot <- sapply(r_cc$reserves[c("ELR", "Bornhuetter-Ferguson", "Cape Cod")], sum)
check("ELR = BF = Cape Cod bei Cape-Cod-Quote", diff(range(tot)) < 1e-6)

# --- Bootstrap reproduzierbar mit gleichem Seed -------------------------------
b1 <- odp_bootstrap(tri, r$cl, 300, seed = 7)
b2 <- odp_bootstrap(tri, r$cl, 300, seed = 7)
check("Bootstrap reproduzierbar", identical(b1$res_total, b2$res_total))

# --- Tail-Faktor erhoeht die Reserve ------------------------------------------
check("Tail 1,05 > Tail 1", sum(chain_ladder(tri, 1.05)$reserve) > sum(r$cl$reserve))

# --- Manuelle Reserve als Benchmark -------------------------------------------
rb <- compute_all(tri, n_sims = 0, benchmark = r$cl$reserve)
check("Benchmark = CL -> Abw. 0", abs(rb$bench["Summe", "Abw. zu CL"]) < 1e-12)
check("Benchmark = CL -> Mack-Niveau knapp ueber 50 %",
      rb$bench["Summe", "Niveau Mack"] > 0.5 && rb$bench["Summe", "Niveau Mack"] < 0.6)

# --- Einlesen: deutsches Zahlenformat, inkrementell ---------------------------
txt <- "Anfalljahr;1;2;3\n2022;1.000;800;300\n2023;1.100;900\n2024;1.200"
t2 <- read_triangle_text(txt, incremental = TRUE, sep = "auto", decimal = ",")
check("CSV deutsch + inkrementell", identical(unname(t2$latest), c(2100, 2000, 1200)))
check("parse_num deutsch", parse_num("1.234,5", ",") == 1234.5)

# --- Quartale erkennen und zu Jahren verdichten -------------------------------
check("parse_quarter Formate", identical(
  lapply(c("2024Q1", "Q3 2024", "2024/2", "4. Quartal 2024", "2024"), parse_quarter),
  list(c(2024L, 1L), c(2024L, 3L), c(2024L, 2L), c(2024L, 4L), NULL)))
# 8 Anfallquartale 2023Q1-2024Q4, kumulierter Wert = Abwicklungsquartal (1, 2, 3, ...)
qs <- paste0(rep(2023:2024, each = 4), "Q", 1:4)
m <- t(sapply(1:8, function(i) c(seq_len(9 - i), rep(NA, i - 1))))
tq <- prepare_triangle(make_triangle(m, qs, 1:8), "auto", to_years = TRUE)$tri
check("Quartale -> Jahre", tq$period == "year" &&
        identical(unname(tq$cum), matrix(c(10, 10, 26, NA), 2)))

cat(sprintf("\nAlle %d Tests bestanden.\n", n_ok))
