# Wolkenpfad

*A journey above the clouds.* Ein ruhiges Perspektiv-Rätselspiel für das iPhone, im Stil eines Studio-Ghibli-Films mit der unmöglichen Architektur von *Monument Valley*. Es gibt schwebende Inseln über einem Wolkenmeer, Pastellverläufe in Rosa, Türkis, Lavendel und Ocker, Escher-Geometrie, moosige Steine und kleine Naturgeister. Gegner und Zeitdruck gibt es nicht.

**Das Spiel ist komplett auf Englisch.** Es hat 18 Kapitel: einen kostenlosen Prolog (1–3) und drei Akte mit je fünf Kapiteln (4–18), die per In-App-Kauf freigeschaltet werden.

## Starten

1. `Wolkenpfad.xcodeproj` in **Xcode 16 oder neuer** öffnen.
2. Einen iPhone-Simulator wählen und ▶︎ drücken. Das geteilte Schema `Wolkenpfad` nutzt die StoreKit-Testkonfiguration `Wolkenpfad.storekit`. Käufe lassen sich deshalb im Simulator ohne App Store Connect testen.
3. Für ein echtes Gerät unter *Signing & Capabilities* das eigene Team eintragen.

Voraussetzungen: iOS 17 oder neuer, iPhone, Hochformat. Das Spiel nutzt SwiftUI, SceneKit, StoreKit 2 und AVAudioEngine und braucht keine externen Abhängigkeiten. Grafik und Musik entstehen prozedural.

## Geschichte

Hana ist eine junge Tüftlerin aus einem Dorf auf einer kleinen schwebenden Insel. **Kiko**, ein kleiner weißer Waldgeist, schwebt neben ihr her und zeigt den Weg, wenn man eine Weile wartet. Im Prolog bringt Hana drei Samen zurück zu den Schreinen. Danach findet sie die alte Windharfe und das vergilbte Notizbuch ihres Großvaters. Der Wind am Himmel wird schwächer: Windmühlen stehen still, Wolkenbrücken zerfallen. Hana macht sich auf, sie zu reparieren und die große Windharfe im Herzen der Wolken neu zu stimmen.

## Die 18 Kapitel

Jedes Kapitel hat einen eigenen Look: Himmelsverlauf, Licht, Wolkenfarben, Kulisse, Teilchen (Blütenblätter, Pusteblumensamen, Sporen, Regen, Briefe, Schmetterlinge …), Materialpalette, Dekoration und eine Variante der Musik. Die Schwierigkeit steigt stetig. Der Wert *Züge* ist die Zahl der Mechanismus-Bedienungen auf dem kürzesten Lösungsweg. Der Prüfer ermittelt ihn automatisch.

