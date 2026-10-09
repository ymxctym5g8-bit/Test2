import SwiftUI

/// Hauptmenü: lebendige Kulisse im Look des Kapitels, in dem die Reise weitergeht.
struct MainMenu: View {
    let onPlay: (Int) -> Void
    @EnvironmentObject private var progress: ChapterProgress
    @EnvironmentObject private var store: Store
    @AppStorage(GameSettings.soundKey) private var soundOn = true
    @State private var sheet: Sheet?
    @State private var appear = false

    enum Sheet: Identifiable {
        case chapters, store, settings
        var id: Self { self }
    }

    private var featured: Int { progress.continueChapter }

    var body: some View {
        let theme = MenuScenery.theme(for: featured)
        let night = theme.night
        let ink = night ? Ink.paper : Ink.text
        GeometryReader { geo in
            ZStack {
                MenuScenery(theme: theme)
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Text("Echoes")
                            .font(.system(size: 58, weight: .light, design: .serif))
                        Text("of the Sky")
                            .font(.system(size: 30, weight: .light, design: .serif))
                            .italic()
                        Rectangle().fill(Ink.accent.opacity(0.75)).frame(width: 52, height: 1.5).padding(.vertical, 8)
                        Text(Catalog.tagline)
                            .font(.system(size: 14, design: .serif))
                            .italic()
                            .opacity(0.75)
                    }
                    .foregroundColor(ink)
                    .shadow(color: night ? .black.opacity(0.45) : .white.opacity(0.9), radius: 12)
                    .padding(.top, geo.safeAreaInsets.top + 36)
                    .offset(y: appear ? 0 : -14)

                    Spacer()

                    VStack(spacing: 14) {
                        continueButton
                        HStack(spacing: 12) {
                            secondary("Chapters", icon: "book", ink: ink, night: night) { sheet = .chapters }
                            secondary("Settings", icon: "gearshape", ink: ink, night: night) { sheet = .settings }
                        }
                        if !store.unlocked {
                            Button { sheet = .store } label: {
                                Label("Unlock the Full Journey\(store.price.map { " · \($0)" } ?? "")", systemImage: "sparkles")
                                    .font(.system(size: 15, weight: .semibold, design: .serif))
                                    .foregroundColor(night ? Ink.gold : Color(red: 0.62, green: 0.42, blue: 0.16))
                                    .frame(width: 292, height: 46)
                                    .background(Capsule().fill((night ? Color.black : Ink.paper).opacity(0.35)))
                                    .overlay(Capsule().stroke(Ink.gold.opacity(0.85), lineWidth: 1.3))
                            }
                        }
                        Text("\(progress.completed.count) of \(Catalog.count) chapters")
                            .font(.system(size: 13, design: .serif))
                            .foregroundColor(ink.opacity(0.7))
                            .padding(.top, 2)
                    }
                    .padding(.bottom, geo.safeAreaInsets.bottom + 30)
                    .offset(y: appear ? 0 : 24)
                }
                .opacity(appear ? 1 : 0)
            }
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .onAppear {
            withAnimation(.easeOut(duration: 1.4).delay(0.2)) { appear = true }
            let audio = SoundEngine.shared
            audio.start()
            audio.enabled = soundOn
            audio.playMusic(theme: theme.song)
        }
        .onChange(of: soundOn) { _, on in SoundEngine.shared.enabled = on }
        .sheet(item: $sheet) { which in
            switch which {
            case .chapters:
                ChapterSelect(current: featured, onSelect: { n in
                    sheet = nil
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { onPlay(n) }
                }, onStore: { switchSheet(to: .store) })
                .environmentObject(progress)
                .environmentObject(store)
            case .store:
                StoreView().environmentObject(store)
            case .settings:
                SettingsView().environmentObject(progress).environmentObject(store)
            }
        }
    }

    private var continueButton: some View {
        let n = featured
        let owned = store.owns(chapter: n)
        return Button {
            if owned { onPlay(n) } else { sheet = .store }
        } label: {
            VStack(spacing: 3) {
                Text(progress.finishedAll ? "Play Again" : (progress.started ? "Continue" : "Begin the Journey"))
                    .font(.system(size: 19, weight: .semibold, design: .serif))
                Text("Chapter \(Catalog.roman(n)) · \(Catalog.chapter(n).title)")
                    .font(.system(size: 13, design: .serif))
                    .italic()
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                    .opacity(0.9)
            }
            .foregroundColor(Ink.paper)
            .padding(.horizontal, 20)
            .frame(width: 292, height: 64)
            .background(Capsule().fill(Ink.accent.opacity(0.92)))
            .shadow(color: Ink.accent.opacity(0.35), radius: 12, y: 4)
        }
        .accessibilityHint(owned ? "Starts the chapter" : "Opens the store")
    }

    private func secondary(_ title: String, icon: String, ink: Color, night: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.system(size: 15, design: .serif))
                .foregroundColor(ink)
                .frame(width: 140, height: 46)
                .background(Capsule().fill((night ? Color.black : Ink.paper).opacity(night ? 0.3 : 0.6)))
                .overlay(Capsule().stroke(ink.opacity(0.25)))
        }
    }

    private func switchSheet(to next: Sheet) {
        sheet = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { sheet = next }
    }
}

