# Wolkenpfad – Kapitel I: Der Samen des Waldes

Ein meditatives Perspektiv-Rätselspiel für das iPhone. Es kombiniert die unmögliche Architektur von *Monument Valley* mit der warmen, lebendigen Welt eines Studio-Ghibli-Films: schwebende Inseln über einem Wolkenmeer, runde Bäume, moosige Steinkanten, Blütenblätter im Wind und ein kleiner Waldgeist als Begleiter.

## Starten

1. `Wolkenpfad.xcodeproj` in **Xcode 16 oder neuer** öffnen.
2. Einen iPhone-Simulator wählen und ▶︎ drücken.
3. Für ein echtes Gerät unter *Signing & Capabilities* das eigene Team eintragen.

Voraussetzungen: iOS 16 oder neuer, iPhone, Hochformat. Das Spiel nutzt SwiftUI, SceneKit und AVAudioEngine und braucht keine externen Abhängigkeiten. Grafik und Musik entstehen prozedural. Die einzige Bilddatei ist das App-Icon.

## Das erste Level

Hana, ein Mädchen mit rotem Umhang und Strohhut, erwacht auf einer schwebenden Garteninsel. Sie soll den leuchtenden Samen zum Schrein über den Wolken bringen. Der Waldgeist **Kiko** schwebt neben ihr her. Wartest du eine Weile, fliegt er zum nächsten Rätsel und leuchtet dort auf.

So verläuft das Level:

1. **Garteninsel:** Teich, Wasserfall ins Wolkenmeer und Steinlaternen. Eine Treppe führt hinauf zur Terrasse.
2. **Drehbrücke:** Mit der goldenen Kurbel drehst du die Holzbrücke, bis sie Terrasse und Turm verbindet. Hana darf dabei auf der Brücke stehen und fährt mit.
3. **Aufzugssäule:** Ziehst du die türkise Säule nach oben, trägt sie Hana zur oberen Galerie.
4. **Die unmögliche Verbindung:** Am Ende der Galerie lässt sich ein Bogenarm drehen. In der richtigen Stellung scheint er nahtlos in die Schrein-Insel überzugehen. In Wirklichkeit liegt diese zwei Ebenen höher und näher an der Kamera. Weil der Weg für das Auge zusammenhängt, kann Hana ihn gehen.
5. **Finale:** Hana erreicht den Schrein. Der Samen steigt auf, ein riesiger Kirschbaum wächst, auf allen Wiesen öffnen sich Blumen, und die Waldgeister erwachen.

## Steuerung

- **Tippen** auf einen Weg: Hana sucht sich den Weg dorthin.
- **Ziehen** an Kurbeln, Griffen oder beweglichen (türkisen) Teilen: Die Welt bewegt sich und rastet mit Klick und Haptik ein.
- Das **Menü** oben rechts bietet Hinweise, Klang an/aus und einen Neustart.

## Wie die unmöglichen Wege funktionieren

Die Kamera ist orthografisch und schaut genau entlang der Raumdiagonale (1, 1, 1). Zwei Felder gelten als verbunden, wenn sich zwei Kantenmittelpunkte („Ports“) in der Projektion decken, also wenn sie sich nur um ein Vielfaches von (1, 1, 1) unterscheiden, und wenn ihre Austrittsrichtungen entgegengesetzt sind. Normale Nachbarn, Treppen und Penrose-artige Illusionen folgen alle aus dieser einen Regel (`Level/LevelModel.swift`). Geht Hana über eine Illusion, springt sie entlang der Blickachse. Auf dem Bildschirm sieht das wie ein ganz normaler Schritt aus.

## Projektaufbau

```
Wolkenpfad/
├── App/WolkenpfadApp.swift      App-Einstieg, Neustart über neue Session
├── Level/
│   ├── level1.json              Leveldaten: Blöcke, Mechanismen, Deko, Erzähltexte
│   └── LevelModel.swift         Gitterlogik, Ports, Illusionen, Wegsuche
├── Scene/
│   ├── Art.swift                Palette, handgemalte Texturen, Himmel, Wolken
│   ├── Props.swift              Bäume, Laternen, Torii, Kurbeln, Hana und Kiko
│   ├── WorldBuilder.swift       Szene aus Leveldaten, Licht, Wolkenmeer, Partikel
│   └── GameCoordinator.swift    Eingabe, Laufen, Mechanismen, Hinweise, Finale
├── Audio/SoundEngine.swift      Prozeduraler Synthesizer (Klangfläche, Wind, Glocken)
└── UI/GameScreen.swift          Titel, Erzähltexte, Menü, Kapitel-Abschluss
Tools/                           Python-Werkzeuge zum Bauen und Prüfen von Levels
```

`Tools/verify_level.py` durchsucht alle Mechanismus-Stellungen. Es prüft, ob das Level lösbar ist und ob Blöcke kollidieren, und listet jede unmögliche Verbindung auf. So entstehen keine unbeabsichtigten Abkürzungen. `Tools/preview_level.py` rendert eine isometrische Vorschau (siehe `Tools/level1_preview.png`).

## Hinweis

Das Projekt wurde in einer Linux-Umgebung ohne Xcode geschrieben. Die Spiellogik ist per Simulation geprüft, und der Swift-Code ist syntaktisch geprüft. Kompiliert wurde er hier aber nicht. Falls Xcode beim ersten Build etwas meldet, ist es voraussichtlich eine Kleinigkeit.
