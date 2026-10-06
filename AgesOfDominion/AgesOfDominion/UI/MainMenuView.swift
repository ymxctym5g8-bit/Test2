import SwiftUI

struct MainMenuView: View {
    @Binding var settings: GameSettings
    let onStart: () -> Void
    @State private var showAges = false
    @State private var showHelp = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.1, green: 0.08, blue: 0.06), Color(red: 0.05, green: 0.08, blue: 0.14)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            AgeRibbon()
                .opacity(0.18)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 18) {
                    VStack(spacing: 4) {
                        Text("AGES OF DOMINION")
                            .font(.system(size: 40, weight: .heavy, design: .serif))
                            .foregroundStyle(LinearGradient(colors: [Theme.gold, Color(red: 0.8, green: 0.55, blue: 0.2)],
                                                            startPoint: .top, endPoint: .bottom))
                            .multilineTextAlignment(.center)
                            .shadow(color: .black, radius: 6)
                        Text("12 Zeitalter. Ein Imperium. Von der Mammutjagd bis zum Orbitalschlag.")
                            .font(.system(size: 14, weight: .medium, design: .serif))
                            .foregroundColor(Theme.dim)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    settingsPanel

                    Button(action: onStart) {
                        Label("Spiel starten", systemImage: "flag.checkered")
                            .font(.title3.bold())
                            .foregroundColor(.black)
                            .frame(width: 260, height: 50)
                            .background(RoundedRectangle(cornerRadius: 12).fill(Theme.gold))
                            .shadow(color: Theme.gold.opacity(0.5), radius: 10)
                    }
                    .buttonStyle(.plain)
                    .keyboardShortcut(.defaultAction)

                    HStack(spacing: 12) {
                        Button { showAges = true } label: {
                            Label("Die 12 Epochen", systemImage: "hourglass")
                        }
                        Button { showHelp = true } label: {
                            Label("Spielprinzip & Steuerung", systemImage: "questionmark.circle")
                        }
                    }
                    .buttonStyle(.bordered)
                    .tint(Theme.gold)
                }
                .padding()
                .frame(maxWidth: .infinity)
            }
        }
        .sheet(isPresented: $showAges) { AgesOverview(onClose: { showAges = false }) }
        .sheet(isPresented: $showHelp) { HelpView(onClose: { showHelp = false }) }
    }

    private var settingsPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            row("Gegner") {
                Picker("Gegner", selection: $settings.opponents) {
                    Text("1").tag(1)
                    Text("2").tag(2)
                    Text("3").tag(3)
                }
                .pickerStyle(.segmented)
            }
            row("Schwierigkeit") {
                Picker("Schwierigkeit", selection: $settings.difficulty) {
                    ForEach(Difficulty.allCases) { Text($0.name).tag($0) }
                }
                .pickerStyle(.segmented)
            }
            row("Karte") {
                Picker("Karte", selection: $settings.mapSize) {
                    ForEach(MapSize.allCases) { Text($0.name).tag($0) }
                }
                .pickerStyle(.segmented)
            }
            row("Startepoche") {
                Picker("Startepoche", selection: $settings.startAge) {
                    ForEach(GameSettings.startAgeChoices, id: \.self) { Text(Ages.info($0).name).tag($0) }
                }
                .pickerStyle(.menu)
            }
            row("Letzte Epoche") {
                Picker("Letzte Epoche", selection: $settings.maxAge) {
                    ForEach(0..<Ages.count, id: \.self) { i in
                        if i >= settings.startAge { Text(Ages.info(i).name).tag(i) }
                    }
                }
                .pickerStyle(.menu)
            }
            Toggle("KI-Gegner sind verbündet (alle gegen dich)", isOn: $settings.alliedAI)
            Toggle("Wundersieg erlaubt", isOn: $settings.wonderVictory)
            Toggle("Karte aufgedeckt", isOn: $settings.revealMap)
        }
        .foregroundColor(Theme.text)
        .tint(Theme.gold)
        .frame(maxWidth: 520)
        .panel(padding: 16)
        .onChange(of: settings.startAge) { newValue in
            if settings.maxAge < newValue { settings.maxAge = newValue }
        }
    }

    private func row<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        HStack {
            Text(title).font(.subheadline.bold()).frame(width: 110, alignment: .leading)
            content()
        }
    }
}

