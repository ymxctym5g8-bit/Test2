# Neko no Machi auf iPhone & iPad

Dieses Xcode-Projekt verpackt das Spiel als echte App für iPhone und iPad (ab iOS/iPadOS 16).
Gespielt wird im Querformat mit Touch-Steuerung – oder am iPad mit angeschlossener Tastatur. Die Sprache (Deutsch/Englisch) richtet sich nach dem Gerät und lässt sich unter **Einstellungen → Sprache** umstellen.

## Was du brauchst
- einen Mac mit **Xcode** (kostenlos im Mac App Store)
- deine **Apple-ID** (eine kostenlose reicht zum Installieren auf deinen eigenen Geräten)
- dein iPhone/iPad und ein USB-Kabel (später geht's auch per WLAN)

## Auf dein Gerät spielen – Schritt für Schritt
1. `NekoNoMachi.xcodeproj` doppelklicken → Xcode öffnet sich.
2. Links oben auf das blaue Projekt **NekoNoMachi** klicken → Reiter **Signing & Capabilities**.
3. Bei **Team** deine Apple-ID wählen (falls leer: *Add an Account…* und anmelden).
4. Der **Bundle Identifier** ist bereits auf `app.nekonomachi` eingestellt (Team 4YYPQ95GVT). Kauf: `app.nekonomachi.fullversion` (Kapitel 4–8).
5. iPhone/iPad per Kabel anschließen, entsperren und „Diesem Computer vertrauen“ bestätigen.
6. Oben in der Leiste dein Gerät als Ziel auswählen und auf **▶ (Run)** klicken.
7. Beim ersten Mal auf dem Gerät: **Einstellungen → Allgemein → VPN & Geräteverwaltung** → deinen Entwickler-Eintrag antippen → **Vertrauen**.
   Auf neueren iPhones zusätzlich: **Einstellungen → Datenschutz & Sicherheit → Entwicklermodus** einschalten (Neustart).
8. App starten – fertig! 🐾

Mit einer **kostenlosen** Apple-ID läuft die App 7 Tage, danach einfach in Xcode nochmal auf ▶ klicken.
Mit einem **Apple-Developer-Account** (99 €/Jahr) kannst du sie per TestFlight an Freunde verteilen oder im App Store veröffentlichen.

## Steuerung auf dem Touchscreen
| Knopf | Aktion |
|---|---|
| ◀ ▶ (links unten) | laufen |
| ⇧ Rennen | Rennen ein/aus |
| 🐾 Sprung (rechts unten) | springen – in der Luft nochmal für Doppelsprung, länger halten = höher |
| ▼ | von Dach/Zaun herunterfallen |
| 😺 Miau | miauen – Freunde finden |
| 💤 Sitzen | hinsetzen / schlafen |
| ☰ (oben rechts) | Menü |

Wenn du die App verlässt, pausiert das Spiel automatisch. Der Spielstand bleibt gespeichert.

## Spiel ändern
Das Spiel selbst liegt im Ordner `NekoNoMachi/web` (dieselben Dateien wie in `../app`).
Nach Änderungen in `../app` im Terminal `./sync-web.sh` ausführen und in Xcode neu starten.

## Fehlersuche
- **„Signing requires a development team“** → Schritt 3.
- **„Failed to register bundle identifier“** → Bundle Identifier ist schon vergeben, Schritt 4 mit einem anderen Namen.
- **Kein Ton** → Lautstärke-Tasten drücken; beim ersten Antippen im Spiel wird der Ton aktiviert.
- **Debuggen**: Auf dem Gerät *Einstellungen → Apps → Safari → Erweitert → Web-Inspektor* einschalten, dann am Mac Safari → Entwickler → dein Gerät → Neko no Machi.
