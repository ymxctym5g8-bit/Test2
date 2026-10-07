import SwiftUI
import SceneKit

struct SceneContainer: UIViewRepresentable {
    let coordinator: GameCoordinator

    func makeUIView(context: Context) -> SCNView { coordinator.view }
    func updateUIView(_ uiView: SCNView, context: Context) {}
}

enum Ink {
    static let text = Color(red: 0.32, green: 0.24, blue: 0.3)
    static let soft = Color(red: 0.32, green: 0.24, blue: 0.3).opacity(0.65)
    static let paper = Color(red: 1, green: 0.97, blue: 0.92)
    static let accent = Color(red: 0.86, green: 0.36, blue: 0.3)
    /// Neko no Machi: Tiefblau des Himmels und Postkasten-Rot
    static let nekoBlue = Color(red: 0.16, green: 0.3, blue: 0.52)
    static let nekoRed = Color(red: 0.85, green: 0.24, blue: 0.2)
}

let romanNumerals = ["I", "II", "III", "IV", "V", "VI"]

struct GameScreen: View {
    @StateObject private var game: GameCoordinator
    let unlocked: Set<Int>
    let onRestart: () -> Void
    let onSelect: (Int) -> Void
    let onCompleted: (Int) -> Void

    init(levelIndex: Int, unlocked: Set<Int>, onRestart: @escaping () -> Void,
         onSelect: @escaping (Int) -> Void, onCompleted: @escaping (Int) -> Void) {
        _game = StateObject(wrappedValue: GameCoordinator(levelIndex: levelIndex))
        self.unlocked = unlocked
        self.onRestart = onRestart
        self.onSelect = onSelect
        self.onCompleted = onCompleted
    }

    var body: some View {
        GeometryReader { geo in
            ZStack {
                SceneContainer(coordinator: game)
                    .ignoresSafeArea()
                    .onAppear { game.layout(size: geo.size) }
                    .onChange(of: geo.size) { _, newSize in game.layout(size: newSize) }

                StoryText(text: game.story, night: game.isNight)
                    .padding(.top, geo.safeAreaInsets.top + 54)
                    .frame(maxHeight: .infinity, alignment: .top)
                    .allowsHitTesting(false)

                if game.phase == .playing || game.phase == .ending {
                    VStack {
                        HStack {
                            if game.sushiTotal > 0 {
                                SushiCounter(count: game.sushiCount, total: game.sushiTotal)
                            }
                            Spacer()
                            Button {
                                game.menuOpen = true
                            } label: {
                                Image(systemName: "circle.grid.cross")
                                    .font(.system(size: 18, weight: .light))
                                    .foregroundColor(game.isNight ? Ink.paper : Ink.text)
                                    .frame(width: 44, height: 44)
                                    .background(Circle().fill(Ink.paper.opacity(0.55)))
                            }
                            .accessibilityLabel("Menü")
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 6)
                }

                if game.phase == .title {
                    TitleOverlay(chapter: game.chapterTitle, current: game.levelIndex, unlocked: unlocked,
                                 onSelect: onSelect) {
                        withAnimation(.easeInOut(duration: 1.2)) { game.startGame() }
                    }
                    .transition(.opacity)
                }

                if game.menuOpen {
                    MenuOverlay(soundOn: $game.soundOn, neko: game.isNeko,
                                onResume: { game.menuOpen = false },
                                onRestart: onRestart)
                        .transition(.opacity)
                }

                if game.phase == .finished {
                    EndOverlay(level: game.levelIndex, sushi: game.sushiCount, sushiTotal: game.sushiTotal,
                               onReplay: onRestart, onSelect: onSelect)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.8), value: game.phase)
            .onChange(of: game.phase) { _, phase in
                if phase == .finished { onCompleted(game.levelIndex) }
            }
            .animation(.easeInOut(duration: 0.3), value: game.menuOpen)
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
    }
}

struct StoryText: View {
    let text: String?
    var night = false

    var body: some View {
        ZStack {
            if let t = text {
                Text(t)
                    .font(.system(size: 19, weight: .regular, design: .serif))
                    .italic()
                    .foregroundColor(night ? Ink.paper : Ink.text)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 34)
                    .shadow(color: night ? Color(red: 0.08, green: 0.08, blue: 0.2).opacity(0.9) : .white.opacity(0.9), radius: 6)
                    .id(t)
                    .transition(.opacity.combined(with: .offset(y: 6)))
            }
        }
        .animation(.easeInOut(duration: 1.1), value: text)
    }
}

struct TitleOverlay: View {
    let chapter: String
    let current: Int
    let unlocked: Set<Int>
    let onSelect: (Int) -> Void
    let onStart: () -> Void
    @State private var pulse = false