// MARK: - Kulisse

/// Himmel, gemalte Ferne, ziehende Wolken, eine schwebende Insel und Lichtteilchen –
/// alles in den Farben eines Kapitels.
struct MenuScenery: View {
    let theme: Theme

    @MainActor private static var themeCache: [Int: Theme] = [:]
    @MainActor private static var imageCache: [String: (UIImage, UIImage)] = [:]

    @MainActor static func theme(for chapter: Int) -> Theme {
        if let t = themeCache[chapter] { return t }
        let t = Theme.named(LevelDef.load("level\(chapter)").theme)
        themeCache[chapter] = t
        return t
    }

    @MainActor private var images: (UIImage, UIImage) {
        if let i = Self.imageCache[theme.name] { return i }
        let i = (Art.skyGradient(theme), Art.backdrop(theme.backdrop, theme: theme))
        Self.imageCache[theme.name] = i
        return i
    }

    var body: some View {
        let (sky, far) = images
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                Image(uiImage: sky).resizable()
                RadialGradient(colors: [Color(uiColor: theme.sun).opacity(theme.night ? 0.35 : 0.7), .clear],
                               center: UnitPoint(x: 0.78, y: 0.16), startRadius: 4, endRadius: geo.size.width * 0.7)
                Image(uiImage: far)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height * 0.42)
                    .clipped()
                    .opacity(0.9)
                TimelineView(.animation) { timeline in
                    Canvas { gc, size in
                        let t = timeline.date.timeIntervalSinceReferenceDate
                        drawClouds(&gc, size: size, t: t)
                        drawIsland(&gc, size: size, t: t)
                        drawMotes(&gc, size: size, t: t)
                    }
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }

    // MARK: Wolken

    private func drawClouds(_ gc: inout GraphicsContext, size: CGSize, t: Double) {
        let light = Color(uiColor: theme.cloudLight), shadow = Color(uiColor: theme.cloudShadow)
        let warm = Color(uiColor: theme.cloudWarmShadow)
        let clouds: [(y: CGFloat, w: CGFloat, speed: Double, offset: Double, warm: Bool)] = [
            (0.13, 0.55, 6, 0, false), (0.27, 0.42, 9, 260, true), (0.40, 0.5, 5, 520, false),
            (0.86, 0.9, 4, 120, true), (0.95, 1.1, 3, 640, false),
        ]
        for (k, c) in clouds.enumerated() {
            let w = size.width * c.w
            let span = size.width + w * 1.2
            let x = CGFloat((c.offset + t * c.speed).truncatingRemainder(dividingBy: Double(span))) - w * 0.6
            let y = size.height * c.y
            for (layer, col, dy) in [(0, c.warm ? warm : shadow, 0.16), (1, light, -0.06)] as [(Int, Color, CGFloat)] {
                var rng = SystemRandomLike(seed: UInt64(k * 31 + 7))
                for i in 0..<7 {
                    let f = CGFloat(i) / 6
                    let mid = 1 - abs(f - 0.5) * 2
                    let r = w * (0.09 + 0.07 * mid + 0.03 * CGFloat(rng.next()))
                    let cx = x + w * (0.1 + 0.8 * f)
                    let cy = y - r * 0.5 - mid * w * 0.05 + r * dy
                    let rr = layer == 0 ? r : r * 0.88
                    gc.fill(Path(ellipseIn: CGRect(x: cx - rr, y: cy - rr, width: rr * 2, height: rr * 2)),
                            with: .color(col.opacity(0.95)))
                }
            }
        }
    }

    // MARK: Insel