| # | Kapitel | Look | Mechanik | Züge |
|---|---|---|---|---|
| | **Prolog · The Forest Seeds** (kostenlos) | | | |
| 1 | The Seed of the Forest | später Nachmittag, riesige Kumuluswolken | Kurbel, Aufzug, erste Illusion | 4 |
| 2 | The Song of the River | Abendrot, Herbstahorn, Fluss | Floß, Druckplatte, Drehkreuz | 6 |
| 3 | The Tower of Lanterns | Nacht, Laternen, Sterne | Drehturm, zwei Platten öffnen ein Tor | 8 |
| | **Act I · The Call of the Sky** | | | |
| 4 | The Hum in the Attic | goldener Staub im Dachboden | erster Zustandstrigger: Dachbalken öffnet die Luke | 10 |
| 5 | The First Step into the Mist | Morgendunst, leuchtende Sporen | gleitende Wolkenbrücken, mitfahren | 11 |
| 6 | The Valley of Whispering Grass | mannshohes Gras, Kodama | Schlafliedsteine lassen Kodama zur Seite treten | 12 |
| 7 | The Mill of Forgotten Letters | Herbstocker, Windmühle, fliegende Briefe | Mühlstein hebt per Zustandstrigger den Kornschacht | 13 |
| 8 | The Storm Is Coming | Gewitterhimmel, Regen, Blitze | Astbrücken um die hohle Eiche, zwei Illusionen | 14 |
| | **Act II · The Search for the Light** | | | |
| 9 | The Lake of Glass | spiegelnde Glasplatten, Rosa und Türkis | gleitende Glasscheiben, zwei Illusionen | 15 |
| 10 | The Town of Bellflowers | violetter Abend, leuchtende Glockenblumen | drehende Blütenstiele, Platten | 16 |
| 11 | The Sleeping Giant | moosiger Wolkenriese | Atem-Kurbel hebt zwei Thermiksäulen | 17 |
| 12 | The Maze of Sunbeams | Sonnenuntergang, Lichtschächte | drei Spiegel, sechs Lichtbrücken, jede braucht ein anderes Spiegelpaar | 18 |
| 13 | The Old Bridge-Builder | Werkstatt, Messing, Seile | gekoppelte Maschinen: Wippe, Zahnrad-Schwenkbrücke, Flaschenzug mit Gegengewicht | 19 |
| | **Act III · The Heart of the Sky** | | | |
| 14 | The Ascent to the Sky Garden | steiler Aufstieg, Schmetterlinge | gestapelte Aufzüge und Drehteile | 20 |
| 15 | The Ruins of the First Storm | monolithische Säulen, schlafende Maschinen | Wächter, Obelisk, gegenläufig gekoppelte Steinringe | 21 |
| 16 | Echoes of the Past | Nacht, Polarlicht, Erinnerungsprojektionen | Geisterwege per Platte und Laterne, eine erinnerte Tür als Illusion | 22 |
| 17 | The Heart of the Clouds | Perlmutt in Rosa, Türkis, Lavendel | drei Harfenwirbel: Saiten aus Licht und ein Akkord öffnet das Herz | 24 |
| 18 | A New Horizon | goldenes Licht, alles blüht, das Dorf erwacht | großes Finale mit allen Mechaniken und dem Akkord des ganzen Tages | 26 |

Vorschaubilder aller Kapitel liegen in `Mockups/chapters/`. Die Übersicht ist `00_alle_kapitel.jpg`.

## In-App-Käufe

| Produkt-ID | Inhalt | Preis (Testkonfiguration) |
|---|---|---|
| `com.example.Wolkenpfad.act1` | Act I, Kapitel 4–8 | 2,99 $ |
| `com.example.Wolkenpfad.act2` | Act II, Kapitel 9–13 | 2,99 $ |
| `com.example.Wolkenpfad.act3` | Act III, Kapitel 14–18 | 2,99 $ |
| `com.example.Wolkenpfad.journey` | Alle drei Akte (*The Complete Journey*) | 6,99 $ |

Alle Produkte sind *Non-Consumable* und unterstützen die Familienfreigabe. `App/Store.swift` nutzt StoreKit 2: Es lädt die Produkte, kauft, hört auf `Transaction.updates`, gleicht `currentEntitlements` ab und bietet *Restore Purchases* (`AppStore.sync`). Gekaufte Akte werden zusätzlich lokal zwischengespeichert. So sind sie auch offline sofort offen.

Für den Release:

1. Bundle-ID und Produkt-IDs von `com.example.Wolkenpfad…` auf die eigenen ändern, in `App/Catalog.swift` und in `Wolkenpfad.storekit`.
2. Die vier Produkte in App Store Connect als *Non-Consumable* anlegen.
3. Optional die Testkonfiguration im Schema abwählen (*Edit Scheme → Run → Options → StoreKit Configuration*).

Freischaltung im Spiel: Der Prolog ist kostenlos. Innerhalb eines Akts öffnet jedes abgeschlossene Kapitel das nächste. Das erste Kapitel eines gekauften Akts ist sofort spielbar. Am Ende eines Kapitels geht es mit *Continue* weiter oder, falls nötig, zum Shop. Die Kapitelauswahl zeigt Fortschritt und Kaufstatus.

## Steuerung

- **Tippen** auf einen Weg: Hana sucht sich den Weg dorthin.
- **Ziehen** an Kurbeln, Griffen oder beweglichen Teilen: Die Welt bewegt sich und rastet mit Klick und Haptik ein. Steht Hana auf einem beweglichen Teil, fährt sie mit.
- **Druckplatten** rasten beim Betreten ein und bewegen Teile, die man nicht anfassen kann.
- **Gekoppelte Mechanismen** (Zustandstrigger): Manche Teile folgen der Stellung anderer, etwa Lichtbrücken den Spiegeln, die rechte Wippe der linken oder die Saiten den Harfenwirbeln.
- Das **Menü** oben rechts bietet Hinweise, Klang an/aus, die Kapitelauswahl und einen Neustart.

