import SwiftUI

struct GameScreen: View {
    @ObservedObject var controller: GameController
    let onExit: () -> Void
    let onRestart: () -> Void
    @State private var showMenu = false
    @State private var doctrineCollapsed = false

    var body: some View {
        GeometryReader { geo in
            let compact = geo.size.height < 520 || geo.size.width < 700
            ZStack {
                GameSceneView(scene: controller.scene)
                    .ignoresSafeArea()

                HUDOverlay(controller: controller, hud: controller.hud, compact: compact, showMenu: $showMenu)

                if controller.hud.doctrineAge != nil && controller.hud.result == nil {
                    if doctrineCollapsed {
                        VStack {
                            Spacer()
                            Button {
                                doctrineCollapsed = false
                            } label: {
                                Label("Doktrin wählen!", systemImage: "sparkles")
                                    .font(.headline)
                                    .foregroundColor(.black)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Capsule().fill(Theme.gold))
                            }
                            .buttonStyle(.plain)
                            .padding(.bottom, compact ? 150 : 200)
                        }
                    } else {
                        DoctrineChoiceView(hud: controller.hud, compact: compact,
                                           onChoose: { controller.chooseDoctrine($0) },
                                           onCollapse: { doctrineCollapsed = true })
                    }
                }

                if showMenu {
                    PauseMenuView(controller: controller, hud: controller.hud,
                                  onResume: { showMenu = false; controller.paused = false },
                                  onRestart: onRestart, onExit: onExit)
                }

                if let result = controller.hud.result {
                    EndGameView(result: result, hud: controller.hud, onRestart: onRestart, onExit: onExit)
                }
            }
            .onChange(of: controller.hud.doctrineAge) { _ in doctrineCollapsed = false }
        }
        #if os(iOS)
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        #endif
    }
}

// MARK: - HUD

struct HUDOverlay: View {
    let controller: GameController
    let hud: HUDState
    let compact: Bool
    @Binding var showMenu: Bool

    var body: some View {
        VStack(spacing: 6) {
            TopBar(controller: controller, hud: hud, compact: compact, showMenu: $showMenu)
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(hud.wonderTexts, id: \.self) { t in
                        Text(t).font(.caption.bold()).foregroundColor(Theme.gold).panel(padding: 5)
                    }
                }
                Spacer()
                NotificationStack(hud: hud, compact: compact)
                Spacer()
                if !compact {
                    PlayerList(players: hud.players)
                }
            }
            Spacer(minLength: 0)
            HStack(alignment: .bottom, spacing: 8) {
                MinimapView(controller: controller, hud: hud, size: compact ? 118 : 180)
                SelectionPanel(controller: controller, hud: hud, compact: compact)
                    .frame(maxWidth: compact ? 260 : 380)
                Spacer(minLength: 0)
                CommandGrid(controller: controller, hud: hud, compact: compact)
            }
        }
        .padding(.horizontal, compact ? 6 : 10)
        .padding(.vertical, compact ? 4 : 10)
    }
}

struct TopBar: View {
    let controller: GameController
    let hud: HUDState
    let compact: Bool
    @Binding var showMenu: Bool

