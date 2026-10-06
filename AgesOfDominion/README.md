# Ages of Dominion

Ein Echtzeit-Strategiespiel über **12 Zeitalter der Menschheitsgeschichte**, inspiriert von *Empire Earth*. Es reicht von der Urzeit bis in die Fusionszukunft und läuft auf **Mac und iPhone/iPad** aus einem einzigen Xcode-Projekt (SwiftUI + SpriteKit, ohne externe Abhängigkeiten oder Grafik-Assets).

## Projekt öffnen und starten

1. `AgesOfDominion.xcodeproj` in **Xcode 16 oder neuer** öffnen. Das Projekt nutzt synchronisierte Ordner (objectVersion 77).
2. Als Ziel **My Mac** oder einen **iPhone-/iPad-Simulator** wählen und auf ▶︎ klicken.
3. Für ein echtes iPhone unter *Signing & Capabilities* das eigene Team eintragen. Die Bundle-ID `com.example.AgesOfDominion` bei Bedarf anpassen.

Mindestversionen: macOS 13 und iOS 16. Auf dem iPhone läuft das Spiel im Querformat.

## Spielprinzip

| Element | Umsetzung |
|---|---|
| **12 Epochen** | Urzeit → Bronzezeit → Eisenzeit → Mittelalter → Schießpulverzeit → Dampfzeitalter → Moderne → Atomzeitalter → Digitalzeitalter → Kybernetik-Ära → Nano-Ära → Fusionszeitalter |
| **Epochensprung** | Wird im Stadtzentrum erforscht. Das Stadtzentrum verwandelt sich (Stammeslager → Forum → Steinburg → Rathaus → Kommandozentrale → Nano-Arkologie …). Alle Gebäude ändern Namen, Farbe und Silhouette. Neue Einheiten, Baupläne und ein neuer Held werden sofort freigeschaltet. |
| **Doktrinen** | Bei jedem Sprung wählst du *Militärische Doktrin* ⚔️, *Wirtschaftsaufschwung* 💰 oder *Sakrale Wunder* 🕍. Das sind 33 dauerhafte Perks, z. B. „Ritterorden“, „Industrialisierung“, „Glaubenseifer“ oder „Göttlicher Schild“. |
| **5 Rohstoffe** | Nahrung, Holz, Eisen und Gold. Dazu kommt ein strategischer Rohstoff, der sich mit der Epoche wandelt: **Öl** ab dem Dampfzeitalter, später **Uran** und dann **Silizium**. Die Kosten verlagern sich entsprechend. |
| **Über 60 Einheiten** | Keulenkrieger, Speerwerfer, Streitwagen, Phalanx, Katapulte, Ritter, Trebuchets, Belagerungstürme, Musketiere, Galeonen, Linieninfanterie, Kanonenbatterien, Grabenschützen, MG, Landschiffe, Doppeldecker, Kampfpanzer, Flugzeugträger, Bomber, Kampfhubschrauber, Mechs, Schwebepanzer (fahren über Wasser), Titan-Mechs, Plasma-Artillerie … |
| **Helden** | Stammeshäuptling, Ordensmeister, Feldmarschall, General, Cyber-Kommandant und Fusions-Avatar. Ihre Aura gibt Einheiten in der Nähe +20 % Angriff. |
| **Superwaffen** | Atomraketen-Silo und Radar (Atomzeitalter), Schildgeneratoren und Orbitalsatelliten-Schläge (Nano-Ära), Dampfeisenbahn/Bahnhof (Dampfzeitalter) |
| **Empire-Earth-Moment** | Ungleiche Epochen prallen aufeinander. Ein Konter-System sorgt dafür, dass es nicht nur auf die Epoche ankommt: Jeder Treffer verursacht mindestens 18 % Schaden, und sakrale Doktrinen geben Bonusschaden gegen Einheiten höherer Epochen. Masse, Taktik und Doktrin entscheiden. |
| **Mammutjagd** | Mammuts wehren sich, Hirsche fliehen. Erlegtes Wild liefert Nahrung. |
| **KI** | Bis zu 3 Gegner in 4 Schwierigkeitsstufen, wahlweise jeder gegen jeden oder alle verbündet gegen dich. Die KI baut ihre Wirtschaft auf, steigt in neue Epochen auf, wählt Doktrinen, verteidigt sich, greift in Wellen an und setzt Atom- und Orbitalschläge ein. |
| **Sieg** | Alle Gegner vernichten oder ein Weltwunder 5 Minuten lang halten. |

