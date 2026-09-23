# =============================================================================
# Shiny-App: Machine-Learning-Ansatz zur IBNR-Reservierung
# Nachbau von Balona & Richman (2020) inkl. Erweiterungen
#
# Start:  shiny::runApp("R/shiny_app")      (oder in RStudio "Run App")
# Pakete: shiny (>= 1.7), bslib (>= 0.5), DT
# Die Rechenlogik steckt in ibnr_ml.R (identisch mit R/ibnr_ml.R).
# =============================================================================

library(shiny)
library(bslib)
library(DT)

source("ibnr_ml.R", local = TRUE)
source("data.R", local = TRUE)

`%||%` <- function(a, b) if (is.null(a)) b else a

options(DT.options = list(language = list(
  search = "Suche:", lengthMenu = "_MENU_ Einträge", info = "_START_–_END_ von _TOTAL_",
  infoEmpty = "keine Einträge", infoFiltered = "(gefiltert aus _MAX_)", zeroRecords = "Keine Treffer",
  paginate = list(previous = "Zurück", `next` = "Weiter"))))

# ---- Farben (validierte Referenzpalette) ------------------------------------
COL <- c(CL = "#2a78d6", BF = "#eb6834", GCC = "#1baf7a")
C_BASIC <- "#2a78d6"; C_SEL <- "#eb6834"; C_INSP <- "#4a3aa7"; C_AVE <- "#eb6834"; C_CDR <- "#1baf7a"
C_TEXT <- "#0b0b0b"; C_MUTED <- "#52514e"; C_GRID <- "#e4e3df"

# ---- Beispieldaten aus dem Paper ---------------------------------------------
BUILTIN <- list(
  swiss = list(label = "Swiss Private Liability (jährlich)", full = SWISS_TRIANGLE,
               premium = SWISS_PREMIUM, origins = SWISS_ORIGINS, dev = SWISS_DEV,
               K = 18, k_train = 5, np = c(10, 19), lr = c(0.50, 0.70)),
  long_tail = list(label = "Long-Tail Liability (Quartale, Incurred)", full = LONG_TAIL_TRIANGLE,
                   premium = LONG_TAIL_PREMIUM, origins = LONG_TAIL_ORIGINS, dev = LONG_TAIL_DEV,
                   K = 19, k_train = 8, np = c(10, 20), lr = c(0.40, 0.60)),
  short_tail = list(label = "Short-Tail Property (Quartale, Incurred)", full = SHORT_TAIL_TRIANGLE,
                    premium = SHORT_TAIL_PREMIUM, origins = SHORT_TAIL_ORIGINS, dev = SHORT_TAIL_DEV,
                    K = 19, k_train = 8, np = c(10, 20), lr = c(0.40, 0.60))
)

# ---- Hilfsfunktionen ------------------------------------------------------------
fnum <- function(x, d = 0) {
  ifelse(is.na(x), "–", formatC(x, format = "f", digits = d, big.mark = ".", decimal.mark = ","))
}
fpct <- function(x, d = 1) ifelse(is.na(x), "–", paste0(formatC(100 * x, format = "f", digits = d,
                                                                 decimal.mark = ",", flag = "+"), " %"))

max_diag <- function(m) max((row(m) - 1 + col(m) - 1)[!is.na(m)])

METHOD_NAME <- c(CL = "Chain Ladder", BF = "Bornhuetter-Ferguson", GCC = "Generalised Cape Cod")
AVG_NAME <- c(volume = "volumengewichtet", simple = "einfaches Mittel", median = "Median")

#' Modell in Klartext (kurz, fuer Kacheln)
spec_text <- function(s, n_orig) {
  per <- if (s$n_periods < 1 || s$n_periods >= n_orig - 1) "alle Faktoren" else
    sprintf("jüngste %d Faktoren", s$n_periods)
  drops <- c(if (isTRUE(s$drop_high)) "ohne Höchstwert", if (isTRUE(s$drop_low)) "ohne Tiefstwert")
  extra <- c(if (s$average != "volume") AVG_NAME[[s$average]],
             if (s$ay_decay != 1) sprintf("AJ-Gewicht %s", fnum(s$ay_decay, 2)),
             if (s$method == "BF") { if (length(s$apriori) > 1) "A-priori je AJ" else
               sprintf("A-priori %s %%", fnum(100 * s$apriori, 1)) },
             if (s$method == "GCC") sprintf("Decay %s", fnum(s$decay, 2)))
  paste(c(per, if (length(drops)) drops else "ohne Ausschlüsse", extra), collapse = " · ")
}

parse_upload <- function(path, sep, dec, incremental) {
  raw <- read.csv(path, sep = sep, colClasses = "character", check.names = FALSE,
                  na.strings = c("", "NA", "-", "NaN"), strip.white = TRUE)
  if (ncol(raw) < 4 || nrow(raw) < 4) stop("Mindestens 4 Anfallperioden und 3 Entwicklungsperioden nötig.")
  to_num <- function(x) {
    x <- gsub("[  ']", "", x)
    x <- if (dec == ",") gsub(",", ".", gsub(".", "", x, fixed = TRUE), fixed = TRUE)
         else gsub(",", "", x, fixed = TRUE)
    suppressWarnings(as.numeric(x))
  }
  origins <- raw[[1]]
  rest <- raw[-1]
  pcol <- grep("^(premium|pr(ä|ae)mie|ep|earned.?premium)$", tolower(names(rest)))
  premium <- if (length(pcol)) to_num(rest[[pcol[1]]]) else NULL
  if (length(pcol)) rest <- rest[-pcol[1]]
  m <- sapply(rest, to_num)
  m <- matrix(m, nrow = nrow(raw), dimnames = NULL)
  if (incremental) {
    m <- t(apply(m, 1, function(r) { ok <- !is.na(r); r[ok] <- cumsum(r[ok]); r }))
  }
  if (!is.null(premium) && anyNA(premium)) premium <- NULL
  list(full = m, premium = premium, origins = origins, dev = names(rest))
}

tri_html <- function(m, K, k_train, origins, dev) {
  head <- paste0("<th></th>", paste0("<th>", dev, "</th>", collapse = ""))
  rows <- vapply(seq_len(nrow(m)), function(i) {
    cells <- vapply(seq_len(ncol(m)), function(j) {
      v <- m[i, j]; c <- (i - 1) + (j - 1)
      if (is.na(v)) return("<td></td>")
      cls <- if (c < k_train) "t-init" else if (c <= K) "t-train" else "t-future"
      sprintf('<td class="%s">%s</td>', cls, fnum(v))
    }, "")
    paste0("<tr><th>", origins[i], "</th>", paste(cells, collapse = ""), "</tr>")
  }, "")
  HTML(paste0('<div class="tri-wrap"><table class="tri"><thead><tr>', head,
              "</tr></thead><tbody>", paste(rows, collapse = ""), "</tbody></table></div>"))
}

plot_setup <- function(mar = c(4.2, 4.8, 1.2, 0.8)) {
  par(mar = mar, bg = "white", fg = C_MUTED, col.axis = C_MUTED, col.lab = C_TEXT, las = 1,
      bty = "l", cex.axis = 0.85, mgp = c(3.2, 0.7, 0))
}
hgrid <- function() abline(h = axTicks(2), col = C_GRID, lwd = 1)
axis_fmt <- function(side = 2) axis(side, at = axTicks(side), labels = fnum(axTicks(side)), col = NA)

bars <- function(mat, cols, names_arg, ylab, legend_labels) {
  plot_setup(mar = c(5.5, 5.2, 1.2, 0.8))
  yl <- range(c(0, mat), na.rm = TRUE)
  b <- barplot(mat, beside = TRUE, col = cols, border = NA, names.arg = names_arg, las = 2,
               cex.names = 0.72, ylim = yl + c(-0.04, 0.12) * diff(yl), axes = FALSE, ylab = ylab)
  hgrid(); axis_fmt()
  barplot(mat, beside = TRUE, col = cols, border = NA, add = TRUE, axes = FALSE, names.arg = rep("", ncol(mat)))
  abline(h = 0, col = C_MUTED)
  legend("topleft", legend_labels, fill = cols, border = NA, bty = "n", cex = 0.85, text.col = C_TEXT)
}