    var body: some View {
        HStack(spacing: compact ? 4 : 8) {
            ForEach(hud.resources) { r in
                HStack(spacing: 3) {
                    Text(r.icon).font(.system(size: compact ? 13 : 16))
                    Text(r.locked ? "–" : "\(r.amount)")
                        .font(.system(size: compact ? 12 : 14, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(r.locked ? Theme.dim : Theme.text)
                }
                .padding(.horizontal, compact ? 5 : 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Theme.panel))
                .help(r.locked ? "\(r.name) – ab dem Dampfzeitalter verfügbar" : r.name)
            }
            HStack(spacing: 3) {
                Text("👥").font(.system(size: compact ? 13 : 16))
                Text("\(hud.popUsed)/\(hud.popCap)")
                    .font(.system(size: compact ? 12 : 14, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(hud.popUsed >= hud.popCap ? .red : Theme.text)
            }
            .padding(.horizontal, compact ? 5 : 8)
            .padding(.vertical, 4)
            .background(Capsule().fill(Theme.panel))

            Spacer(minLength: 4)

            VStack(spacing: 2) {
                Text(hud.ageName)
                    .font(.system(size: compact ? 12 : 15, weight: .bold, design: .serif))
                    .foregroundColor(Theme.gold)
                if let p = hud.ageProgress {
                    ProgressView(value: p).tint(Theme.gold).frame(width: compact ? 70 : 110)
                } else if !compact {
                    Text(hud.ageEra).font(.caption2).foregroundColor(Theme.dim)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 3)
            .background(Capsule().fill(Theme.panel))
            .overlay(Capsule().stroke(Theme.border))

            Spacer(minLength: 4)

            Text(hud.timeText)
                .font(.system(size: compact ? 12 : 14, weight: .medium, design: .monospaced))
                .foregroundColor(Theme.text)
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(Capsule().fill(Theme.panel))

            IconButton(icon: "🧑‍🌾", badge: hud.idleVillagers > 0 ? "\(hud.idleVillagers)" : nil,
                       help: "Untätigen Arbeiter auswählen (.)", compact: compact) { controller.selectIdleVillager() }
            IconButton(icon: "⚔️", badge: hud.armyCount > 0 ? "\(hud.armyCount)" : nil,
                       help: "Gesamte Armee auswählen (M)", compact: compact) { controller.selectArmy() }
            IconButton(icon: "🏛️", badge: nil, help: "Stadtzentrum (H)", compact: compact) { controller.selectTownCenter() }
            if controller.isTouch {
                IconButton(icon: "✖️", badge: nil, help: "Auswahl aufheben", compact: compact) { controller.perform(.deselect) }
            }
            IconButton(icon: "☰", badge: nil, help: "Menü", compact: compact) {
                controller.paused = true
                showMenu = true
            }
        }
    }
}

struct IconButton: View {
    let icon: String
    let badge: String?
    let help: String
    let compact: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(icon)
                .font(.system(size: compact ? 15 : 18))
                .frame(width: compact ? 30 : 36, height: compact ? 28 : 32)
                .background(Circle().fill(Theme.panel))
                .overlay(Circle().stroke(Theme.border))
                .overlay(alignment: .topTrailing) {
                    if let b = badge {
                        Text(b)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(3)
                            .background(Circle().fill(Color.red))
                            .offset(x: 4, y: -4)
                    }
                }
        }
        .buttonStyle(.plain)
        .help(help)
    }
}

struct NotificationStack: View {
    let hud: HUDState
    let compact: Bool

    var body: some View {
        VStack(spacing: 4) {
            if let hint = hud.modeHint {
                Text(hint)
                    .font(.system(size: compact ? 11 : 13, weight: .semibold))
                    .foregroundColor(.black)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(Capsule().fill(Theme.gold))
            }
            ForEach(hud.notifications.suffix(compact ? 3 : 5)) { n in
                Text(n.text)
                    .font(.system(size: compact ? 11 : 13, weight: n.important ? .bold : .regular))
                    .foregroundColor(n.important ? Theme.gold : Theme.text)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(Capsule().fill(Theme.panel))
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: hud.notifications.map { $0.id })
        .allowsHitTesting(false)
    }
}

struct PlayerList: View {
    let players: [PlayerLine]

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            ForEach(players) { p in
                HStack(spacing: 6) {
                    Circle().fill(PlayerPalette.color(p.colorIndex)).frame(width: 9, height: 9)
                    Text(p.name).font(.caption.bold()).strikethrough(p.defeated)
                    Text(p.ageName).font(.caption2).foregroundColor(Theme.dim)
                    if p.isAlly && p.id != 0 { Text("🤝").font(.caption2) }
                }
                .foregroundColor(p.defeated ? Theme.dim : Theme.text)
            }
        }
        .panel(padding: 6)
        .allowsHitTesting(false)
    }
}

// MARK: - Minikarte

struct MinimapView: View {
    let controller: GameController
    let hud: HUDState
    let size: CGFloat

    var body: some View {
        ZStack(alignment: .topLeading) {
            if let img = controller.minimap {
                Image(decorative: img, scale: 1)
                    .interpolation(.none)
                    .resizable()
            } else {
                Color.black
            }
            let r = hud.cameraRect
            Rectangle()
                .stroke(Color.white, lineWidth: 1.2)
                .frame(width: max(4, r.width * size), height: max(4, r.height * size))
                .offset(x: r.minX * size, y: r.minY * size)
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.border, lineWidth: 1.5))
        .contentShape(Rectangle())
        .gesture(DragGesture(minimumDistance: 0).onChanged { v in
            let p = CGPoint(x: min(1, max(0, v.location.x / size)), y: min(1, max(0, v.location.y / size)))
            controller.minimapTapped(normalized: p)
        })
        .padding(3)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.panel))
    }
}