    private var world: GameWorld { GameWorld.of(level: current) }
    private var neko: Bool { world.id == "neko" }
    private var ink: Color { neko ? Ink.nekoBlue : Ink.text }
    private var accent: Color { neko ? Ink.nekoRed : Ink.accent }

    private var chapterParts: (String, String) {
        let parts = chapter.components(separatedBy: " · ")
        return (parts.first ?? chapter, parts.count > 1 ? parts[1] : "")
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [Ink.paper.opacity(0.75), Ink.paper.opacity(0.15), .clear, Ink.paper.opacity(0.45)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            VStack(spacing: 14) {
                Spacer().frame(height: 70)
                Text(world.title)
                    .font(.system(size: neko ? 44 : 50, weight: neko ? .bold : .light, design: neko ? .rounded : .serif))
                    .foregroundColor(ink)
                    .shadow(color: .white, radius: 10)
                if neko {
                    Text("猫の町")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundColor(accent)
                }
                Rectangle()
                    .fill(accent.opacity(0.7))
                    .frame(width: 46, height: 1.5)
                Text(chapterParts.0)
                    .font(.system(size: 14, weight: .regular, design: neko ? .rounded : .serif))
                    .foregroundColor(ink.opacity(0.65))
                Text(chapterParts.1)
                    .font(.system(size: 19, weight: neko ? .semibold : .regular, design: neko ? .rounded : .serif))
                    .italic(!neko)
                    .foregroundColor(ink)
                    .multilineTextAlignment(.center)
                Spacer()
                VStack(spacing: 10) {
                    ForEach(GameWorld.all) { w in
                        worldRow(w)
                    }
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Ink.paper.opacity(0.7)))
                Text("Tippe, um zu beginnen")
                    .font(.system(size: 15, weight: .regular, design: neko ? .rounded : .serif))
                    .foregroundColor(ink)
                    .opacity(pulse ? 0.9 : 0.35)
                    .padding(.top, 14)
                    .padding(.bottom, 46)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onStart)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever()) { pulse = true }
        }
    }

    private func worldRow(_ w: GameWorld) -> some View {
        let isNeko = w.id == "neko"
        let rowInk = isNeko ? Ink.nekoBlue : Ink.text
        let rowAccent = isNeko ? Ink.nekoRed : Ink.accent
        return HStack(spacing: 12) {
            Text(w.title)
                .font(.system(size: 14, weight: .semibold, design: isNeko ? .rounded : .serif))
                .foregroundColor(rowInk)
                .frame(width: 112, alignment: .leading)
            ForEach(Array(w.levels), id: \.self) { i in
                Button {
                    if i != current { onSelect(i) }
                } label: {
                    Text(romanNumerals[w.chapter(of: i) - 1])
                        .font(.system(size: 15, weight: i == current ? .semibold : .regular, design: isNeko ? .rounded : .serif))
                        .foregroundColor(unlocked.contains(i) ? rowInk : rowInk.opacity(0.25))
                        .frame(width: 40, height: 40)
                        .background(Circle().stroke(i == current ? rowAccent : rowInk.opacity(0.25), lineWidth: i == current ? 1.5 : 1))
                }
                .disabled(!unlocked.contains(i))
                .accessibilityLabel("\(w.title), Kapitel \(w.chapter(of: i))")
            }
        }
    }
}

struct SushiCounter: View {
    let count: Int
    let total: Int

    var body: some View {
        HStack(spacing: 6) {
            Text("🍣")
                .font(.system(size: 16))
            Text("\(count) / \(total)")
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundColor(Ink.nekoBlue)
                .monospacedDigit()
        }
        .padding(.horizontal, 12)
        .frame(height: 36)
        .background(Capsule().fill(Ink.paper.opacity(0.7)))
        .scaleEffect(count == total ? 1.08 : 1)
        .animation(.spring(response: 0.3, dampingFraction: 0.5), value: count)
        .accessibilityLabel("Sushi \(count) von \(total)")
    }
}

struct MenuOverlay: View {
    @Binding var soundOn: Bool
    var neko = false
    let onResume: () -> Void
    let onRestart: () -> Void