    private func drawIsland(_ gc: inout GraphicsContext, size: CGSize, t: Double) {
        let s = min(size.width * 0.07, 30)
        let center = CGPoint(x: size.width * 0.5, y: size.height * 0.5 + CGFloat(sin(t * 0.55)) * 7)
        func p(_ x: CGFloat, _ y: CGFloat, _ z: CGFloat) -> CGPoint {
            CGPoint(x: center.x + (x - y) * s * 0.866, y: center.y + (x + y) * s * 0.5 - z * s)
        }
        let grass = theme.colors("grass"), rock = theme.colors("rock"), dark = theme.colors("rockdark")
        let stone = theme.colors("stone")
        var cubes: [(Int, Int, Int, MaterialColors)] = []
        for i in -2...1 { for j in -2...1 where !((i == -2 || i == 1) && (j == -2 || j == 1)) { cubes.append((i, j, 0, grass)) } }
        cubes.append((-2, -2, 1, stone))
        for (i, j) in [(-1, -1), (0, -1), (-1, 0), (0, 0), (1, 0), (0, 1), (-2, -1)] { cubes.append((i, j, -1, rock)) }
        for (i, j) in [(-1, -1), (0, 0), (0, -1)] { cubes.append((i, j, -2, rock)) }
        cubes.append((0, 0, -3, dark)); cubes.append((0, 0, -4, dark))
        cubes.sort { ($0.2, $0.0 + $0.1) < ($1.2, $1.0 + $1.1) }

        // Wasserfall hinter der Insel
        let fallTop = p(1.5, -0.6, 0.2)
        let fall = CGRect(x: fallTop.x - s * 0.12, y: fallTop.y, width: s * 0.24, height: s * 4.2)
        gc.fill(Path(roundedRect: fall, cornerRadius: s * 0.1),
                with: .linearGradient(Gradient(colors: [.white.opacity(0.85), .white.opacity(0)]),
                                      startPoint: CGPoint(x: fall.midX, y: fall.minY), endPoint: CGPoint(x: fall.midX, y: fall.maxY)))

        for (i0, j0, k0, m) in cubes {
            let i = CGFloat(i0), j = CGFloat(j0), k = CGFloat(k0)
            let top = Path { $0.addLines([p(i, j, k + 1), p(i + 1, j, k + 1), p(i + 1, j + 1, k + 1), p(i, j + 1, k + 1)]); $0.closeSubpath() }
            let right = Path { $0.addLines([p(i + 1, j, k + 1), p(i + 1, j + 1, k + 1), p(i + 1, j + 1, k), p(i + 1, j, k)]); $0.closeSubpath() }
            let left = Path { $0.addLines([p(i, j + 1, k + 1), p(i + 1, j + 1, k + 1), p(i + 1, j + 1, k), p(i, j + 1, k)]); $0.closeSubpath() }
            gc.fill(right, with: .color(Color(uiColor: m.side.multiplied(0.86))))
            gc.fill(left, with: .color(Color(uiColor: m.side.multiplied(0.7))))
            gc.fill(top, with: .color(Color(uiColor: m.top)))
        }

        // Baum auf der Insel
        let base = p(0.5, 0.5, 1)
        gc.fill(Path(roundedRect: CGRect(x: base.x - s * 0.07, y: base.y - s * 0.9, width: s * 0.14, height: s * 0.9), cornerRadius: 2),
                with: .color(Color(red: 0.45, green: 0.32, blue: 0.24)))
        let leaf = Color(uiColor: grass.top.multiplied(1.08))
        let sway = CGFloat(sin(t * 0.8)) * s * 0.04
        for (dx, dy, r, f) in [(-0.32, -1.0, 0.42, 0.85), (0.3, -1.05, 0.4, 0.9), (0, -1.38, 0.5, 1.0), (0.05, -1.0, 0.36, 1.1)] as [(CGFloat, CGFloat, CGFloat, Double)] {
            let c = CGPoint(x: base.x + dx * s + sway, y: base.y + dy * s)
            gc.fill(Path(ellipseIn: CGRect(x: c.x - r * s, y: c.y - r * s, width: r * s * 2, height: r * s * 2)),
                    with: .color(leaf.opacity(f > 1 ? 0.65 : 1)))
        }
        // Torbogen auf dem Steinsockel
        let gate = p(-1.5, -1.5, 2)
        gc.fill(Path(CGRect(x: gate.x - s * 0.36, y: gate.y - s * 0.62, width: s * 0.72, height: s * 0.1)), with: .color(Ink.accent))
        for dx in [-0.25, 0.21] as [CGFloat] {
            gc.fill(Path(CGRect(x: gate.x + dx * s, y: gate.y - s * 0.55, width: s * 0.06, height: s * 0.55)), with: .color(Ink.accent))
        }

        // Kiko schwebt neben der Insel
        let kiko = CGPoint(x: center.x + s * 2.4 + CGFloat(cos(t * 0.7)) * s * 0.3, y: center.y - s * 2.2 + CGFloat(sin(t * 1.1)) * s * 0.25)
        gc.fill(Path(ellipseIn: CGRect(x: kiko.x - s * 0.7, y: kiko.y - s * 0.7, width: s * 1.4, height: s * 1.4)),
                with: .radialGradient(Gradient(colors: [.white.opacity(0.6), .white.opacity(0)]), center: kiko, startRadius: 0, endRadius: s * 0.7))
        gc.fill(Path(ellipseIn: CGRect(x: kiko.x - s * 0.17, y: kiko.y - s * 0.15, width: s * 0.34, height: s * 0.3)), with: .color(.white))
        for dx in [-0.06, 0.06] as [CGFloat] {
            gc.fill(Path(ellipseIn: CGRect(x: kiko.x + dx * s - s * 0.025, y: kiko.y - s * 0.04, width: s * 0.05, height: s * 0.05)),
                    with: .color(Color(red: 0.15, green: 0.12, blue: 0.16)))
        }
    }