// MARK: - Auswahl

struct SelectionPanel: View {
    let controller: GameController
    let hud: HUDState
    let compact: Bool

    var body: some View {
        Group {
            if let s = hud.selection {
                VStack(alignment: .leading, spacing: compact ? 3 : 5) {
                    HStack(alignment: .top, spacing: 8) {
                        Text(s.icon)
                            .font(.system(size: compact ? 26 : 36))
                            .frame(width: compact ? 38 : 52, height: compact ? 38 : 52)
                            .background(RoundedRectangle(cornerRadius: 8).fill(PlayerPalette.color(s.colorIndex).opacity(0.35)))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(s.title)
                                .font(.system(size: compact ? 13 : 16, weight: .bold, design: .serif))
                                .foregroundColor(Theme.gold)
                                .lineLimit(1)
                            Text(s.subtitle)
                                .font(.system(size: compact ? 10 : 11))
                                .foregroundColor(Theme.dim)
                                .lineLimit(2)
                            if s.maxHP > 0 {
                                HStack(spacing: 4) {
                                    HPBar(fraction: s.hp / s.maxHP)
                                    Text("\(Int(s.hp))/\(Int(s.maxHP))")
                                        .font(.system(size: 9, design: .monospaced))
                                        .foregroundColor(Theme.dim)
                                        .fixedSize()
                                }
                            }
                        }
                    }
                    if !s.stats.isEmpty {
                        HStack(spacing: 8) {
                            ForEach(s.stats) { st in
                                VStack(spacing: 0) {
                                    Text(st.value).font(.system(size: compact ? 11 : 13, weight: .semibold, design: .rounded))
                                    Text(st.label).font(.system(size: 8)).foregroundColor(Theme.dim)
                                }
                            }
                        }
                        .foregroundColor(Theme.text)
                    }
                    if !s.groups.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 4) {
                                ForEach(s.groups) { g in
                                    HStack(spacing: 2) {
                                        Text(g.icon).font(.system(size: 16))
                                        Text("\(g.count)").font(.caption.bold()).foregroundColor(Theme.text)
                                    }
                                    .padding(4)
                                    .background(RoundedRectangle(cornerRadius: 6).fill(Theme.panelLight))
                                    .help(g.name)
                                }
                            }
                        }
                    }
                    if !s.queue.isEmpty {
                        HStack(spacing: 4) {
                            ForEach(s.queue) { q in
                                Button {
                                    controller.perform(.cancelQueue(q.id))
                                } label: {
                                    VStack(spacing: 1) {
                                        Text(q.icon).font(.system(size: 16))
                                        ProgressView(value: q.progress).tint(Theme.gold).frame(width: 26)
                                    }
                                    .padding(3)
                                    .background(RoundedRectangle(cornerRadius: 6).fill(Theme.panelLight))
                                }
                                .buttonStyle(.plain)
                                .help("\(q.title) – klicken zum Abbrechen")
                            }
                        }
                    }
                    if !compact && !s.description.isEmpty {
                        Text(s.description)
                            .font(.system(size: 10))
                            .foregroundColor(Theme.dim)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .panel(padding: compact ? 6 : 8)
            } else {
                EmptyView()
            }
        }
    }
}

struct CommandGrid: View {
    let controller: GameController
    let hud: HUDState
    let compact: Bool

    var body: some View {
        if !hud.commands.isEmpty {
            let cell: CGFloat = compact ? 50 : 66
            let columns = Array(repeating: GridItem(.fixed(cell), spacing: 4), count: compact ? 5 : 5)
            ScrollView(.vertical, showsIndicators: false) {
                LazyVGrid(columns: columns, spacing: 4) {
                    ForEach(hud.commands) { c in
                        CommandButtonView(command: c, size: cell) { controller.perform(c.action) }
                    }
                }
                .padding(4)
            }
            .frame(width: cell * 5 + 4 * 4 + 8, height: gridHeight(cell: cell))
            .background(RoundedRectangle(cornerRadius: 10).fill(Theme.panel))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.border))
        }
    }
}

extension CommandGrid {
    func gridHeight(cell: CGFloat) -> CGFloat {
        let rows = (hud.commands.count + 4) / 5
        let visibleRows = min(rows, compact ? 2 : 3)
        return CGFloat(visibleRows) * (cell + 4) + 8
    }
}