# =============================================================================
# UI
# =============================================================================
css <- "
.tri-wrap { overflow:auto; max-height: 560px; }
table.tri { border-collapse: collapse; font-size: 0.74rem; font-variant-numeric: tabular-nums; }
table.tri th, table.tri td { padding: 2px 6px; text-align: right; white-space: nowrap; border: 1px solid #fff; }
table.tri thead th { position: sticky; top: 0; background: #fff; color: #52514e; }
table.tri tbody th { position: sticky; left: 0; background: #fff; color: #52514e; }
.t-init { background: #dbe8f8; } .t-train { background: #d6f0e2; } .t-future { background: #fcefc7; }
.legend-sw { display:inline-block; width:12px; height:12px; border-radius:2px; margin: 0 4px -1px 12px; }
.bslib-value-box .value-box-value { font-size: 1.35rem; }
.vb-small { font-size: 0.78rem; opacity: 0.8; margin-bottom: 0.2rem; }
.help-note { font-size: 0.8rem; color: #52514e; }
table.lr td.used { background: #eef4fc; }
table.lr td.out  { color: #a3a29c; }
table.lr td.high { background: #fbe0d6; color: #9c2f0c; text-decoration: line-through; font-weight: 600; }
table.lr td.low  { background: #dcefe6; color: #0b6b47; text-decoration: line-through; font-weight: 600; }
table.lr td.noeff { opacity: 0.45; }
table.lr tr.ldf-row th, table.lr tr.ldf-row td { border-top: 2px solid #52514e; font-weight: 600; background: #fff; }
table.lr tr.ldf-cmp th, table.lr tr.ldf-cmp td { color: #52514e; background: #fff; }
table.settings td:first-child { font-weight: 600; white-space: nowrap; padding-right: 1.2rem; }
table.settings td { padding: 4px 8px; vertical-align: top; border-bottom: 1px solid #eee; }
table.settings td:last-child { color: #52514e; font-size: 0.82rem; }
"

ui <- page_sidebar(
  title = "IBNR-Modellwahl per Backtest · Balona & Richman (2020)",
  theme = bs_theme(version = 5, primary = "#2a78d6", "font-size-base" = "0.9rem"),
  fillable = FALSE,
  sidebar = sidebar(
    width = 350,
    tags$head(tags$style(HTML(css))),
    accordion(
      open = c("Daten", "Bewertung"),
      accordion_panel(
        "Daten", icon = icon("table"),
        radioButtons("src", NULL, c("Beispieldaten aus dem Paper" = "builtin",
                                   "Eigene CSV-Datei" = "upload")),
        conditionalPanel("input.src == 'builtin'",
          selectInput("builtin", "Dreieck", setNames(names(BUILTIN), sapply(BUILTIN, `[[`, "label")))),
        conditionalPanel("input.src == 'upload'",
          fileInput("file", "Dreieck als CSV", accept = c(".csv", ".txt"), buttonLabel = "Durchsuchen …",
                    placeholder = "keine Datei ausgewählt"),
          layout_columns(
            selectInput("sep", "Trennzeichen", c("Semikolon" = ";", "Komma" = ",", "Tab" = "\t")),
            selectInput("dec", "Dezimalzeichen", c("Komma" = ",", "Punkt" = "."))),
          checkboxInput("incremental", "Werte sind inkrementell", FALSE),
          div(class = "help-note",
              "Erste Spalte: Anfallperiode, weitere Spalten: Entwicklungsperioden (leer = unbeobachtet). ",
              "Optional eine Spalte 'Praemie'. Ist das Rechteck vollständig, wird out of sample bewertet. ",
              downloadLink("dl_example", "Beispieldatei"))),
        uiOutput("calendar_ui")
      ),
      accordion_panel(
        "Suchraum", icon = icon("sliders"),
        checkboxGroupInput("methods", "Verfahren",
                           c("Chain Ladder" = "CL", "Bornhuetter-Ferguson" = "BF",
                             "Generalised Cape Cod" = "GCC"), selected = c("CL", "BF", "GCC")),
        uiOutput("np_ui"),
        checkboxInput("drops", "Ausschluss höchster / niedrigster Faktor variieren", TRUE),
        uiOutput("lr_ui"),
        layout_columns(
          numericInput("lr_step", "Schritt Quote", 0.01, min = 0.005, max = 0.1, step = 0.005),
          numericInput("decay_step", "Schritt Decay", 0.05, min = 0.01, max = 0.5, step = 0.01)),
        checkboxGroupInput("avg", "LDF-Mittelung (Erweiterung)",
                           c("volumengewichtet" = "volume", "einfach" = "simple", "Median" = "median"),
                           selected = "volume", inline = TRUE),
        textInput("ay_decay", "Anfalljahres-Gewichte, Decay-Werte (Erweiterung)", "1"),
        uiOutput("n_models")
      ),
      accordion_panel(
        "Bewertung", icon = icon("bullseye"),
        radioButtons("metric", "Score für die Modellwahl",
                     c("AvE" = "AvE", "CDR" = "CDR", "CDR-α" = "alpha"), selected = "CDR", inline = TRUE),
        conditionalPanel("input.metric == 'alpha'",
          sliderInput("alpha", "α  (0 = AvE, 1 = CDR)", 0, 1.5, 0.5, step = 0.05)),
        numericInput("lambda", "Bias-Strafterm λ (Erweiterung)", 0, min = 0, step = 0.25),
        radioButtons("expectation", "Erwartung der nächsten Diagonale (BF/GCC)",
                     c("wie chainladder / Paper" = "chainladder", "verfahrenskonsistent" = "consistent")),
        selectInput("basic", "Vergleichs-Basismodell",
                    c("Chain Ladder, alle Perioden" = "CL", "BF, mittlere A-priori-Quote" = "BF",
                      "GCC, Decay 0,75" = "GCC")),
        div(class = "help-note", "Score, α, λ und Basismodell wirken sofort; Daten, Suchraum und ",
            "Erwartung erst nach 'Suche starten'.")
      )
    ),
    actionButton("run", "Suche starten", icon = icon("play"), class = "btn-primary w-100")
  ),

  navset_card_underline(
    id = "tabs",
    # ---------------------------------------------------------------- Übersicht
    nav_panel(
      "Übersicht",
      uiOutput("value_boxes"),
      card(card_header("Basismodell vs. optimierte Modelle"),
           DTOutput("summary_tbl", fill = FALSE),
           div(class = "help-note", "Scores = mittlerer gewichteter RMSE der Backtest-Prognosen (Gl. 2). ",
               "RMSE / Rang / Bias: Fehler der Endschäden gegenüber der tatsächlichen Entwicklung ",
               "(nur wenn die Zukunft in den Daten enthalten ist).")),
      layout_columns(
        col_widths = c(6, 6),
        card(card_header("IBNR je Anfallperiode"), plotOutput("plot_ibnr", height = 330),
             downloadLink("dl_ibnr", "IBNR-Tabelle als CSV")),
        card(card_header(textOutput("plot_err_title", inline = TRUE)), plotOutput("plot_err", height = 330))
      )
    ),
    # ---------------------------------------------------------------- Modelldetails
    nav_panel(
      "Modelldetails",
      card(card_header(uiOutput("det_header")),
           layout_columns(
             col_widths = c(7, 5),
             div(h6("Einstellungen des Verfahrens"), uiOutput("det_settings")),
             div(h6("Bewertung und Auswahl"), uiOutput("det_scoring")))),
      card(card_header("Individuelle Abwicklungsfaktoren am Stichtag – was ging in die LDFs ein?"),
           div(class = "help-note mb-2",
               span(class = "legend-sw", style = "background:#eef4fc"), "verwendet",
               span(class = "legend-sw", style = "background:#fff; border:1px solid #ccc"), "außerhalb des Zeitfensters",
               span(class = "legend-sw", style = "background:#fbe0d6"), "als höchster Faktor ausgeschlossen",
               span(class = "legend-sw", style = "background:#dcefe6"), "als niedrigster Faktor ausgeschlossen",
               " (blass = lag ohnehin außerhalb des Fensters)"),
           uiOutput("lr_table"),
           uiOutput("lr_note"))
    ),
    # ---------------------------------------------------------------- Dreieck
    nav_panel(
      "Dreieck",
      card(
        card_header(
          div(class = "d-flex justify-content-between align-items-center",
              span("Daten und Aufteilung (Abb. 1 im Paper)"),
              radioButtons("tri_mode", NULL, c("kumuliert" = "cum", "inkrementell" = "inc"), inline = TRUE))),
        div(class = "help-note mb-2",
            span(class = "legend-sw", style = "background:#dbe8f8"), "Ausgangsdreieck",
            span(class = "legend-sw", style = "background:#d6f0e2"), "Trainings-Diagonalen (Fit + Scoring)",
            span(class = "legend-sw", style = "background:#fcefc7"), "Zukunft (nur zur Out-of-Sample-Bewertung)"),
        uiOutput("tri_table")),
      layout_columns(
        col_widths = c(7, 5),
        card(card_header(textOutput("ldf_title", inline = TRUE)), DTOutput("ldf_tbl", fill = FALSE)),
        card(card_header("Prämie und Schadenquoten (Stichtag)"), DTOutput("prem_tbl", fill = FALSE)))
    ),
    # ---------------------------------------------------------------- Modellraum
    nav_panel(
      "Modellraum",
      card(card_header(div(class = "d-flex justify-content-between",
                           span("Alle bewerteten Modelle – Zeile anklicken, um ein Modell zu inspizieren"),
                           downloadLink("dl_grid", "CSV"))),
           DTOutput("grid_tbl", fill = FALSE)),
      layout_columns(
        col_widths = c(6, 6),
        card(card_header("Bester Score je n_periods und Verfahren"), plotOutput("plot_np", height = 320)),
        card(card_header("Trainings-Score vs. Out-of-Sample-RMSE"), plotOutput("plot_scatter", height = 320),
             uiOutput("scatter_note")))
    ),
    # ---------------------------------------------------------------- Backtest
    nav_panel(
      "Backtest",
      card(card_header(uiOutput("insp_header")),
           layout_columns(
             col_widths = c(6, 6),
             plotOutput("plot_bt_scores", height = 300),
             plotOutput("plot_bt_bias", height = 300))),
      card(card_header("Backtest-Datensätze (je Kalenderperiode und Anfallperiode)"), DTOutput("bt_tbl", fill = FALSE))
    ),
    # ---------------------------------------------------------------- Erweiterungen
    nav_panel(
      "Erweiterungen",
      layout_columns(
        col_widths = c(6, 6),
        card(card_header("B1 · CDR-α: Modellwahl in Abhängigkeit von α"),
             plotOutput("plot_alpha", height = 260), DTOutput("alpha_tbl", fill = FALSE)),
        card(card_header("B6 · Mack-Variationskoeffizient"), uiOutput("mack_ui"),
             hr(),
             card_title("B7 · Holdout-Validierung der Metrik"),
             div(class = "help-note", "Die letzten Diagonalen werden zurückgehalten; je α wird ein Modell ",
                 "gewählt und dessen Mehrperioden-Prognose gegen die Ist-Werte geprüft."),
             layout_columns(numericInput("holdout", "Zurückgehaltene Diagonalen", 3, min = 1, max = 6),
                            actionButton("run_holdout", "Holdout rechnen", class = "btn-outline-primary mt-4")),
             DTOutput("holdout_tbl", fill = FALSE), uiOutput("holdout_note"))
      ),
      layout_columns(
        col_widths = c(6, 6),
        card(card_header("B5 · Zwei-Stufen-Suche"),
             div(class = "help-note", "Erst beste CL-Variante, dann nur A-priori-Quote bzw. Decay – ",
                 "Vergleich mit dem vollen Grid."),
             actionButton("run_twostep", "Zwei-Stufen-Suche rechnen", class = "btn-outline-primary"),
             DTOutput("twostep_tbl", fill = FALSE)),
        card(card_header("B8 · Bayes'sche Optimierung (TPE)"),
             layout_columns(
               numericInput("trials", "Trials", 150, min = 30, max = 1000, step = 10),
               numericInput("knots", "Stützstellen AJ-Quote (0 = aus)", 0, min = 0, max = 6),
               numericInput("seed", "Seed", 1)),
             checkboxInput("tpe_ext", "Erweiterte LDF-Optionen durchsuchen", TRUE),
             actionButton("run_bayes", "Optimierung starten", class = "btn-outline-primary"),
             uiOutput("bayes_ui"), plotOutput("plot_bayes", height = 220))
      )
    ),
    # ---------------------------------------------------------------- Benchmark
    nav_panel(
      "Benchmark",
      layout_columns(
        col_widths = c(5, 7),
        card(card_header("Manuelle Reservierung laden"),
             div(class = "help-note",
                 "CSV im Langformat mit den Spalten ", strong("Stichtag; Anfalljahr; Endschaden"),
                 " und optional ", strong("Erwartet"), " (damals erwarteter Zuwachs der Folgeperiode). ",
                 "Stichtag = Kalenderperiode mit derselben Bezeichnung wie die Anfallperioden ",
                 "(z. B. 1990 = Jahresende 1990). Trenn- und Dezimalzeichen wie in der Seitenleiste."),
             fileInput("bench_file", NULL, accept = c(".csv", ".txt"), buttonLabel = "Durchsuchen …",
                       placeholder = "keine Datei ausgewählt"),
             layout_columns(
               actionButton("bench_demo", "Demo laden (simuliert)", class = "btn-outline-primary"),
               downloadButton("bench_template", "Vorlage", class = "btn-outline-secondary")),
             numericInput("bench_min", "Mindestanzahl Backtest-Perioden vor der ersten Auswahl",
                          3, min = 1, max = 10),
             uiOutput("bench_status")),
        card(card_header("So wird verglichen"),
             markdown(paste(
               "- **Manuell:** Die damals gebuchten Endschäden werden mit denselben Kennzahlen bewertet wie die Modelle (AvE, CDR, CDR-α, Gl. 2).",
               "- **App, rollierende Wahl:** Zu jedem Stichtag wählt die App ihr Modell **nur mit den bis dahin bekannten** Backtest-Perioden – wie es damals möglich gewesen wäre. Modellwechsel wirken auf den CDR wie in der Praxis.",
               "- **App, feste Auswahl:** das heute gewählte Modell rückwirkend angewendet. Es wurde auf genau diesen Perioden ausgesucht und ist deshalb **zu optimistisch** – nur als Referenz.",
               "- Fehlt die Spalte *Erwartet*, wird die Erwartung aus dem Chain-Ladder-Muster zum Stichtag abgeleitet (offene manuelle Reserve × Anteil der nächsten Periode).",
               "- Vorher auf **gleichen Umfang** achten: brutto/netto, ohne Tail, gleiche Sparte, Großschäden gleich behandelt.",
               sep = "\n")))),
      uiOutput("bench_boxes"),
      layout_columns(
        col_widths = c(6, 6),
        card(card_header("Score je Periode (kleiner = besser)"), plotOutput("bench_plot_scores", height = 320)),
        card(card_header("Abwicklungsergebnis je Periode (Summe CDR)"), plotOutput("bench_plot_runoff", height = 320),
             div(class = "help-note", "Negativ = Endschäden wurden nach unten korrigiert (Abwicklungsgewinn, ",
                 "Reserve war zu hoch); positiv = Nachreservierung (Reserve war zu niedrig)."))),
      card(card_header("Zusammenfassung"), DTOutput("bench_summary", fill = FALSE), uiOutput("bench_note")),
      card(card_header("Periode für Periode"), DTOutput("bench_periods", fill = FALSE))
    ),
    # ---------------------------------------------------------------- Methode
    nav_panel(
      "Methode",
      card(
        card_header("So funktioniert der Ansatz"),
        markdown("
**Idee (Balona & Richman 2020).** Klassische Reservierungsverfahren – Chain Ladder (CL), Bornhuetter-Ferguson (BF) und Generalised Cape Cod (GCC) – haben Stellschrauben: Anzahl der Perioden für die Abwicklungsfaktoren, Ausschluss von Ausreißern, A-priori-Schadenquote, Decay. Statt sie nach Erfahrung zu setzen, werden sie wie Hyperparameter eines Machine-Learning-Modells **auf ungesehenen Daten** ausgewählt.

**Ablauf.** Für jede Parameterkombination wird das Dreieck Kalenderperiode für Kalenderperiode nachreserviert: Fit auf allen Daten bis Diagonale *k*, Prognose der Diagonale *k+1*, Vergleich mit dem tatsächlich Eingetretenen, dann Neufit mit der zusätzlichen Diagonale. Die Fehler werden je Periode zu einem gewichteten RMSE verdichtet (Gewicht: |Ist-Zuwachs|) und über die Perioden gemittelt. Gewählt wird das Modell mit dem kleinsten Score.

**Scores.**
- **AvE** (Actual vs. Expected): Ist-Zuwachs minus erwarteter Zuwachs der nächsten Diagonale – misst die Prognosegüte.
- **CDR** (Claims Development Result): Veränderung des geschätzten Endschadens zwischen zwei Stichtagen = AvE + Veränderung der Restreserve – belohnt zusätzlich stabile Reserven.
- **CDR-α** (Erweiterung): AvE + α · Reserveveränderung, stufenlos zwischen beiden.
- **λ** (Erweiterung): Strafterm für systematische Über- oder Unterschätzung.

**Welche Metrik?** Das Paper findet CDR besser für große, stabile Dreiecke und AvE für volatile. Als Faustregel dient der Mack-Variationskoeffizient der CL-Reserve (Tab *Erweiterungen*); datengetrieben lässt sich α per Holdout wählen.

**Out-of-Sample-Bewertung.** Enthält die Datei die vollständige zukünftige Entwicklung (Rechteck), wird zusätzlich der RMSE der Endschäden gegenüber der letzten Spalte berechnet – so wie in den Fallstudien des Papers. Die letzte Spalte gilt dabei als endabgewickelt. Im Normalfall (nur Dreieck) entfällt diese Auswertung.

**Konventionen.** Kein Tail-Faktor. Kalenderdiagonalen sind 0-basiert (Diagonale 0 = erste Periode der ersten Anfallperiode). Die Voreinstellungen (Erwartung 'wie chainladder', Ausschluss-Logik) reproduzieren die Tabellen des Papers exakt.
"))
    )
  )
)

# =============================================================================
# Server
# =============================================================================
server <- function(input, output, session) {

  rv <- reactiveValues(P = NULL, df = NULL, specs = NULL, inspect = NULL, holdout = NULL,
                       twostep = NULL, bayes = NULL, d = NULL, settings = NULL)

  # ---- Daten ------------------------------------------------------------------
  dat <- reactive({
    if (input$src == "builtin") {
      b <- BUILTIN[[input$builtin]]
      return(list(full = b$full, premium = b$premium, origins = b$origins, dev = b$dev,
                  K = b$K, k_train = b$k_train, np = b$np, lr = b$lr, name = b$label))
    }
    req(input$file)
    d <- tryCatch(parse_upload(input$file$datapath, input$sep, input$dec, input$incremental),
                  error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL })
    req(d)
    n <- nrow(d$full)
    K <- min(max_diag(d$full), n - 1)
    lr0 <- if (!is.null(d$premium)) {
      p <- project(triangle_at(d$full, K), model_spec("CL"), d$premium)
      sum(p$ultimate, na.rm = TRUE) / sum(d$premium[!is.na(p$ultimate)])
    } else 0.6
    c(d, list(K = K, k_train = max(1, ceiling(K / 3), K - 12), np = c(max(2, floor(n / 2)), n),
              lr = round(c(max(0.05, lr0 - 0.15), lr0 + 0.15), 2), name = input$file$name))
  })

  output$calendar_ui <- renderUI({
    d <- dat()
    md <- max_diag(d$full)
    if (!anyNA(d$full)) md <- md - 1      # vollständiges Rechteck: mind. eine Diagonale Zukunft
    tagList(
      sliderInput("cal", "Kalenderdiagonalen: erster Fit … Bewertungsstichtag K",
                  min = 1, max = md, value = c(d$k_train, d$K), step = 1),
      uiOutput("cal_note"))
  })
  output$cal_note <- renderUI({
    req(input$cal)
    d <- dat()
    div(class = "help-note",
        sprintf("%d Scoring-Perioden · %s", input$cal[2] - input$cal[1],
                if (anyNA(d$full[, ncol(d$full)])) "Zukunft unbekannt – nur Scoring"
                else "vollständige Zukunft vorhanden – Out-of-Sample-RMSE wird berechnet"),
        if (is.null(d$premium)) tags$div(style = "color:#b3261e",
                                         "Keine Prämie gefunden – BF und GCC sind deaktiviert."))
  })
  output$np_ui <- renderUI({
    d <- dat()
    sliderInput("np", "n_periods (Anzahl jüngster Faktoren je Spalte)", min = 2,
                max = nrow(d$full), value = d$np, step = 1)
  })
  output$lr_ui <- renderUI({
    d <- dat()
    sliderInput("lr", "A-priori-Schadenquoten für BF", min = 0.05, max = 1.5, value = d$lr, step = 0.01)
  })

  output$dl_example <- downloadHandler(
    filename = "beispiel_dreieck_swiss.csv",
    content = function(file) {
      m <- triangle_at(SWISS_TRIANGLE, 18)
      df <- data.frame(Anfalljahr = SWISS_ORIGINS, m, Praemie = SWISS_PREMIUM, check.names = FALSE)
      names(df)[2:(ncol(m) + 1)] <- SWISS_DEV
      write.table(df, file, sep = ";", dec = ",", row.names = FALSE, na = "")
    })

  # ---- Suchraum ------------------------------------------------------------------
  settings_now <- reactive({
    d <- dat()
    methods <- input$methods %||% c("CL", "BF", "GCC")
    if (is.null(d$premium)) methods <- intersect(methods, "CL")
    if (!length(methods)) methods <- "CL"
    np <- input$np %||% d$np
    lr <- input$lr %||% d$lr
    ayd <- suppressWarnings(as.numeric(strsplit(gsub(",", " ", input$ay_decay %||% "1"), "\\s+")[[1]]))
    ayd <- unique(ayd[!is.na(ayd) & ayd > 0 & ayd <= 1]); if (!length(ayd)) ayd <- 1
    list(methods = methods, np = seq(np[1], np[2]),
         drops = if (isTRUE(input$drops %||% TRUE)) c(TRUE, FALSE) else FALSE,
         lr = round(seq(lr[1], lr[2] + 1e-9, by = max(input$lr_step %||% 0.01, 0.001)), 4),
         decay = round(unique(c(seq(0, 1, by = max(input$decay_step %||% 0.05, 0.005)), 1)), 4),
         avg = if (length(input$avg)) input$avg else "volume", ayd = ayd,
         cal = input$cal %||% c(d$k_train, d$K), expectation = input$expectation %||% "chainladder")
  })

  build_specs <- function(s) {
    out <- list()
    for (m in s$methods) {
      out <- c(out, grid_specs(m, s$np, s$drops, s$drops,
                               apriori = if (m == "BF") s$lr, decay = if (m == "GCC") s$decay,
                               average = s$avg, ay_decay = s$ayd))
    }
    out
  }

  output$n_models <- renderUI({
    s <- settings_now()
    per <- length(s$np) * length(s$drops)^2 * length(s$avg) * length(s$ayd)
    n <- per * sum(c(CL = 1, BF = length(s$lr), GCC = length(s$decay))[s$methods])
    div(class = "help-note", sprintf("%s Modelle · geschätzte Laufzeit ca. %s s", fnum(n),
                                     fnum(max(1, n * 0.012 * (s$cal[2] - s$cal[1]) / 13))))
  })

  # ---- Suche ---------------------------------------------------------------------
  observeEvent(input$run, {
    d <- dat()
    s <- settings_now()
    if (s$cal[2] - s$cal[1] < 2) {
      showNotification("Mindestens 2 Scoring-Perioden nötig (Bereich vergrößern).", type = "error")
      return()
    }
    P <- triangle_problem(d$full, d$premium, valuation_c = s$cal[2], first_fit_c = s$cal[1],
                          origins = d$origins, expectation = s$expectation)
    specs <- build_specs(s)
    res <- tryCatch(withProgress(message = "Backtests laufen", value = 0, {
      idx <- split(seq_along(specs), ceiling(seq_along(specs) / 40))
      parts <- vector("list", length(idx))
      for (k in seq_along(idx)) {
        parts[[k]] <- run_search(P, specs[idx[[k]]])
        incProgress(1 / length(idx), detail = sprintf("%s von %s Modellen", fnum(max(idx[[k]])),
                                                      fnum(length(specs))))
      }
      df <- do.call(rbind, parts)
      if ("RMSE" %in% names(df)) df <- rerank(df)
      df
    }), error = function(e) { showNotification(paste("Fehler:", conditionMessage(e)), type = "error"); NULL })
    req(res)
    rv$P <- P; rv$df <- res; rv$specs <- specs; rv$d <- d; rv$settings <- s
    rv$inspect <- NULL; rv$holdout <- NULL; rv$twostep <- NULL; rv$bayes <- NULL
  }, ignoreNULL = FALSE)

  # ---- abgeleitete Grössen -------------------------------------------------------------
  alpha_now <- reactive(switch(input$metric, AvE = 0, CDR = 1, alpha = input$alpha))
  alpha_d <- debounce(alpha_now, 300)
  lambda_now <- reactive(max(0, input$lambda %||% 0))
  metric_label <- reactive({
    base <- switch(input$metric, AvE = "AvE", CDR = "CDR", alpha = sprintf("CDR-α (α = %s)", input$alpha))
    if (lambda_now() > 0) paste0(base, " + ", lambda_now(), "·|Bias|") else base
  })
  truth <- reactive({ req(rv$df); "RMSE" %in% names(rv$df) })

  scored <- reactive({
    req(rv$df)
    df <- rv$df
    a <- alpha_d(); lam <- lambda_now()
    df$score_sel <- vapply(rv$specs, function(s) score_records(backtest(rv$P, s)$records, alpha = a,
                                                                bias_penalty = lam), 0)
    df
  })
  sel_idx <- reactive(which.min(scored()$score_sel))
  insp_idx <- reactive(rv$inspect %||% sel_idx())

  basic_spec <- reactive({
    req(rv$P)
    b <- input$basic
    if (is.null(rv$P$premium)) b <- "CL"
    switch(b, CL = model_spec("CL"),
           BF = model_spec("BF", apriori = round(mean(rv$settings$lr), 2)),
           GCC = model_spec("GCC", decay = 0.75))
  })
  eval_spec <- function(s) {
    bt <- backtest(rv$P, s)
    out <- list(label = spec_label(s), AvE = score_records(bt$records, alpha = 0),
                CDR = score_records(bt$records, alpha = 1),
                sel = score_records(bt$records, alpha = alpha_d(), bias_penalty = lambda_now()),
                IBNR = sum(ibnr(bt$final), na.rm = TRUE), final = bt$final)
    if (truth()) {
      ev <- evaluate_projection(rv$P, bt$final)
      out <- c(out, ev[c("RMSE", "bias")], rank = sum(rv$df$RMSE < ev$RMSE) + 1)
    }
    out
  }
  basic_eval <- reactive(eval_spec(basic_spec()))
  sel_eval <- reactive(eval_spec(rv$specs[[sel_idx()]]))
  insp_eval <- reactive(eval_spec(rv$specs[[insp_idx()]]))
  mack <- reactive({ req(rv$P); tryCatch(mack_cov(tri_at(rv$P, rv$P$K)), error = function(e) NULL) })

  # ---- Übersicht ---------------------------------------------------------------
  output$value_boxes <- renderUI({
    req(rv$df)
    se <- sel_eval(); be <- basic_eval(); mk <- mack()
    boxes <- list(
      value_box(title = paste("Gewähltes Modell ·", metric_label()),
                value = METHOD_NAME[[rv$specs[[sel_idx()]]$method]],
                p(class = "vb-small", spec_text(rv$specs[[sel_idx()]], nrow(rv$P$full))),
                p(class = "vb-small", sprintf("%s Modelle bewertet", fnum(nrow(rv$df)))), theme = "primary"),
      value_box(title = "IBNR gewähltes Modell", value = fnum(se$IBNR),
                p(class = "vb-small", sprintf("Basismodell: %s (%s)", fnum(be$IBNR),
                                              fpct(se$IBNR / be$IBNR - 1)))))
    if (truth()) {
      boxes <- c(boxes, list(value_box(
        title = "Out-of-Sample-RMSE Endschaden", value = fnum(se$RMSE, 1),
        p(class = "vb-small", sprintf("Rang %s von %s · Basis %s (%s)", fnum(se$rank), fnum(nrow(rv$df)),
                                      fnum(be$RMSE, 1), fpct(se$RMSE / be$RMSE - 1))),
        p(class = "vb-small", sprintf("bestes Modell im Suchraum: %s", fnum(min(rv$df$RMSE), 1))))))
    }
    if (!is.null(mk)) {
      rec <- recommend_metric(mk$cov)
      boxes <- c(boxes, list(value_box(
        title = "Mack-CoV der CL-Reserve", value = fnum(mk$cov, 3),
        p(class = "vb-small", sprintf("Faustregel: %s (%s)", rec,
                                      if (rec == "CDR") "stabiles Dreieck" else "volatiles Dreieck")))))
    }
    do.call(layout_columns, c(list(col_widths = rep(12 / length(boxes), length(boxes))), boxes))
  })

  summary_df <- reactive({
    df <- scored()
    rows <- list(Basismodell = basic_eval(),
                 `Min. AvE` = eval_spec(rv$specs[[which.min(df$score_AvE)]]),
                 `Min. CDR` = eval_spec(rv$specs[[which.min(df$score_CDR)]]),
                 "Gewählt" = sel_eval())
    if (!is.null(rv$inspect)) rows$Inspiziert <- insp_eval()
    out <- do.call(rbind, lapply(names(rows), function(n) {
      r <- rows[[n]]
      x <- data.frame(Modell = n, Spezifikation = r$label, `Score AvE` = r$AvE, `Score CDR` = r$CDR,
                      "Score gewählt" = r$sel, IBNR = r$IBNR, check.names = FALSE)
      if (truth()) { x$RMSE <- r$RMSE; x$Rang <- r$rank; x$Bias <- r$bias }
      x
    }))
    out
  })
  output$summary_tbl <- renderDT({
    df <- summary_df()
    num <- setdiff(names(df), c("Modell", "Spezifikation", "Rang"))
    datatable(fillContainer = FALSE, df, rownames = FALSE, selection = "none",
              options = list(dom = "t", ordering = FALSE, pageLength = 10)) |>
      formatRound(num, digits = 1, mark = ".", dec.mark = ",") |>
      formatStyle("Modell", target = "row",
                  fontWeight = styleEqual("Gewählt", "600"))
  })

  finals_plot <- reactive({
    l <- list(Basismodell = basic_eval()$final, "Gewählt" = sel_eval()$final)
    cols <- c(C_BASIC, C_SEL)
    if (!is.null(rv$inspect) && insp_idx() != sel_idx()) {
      l$Inspiziert <- insp_eval()$final; cols <- c(cols, C_INSP)
    }
    list(l = l, cols = cols)
  })
  output$plot_ibnr <- renderPlot(res = 100, {
    req(rv$df)
    fp <- finals_plot()
    m <- do.call(rbind, lapply(fp$l, ibnr))
    bars(m, fp$cols, rv$P$origins, "IBNR",
         sprintf("%s: %s", names(fp$l), fnum(rowSums(m, na.rm = TRUE))))
  })
  output$plot_err_title <- renderText({
    req(rv$df)
    if (truth()) "Tatsächlicher minus prognostizierter Endschaden" else "Geschätzter Endschaden je Anfallperiode"
  })
  output$plot_err <- renderPlot(res = 100, {
    req(rv$df)
    fp <- finals_plot()
    if (truth()) {
      m <- do.call(rbind, lapply(fp$l, function(f) true_ultimate(rv$P) - f$ultimate))
      bars(m, fp$cols, rv$P$origins, "Ist − Prognose",
           sprintf("%s: RMSE %s", names(fp$l), fnum(sqrt(rowMeans(m^2, na.rm = TRUE)), 1)))
    } else {
      m <- do.call(rbind, lapply(fp$l, `[[`, "ultimate"))
      bars(m, fp$cols, rv$P$origins, "Endschaden", names(fp$l))
    }
  })
  output$dl_ibnr <- downloadHandler(
    filename = "ibnr_je_anfallperiode.csv",
    content = function(file) {
      fp <- finals_plot()
      df <- data.frame(Anfallperiode = rv$P$origins, Letzter_Stand = fp$l[[1]]$latest)
      for (n in names(fp$l)) {
        df[[paste0("Endschaden_", n)]] <- fp$l[[n]]$ultimate
        df[[paste0("IBNR_", n)]] <- ibnr(fp$l[[n]])
      }
      if (truth()) df$Endschaden_tatsaechlich <- true_ultimate(rv$P)
      write.table(df, file, sep = ";", dec = ",", row.names = FALSE)
    })

  # ---- Modelldetails -------------------------------------------------------------
  insp_spec <- reactive({ req(rv$df); rv$specs[[insp_idx()]] })
  insp_sel <- reactive({
    s <- insp_spec()
    ldf_selection(tri_at(rv$P, rv$P$K), s$n_periods, s$drop_high, s$drop_low, s$average, s$ay_decay)
  })

  output$det_header <- renderUI({
    s <- insp_spec()
    div(class = "d-flex justify-content-between align-items-center",
        span(strong(if (is.null(rv$inspect)) "Gewähltes Modell: " else "Inspiziertes Modell: "),
             METHOD_NAME[[s$method]], " – ", spec_text(s, nrow(rv$P$full))),
        if (!is.null(rv$inspect)) actionLink("reset_insp2", "zurück zum gewählten Modell"))
  })
  observeEvent(input$reset_insp2, { rv$inspect <- NULL; selectRows(dataTableProxy("grid_tbl"), sel_idx()) })

  output$det_settings <- renderUI({
    s <- insp_spec(); sel <- insp_sel(); n_orig <- nrow(rv$P$full)
    n_high <- sum(sel$status == "hoch", na.rm = TRUE)
    n_low <- sum(sel$status == "niedrig", na.rm = TRUE)
    all_per <- s$n_periods < 1 || s$n_periods >= n_orig - 1
    eff_high <- sum(sel$status == "hoch" & sel$in_window, na.rm = TRUE)
    eff_low <- sum(sel$status == "niedrig" & sel$in_window, na.rm = TRUE)
    drop_txt <- function(n, eff, what) {
      base <- sprintf("%d Faktoren als %s markiert (je Spalte einer, sofern die Spalte mindestens 3 Faktoren hat)",
                      n, what)
      if (all_per || eff == n) paste0(base, ".") else
        sprintf(paste("%s. Davon liegen %d im Zeitfenster und verändern die LDFs; die übrigen %d wären ohnehin",
                      "nicht verwendet worden (Höchst-/Tiefstwert wird wie im Paper über alle Faktoren",
                      "der Spalte bestimmt)."), base, eff, n - eff)
    }
    n_out <- sum(sel$status == "ausserhalb", na.rm = TRUE)
    n_all <- sum(!is.na(sel$status))
    rows <- list(
      c("Verfahren", METHOD_NAME[[s$method]],
        switch(s$method,
               CL = "Endschaden = aktueller Stand × kumulierter Abwicklungsfaktor.",
               BF = "Offene Entwicklung = (1 − gemeldeter Anteil) × A-priori-Schadenquote × Prämie.",
               GCC = "Wie BF, die Schadenquote wird aber aus benachbarten Anfalljahren geschätzt (gewichtet mit Decay).")),
      c("Zeitfenster für LDFs",
        if (all_per) "alle verfügbaren Faktoren" else sprintf("jüngste %d Faktoren je Spalte", s$n_periods),
        if (all_per) "Keine älteren Anfalljahre ausgeblendet." else
          sprintf("%s von %s individuellen Faktoren liegen außerhalb des Fensters und bleiben unberücksichtigt.",
                  n_out, n_all)),
      c("Höchsten Faktor ausschließen", if (isTRUE(s$drop_high)) "ja" else "nein",
        if (isTRUE(s$drop_high)) drop_txt(n_high, eff_high, "Höchstwert") else "–"),
      c("Niedrigsten Faktor ausschließen", if (isTRUE(s$drop_low)) "ja" else "nein",
        if (isTRUE(s$drop_low)) drop_txt(n_low, eff_low, "Tiefstwert") else "–"),
      c("Mittelung der Faktoren", AVG_NAME[[s$average]],
        switch(s$average, volume = "Σ C(j+1) / Σ C(j) – große Anfalljahre zählen stärker (Standard).",
               simple = "Arithmetisches Mittel der Einzelfaktoren.", median = "Median der Einzelfaktoren.")),
      c("Gewichtung nach Alter", if (s$ay_decay == 1) "keine" else sprintf("Decay %s", fnum(s$ay_decay, 3)),
        if (s$ay_decay == 1) "Alle Faktoren im Fenster zählen gleich." else
          sprintf("Ein Faktor, der k Jahre älter ist, zählt %s^k-fach.", fnum(s$ay_decay, 3))))
    if (s$method == "BF") {
      rows[[length(rows) + 1]] <- if (length(s$apriori) > 1)
        c("A-priori-Schadenquote", sprintf("je Anfalljahr %s – %s %%", fnum(100 * min(s$apriori), 1),
                                            fnum(100 * max(s$apriori), 1)), "Stückweise lineare Kurve (Bayes-Optimierung).")
      else c("A-priori-Schadenquote", sprintf("%s %%", fnum(100 * s$apriori, 1)),
             "Erwartete Endschadenquote für die noch offene Entwicklung.")
    }
    if (s$method == "GCC") {
      f <- backtest(rv$P, s)$final
      ulr <- f$U / rv$P$premium
      rows[[length(rows) + 1]] <- c("Decay γ", fnum(s$decay, 2),
        sprintf("0 = Chain Ladder, 1 = klassisches Cape Cod. Geschätzte Schadenquoten: %s – %s %%.",
                fnum(100 * min(ulr, na.rm = TRUE), 1), fnum(100 * max(ulr, na.rm = TRUE), 1)))
    }
    rows[[length(rows) + 1]] <- c("Tail-Faktor", "keiner", "Keine Entwicklung nach der letzten Spalte.")
    HTML(paste0('<table class="settings">', paste(vapply(rows, function(r)
      sprintf("<tr><td>%s</td><td>%s</td><td>%s</td></tr>", r[1], r[2], r[3]), ""), collapse = ""), "</table>"))
  })

  output$det_scoring <- renderUI({
    df <- scored(); i <- insp_idx(); ie <- insp_eval()
    rank_sel <- rank(df$score_sel, ties.method = "min")[i]
    rows <- list(
      c("Score-Metrik", metric_label()),
      c("Erwartungskonvention", if (rv$P$expectation == "chainladder") "wie chainladder / Paper" else "verfahrenskonsistent"),
      c("Stichtag / erste Fit-Diagonale", sprintf("Diagonale %d / %d", rv$P$K, rv$P$k_train)),
      c("Scoring-Perioden", as.character(rv$P$K - rv$P$k_train)),
      c("Score AvE / CDR", sprintf("%s / %s", fnum(ie$AvE, 1), fnum(ie$CDR, 1))),
      c("Score gewählte Metrik", sprintf("%s (Rang %s von %s)", fnum(ie$sel, 1), fnum(rank_sel), fnum(nrow(df)))),
      c("IBNR", fnum(ie$IBNR)))
    if (truth()) rows <- c(rows, list(
      c("Out-of-Sample-RMSE", sprintf("%s (Rang %s von %s)", fnum(ie$RMSE, 1), fnum(ie$rank), fnum(nrow(df)))),
      c("Bias Endschaden", fnum(ie$bias, 1))))
    HTML(paste0('<table class="settings">', paste(vapply(rows, function(r)
      sprintf("<tr><td>%s</td><td>%s</td></tr>", r[1], r[2]), ""), collapse = ""), "</table>"))
  })

  output$lr_table <- renderUI({
    sel <- insp_sel(); d <- rv$d
    base_ldf <- estimate_ldfs(tri_at(rv$P, rv$P$K))
    J <- ncol(sel$ratio)
    has <- colSums(!is.na(sel$ratio)) > 0
    cols <- which(has)
    dev <- d$dev
    head <- paste0("<th></th>", paste0(sprintf("<th>%s–%s</th>", dev[cols], dev[cols + 1]), collapse = ""))
    body <- vapply(which(rowSums(!is.na(sel$ratio)) > 0), function(i) {
      cells <- vapply(cols, function(j) {
        v <- sel$ratio[i, j]; st <- sel$status[i, j]
        if (is.na(v)) return("<td></td>")
        cls <- c(verwendet = "used", ausserhalb = "out", hoch = "high", niedrig = "low")[[st]]
        if (st %in% c("hoch", "niedrig") && !isTRUE(sel$in_window[i, j])) cls <- paste(cls, "noeff")
        sprintf('<td class="%s">%s</td>', cls, fnum(v, 3))
      }, "")
      paste0("<tr><th>", rv$P$origins[i], "</th>", paste(cells, collapse = ""), "</tr>")
    }, "")
    ldf_row <- paste0('<tr class="ldf-row"><th>LDF Modell</th>',
                      paste0("<td>", fnum(sel$ldf[cols], 4), "</td>", collapse = ""), "</tr>")
    cmp_row <- paste0('<tr class="ldf-cmp"><th>LDF alle, vol.</th>',
                      paste0("<td>", fnum(base_ldf[cols], 4), "</td>", collapse = ""), "</tr>")
    HTML(paste0('<div class="tri-wrap"><table class="tri lr"><thead><tr>', head, "</tr></thead><tbody>",
                paste(body, collapse = ""), ldf_row, cmp_row, "</tbody></table></div>"))
  })
  output$lr_note <- renderUI({
    sel <- insp_sel()
    base_ldf <- estimate_ldfs(tri_at(rv$P, rv$P$K))
    cdf_m <- prod(sel$ldf); cdf_b <- prod(base_ldf)
    div(class = "help-note mt-2", sprintf(paste(
      "Kumulierter Faktor von der ersten bis zur letzten Entwicklungsperiode: Modell %s, Standard-Chain-Ladder %s",
      "(%s). Die Zeile 'LDF alle, vol.' zeigt zum Vergleich die LDFs ohne Zeitfenster und ohne Ausschlüsse."),
      fnum(cdf_m, 4), fnum(cdf_b, 4), fpct(cdf_m / cdf_b - 1, 2)))
  })

  # ---- Dreieck ------------------------------------------------------------------
  output$tri_table <- renderUI({
    d <- dat(); s <- settings_now()
    m <- if (input$tri_mode == "inc") to_incremental(d$full) else d$full
    tri_html(m, s$cal[2], s$cal[1], d$origins, d$dev)
  })
  output$ldf_title <- renderText({
    req(rv$df)
    paste("Abwicklungsmuster am Stichtag –", insp_eval()$label)
  })
  output$ldf_tbl <- renderDT({
    req(rv$df)
    f <- insp_eval()$final
    J <- length(f$beta)
    dev <- rv$d$dev
    df <- data.frame(Von = dev[-J], Bis = dev[-1], LDF = f$ldf,
                     CDF = 1 / f$beta[-J], "Anteil gemeldet β" = f$beta[-J], check.names = FALSE)
    datatable(fillContainer = FALSE, df, rownames = FALSE, selection = "none",
              options = list(dom = "t", pageLength = 50, scrollY = "320px")) |>
      formatRound(c("LDF", "CDF", "Anteil gemeldet β"), digits = 4, mark = ".", dec.mark = ",")
  })
  output$prem_tbl <- renderDT({
    req(rv$df)
    f <- insp_eval()$final
    pr <- rv$P$premium
    df <- data.frame(AP = rv$P$origins, `Stand` = f$latest, Endschaden = f$ultimate, check.names = FALSE)
    if (!is.null(pr)) { df$Praemie <- pr; df$`SQ Endschaden` <- f$ultimate / pr }
    dt <- datatable(fillContainer = FALSE, df, rownames = FALSE, selection = "none",
                    options = list(dom = "t", pageLength = 50, scrollY = "320px")) |>
      formatRound(c("Stand", "Endschaden", if (!is.null(pr)) "Praemie"), digits = 0, mark = ".")
    if (!is.null(pr)) dt <- formatPercentage(dt, "SQ Endschaden", 1, dec.mark = ",")
    dt
  })

  # ---- Modellraum --------------------------------------------------------------
  grid_view <- reactive({
    df <- scored()
    cols <- c("label", "method", "score_AvE", "score_CDR", "score_sel",
              intersect(c("RMSE", "RMSE_rank", "bias"), names(df)), "IBNR")
    out <- df[, cols]
    names(out) <- c("Modell", "Verfahren", "Score AvE", "Score CDR", "Score gewählt",
                    if (truth()) c("RMSE", "Rang RMSE", "Bias"), "IBNR")
    out
  })
  output$grid_tbl <- renderDT({
    df <- grid_view()
    num <- intersect(c("Score AvE", "Score CDR", "Score gewählt", "RMSE", "Bias", "IBNR"), names(df))
    datatable(fillContainer = FALSE, df, rownames = FALSE, selection = list(mode = "single", selected = isolate(insp_idx())),
              options = list(pageLength = 10, order = list(list(4, "asc")), scrollX = TRUE)) |>
      formatRound(num, digits = 1, mark = ".", dec.mark = ",")
  }, server = TRUE)
  observeEvent(input$grid_tbl_rows_selected, {
    i <- input$grid_tbl_rows_selected
    rv$inspect <- if (length(i) && i != sel_idx()) i else NULL
  }, ignoreNULL = FALSE, ignoreInit = TRUE)

  output$dl_grid <- downloadHandler(
    filename = "modellraum_scores.csv",
    content = function(file) write.table(scored(), file, sep = ";", dec = ",", row.names = FALSE))

  output$plot_np <- renderPlot(res = 100, {
    df <- scored()
    plot_setup(mar = c(4.2, 4.8, 2.4, 0.8))
    ag <- aggregate(score_sel ~ method + n_periods, df, min)
    plot(NA, xlim = range(ag$n_periods), ylim = range(ag$score_sel), axes = FALSE,
         xlab = "n_periods", ylab = paste("Score", metric_label()))
    hgrid(); axis(1, col = NA); axis_fmt()
    for (m in unique(ag$method)) {
      s <- ag[ag$method == m, ]; s <- s[order(s$n_periods), ]
      lines(s$n_periods, s$score_sel, col = COL[m], lwd = 2)
      points(s$n_periods, s$score_sel, col = COL[m], pch = 19, cex = 0.7)
    }
    sb <- df[sel_idx(), ]
    points(sb$n_periods, sb$score_sel, pch = 21, bg = "white", col = COL[sb$method], cex = 1.8, lwd = 2)
    legend("top", unique(ag$method), col = COL[unique(ag$method)], lwd = 2, bty = "n", cex = 0.85,
           horiz = TRUE, inset = c(0, -0.1), xpd = TRUE)
  })
  output$plot_scatter <- renderPlot(res = 100, {
    df <- scored()
    plot_setup()
    if (!truth()) {
      plot.new(); text(0.5, 0.5, "Nur verfügbar, wenn die zukünftige Entwicklung\nin den Daten enthalten ist.",
                       col = C_MUTED)
      return()
    }
    plot(df$score_sel, df$RMSE, pch = 19, cex = 0.55, col = adjustcolor(COL[df$method], 0.45),
         axes = FALSE, xlab = paste("Trainings-Score", metric_label()), ylab = "RMSE Endschaden")
    hgrid(); axis_fmt(1); axis_fmt(2)
    points(df$score_sel[sel_idx()], df$RMSE[sel_idx()], pch = 21, bg = C_SEL, col = "white", cex = 2, lwd = 2)
    if (!is.null(rv$inspect)) points(df$score_sel[insp_idx()], df$RMSE[insp_idx()], pch = 21, bg = C_INSP,
                                     col = "white", cex = 2, lwd = 2)
    be <- basic_eval()
    abline(h = be$RMSE, lty = 2, col = C_MUTED)
    legend("topleft", c(unique(df$method), "gewählt", "Basismodell"),
           col = c(COL[unique(df$method)], C_SEL, C_MUTED), pch = c(rep(19, length(unique(df$method))), 19, NA),
           lty = c(rep(NA, length(unique(df$method)) + 1), 2), bty = "n", cex = 0.85)
  })
  output$scatter_note <- renderUI({
    req(truth())
    df <- scored()
    rho <- suppressWarnings(cor(df$score_sel, df$RMSE, method = "spearman"))
    div(class = "help-note", sprintf(paste(
      "Spearman-Korrelation Trainings-Score ↔ Out-of-Sample-RMSE: %s. Je höher, desto verlässlicher",
      "sagt der Backtest die spätere Güte voraus."), fnum(rho, 2)))
  })

  # ---- Backtest ------------------------------------------------------------------
  output$insp_header <- renderUI({
    req(rv$df)
    div(class = "d-flex justify-content-between align-items-center",
        span(strong(if (is.null(rv$inspect)) "Gewähltes Modell: " else "Inspiziertes Modell: "),
             code(insp_eval()$label)),
        if (!is.null(rv$inspect)) actionLink("reset_insp", "zurück zum gewählten Modell"))
  })
  observeEvent(input$reset_insp, { rv$inspect <- NULL; selectRows(dataTableProxy("grid_tbl"), sel_idx()) })

  per_period <- reactive({
    rec <- backtest(rv$P, rv$specs[[insp_idx()]])$records
    a <- alpha_d()
    do.call(rbind, lapply(split(rec, rec$calendar), function(r) {
      w <- abs(r$actual); sw <- sum(w)
      e_sel <- r$AvE + a * r$dR
      data.frame(calendar = r$calendar[1],
                 AvE = sqrt(sum(w * r$AvE^2) / sw), CDR = sqrt(sum(w * r$CDR^2) / sw),
                 sel = sqrt(sum(w * e_sel^2) / sw),
                 sum_AvE = sum(r$AvE), sum_CDR = sum(r$CDR))
    }))
  })
  output$plot_bt_scores <- renderPlot(res = 100, {
    req(rv$df)
    pp <- per_period()
    plot_setup()
    yl <- range(c(0, pp$AvE, pp$CDR, pp$sel))
    plot(NA, xlim = range(pp$calendar), ylim = yl, axes = FALSE, xlab = "Kalenderdiagonale (bewertet)",
         ylab = "Score je Periode (gew. RMSE)")
    hgrid(); axis(1, at = pp$calendar, col = NA); axis_fmt()
    lines(pp$calendar, pp$AvE, col = C_AVE, lwd = 2, type = "o", pch = 19, cex = 0.7)
    lines(pp$calendar, pp$CDR, col = C_CDR, lwd = 2, type = "o", pch = 19, cex = 0.7)
    if (input$metric == "alpha") lines(pp$calendar, pp$sel, col = C_INSP, lwd = 2, lty = 2)
    legend("topleft", c(sprintf("AvE (Ø %s)", fnum(mean(pp$AvE), 1)), sprintf("CDR (Ø %s)", fnum(mean(pp$CDR), 1)),
                        if (input$metric == "alpha") "CDR-α"),
           col = c(C_AVE, C_CDR, if (input$metric == "alpha") C_INSP), lwd = 2, bty = "n", cex = 0.85)
  })
  output$plot_bt_bias <- renderPlot(res = 100, {
    req(rv$df)
    pp <- per_period()
    m <- rbind(pp$sum_AvE, pp$sum_CDR)
    bars(m, c(C_AVE, C_CDR), pp$calendar, "Summe über Anfallperioden",
         c("AvE (Ist − Erwartung)", "CDR (Veränderung Endschaden)"))
  })
  output$bt_tbl <- renderDT({
    req(rv$df)
    rec <- backtest(rv$P, rv$specs[[insp_idx()]])$records
    rec$origin <- rv$P$origins[rec$origin + 1]
    names(rec) <- c("Diagonale", "Anfallperiode", "Entw.-Periode (0-bas.)", "Ist-Zuwachs",
                    "Erwartet", "AvE", "CDR", "Δ Reserve")
    datatable(fillContainer = FALSE, rec, rownames = FALSE, selection = "none",
              options = list(pageLength = 15, scrollX = TRUE)) |>
      formatRound(4:8, digits = 1, mark = ".", dec.mark = ",")
  })

  # ---- Erweiterungen -------------------------------------------------------------
  alpha_sweep <- reactive({
    req(rv$df)
    alphas <- c(0, 0.25, 0.5, 0.75, 1, 1.25, 1.5)
    recs <- lapply(rv$specs, function(s) backtest(rv$P, s)$records)
    do.call(rbind, lapply(alphas, function(a) {
      sc <- vapply(recs, score_records, 0, alpha = a, bias_penalty = lambda_now())
      i <- which.min(sc)
      x <- data.frame(alpha = a, Modell = rv$df$label[i], IBNR = rv$df$IBNR[i])
      if (truth()) { x$RMSE <- rv$df$RMSE[i]; x$Rang <- rv$df$RMSE_rank[i] }
      x
    }))
  })
  output$plot_alpha <- renderPlot(res = 100, {
    sw <- alpha_sweep()
    plot_setup()
    y <- if (truth()) sw$RMSE else sw$IBNR
    yb <- if (truth()) basic_eval()$RMSE else basic_eval()$IBNR
    plot(sw$alpha, y, type = "o", pch = 19, col = C_BASIC, lwd = 2, axes = FALSE,
         ylim = range(c(y, yb)), xlab = "α  (0 = AvE, 1 = CDR)",
         ylab = if (truth()) "RMSE gewähltes Modell" else "IBNR gewähltes Modell")
    hgrid(); axis(1, col = NA); axis_fmt()
    abline(h = yb, lty = 2, col = C_MUTED)
    legend("topright", c("gewähltes Modell", "Basismodell"), col = c(C_BASIC, C_MUTED), lty = c(1, 2),
           pch = c(19, NA), bty = "o", bg = "white", box.col = NA, cex = 0.85)
  })
  output$alpha_tbl <- renderDT({
    sw <- alpha_sweep()
    datatable(fillContainer = FALSE, sw, rownames = FALSE, selection = "none", options = list(dom = "t", ordering = FALSE)) |>
      formatRound(intersect(c("IBNR", "RMSE"), names(sw)), digits = 1, mark = ".", dec.mark = ",")
  })

  output$mack_ui <- renderUI({
    mk <- mack()
    req(mk)
    rec <- recommend_metric(mk$cov)
    tagList(
      p(sprintf("CL-Reserve %s · Mack-Standardfehler %s · Variationskoeffizient %s",
                fnum(mk$reserve), fnum(mk$mack_se), fnum(mk$cov, 3))),
      p(class = "help-note", sprintf(paste(
        "Faustregel aus Abschn. 6 des Papers: CoV < 0,3 → CDR (stabil), sonst AvE (volatil).",
        "Empfehlung hier: %s. (Paper: Swiss 0,135 → CDR; Quartalsdreiecke 0,67 / 1,9 → AvE)"), rec)))
  })

  observeEvent(input$run_holdout, {
    req(rv$df)
    h <- input$holdout
    if (rv$P$K - h - rv$P$k_train < 2) {
      showNotification("Zu wenige Perioden für diesen Holdout.", type = "error"); return()
    }
    rv$holdout <- withProgress(message = "Holdout-Validierung läuft …", value = 0.3,
      holdout_metric_selection(rv$P, rv$specs, alphas = c(0, 0.25, 0.5, 0.75, 1), holdout = h,
                               bias_penalty = lambda_now()))
  })
  output$holdout_tbl <- renderDT({
    req(rv$holdout)
    datatable(fillContainer = FALSE, rv$holdout, rownames = FALSE, selection = "none", options = list(dom = "t", ordering = FALSE),
              colnames = c("α", "Gewählt im verkürzten Dreieck", "Holdout-RMSE", "Holdout-Bias")) |>
      formatRound(3:4, digits = 1, mark = ".", dec.mark = ",")
  })
  output$holdout_note <- renderUI({
    req(rv$holdout)
    a <- rv$holdout$alpha[which.min(rv$holdout$holdout_RMSE)]
    div(class = "help-note mt-2", sprintf("→ Empfohlenes α = %s. Tipp: 'CDR-α' mit diesem Wert einstellen.", a),
        actionLink("apply_alpha", "übernehmen"))
  })
  observeEvent(input$apply_alpha, {
    a <- rv$holdout$alpha[which.min(rv$holdout$holdout_RMSE)]
    updateRadioButtons(session, "metric", selected = "alpha")
    updateSliderInput(session, "alpha", value = a)
  })

  observeEvent(input$run_twostep, {
    req(rv$df)
    s <- rv$settings
    a <- alpha_d(); lam <- lambda_now()
    cl_specs <- grid_specs("CL", s$np, s$drops, s$drops, average = s$avg, ay_decay = s$ayd)
    sc <- function(sp) vapply(sp, function(x) score_records(backtest(rv$P, x)$records, alpha = a,
                                                            bias_penalty = lam), 0)
    withProgress(message = "Zwei-Stufen-Suche …", {
      best_cl <- cl_specs[[which.min(sc(cl_specs))]]
      rows <- list()
      for (m in intersect(c("BF", "GCC"), s$methods)) {
        vals <- if (m == "BF") s$lr else s$decay
        st2 <- lapply(vals, function(v) { x <- best_cl; x$method <- m
          if (m == "BF") x$apriori <- v else x$decay <- v; x })
        best2 <- st2[[which.min(sc(st2))]]
        full <- which(rv$df$method == m)
        bf <- full[which.min(scored()$score_sel[full])]
        r <- data.frame(Verfahren = m, `Zwei-Stufen` = spec_label(best2),
                        Backtests = length(cl_specs) + length(vals),
                        `Volles Grid` = rv$df$label[bf], `Backtests Grid` = length(full), check.names = FALSE)
        if (truth()) {
          r$`RMSE 2-Stufen` <- evaluate_projection(rv$P, backtest(rv$P, best2)$final)$RMSE
          r$`RMSE Grid` <- rv$df$RMSE[bf]
        }
        rows[[m]] <- r
      }
    })
    if (length(rows)) {
      ts <- do.call(rbind, rows)
      first <- intersect(c("Verfahren", "RMSE 2-Stufen", "RMSE Grid", "Backtests", "Backtests Grid"), names(ts))
      rows <- list(ts[, c(first, setdiff(names(ts), first))])
    }
    rv$twostep <- if (length(rows)) rows[[1]] else
      data.frame(Hinweis = "BF oder GCC im Suchraum aktivieren.")
  })
  output$twostep_tbl <- renderDT({
    req(rv$twostep)
    dt <- datatable(fillContainer = FALSE, rv$twostep, rownames = FALSE, selection = "none",
                    options = list(dom = "t", ordering = FALSE, scrollX = TRUE))
    rc <- intersect(c("RMSE 2-Stufen", "RMSE Grid"), names(rv$twostep))
    if (length(rc)) dt <- formatRound(dt, rc, digits = 1, mark = ".", dec.mark = ",")
    dt
  })

  observeEvent(input$run_bayes, {
    req(rv$df)
    s <- rv$settings
    res <- withProgress(message = sprintf("TPE-Optimierung mit %d Trials …", input$trials), value = 0.2,
      tryCatch(bayes_search(rv$P, n_trials = input$trials, alpha = alpha_d(), bias_penalty = lambda_now(),
                            methods = s$methods, n_periods = range(s$np), lr_range = range(s$lr),
                            n_lr_knots = if ("BF" %in% s$methods) input$knots else 0,
                            extended_ldf_options = input$tpe_ext, seed = input$seed),
               error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL }))
    req(res)
    res$eval <- eval_spec(res$best)
    rv$bayes <- res
  })
  output$bayes_ui <- renderUI({
    req(rv$bayes)
    b <- rv$bayes; e <- b$eval
    lr <- if (length(b$best$apriori) > 1)
      sprintf(" · Stützstellen-Quoten: %s", paste(fnum(unlist(b$best_params[grep("^lr_", names(b$best_params))]), 2),
                                                 collapse = " / ")) else ""
    grid_best <- min(scored()$score_sel)
    tagList(
      p(strong("Bestes Modell: "), code(e$label), lr),
      p(class = "help-note", sprintf("Trainings-Score %s (Grid-Optimum %s) · IBNR %s%s", fnum(b$best_value, 1),
                                     fnum(grid_best, 1), fnum(e$IBNR),
                                     if (truth()) sprintf(" · RMSE %s (Grid-Wahl %s)", fnum(e$RMSE, 1),
                                                          fnum(sel_eval()$RMSE, 1)) else "")))
  })
  output$plot_bayes <- renderPlot(res = 100, {
    req(rv$bayes)
    v <- rv$bayes$values
    plot_setup(mar = c(4, 4.8, 0.5, 0.8))
    plot(seq_along(v), v, pch = 19, cex = 0.5, col = adjustcolor(C_MUTED, 0.5), axes = FALSE,
         xlab = "Trial", ylab = "Score", ylim = quantile(v, c(0, 0.9)))
    hgrid(); axis(1, col = NA); axis_fmt()
    lines(seq_along(v), cummin(v), col = C_BASIC, lwd = 2)
    abline(h = min(scored()$score_sel), lty = 2, col = C_SEL)
    legend("topright", c("bisher bester Score", "Grid-Optimum"), col = c(C_BASIC, C_SEL), lty = c(1, 2),
           lwd = 2, bty = "n", cex = 0.8)
  })

  # ---- Benchmark gegen manuelle Reservierung -----------------------------------
  cal_label <- function(c) ifelse(c + 1 <= length(rv$P$origins), rv$P$origins[pmin(c + 1, length(rv$P$origins))],
                                  paste0("Diag. ", c))
  bench_raw <- reactiveVal(NULL)       # list(df = data.frame, source = "…")
  observeEvent(input$bench_file, {
    df <- tryCatch({
      raw <- read.csv(input$bench_file$datapath, sep = input$sep, colClasses = "character",
                      check.names = FALSE, strip.white = TRUE, na.strings = c("", "NA", "-"))
      num <- function(x) { x <- gsub("[  ']", "", x)
        x <- if (input$dec == ",") gsub(",", ".", gsub(".", "", x, fixed = TRUE), fixed = TRUE)
             else gsub(",", "", x, fixed = TRUE)
        suppressWarnings(as.numeric(x)) }
      nm <- tolower(names(raw))
      for (j in seq_along(raw)) if (grepl("endschaden|ultimate|erwart|expected|diagonale", nm[j])) raw[[j]] <- num(raw[[j]])
      raw
    }, error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL })
    req(df)
    bench_raw(list(df = df, source = input$bench_file$name))
  })
  observeEvent(input$bench_demo, {
    req(rv$P)
    plan <- round(mean(rv$settings$lr) + 0.03, 2)
    df <- simulate_manual(rv$P, rv$P$k_train:rv$P$K, n_cl = 5, n_bf = if (is.null(rv$P$premium)) 0 else 3,
                          plan_lr = plan)
    bench_raw(list(df = df, source = sprintf(paste(
      "Demo (simuliert): Chain Ladder mit den jüngsten 5 Faktoren, BF mit Plan-Schadenquote",
      "%s %% für die 3 jüngsten Anfalljahre – keine echte manuelle Reservierung."), fnum(100 * plan))))
  })
  output$bench_template <- downloadHandler(
    filename = "vorlage_manuelle_reservierung.csv",
    content = function(file) {
      req(rv$P)
      df <- simulate_manual(rv$P, rv$P$k_train:rv$P$K, n_bf = if (is.null(rv$P$premium)) 0 else 3,
                            plan_lr = round(mean(rv$settings$lr) + 0.03, 2))
      write.table(df, file, sep = ";", dec = ",", row.names = FALSE, quote = FALSE)
    })

  bench_man <- reactive({
    b <- bench_raw(); req(b, rv$P)
    tryCatch(normalize_manual(b$df, rv$P$origins),
             error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL })
  })
  rolling <- reactive({
    req(rv$df)
    withProgress(message = "Rollierende Modellwahl …", value = 0.5,
      tryCatch(rolling_selection(rv$P, rv$specs, alpha = alpha_d(), bias_penalty = lambda_now(),
                                 min_periods = max(1, input$bench_min %||% 3)),
               error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL }))
  })
  bench <- reactive({
    man <- bench_man(); ro <- rolling(); req(man, ro)
    rm_ <- tryCatch(manual_records(rv$P, man),
                    error = function(e) { showNotification(conditionMessage(e), type = "error"); NULL })
    req(rm_)
    a <- alpha_d()
    fixed <- backtest(rv$P, rv$specs[[sel_idx()]])$records
    basic <- backtest(rv$P, basic_spec())$records
    cals <- intersect(unique(rm_$calendar), unique(ro$records$calendar))
    validate(need(length(cals) >= 2, paste("Zu wenige gemeinsame Perioden. Die manuellen Stichtage müssen die",
                                            "Periode der rollierenden Auswahl abdecken (Mindestanzahl ggf. senken).")))
    sets <- list(Manuell = rm_, `App rollierend` = ro$records, `App fest (in-sample)` = fixed, Basismodell = basic)
    sets <- lapply(sets, function(r) r[r$calendar %in% cals, ])
    ps <- lapply(sets, function(r) list(sel = period_scores(r, a), ave = period_scores(r, 0), cdr = period_scores(r, 1)))
    list(sets = sets, ps = ps, cals = sort(cals), ro = ro, man = man, n_rec = nrow(rm_))
  })

  output$bench_status <- renderUI({
    b <- bench_raw()
    if (is.null(b)) return(div(class = "help-note", "Noch keine manuelle Reservierung geladen."))
    man <- bench_man(); req(man)
    ks <- sort(unique(man$k))
    tagList(
      div(class = "help-note", strong("Quelle: "), b$source),
      div(class = "help-note", sprintf("%s Werte erkannt, %d Stichtage (%s bis %s)%s.", fnum(nrow(man)),
          length(ks), cal_label(min(ks)), cal_label(max(ks)),
          if (attr(man, "n_dropped") > 0) sprintf(", %d Zeilen nicht zuordenbar", attr(man, "n_dropped")) else "")),
      if (all(is.na(man$expected))) div(class = "help-note",
          "Keine Spalte „Erwartet“: AvE wird aus dem Chain-Ladder-Muster abgeleitet."))
  })

  output$bench_boxes <- renderUI({
    B <- bench()
    s <- function(nm) mean(B$ps[[nm]]$sel$score)
    sm <- s("Manuell"); sr <- s("App rollierend"); sf <- s("App fest (in-sample)")
    cmp <- compare_periods(B$ps$`App rollierend`$sel, B$ps$Manuell$sel)
    ro_m <- mean(B$ps$Manuell$cdr$runoff); ro_a <- mean(B$ps$`App rollierend`$cdr$runoff)
    boxes <- list(
      value_box(title = paste("Score manuell ·", metric_label()), value = fnum(sm, 1),
                p(class = "vb-small", sprintf("%d Perioden (%s – %s)", length(B$cals), cal_label(min(B$cals)),
                                              cal_label(max(B$cals))))),
      value_box(title = "Score App · rollierende Wahl", value = fnum(sr, 1),
                p(class = "vb-small", sprintf("%s ggü. manuell", fpct(sr / sm - 1))),
                p(class = "vb-small", sprintf("feste Auswahl (optimistisch): %s", fnum(sf, 1))),
                theme = if (sr < sm) "primary" else NULL),
      value_box(title = "Perioden gewonnen", value = sprintf("App %d : %d manuell", cmp$wins_a, cmp$wins_b),
                p(class = "vb-small", sprintf("Vorzeichentest p = %s · t-Test p = %s", fnum(cmp$p_sign, 2),
                                              fnum(cmp$p_t, 2))),
                p(class = "vb-small", if (!is.na(cmp$p_sign) && cmp$p_sign < 0.05) "Unterschied statistisch gesichert"
                  else "Unterschied (noch) nicht statistisch gesichert")),
      value_box(title = "Ø Abwicklungsergebnis je Periode", value = sprintf("%s / %s", fnum(ro_m), fnum(ro_a)),
                p(class = "vb-small", "manuell / App (Summe CDR)"),
                p(class = "vb-small", if (ro_m < 0) "manuell: systematisch Abwicklungsgewinne → vorsichtig"
                  else "manuell: systematisch Nachreservierung → eher knapp")))
    do.call(layout_columns, c(list(col_widths = c(3, 3, 3, 3)), boxes))
  })

  bench_cols <- c(Manuell = "#52514e", `App rollierend` = C_SEL, `App fest (in-sample)` = "#a3a29c",
                  Basismodell = C_BASIC)
  output$bench_plot_scores <- renderPlot(res = 100, {
    B <- bench()
    plot_setup(mar = c(5.2, 4.8, 1.2, 0.8))
    yl <- range(unlist(lapply(B$ps, function(p) p$sel$score)), na.rm = TRUE)
    plot(NA, xlim = range(B$cals), ylim = c(0, yl[2] * 1.3), axes = FALSE, xlab = "",
         ylab = paste("Score", metric_label()))
    hgrid(); axis(1, at = B$cals, labels = cal_label(B$cals), col = NA, las = 2, cex.axis = 0.75); axis_fmt()
    lt <- c(Manuell = 1, `App rollierend` = 1, `App fest (in-sample)` = 2, Basismodell = 3)
    for (nm in names(B$ps)) {
      p <- B$ps[[nm]]$sel
      lines(p$calendar, p$score, col = bench_cols[[nm]], lwd = if (nm %in% c("Manuell", "App rollierend")) 2.5 else 1.5,
            lty = lt[[nm]], type = "o", pch = if (nm %in% c("Manuell", "App rollierend")) 19 else NA, cex = 0.7)
    }
    legend("topleft", names(B$ps), col = bench_cols[names(B$ps)], lty = lt[names(B$ps)], lwd = 2, bty = "n",
           cex = 0.78, ncol = 2)
  })
  output$bench_plot_runoff <- renderPlot(res = 100, {
    B <- bench()
    m <- rbind(B$ps$Manuell$cdr$runoff, B$ps$`App rollierend`$cdr$runoff)
    bars(m, bench_cols[c("Manuell", "App rollierend")], cal_label(B$cals), "Abwicklungsergebnis",
         sprintf("%s: Summe %s", c("Manuell", "App rollierend"), fnum(rowSums(m))))
  })

  output$bench_summary <- renderDT({
    B <- bench()
    truth_ok <- truth() && any(B$man$k == rv$P$K)
    man_final <- if (truth_ok) { mk <- B$man[B$man$k == rv$P$K, ]; err <- true_ultimate(rv$P)[mk$i] - mk$ult
      sqrt(mean(err^2, na.rm = TRUE)) } else NA
    rmse_of <- function(final) if (truth_ok) { mk <- B$man[B$man$k == rv$P$K, ]
      err <- true_ultimate(rv$P)[mk$i] - final$ultimate[mk$i]; sqrt(mean(err^2, na.rm = TRUE)) } else NA
    ref <- B$ps$Manuell$sel
    rows <- lapply(names(B$ps), function(nm) {
      p <- B$ps[[nm]]
      cmp <- if (nm == "Manuell") NULL else compare_periods(p$sel, ref)
      data.frame(Methode = nm, `Score gewählt` = mean(p$sel$score), `Score AvE` = mean(p$ave$score),
                 `Score CDR` = mean(p$cdr$score), `Bias (gew.)` = mean(p$sel$bias),
                 `Ø Abwicklungsergebnis` = mean(p$cdr$runoff),
                 `Perioden besser als manuell` = if (is.null(cmp)) "–" else sprintf("%d von %d", cmp$wins_a, cmp$periods),
                 `RMSE Endschaden` = switch(nm, Manuell = man_final, `App rollierend` = rmse_of(B$ro$final),
                                            `App fest (in-sample)` = rmse_of(backtest(rv$P, rv$specs[[sel_idx()]])$final),
                                            Basismodell = rmse_of(backtest(rv$P, basic_spec())$final)),
                 check.names = FALSE)
    })
    df <- do.call(rbind, rows)
    if (!truth_ok) df$`RMSE Endschaden` <- NULL
    num <- intersect(c("Score gewählt", "Score AvE", "Score CDR", "Bias (gew.)", "Ø Abwicklungsergebnis",
                       "RMSE Endschaden"), names(df))
    datatable(fillContainer = FALSE, df, rownames = FALSE, selection = "none",
              options = list(dom = "t", ordering = FALSE)) |>
      formatRound(num, digits = 1, mark = ".", dec.mark = ",") |>
      formatStyle("Methode", target = "row", color = styleEqual("App fest (in-sample)", "#8a8984"))
  })
  output$bench_note <- renderUI({
    B <- bench()
    div(class = "help-note mt-2", paste(
      "Score = Mittel der Perioden-Scores (Gl. 2) über die gemeinsamen Perioden. Bias > 0: Ist-Entwicklung lag über",
      "der Prognose (unterschätzt), Bias < 0: überschätzt. 'App fest' ist nur eine obere Schranke dessen, was mit",
      "Rückschau möglich gewesen wäre – für den fairen Vergleich zählt 'App rollierend'.",
      if (truth()) "RMSE Endschaden: Stand am Bewertungsstichtag gegenüber der tatsächlichen Entwicklung (nur Anfalljahre mit manuellem Wert)." else ""))
  })
  output$bench_periods <- renderDT({
    B <- bench()
    a <- B$ps$`App rollierend`$sel; m <- B$ps$Manuell$sel
    ch <- B$ro$choices
    df <- data.frame(Periode = cal_label(a$calendar),
                     `App-Modell (gewählt zum Vorstichtag)` = ch$model[match(a$calendar - 1, ch$stichtag)],
                     `Score App` = a$score, `Score manuell` = m$score[match(a$calendar, m$calendar)],
                     `Abwicklung App` = B$ps$`App rollierend`$cdr$runoff,
                     `Abwicklung manuell` = B$ps$Manuell$cdr$runoff[match(a$calendar, B$ps$Manuell$cdr$calendar)],
                     check.names = FALSE)
    df$Differenz <- df$`Score App` - df$`Score manuell`
    df$Besser <- ifelse(df$Differenz < 0, "App", ifelse(df$Differenz > 0, "manuell", "gleich"))
    datatable(fillContainer = FALSE, df, rownames = FALSE, selection = "none",
              options = list(dom = "t", ordering = FALSE, pageLength = 50, scrollX = TRUE)) |>
      formatRound(c("Score App", "Score manuell", "Abwicklung App", "Abwicklung manuell", "Differenz"),
                  digits = 1, mark = ".", dec.mark = ",") |>
      formatStyle("Besser", color = styleEqual(c("App", "manuell"), c(C_SEL, "#52514e")), fontWeight = "600")
  })
}

shinyApp(ui, server)