## Wie die unmöglichen Wege funktionieren

Die Kamera ist orthografisch und schaut genau entlang der Raumdiagonale (1, 1, 1). Zwei Felder gelten als verbunden, wenn sich zwei Kantenmittelpunkte („Ports“) in der Projektion decken, also wenn sie sich nur um ein Vielfaches von (1, 1, 1) unterscheiden, und wenn ihre Austrittsrichtungen entgegengesetzt sind. Normale Nachbarn, Treppen und Penrose-artige Illusionen folgen alle aus dieser einen Regel (`Level/LevelModel.swift`). Nicht angrenzende Verbindungen gelten nur zwischen Feldern, die im Level mit `"ill": true` markiert sind. Jede Illusion ist also gewollt.

## Projektaufbau

```
Wolkenpfad/
├── App/
│   ├── WolkenpfadApp.swift      App-Einstieg, Spielfortschritt
│   ├── Catalog.swift            Prolog, drei Akte, Kapiteltitel, Produkt-IDs
│   └── Store.swift              StoreKit 2: Produkte, Kauf, Wiederherstellen
├── Level/
│   ├── level1–18.json           Leveldaten: Blöcke, Mechanismen, Platten, Trigger, Hinweise, Texte, Finale
│   └── LevelModel.swift         Gitterlogik, Ports, Illusionen, Trigger, Wegsuche
├── Scene/
│   ├── Themes.swift             18 Kapitel-Looks: Himmel, Licht, Wolken, Teilchen, Paletten, gemalte Kulissen
│   ├── Art.swift                handgemalte Texturen, Wolken, Himmel
│   ├── Props.swift, GhibliProps.swift, NekoProps.swift   Bäume, Mühlen, Glockenblumen, Riese, Harfe, Hana, Kiko …
│   ├── WorldBuilder.swift       Szene aus Leveldaten, Überwucherung, Atmosphäre
│   └── GameCoordinator.swift    Eingabe, Laufen, Mechanismen, Trigger, Hinweise, Finale
├── Audio/SoundEngine.swift      generative Musik (eine Variante je Kapitel)
├── UI/                          Titel, Erzähltexte, Menü, Kapitelauswahl, Shop
└── Wolkenpfad.storekit          StoreKit-Testkonfiguration
Tools/                           Python-Werkzeuge zum Bauen und Prüfen von Levels
```

## Level-Werkzeuge

- `Tools/generate_level1–3.py` erzeugen den Prolog, `Tools/levels/ch4–18.py` die Akte. Sie nutzen die kleine DSL `Tools/leveldsl.py` und die Bausteine in `Tools/levels/kit.py`. `Tools/levels/BRIEF.md` beschreibt die Regeln für neue Kapitel.
- `python3 Tools/verify_level.py Wolkenpfad/Level/levelN.json --essential` durchsucht alle Mechanismus-Stellungen und Druckplatten-Zustände. Der Prüfer zeigt, ob das Level lösbar ist und wie viele Züge die kürzeste Lösung braucht. Er listet jede unmögliche Verbindung auf und prüft Kollisionen beim Drehen und Schieben. Mit `--essential` zeigt er außerdem, dass jeder Mechanismus wirklich gebraucht wird.
- `Tools/preview_level.py` rendert eine schnelle isometrische Vorschau. `Tools/render_chapters.py` erzeugt die Kapitel-Vorschauen in `Mockups/chapters/` mit den Farben aus `Themes.swift`.

## Hinweis

Das Projekt wurde in einer Linux-Umgebung ohne Xcode geschrieben. Die Spiellogik aller 18 Kapitel ist per Simulation geprüft, und der Swift-Code ist syntaktisch geprüft. Kompiliert wurde er hier aber nicht. Falls Xcode beim ersten Build etwas meldet, ist es voraussichtlich eine Kleinigkeit.