struct CommandButtonView: View {
    let command: CommandButton
    let size: CGFloat
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 1) {
                Text(command.icon).font(.system(size: size * 0.36))
                Text(command.title)
                    .font(.system(size: size < 60 ? 7.5 : 9, weight: .semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
                    .minimumScaleFactor(0.7)
                if !command.cost.isEmpty {
                    Text(command.cost)
                        .font(.system(size: size < 60 ? 6.5 : 8))
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                        .foregroundColor(Theme.dim)
                }
            }
            .foregroundColor(Theme.text)
            .frame(width: size, height: size)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(command.highlight ? Theme.gold.opacity(0.28) : Theme.panelLight)
            )
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(command.highlight ? Theme.gold : Color.white.opacity(0.08)))
            .overlay(alignment: .topTrailing) {
                if let b = command.badge {
                    Text(b)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.black)
                        .padding(3)
                        .background(Circle().fill(Theme.gold))
                        .offset(x: 3, y: -3)
                }
            }
            .opacity(command.enabled ? 1 : 0.4)
        }
        .buttonStyle(.plain)
        .help("\(command.title)\n\(command.cost)\n\(command.tooltip)")
    }
}

// MARK: - Doktrin

struct DoctrineChoiceView: View {
    let hud: HUDState
    let compact: Bool
    let onChoose: (DoctrineFocus) -> Void
    let onCollapse: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.45).ignoresSafeArea()
            VStack(spacing: compact ? 8 : 14) {
                VStack(spacing: 2) {
                    Text("Neue Epoche: \(Ages.info(hud.doctrineAge ?? 0).name)")
                        .font(.system(size: compact ? 18 : 26, weight: .bold, design: .serif))
                        .foregroundColor(Theme.gold)
                    Text("Wähle den Fokus deiner Zivilisation – er prägt deinen Technologiebaum dauerhaft.")
                        .font(.system(size: compact ? 11 : 13))
                        .foregroundColor(Theme.dim)
                        .multilineTextAlignment(.center)
                }
                HStack(alignment: .top, spacing: compact ? 8 : 14) {
                    ForEach(hud.doctrineOffers) { o in
                        Button {
                            onChoose(o.focus)
                        } label: {
                            VStack(spacing: compact ? 4 : 8) {
                                Text(o.focus.icon).font(.system(size: compact ? 28 : 40))
                                Text(o.focus.title)
                                    .font(.system(size: compact ? 10 : 12, weight: .semibold))
                                    .foregroundColor(Theme.focusColor(o.focus))
                                Text(o.name)
                                    .font(.system(size: compact ? 14 : 18, weight: .bold, design: .serif))
                                    .foregroundColor(Theme.text)
                                    .multilineTextAlignment(.center)
                                Text(o.description)
                                    .font(.system(size: compact ? 10 : 12))
                                    .foregroundColor(Theme.dim)
                                    .multilineTextAlignment(.center)
                                    .fixedSize(horizontal: false, vertical: true)
                                Spacer(minLength: 0)
                                if o.timesChosen > 0 {
                                    Text("Bisher \(o.timesChosen)× gewählt")
                                        .font(.system(size: 9))
                                        .foregroundColor(Theme.dim)
                                }
                            }
                            .padding(compact ? 8 : 14)
                            .frame(width: compact ? 170 : 220, height: compact ? 190 : 250)
                            .background(RoundedRectangle(cornerRadius: 14).fill(Theme.panel))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.focusColor(o.focus), lineWidth: 2))
                        }
                        .buttonStyle(.plain)
                    }
                }
                Button("Später entscheiden", action: onCollapse)
                    .buttonStyle(.plain)
                    .font(.caption)
                    .foregroundColor(Theme.dim)
            }
        }
    }
}

// MARK: - Pause & Ende

struct PauseMenuView: View {
    @ObservedObject var controller: GameController
    let hud: HUDState
    let onResume: () -> Void
    let onRestart: () -> Void
    let onExit: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.6).ignoresSafeArea()
            ScrollView {
                VStack(spacing: 12) {
                    Text("Pause")
                        .font(.system(size: 28, weight: .bold, design: .serif))
                        .foregroundColor(Theme.gold)
                    Picker("Spieltempo", selection: $controller.speed) {
                        Text("0,5×").tag(0.5)
                        Text("1×").tag(1.0)
                        Text("1,5×").tag(1.5)
                        Text("2×").tag(2.0)
                        Text("3×").tag(3.0)
                    }
                    .pickerStyle(.segmented)
                    .frame(maxWidth: 320)
                    MenuButton(title: "Weiterspielen", icon: "play.fill", action: onResume)
                    MenuButton(title: "Neu starten", icon: "arrow.clockwise", action: onRestart)
                    MenuButton(title: "Hauptmenü", icon: "house.fill", action: onExit)
                    if !hud.perkNames.isEmpty {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Gewählte Doktrinen").font(.headline).foregroundColor(Theme.gold)
                            ForEach(hud.perkNames, id: \.self) { Text($0).font(.caption).foregroundColor(Theme.text) }
                        }
                        .frame(maxWidth: 320, alignment: .leading)
                        .panel()
                    }
                    ControlsHelp(touch: controller.isTouch)
                        .frame(maxWidth: 420)
                }
                .padding(24)
                .frame(maxWidth: .infinity)
            }
        }
    }
}