    // MARK: Lichtteilchen

    private func drawMotes(_ gc: inout GraphicsContext, size: CGSize, t: Double) {
        var rng = SystemRandomLike(seed: 99)
        let col: Color = theme.night ? Color(red: 0.8, green: 1, blue: 0.85) : Color(red: 1, green: 0.96, blue: 0.86)
        for _ in 0..<34 {
            let x0 = rng.next(), speed = 0.006 + 0.01 * rng.next(), phase = rng.next()
            let y = 1 - (phase + t * speed).truncatingRemainder(dividingBy: 1)
            let x = x0 + 0.03 * sin(t * 0.4 + phase * 10)
            let r = CGFloat(1.2 + 2.2 * rng.next())
            let a = 0.35 + 0.5 * (0.5 + 0.5 * sin(t * 1.3 + phase * 20))
            let c = CGPoint(x: CGFloat(x) * size.width, y: CGFloat(y) * size.height)
            gc.fill(Path(ellipseIn: CGRect(x: c.x - r * 3, y: c.y - r * 3, width: r * 6, height: r * 6)),
                    with: .radialGradient(Gradient(colors: [col.opacity(a * 0.5), col.opacity(0)]), center: c, startRadius: 0, endRadius: r * 3))
            gc.fill(Path(ellipseIn: CGRect(x: c.x - r * 0.6, y: c.y - r * 0.6, width: r * 1.2, height: r * 1.2)), with: .color(col.opacity(a)))
        }
    }
}

/// Kleiner deterministischer Zufall, damit die Kulisse in jedem Bild gleich aussieht.
private struct SystemRandomLike {
    private var state: UInt64
    init(seed: UInt64) { state = seed &* 0x9E3779B97F4A7C15 | 1 }
    mutating func next() -> Double {
        state ^= state << 13; state ^= state >> 7; state ^= state << 17
        return Double(state % 10_000) / 10_000
    }
}

// MARK: - Einstellungen

struct SettingsView: View {
    @EnvironmentObject private var progress: ChapterProgress
    @EnvironmentObject private var store: Store
    @Environment(\.dismiss) private var dismiss
    @AppStorage(GameSettings.soundKey) private var soundOn = true
    @AppStorage(GameSettings.hapticsKey) private var hapticsOn = true
    @State private var confirmReset = false

    private var version: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(v) (\(b))"
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Sound & Feel") {
                    Toggle(isOn: $soundOn) { Label("Music & Sound", systemImage: "music.note") }
                    Toggle(isOn: $hapticsOn) { Label("Haptics", systemImage: "hand.tap") }
                }
                Section("The Full Journey") {
                    HStack {
                        Label(store.unlocked ? "Unlocked" : "Prologue only", systemImage: store.unlocked ? "checkmark.seal" : "lock")
                        Spacer()
                        if !store.unlocked, let price = store.price { Text(price).foregroundColor(.secondary) }
                    }
                    Button("Restore Purchase") { Task { await store.restore() } }
                }
                Section("Progress") {
                    Text("\(progress.completed.count) of \(Catalog.count) chapters complete")
                    Button("Start a New Journey", role: .destructive) { confirmReset = true }
                }
                Section("About") {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(Catalog.appName).font(.system(size: 17, weight: .semibold, design: .serif))
                        Text("A calm puzzle journey above the clouds. No enemies, no timers – only paths that appear when you look at the world differently.")
                            .font(.system(size: 14, design: .serif))
                            .foregroundColor(.secondary)
                        Text("Version \(version)").font(.footnote).foregroundColor(.secondary)
                    }
                    .padding(.vertical, 4)
                }
            }
            .scrollContentBackground(.hidden)
            .background(Ink.paper.ignoresSafeArea())
            .tint(Ink.accent)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }.foregroundColor(Ink.text)
                }
            }
            .confirmationDialog("Start a new journey?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Erase Progress", role: .destructive) { progress.reset() }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("All completed chapters will be forgotten. Your purchase stays.")
            }
            .alert(Catalog.appName, isPresented: Binding(get: { store.message != nil }, set: { if !$0 { store.message = nil } })) {
                Button("OK") { store.message = nil }
            } message: {
                Text(store.message ?? "")
            }
            .onChange(of: soundOn) { _, on in SoundEngine.shared.enabled = on }
        }
    }
}
