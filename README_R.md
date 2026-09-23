# R-Version

Die R-Version ist inhaltlich identisch mit der Python-Version und benötigt **nur Basis-R (≥ 4.0), keine Zusatzpakete**.

| Datei | Entspricht | Inhalt |
|---|---|---|
| `ibnr_ml.R` | `ibnr_ml.py` | CL / BF / GCC, dynamischer Backtest, AvE-/CDR-Scores, Grid Search, alle Erweiterungen |
| `data.R` | `data.py` | Die drei Dreiecke und Prämien aus dem Anhang des Papers |
| `run_case_studies.R` | `run_case_studies.py` | Reproduktion (Teil A), Erweiterungen (Teil B), Grafiken, `results_R/REPORT.md` |

```bash
cd R
Rscript run_case_studies.R            # alles, ca. 3–4 Minuten
Rscript run_case_studies.R --quick    # ohne Bayes'sche Optimierung
```

## Abgleich mit Python

- **Teil A (Reproduktion des Papers):** Alle RMSE-Werte, Ränge, IBNR-Summen, Scores und gewählten Modelle sind identisch.
- **B1–B7 (Erweiterungen):** Alle 90 Tabellenzeilen stimmen in gewähltem Modell, RMSE, Bias und IBNR überein.
- **Mack-CoV:** identisch (0,134 / 0,671 / 1,894).
- **B8 (Bayes'sche Optimierung):** Die Ergebnisse weichen im Detail ab. Python nutzt Optuna (multivariater TPE), R eine eigene schlanke TPE-Implementierung in Basis-R (univariat, wie Optunas Standard). Die Zufallszahlen sind außerdem verschieden. Das Muster bleibt gleich: Der größere Suchraum senkt den Trainings-Score, die Out-of-Sample-Genauigkeit verbessert sich aber nicht zuverlässig.

## Unterschiede in der Bedienung

| Python | R |
|---|---|
| `ModelSpec("BF", n_periods=11, drop_high=True, apriori=0.59)` | `model_spec("BF", n_periods = 11, drop_high = TRUE, apriori = 0.59)` |
| `TriangleProblem(tri, premium, valuation_c=K, first_fit_c=k)` | `triangle_problem(tri, premium, valuation_c = K, first_fit_c = k)` |
| `P.backtest(spec)` | `backtest(P, spec)` |
| `P.evaluate(final)` | `evaluate_projection(P, final)` |
| `grid("BF", range(10, 20), apriori=...)` | `grid_specs("BF", 10:19, apriori = ...)` |
| `select(df, "CDR")` | `select_best(df, "CDR")` |

Die Kalenderindizes (`valuation_c`, `first_fit_c`) sind wie im Paper und in Python **0-basiert**: Die Zelle `[i, j]` in R liegt auf der Diagonale `(i-1) + (j-1)`.

## Eigene Daten

```r
source("data.R"); source("ibnr_ml.R")
tri     <- ...   # kumuliertes Dreieck, NA unterhalb der Diagonale
premium <- ...   # verdiente Prämie je Anfallperiode
K <- nrow(tri) - 1
P <- triangle_problem(tri, premium, valuation_c = K, first_fit_c = K - 10)

specs <- c(grid_specs("CL", 5:14),
           grid_specs("BF", 5:14, apriori = seq(0.50, 0.80, 0.01)),
           grid_specs("GCC", 5:14, decay = seq(0, 1, 0.05)))
metric <- recommend_metric(mack_cov(tri_at(P, K))$cov)   # "AvE" oder "CDR"
res  <- run_search(P, specs)
best <- select_best(res, metric)
best[, c("label", "IBNR")]
```
