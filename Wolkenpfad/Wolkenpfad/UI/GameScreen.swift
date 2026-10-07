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
}

struct GameScreen: View {
    @StateObject private var game: GameCoordinator
    let unlocked: Int
    let levelCount: Int
    let onRestart: () -> Void
    let onSelect: (Int) -> Void
    let onCompleted: (Int) -> Void

    init(levelIndex: Int, unlocked: Int, levelCount: Int, onRestart: @escaping () -> Void,
         onSelect: @escaping (Int) -> Void, onCompleted: @escaping (Int) -> Void) {
        _game = StateObject(wrappedValue: GameCoordinator(levelIndex: levelIndex))
        self.unlocked = unlocked
        self.levelCount = levelCount
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
                                 levelCount: levelCount, onSelect: onSelect) {
                        withAnimation(.easeInOut(duration: 1.2)) { game.startGame() }
                    }
                    .transition(.opacity)
                }

                if game.menuOpen {
                    MenuOverlay(soundOn: $game.soundOn,
                                onResume: { game.menuOpen = false },
                                onRestart: onRestart)
                        .transition(.opacity)
                }

                if game.phase == .finished {
                    EndOverlay(level: game.levelIndex, levelCount: levelCount, onReplay: onRestart,
                               onNext: { onSelect(game.levelIndex + 1) }, onFirst: { onSelect(1) })
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
    let unlocked: Int
    let levelCount: Int
    let onSelect: (Int) -> Void
    let onStart: () -> Void
    @State private var pulse = false

    private var chapterParts: (String, String) {
        let parts = chapter.components(separatedBy: " · ")
        return (parts.first ?? chapter, parts.count > 1 ? parts[1] : "")
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [Ink.paper.opacity(0.75), Ink.paper.opacity(0.15), .clear, Ink.paper.opacity(0.35)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            VStack(spacing: 14) {
                Spacer().frame(height: 70)
                Text("Wolkenpfad")
                    .font(.system(size: 50, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                    .shadow(color: .white, radius: 10)
                Rectangle()
                    .fill(Ink.accent.opacity(0.7))
                    .frame(width: 46, height: 1.5)
                Text(chapterParts.0)
                    .font(.system(size: 14, weight: .regular, design: .serif))
                    .foregroundColor(Ink.soft)
                Text(chapterParts.1)
                    .font(.system(size: 19, weight: .regular, design: .serif))
                    .italic()
                    .foregroundColor(Ink.text)
                HStack(spacing: 14) {
                    ForEach(1...levelCount, id: \.self) { i in
                        Button {
                            if i != current { onSelect(i) }
                        } label: {
                            Text(["I", "II", "III", "IV", "V"][min(i - 1, 4)])
                                .font(.system(size: 15, weight: i == current ? .semibold : .regular, design: .serif))
                                .foregroundColor(i <= unlocked ? Ink.text : Ink.soft.opacity(0.4))
                                .frame(width: 40, height: 40)
                                .background(Circle().stroke(i == current ? Ink.accent : Ink.text.opacity(0.25), lineWidth: i == current ? 1.5 : 1))
                        }
                        .disabled(i > unlocked)
                        .accessibilityLabel("Kapitel \(i)")
                    }
                }
                .padding(.top, 10)
                Spacer()
                Text("Tippe, um zu beginnen")
                    .font(.system(size: 15, weight: .regular, design: .serif))
                    .foregroundColor(Ink.text)
                    .opacity(pulse ? 0.9 : 0.35)
                    .padding(.bottom, 60)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onStart)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever()) { pulse = true }
        }
    }
}

struct MenuOverlay: View {
    @Binding var soundOn: Bool
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
                    hint("hand.tap", "Tippe auf einen Weg, und Hana geht dorthin.")
                    hint("arrow.triangle.2.circlepath", "Ziehe an goldenen Kurbeln und Griffen, um die Welt zu bewegen.")
                    hint("eye", "Was für das Auge verbunden ist, ist auch begehbar.")
                    hint("leaf", "Warte einen Moment – Kiko zeigt dir den Weg.")
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
    let levelCount: Int
    let onReplay: () -> Void
    let onNext: () -> Void
    let onFirst: () -> Void
    @State private var appear = false

    private var isLast: Bool { level >= levelCount }
    private var roman: String { ["I", "II", "III", "IV", "V"][min(level - 1, 4)] }
    private var nextRoman: String { ["I", "II", "III", "IV", "V"][min(level, 4)] }

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 12) {
                Text("Kapitel \(roman) abgeschlossen")
                    .font(.system(size: 28, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                Text(isLast ? "Alle Samen ruhen in der Erde.\nDer Wald wird sich an dich erinnern."
                            : "Der Wald erwacht. Doch hinter den Wolken\nwarten noch viele stille Türme.")
                    .font(.system(size: 15, design: .serif))
                    .italic()
                    .multilineTextAlignment(.center)
                    .foregroundColor(Ink.soft)
                if !isLast {
                    Button(action: onNext) {
                        Label("Weiter zu Kapitel \(nextRoman)", systemImage: "arrow.right")
                            .font(.system(size: 16, weight: .semibold, design: .serif))
                            .foregroundColor(Ink.paper)
                            .frame(width: 240, height: 46)
                            .background(Capsule().fill(Ink.accent.opacity(0.9)))
                    }
                    .padding(.top, 8)
                }
                Button(action: isLast ? onFirst : onReplay) {
                    Label(isLast ? "Von vorn beginnen" : "Noch einmal", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 16, design: .serif))
                        .foregroundColor(Ink.text)
                        .frame(width: 240, height: 44)
                        .background(Capsule().stroke(Ink.text.opacity(0.35)))
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
