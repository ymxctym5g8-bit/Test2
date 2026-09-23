# Shiny-App: IBNR-Modellwahl per Backtest

Interaktive Oberfläche für den Ansatz von Balona & Richman (2020) inklusive aller Erweiterungen. Die Rechenlogik ist dieselbe wie in `R/ibnr_ml.R`; der Ordner enthält eine Kopie davon und ist damit eigenständig lauffähig bzw. deploybar (shinyapps.io, Posit Connect, Shiny Server).

## Start

```r
install.packages(c("shiny", "bslib", "DT"))   # einmalig
shiny::runApp("R/shiny_app")                  # oder app.R in RStudio öffnen -> "Run App"
```

Voraussetzungen: R ≥ 4.2 (UTF-8), shiny ≥ 1.7, bslib ≥ 0.6, DT. Beim Start wird automatisch das Swiss-Dreieck mit dem Suchraum des Papers gerechnet (1.720 Modelle, ca. 20 Sekunden).

## Bedienung

**Seitenleiste**
- **Daten:** Beispieldreiecke aus dem Paper oder eigene CSV-Datei. Mit dem Schieberegler legen Sie die erste Fit-Diagonale und den Bewertungsstichtag fest.
- **Suchraum:** Verfahren (CL / BF / GCC), Bereich für `n_periods`, Ausschluss höchster/niedrigster Faktoren, Bandbreite und Schrittweite der A-priori-Quoten und des Decays, erweiterte LDF-Optionen. Unten steht die Anzahl der Modelle und die geschätzte Laufzeit.
- **Bewertung:** Score (AvE, CDR oder CDR-α), Bias-Strafterm λ, Erwartungskonvention und Vergleichs-Basismodell. Diese Einstellungen wirken **sofort** ohne neue Suche, weil alle Backtests zwischengespeichert sind.
- **Suche starten:** rechnet alle Backtests neu (nötig nach Änderungen an Daten, Suchraum oder Erwartungskonvention).

**Tabs**

| Tab | Inhalt |
|---|---|
| Übersicht | Gewähltes Modell, IBNR, Out-of-Sample-RMSE und Rang, Mack-CoV; Vergleich Basismodell / min. AvE / min. CDR / gewählt; IBNR und Prognosefehler je Anfallperiode (CSV-Download) |
| Modelldetails | Einstellungen des gewählten bzw. inspizierten Modells im Klartext (Verfahren, Zeitfenster, Ausschlüsse mit Anzahl, Mittelung, Gewichtung, A-priori-Quote/Decay) und seine Bewertung. Dazu das Dreieck der individuellen Abwicklungsfaktoren: verwendet, außerhalb des Zeitfensters, als Höchst- oder Tiefstwert ausgeschlossen. Blass markiert sind Ausschlüsse, die ohnehin außerhalb des Fensters lagen. Darunter stehen die resultierenden LDFs im Vergleich zum Standard-Chain-Ladder |
| Dreieck | Dreieck farblich nach Ausgangsdreieck / Trainingsdiagonalen / Zukunft (wie Abb. 1 im Paper), Abwicklungsmuster und Schadenquoten des Modells |
| Modellraum | Alle Modelle mit Scores (sortier- und durchsuchbar, CSV-Download). **Klick auf eine Zeile** inspiziert das Modell in allen anderen Tabs. Grafiken: bester Score je `n_periods`; Trainings-Score gegen Out-of-Sample-RMSE samt Rangkorrelation |
| Backtest | Score je Kalenderperiode, Summe AvE/CDR je Periode (systematische Verzerrung) und alle Backtest-Datensätze des gewählten bzw. inspizierten Modells |
| Erweiterungen | B1 CDR-α-Sweep, B6 Mack-CoV-Faustregel, B7 Holdout-Wahl von α (mit „übernehmen“), B5 Zwei-Stufen-Suche, B8 Bayes'sche Optimierung (TPE) mit optional anfalljahresabhängigen Schadenquoten |
| Benchmark | Vergleich mit der manuellen Reservierung: Die Historie der gebuchten Endschäden (CSV: Stichtag; Anfalljahr; Endschaden; optional Erwartet) wird mit denselben Kennzahlen bewertet wie die App. Die App wählt dabei **rollierend**, nur mit dem Wissen des jeweiligen Stichtags. Gezeigt werden Scores, gewonnene Perioden mit Vorzeichen- und t-Test, Abwicklungsergebnis, Bias und bei bekannter Zukunft der RMSE. Zum Ausprobieren gibt es eine Vorlage und simulierte Demo-Daten |
| Methode | Kurzbeschreibung des Verfahrens |

## CSV-Format für eigene Daten

```
AJ;12;24;36;...;Praemie
1979;3670;5817;6462;...;17684
1980;4827;7600;8274;...;18762
...
```

- Erste Spalte: Anfallperiode (beliebige Bezeichnung). Weitere Spalten: Entwicklungsperioden, **kumuliert** (oder inkrementell mit der Checkbox „Werte sind inkrementell“). Leere Zellen = noch nicht beobachtet.
- Optional eine Spalte `Praemie` / `Prämie` / `Premium` / `EP`. Ohne Prämie ist nur Chain Ladder verfügbar.
- Trennzeichen (`;`, `,`, Tab) und Dezimalzeichen (`,` oder `.`) sind wählbar; Tausenderpunkte werden bei Dezimalkomma entfernt.
- **Normalfall Dreieck:** Die Modelle werden bewertet und ausgewählt, und die App liefert das IBNR.
- **Vollständiges Rechteck** (auch die Zukunft ist bekannt, z. B. historische Daten): Zusätzlich misst die App den Out-of-Sample-RMSE der Endschäden gegenüber der letzten Spalte, wie in den Fallstudien des Papers. Die letzte Spalte gilt dabei als endabgewickelt.
- Über den Link „Beispieldatei“ in der Seitenleiste bekommen Sie das Swiss-Dreieck im passenden Format.

## Hinweise

- Die Voreinstellungen reproduzieren die Ergebnisse des Papers; beim Swiss-Dreieck wählt die App zum Beispiel BF(n=11, drop_high, 59 %) mit RMSE 527,9 und IBNR 31.647.
- Die Laufzeit wächst linear mit der Modellzahl (etwa 10 ms pro Modell und 13 Bewertungsperioden). Bei sehr großen Suchräumen ist die Zwei-Stufen-Suche oder die Bayes'sche Optimierung sinnvoller als das volle Grid.

## Benchmark-Datei (manuelle Reservierung)

```
Stichtag;Anfalljahr;Endschaden;Erwartet
1984;1979;7002;0
1984;1980;9362,5;303,5
...
1997;1997;32036,6;8963,2
```

- **Stichtag:** die Kalenderperiode der Reservierung, mit derselben Bezeichnung wie die Anfallperioden (1990 = Jahresende 1990). Alternativ eine Spalte `Diagonale` mit dem Kalenderindex.
- **Endschaden:** der damals geschätzte Endschaden je Anfalljahr.
- **Erwartet** (optional): der damals erwartete Zuwachs der Folgeperiode. Fehlt die Spalte, leitet die App die Erwartung aus dem Chain-Ladder-Muster zum Stichtag ab.
- Nötig sind mindestens zwei aufeinanderfolgende Stichtage, sinnvoll ab etwa acht.
- Die Beispielwerte stammen aus der Datei `vorlage_manuelle_reservierung_DEMO.csv` (simuliert, keine echte Reservierung).
- Funktionen im Rechenkern: `normalize_manual()`, `manual_records()`, `rolling_selection()`, `compare_periods()`, `simulate_manual()` (nur Demo).
