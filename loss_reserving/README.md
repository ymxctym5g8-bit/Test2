# Loss Reserving – R-Version

| Datei | Inhalt |
|---|---|
| `loss_reserving.R` | Rechenlogik in Base R (Chain Ladder, Mack, ELR, Bornhuetter-Ferguson, Cape Cod, Additiv, ODP-Bootstrap) – auch als Kommandozeilen-Skript nutzbar |
| `app.R` | R-Shiny-App |
| `install_packages.R` | installiert die benötigten Pakete |

## Installation (einmalig, in R)

    source("install_packages.R")

Benötigt R ≥ 4.1 und die Pakete shiny, bslib, plotly, openxlsx, readxl.

## Starten

**Shiny-App** – in RStudio `app.R` öffnen und auf „Run App“ klicken, oder in R:

    shiny::runApp("pfad/zum/ordner")

**Kommandozeile:**

    Rscript loss_reserving.R                                   # Demo mit RAA-Dreieck
    Rscript loss_reserving.R --triangle dreieck.csv --premiums praemien.csv --elr 0.65
    Rscript loss_reserving.R --triangle dreieck.csv --sep ";" --decimal "," --incremental

**Als Bibliothek in eigenen Skripten:**

    source("loss_reserving.R")
    tri <- read_triangle_file("dreieck.csv", sep = ";", decimal = ",")
    r   <- compute_all(tri, premiums = c(...), elr = 0.65, benchmark = c(...))   # benchmark optional
    r$comp        # Vergleich aller Verfahren
    r$res_df      # Reserven je Anfalljahr
    r$bench       # Einordnung der manuellen Reserve (falls angegeben)
    write_excel(r, "ergebnisse.xlsx")

## Daten

- Dreieck als CSV oder Excel hochladen oder direkt aus Excel einfügen
  (erste Spalte = Anfalljahr, weitere Spalten = Abwicklungsjahre, zukünftige Zellen leer).
- Kumuliert oder inkrementell; deutsches Format (Semikolon, Dezimalkomma, Tausenderpunkt) wird unterstützt.
- Prämien in der App im Tab „Daten“: eine Zeile je Anfalljahr (Spalte aus Excel einfügen).

## Jahres- und Quartalsdaten

Das Tool rechnet mit Jahres- oder Quartalsdreiecken.

- **Erkennung:** Anfallperioden wie `2024Q1`, `2024-Q1`, `Q1 2024`, `2024/1` oder `1. Quartal 2024` werden
  automatisch als Quartale erkannt (Seitenleiste **Periodizität**; lässt sich auch fest auf Jahre oder Quartale stellen).
  Die Spalten sind dann Abwicklungsquartale (1 = Anfallquartal selbst, 2 = folgendes Quartal usw.).
- **Direkt als Quartale:** Alle Verfahren laufen auf dem Quartalsdreieck; Beschriftungen lauten dann
  „Anfallquartal“ / „Abwicklungsquartal“. Prämien und manuelle Reserve werden je Quartal eingetragen.
- **Zu Jahren verdichten:** Häkchen **„Quartale zu Jahren verdichten“**. Der Wert eines Anfalljahres im
  Abwicklungsjahr k ist die Summe seiner vier Anfallquartale, jeweils zum Stand 31.12. (Anfalljahr + k − 1).
  Endet der Datenstand unterjährig, verwendet das Tool den Stand zum letzten Jahresende und weist darauf hin.
  Prämien und manuelle Reserve werden dann je Jahr eingetragen; in Dateien (Kommandozeile) dürfen sie auch je
  Quartal stehen und werden automatisch aufsummiert.
- **Beispiel:** `beispiel_quartale.csv` und `beispiel_quartale_praemien.csv` (fiktiv, 2021Q1–2024Q4); in der App
  als Quelle **„Demo Quartale (fiktiv)“**.
- **Kommandozeile:** `--period quarter` (oder `auto`/`year`) und `--to-years`.

## Eigene (manuelle) Reserve als Benchmark

Die eigene Reservierung lässt sich je Anfalljahr eintragen und wird dann mit allen Verfahren verglichen.

**In der App:** Seite **Daten** → Spalte bzw. Feld **„Manuelle Reserve“** – ein Wert je Anfalljahr in
derselben Reihenfolge wie im Dreieck (0 ist erlaubt; eine Spalte aus Excel lässt sich direkt einfügen).
Bleibt das Feld leer, rechnet die App wie bisher ohne Benchmark.

Danach zeigt die App zusätzlich:
- eine Kachel **„Manuelle Reserve“** mit Abweichung zu Chain Ladder und Sicherheitsniveau,
- die Zeile **„Manuelle Reserve“** in allen Tabellen und Diagrammen sowie die Spalte **„Abw. zu Benchmark“**,
- eine gepunktete Linie in den Balkendiagrammen und im Bootstrap-Histogramm,
- die Karte **„Einordnung der manuellen Reserve“** (Übersicht) mit Kurzaussagen und einer Tabelle je Anfalljahr,
- im Excel-Export das Blatt **„Benchmark“**.

**Sicherheitsniveau:** Anteil der Szenarien, den die manuelle Reserve abdeckt – nach Mack über eine
Lognormal-Näherung, nach Bootstrap aus der simulierten Verteilung. 50 % entspricht dem Median; höhere
Werte bedeuten eine vorsichtigere Reservierung.

**Kommandozeile:** Option `--benchmark manuelle_reserve.csv` (Vorlage: `manuelle_reserve_vorlage.csv`,
Spalten Anfalljahr und Manuelle Reserve).

## Hinweis

Der ODP-Bootstrap ist zufallsbasiert. Mit gleichem Zufallsstartwert und gleicher Anzahl Simulationen
sind die Ergebnisse reproduzierbar. Ausführliche Anleitung: `Loss_Reserving_Benutzerhandbuch_R.docx`.