## Steuerung

**Mac:** Mit Linksklick wählst du aus, mit Ziehen ziehst du einen Auswahlrahmen auf und mit Shift fügst du zur Auswahl hinzu. Ein Doppelklick wählt alle Einheiten des gleichen Typs. Rechtsklick (oder Ctrl-Klick) gibt einen Kontextbefehl: bewegen, angreifen, sammeln, bauen/reparieren oder Sammelpunkt setzen. Die Kamera bewegst du mit WASD oder den Pfeiltasten, zoomst mit Mausrad oder Pinch und scrollst mit dem Trackpad.
Tastenkürzel: `.` untätiger Arbeiter · `H` Stadtzentrum · `M` Armee · `E` Epochensprung · `Q` Angriffsbewegung · `X` Halt · `Entf` entlassen · `Leertaste` Pause · `J` zum letzten Angriff springen · `Esc` abbrechen.

**iPhone/iPad:** Tippen wählt aus. Mit einer Auswahl tippst du auf den Boden oder ein Ziel, um einen Befehl zu geben. Doppeltippen wählt alle Einheiten des gleichen Typs. Gedrückt halten und ziehen zieht einen Auswahlrahmen auf. Wischen bewegt die Kamera, Kneifen zoomt. Gebäude platzierst du so: einmal tippen zum Positionieren, ein zweites Mal zum Bestätigen.

## Architektur

```
AgesOfDominion/
├── App/    AgesOfDominionApp.swift   – App-Einstieg, AppState, RootView
├── Core/   (reines Swift, nur Foundation – plattformunabhängige Simulation)
│   ├── Ages.swift, Resources.swift, Doctrine.swift     – Epochen, Rohstoffe, Doktrinen/Perks
│   ├── UnitCatalog.swift, BuildingCatalog.swift        – Datentabellen + Kontermatrix
│   ├── Entities.swift, GameSettings.swift              – Einheiten, Gebäude, Rohstoffe, Spieler
│   ├── GameMap.swift                                   – Terrain, Kartengenerator, A*-Wegfindung
│   ├── GameWorld.swift, GameWorld+Simulation.swift     – Spielwelt, Befehle, Kampf, Wirtschaft, Nebel
│   └── AIController.swift                              – Computergegner
├── Game/   (SpriteKit)
│   ├── GameScene.swift        – Rendering, Effekte, Kamera, Maus/Tastatur/Touch
│   ├── GameController.swift   – Brücke Simulation ↔ Szene ↔ HUD (Auswahl, Kontextbefehle)
│   ├── Sprites.swift, Rendering.swift – prozedurale Texturen, Einheiten-/Gebäude-Sprites
│   └── GameSKView.swift       – SKView-Wrapper für macOS (NSView) und iOS (UIView)
└── UI/     (SwiftUI) Hauptmenü, HUD, Minikarte, Doktrin-Auswahl, Pause- & Endbildschirm
```

Die Simulation läuft mit einem festen Zeitschritt von 30 Hz und lässt sich auf 0,5× bis 3× beschleunigen. Grafiken entstehen prozedural aus Emoji-Glyphen und programmatisch gezeichneten Texturen. Deshalb braucht das Projekt keine Bilddateien außer dem App-Icon.

## Hinweis

Das Projekt wurde in einer Linux-Umgebung ohne Xcode geschrieben. Der Code wurde syntaktisch geprüft, aber hier nicht kompiliert. Falls Xcode beim ersten Build Kleinigkeiten meldet, z. B. eine Typinferenz oder eine API-Verfügbarkeit, lassen sie sich in der Regel mit einer Zeile beheben.