    var body: some View {
        ZStack {
            Ink.paper.opacity(0.82)
                .ignoresSafeArea()
                .onTapGesture(perform: onResume)
            VStack(spacing: 26) {
                Text("Innehalten")
                    .font(.system(size: 32, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                VStack(alignment: .leading, spacing: 10) {
                    if neko {
                        hint("pawprint", "Tippe auf einen Weg, und Mochi tapst dorthin.")
                        hint("arrow.triangle.2.circlepath", "Ziehe an goldenen Kurbeln und Griffen, um die Stadt zu bewegen.")
                        hint("eye", "Was für das Auge verbunden ist, ist auch begehbar.")
                        hint("bird", "Warte einen Moment – der Spatz zeigt dir den Weg.")
                        hint("fork.knife", "Sammle unterwegs das Sushi ein.")
                    } else {
                        hint("hand.tap", "Tippe auf einen Weg, und Hana geht dorthin.")
                        hint("arrow.triangle.2.circlepath", "Ziehe an goldenen Kurbeln und Griffen, um die Welt zu bewegen.")
                        hint("eye", "Was für das Auge verbunden ist, ist auch begehbar.")
                        hint("leaf", "Warte einen Moment – Kiko zeigt dir den Weg.")
                    }
                }
                .padding(.horizontal, 30)
                menuButton(soundOn ? "Klang: an" : "Klang: aus", icon: soundOn ? "speaker.wave.2" : "speaker.slash") {
                    soundOn.toggle()
                }
                menuButton("Kapitel neu beginnen", icon: "arrow.counterclockwise", action: onRestart)
                menuButton("Weiter", icon: "play", action: onResume)
            }
        }
    }

    private func hint(_ icon: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon).frame(width: 22).foregroundColor(Ink.accent)
            Text(text).font(.system(size: 15, design: .serif)).foregroundColor(Ink.text)
        }
    }

    private func menuButton(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.system(size: 17, weight: .regular, design: .serif))
                .foregroundColor(Ink.text)
                .frame(width: 250, height: 48)
                .background(Capsule().stroke(Ink.text.opacity(0.35), lineWidth: 1))
        }
    }
}

struct EndOverlay: View {
    let level: Int
    let sushi: Int
    let sushiTotal: Int
    let onReplay: () -> Void
    let onSelect: (Int) -> Void
    @State private var appear = false

    private var world: GameWorld { GameWorld.of(level: level) }
    private var neko: Bool { world.id == "neko" }
    private var isLast: Bool { level >= world.levels.upperBound }
    private var roman: String { romanNumerals[world.chapter(of: level) - 1] }
    private var nextRoman: String { romanNumerals[min(world.chapter(of: level), romanNumerals.count - 1)] }
    private var otherWorld: GameWorld { GameWorld.all.first { $0.id != world.id } ?? world }
    private var ink: Color { neko ? Ink.nekoBlue : Ink.text }
    private var accent: Color { neko ? Ink.nekoRed : Ink.accent }
    private var design: Font.Design { neko ? .rounded : .serif }

    private var message: String {
        switch (neko, isLast) {
        case (false, false): return "Der Wald erwacht. Doch hinter den Wolken\nwarten noch viele stille Türme."
        case (false, true): return "Alle Samen ruhen in der Erde.\nDer Wald wird sich an dich erinnern."
        case (true, false): return "Das Glöckchen klingt. Irgendwo hinter\nden Hügeln wartet schon das nächste."
        case (true, true): return "Alle Glöckchen läuten über dem See.\nMochi ist angekommen."
        }
    }

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 12) {
                Text("Kapitel \(roman) abgeschlossen")
                    .font(.system(size: 28, weight: neko ? .semibold : .light, design: design))
                    .foregroundColor(ink)
                Text(message)
                    .font(.system(size: 15, design: design))
                    .italic(!neko)
                    .multilineTextAlignment(.center)
                    .foregroundColor(ink.opacity(0.65))
                if sushiTotal > 0 {
                    Text(sushi == sushiTotal ? "🍣 Alles Sushi gefunden – \(sushi) / \(sushiTotal)" : "🍣 \(sushi) / \(sushiTotal) Sushi gefunden")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundColor(ink)
                }
                if !isLast {
                    Button { onSelect(level + 1) } label: {
                        Label("Weiter zu Kapitel \(nextRoman)", systemImage: "arrow.right")
                            .font(.system(size: 16, weight: .semibold, design: design))
                            .foregroundColor(Ink.paper)
                            .frame(width: 250, height: 46)
                            .background(Capsule().fill(accent.opacity(0.9)))
                    }
                    .padding(.top, 8)
                } else {
                    Button { onSelect(otherWorld.levels.lowerBound) } label: {
                        Label("Zu \(otherWorld.title)", systemImage: "arrow.right")
                            .font(.system(size: 16, weight: .semibold, design: design))
                            .foregroundColor(Ink.paper)
                            .frame(width: 250, height: 46)
                            .background(Capsule().fill(accent.opacity(0.9)))
                    }
                    .padding(.top, 8)
                }
                Button(action: isLast ? { onSelect(world.levels.lowerBound) } : onReplay) {
                    Label(isLast ? "Von vorn beginnen" : "Noch einmal", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 16, design: design))
                        .foregroundColor(ink)
                        .frame(width: 250, height: 44)
                        .background(Capsule().stroke(ink.opacity(0.35)))
                }
            }
            .padding(26)
            .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Ink.paper.opacity(0.88)))
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
            .opacity(appear ? 1 : 0)
            .offset(y: appear ? 0 : 20)
        }
        .onAppear { withAnimation(.easeOut(duration: 1.2)) { appear = true } }
    }
}