/// Dekoratives Band mit den Stadtzentren aller Epochen.
struct AgeRibbon: View {
    var body: some View {
        GeometryReader { geo in
            let items = Ages.all.map { $0.townCenterEmoji }
            VStack(spacing: 40) {
                ForEach(0..<6, id: \.self) { row in
                    HStack(spacing: 30) {
                        ForEach(0..<14, id: \.self) { i in
                            Text(items[(i + row * 3) % items.count]).font(.system(size: 34))
                        }
                    }
                    .offset(x: CGFloat(row % 2) * 40 - 40)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
            .clipped()
        }
        .allowsHitTesting(false)
    }
}

struct AgesOverview: View {
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Die 12 Epochen").font(.title2.bold())
                Spacer()
                Button("Schließen", action: onClose).keyboardShortcut(.cancelAction)
            }
            .padding()
            List {
                ForEach(Ages.all, id: \.index) { a in
                    HStack(alignment: .top, spacing: 12) {
                        Text(a.townCenterEmoji).font(.system(size: 30))
                        VStack(alignment: .leading, spacing: 3) {
                            HStack {
                                Text("\(a.index + 1). \(a.name)").font(.headline)
                                Text(a.era).font(.caption).foregroundColor(.secondary)
                            }
                            Text(a.description).font(.subheadline)
                            Text("Stadtzentrum: \(a.townCenterName)").font(.caption).foregroundColor(.secondary)
                            let units = UnitKind.allCases.filter { $0.stats.age == a.index && $0.stats.category != .animal }
                            if !units.isEmpty {
                                Text(units.map { "\($0.stats.emoji) \($0.stats.name)" }.joined(separator: " · "))
                                    .font(.caption)
                            }
                            if a.index > 0 {
                                Text("Aufstieg: " + a.advanceCost.shortText(age: a.index)).font(.caption2).foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .frame(minWidth: 420, minHeight: 500)
    }
}

struct HelpView: View {
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Spielprinzip").font(.title2.bold())
                Spacer()
                Button("Schließen", action: onClose).keyboardShortcut(.cancelAction)
            }
            .padding()
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    section("🏛️ Epochensprung", "Im Stadtzentrum erforschst du die nächste Epoche. Das Stadtzentrum verwandelt sich architektonisch (Stammeslager → Forum → Steinburg → Rathaus → Kommandozentrale → Nano-Arkologie …) und schaltet sofort neue Einheiten, Baupläne und einen neuen Helden frei.")
                    section("⚖️ Doktrinen", "Bei jedem Epochensprung wählst du einen Fokus: Militärische Doktrin ⚔️, Wirtschaftsaufschwung 💰 oder Sakrale Wunder 🕍. Jede Wahl ist ein dauerhafter Bonus und prägt deinen Technologiebaum.")
                    section("⛏️ Fünf Rohstoffe", "Nahrung 🍖 und Holz 🪵 dominieren die Antike, Eisen ⛓️ und Gold 🪙 das Mittelalter. Ab dem Dampfzeitalter wird der fünfte Rohstoff abbaubar: Öl 🛢️, später Uran ☢️ und schließlich Silizium 💠.")
                    section("💥 Der Empire-Earth-Moment", "Wer schneller forscht, trifft mit Panzern auf Kavallerie. Doch Masse, Konter und Doktrinen zählen: Jeder Treffer verursacht mindestens 18 % Schaden, Speere kontern Reiter, und die sakralen Doktrinen „Glaubenseifer“ und „Märtyrertum“ geben Bonusschaden gegen Einheiten höherer Epochen.")
                    section("🗡️ Konter", "Speer > Kavallerie > Fernkampf > Infanterie. Belagerung zerschmettert Gebäude. Panzer überrollen alles Biologische, fürchten aber Panzerabwehr, Kampfhubschrauber und Bomber. Flugzeuge können nur von Flak, Jägern und einigen Spezialeinheiten getroffen werden.")
                    section("☢️ Superwaffen", "Atomzeitalter: Atomraketen-Silo. Nano-Ära: Schildgeneratoren und Orbitalsatelliten-Schläge.")
                    section("🏆 Sieg", "Vernichte alle gegnerischen Gebäude und Arbeiter – oder errichte ein Weltwunder und halte es 5 Minuten lang.")
                    ControlsHelp(touch: false)
                    ControlsHelp(touch: true)
                }
                .padding()
            }
        }
        .frame(minWidth: 420, minHeight: 520)
    }

    private func section(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.headline)
            Text(text).font(.subheadline).fixedSize(horizontal: false, vertical: true)
        }
    }
}