struct MenuButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundColor(.black)
                .frame(width: 240, height: 40)
                .background(RoundedRectangle(cornerRadius: 10).fill(Theme.gold))
        }
        .buttonStyle(.plain)
    }
}

struct ControlsHelp: View {
    let touch: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Steuerung").font(.headline).foregroundColor(Theme.gold)
            Group {
                if touch {
                    Text("• Tippen: Einheit/Gebäude auswählen")
                    Text("• Mit Auswahl auf Boden/Ziel tippen: Bewegen, Angreifen, Sammeln, Bauen")
                    Text("• Doppeltippen: alle Einheiten dieses Typs auswählen")
                    Text("• Gedrückt halten & ziehen: Rahmenauswahl")
                    Text("• Wischen: Karte bewegen · Zwei Finger kneifen: Zoom")
                    Text("• Minikarte antippen: Kamera springen")
                } else {
                    Text("• Linksklick: auswählen · Ziehen: Rahmenauswahl · Shift: hinzufügen")
                    Text("• Doppelklick: alle Einheiten dieses Typs")
                    Text("• Rechtsklick (oder Ctrl-Klick): Bewegen, Angreifen, Sammeln, Bauen, Sammelpunkt")
                    Text("• WASD/Pfeiltasten: Kamera · Mausrad/Pinch: Zoom · Trackpad: scrollen")
                    Text("• . untätiger Arbeiter · H Stadtzentrum · M Armee · E Epochensprung")
                    Text("• Q Angriffsbewegung · X Halt · Entf entlassen · Leertaste Pause · J zum Angriff springen")
                }
            }
            .font(.caption)
            .foregroundColor(Theme.text)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .panel()
    }
}

struct EndGameView: View {
    let result: GameResult
    let hud: HUDState
    let onRestart: () -> Void
    let onExit: () -> Void

    private var isVictory: Bool {
        if case .victory = result { return true }
        return false
    }

    private var reason: String {
        switch result {
        case .victory(let r), .defeat(let r): return r
        }
    }

    var body: some View {
        ZStack {
            Color.black.opacity(0.7).ignoresSafeArea()
            VStack(spacing: 14) {
                Text(isVictory ? "🏆" : "💀").font(.system(size: 60))
                Text(isVictory ? "Sieg!" : "Niederlage")
                    .font(.system(size: 40, weight: .heavy, design: .serif))
                    .foregroundColor(isVictory ? Theme.gold : .red)
                Text(reason).font(.headline).foregroundColor(Theme.text).multilineTextAlignment(.center)
                Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 4) {
                    GridRow { Text("Spielzeit"); Text(hud.timeText).bold() }
                    GridRow { Text("Erreichte Epoche"); Text(hud.ageName).bold() }
                    GridRow { Text("Einheiten ausgebildet"); Text("\(hud.stats.unitsTrained)").bold() }
                    GridRow { Text("Feinde besiegt"); Text("\(hud.stats.unitsKilled)").bold() }
                    GridRow { Text("Verluste"); Text("\(hud.stats.unitsLost)").bold() }
                    GridRow { Text("Gebäude zerstört"); Text("\(hud.stats.buildingsDestroyed)").bold() }
                    GridRow { Text("Rohstoffe gesammelt"); Text("\(Int(hud.stats.resourcesGathered))").bold() }
                }
                .font(.subheadline)
                .foregroundColor(Theme.text)
                .panel(padding: 14)
                HStack(spacing: 12) {
                    MenuButton(title: "Nochmal", icon: "arrow.clockwise", action: onRestart)
                    MenuButton(title: "Hauptmenü", icon: "house.fill", action: onExit)
                }
            }
            .padding()
        }
    }
}
