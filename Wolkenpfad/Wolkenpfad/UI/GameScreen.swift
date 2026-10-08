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
    static let gold = Color(red: 0.86, green: 0.64, blue: 0.3)
}

struct GameScreen: View {
    @StateObject private var game: GameCoordinator
    @EnvironmentObject private var progress: ChapterProgress
    @EnvironmentObject private var store: Store
    @State private var showChapters = false
    @State private var showStore = false
    let onRestart: () -> Void
    let onSelect: (Int) -> Void
    let onCompleted: (Int) -> Void

    init(levelIndex: Int, onRestart: @escaping () -> Void, onSelect: @escaping (Int) -> Void, onCompleted: @escaping (Int) -> Void) {
        _game = StateObject(wrappedValue: GameCoordinator(levelIndex: levelIndex))
        self.onRestart = onRestart
        self.onSelect = onSelect
        self.onCompleted = onCompleted
    }

    private var playable: Bool { store.owns(chapter: game.levelIndex) && progress.reached(game.levelIndex) }

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
                            .accessibilityLabel("Menu")
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 6)
                }

                if game.phase == .title {
                    TitleOverlay(level: game.levelIndex, playable: playable,
                                 onChapters: { showChapters = true }, onStore: { showStore = true }) {
                        withAnimation(.easeInOut(duration: 1.2)) { game.startGame() }
                    }
                    .transition(.opacity)
                }

                if game.menuOpen {
                    MenuOverlay(soundOn: $game.soundOn,
                                onResume: { game.menuOpen = false },
                                onChapters: { showChapters = true },
                                onRestart: onRestart)
                        .transition(.opacity)
                }

                if game.phase == .finished {
                    EndOverlay(level: game.levelIndex, onReplay: onRestart, onSelect: onSelect,
                               onChapters: { showChapters = true }, onStore: { showStore = true })
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
        .sheet(isPresented: $showChapters) {
            ChapterSelect(current: game.levelIndex, onSelect: { n in
                showChapters = false
                onSelect(n)
            }, onStore: {
                showChapters = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { showStore = true }
            })
            .environmentObject(progress)
            .environmentObject(store)
        }
        .sheet(isPresented: $showStore) {
            StoreView().environmentObject(store)
        }
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
    let level: Int
    let playable: Bool
    let onChapters: () -> Void
    let onStore: () -> Void
    let onStart: () -> Void
    @State private var pulse = false

    var body: some View {
        let chapter = Catalog.chapter(level), act = Catalog.act(of: level)
        ZStack {
            LinearGradient(colors: [Ink.paper.opacity(0.8), Ink.paper.opacity(0.15), .clear, Ink.paper.opacity(0.45)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            VStack(spacing: 12) {
                Spacer().frame(height: 64)
                Text("Wolkenpfad")
                    .font(.system(size: 50, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                    .shadow(color: .white, radius: 10)
                Text("A journey above the clouds")
                    .font(.system(size: 14, design: .serif))
                    .italic()
                    .foregroundColor(Ink.soft)
                Rectangle().fill(Ink.accent.opacity(0.7)).frame(width: 46, height: 1.5).padding(.vertical, 4)
                Text("\(act.title) · \(act.subtitle)")
                    .font(.system(size: 13, design: .serif))
                    .foregroundColor(Ink.soft)
                Text("Chapter \(level)")
                    .font(.system(size: 14, weight: .regular, design: .serif))
                    .foregroundColor(Ink.soft)
                Text(chapter.title)
                    .font(.system(size: 22, weight: .regular, design: .serif))
                    .italic()
                    .multilineTextAlignment(.center)
                    .foregroundColor(Ink.text)
                    .padding(.horizontal, 30)
                Spacer()
                HStack(spacing: 14) {
                    pill("Chapters", icon: "book", action: onChapters)
                    pill("Journey", icon: "sparkles", action: onStore)
                }
                if playable {
                    Text("Tap to begin")
                        .font(.system(size: 15, weight: .regular, design: .serif))
                        .foregroundColor(Ink.text)
                        .opacity(pulse ? 0.9 : 0.35)
                        .padding(.top, 16)
                        .padding(.bottom, 54)
                } else {
                    Button(action: onStore) {
                        Label("Unlock \(act.title)", systemImage: "lock.open")
                            .font(.system(size: 16, weight: .semibold, design: .serif))
                            .foregroundColor(Ink.paper)
                            .frame(width: 230, height: 46)
                            .background(Capsule().fill(Ink.accent.opacity(0.9)))
                    }
                    .padding(.top, 16)
                    .padding(.bottom, 50)
                }
            }
        }
        .contentShape(Rectangle())
        .onTapGesture { if playable { onStart() } }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever()) { pulse = true }
        }
    }

    private func pill(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.system(size: 15, design: .serif))
                .foregroundColor(Ink.text)
                .padding(.horizontal, 18)
                .frame(height: 40)
                .background(Capsule().fill(Ink.paper.opacity(0.75)))
                .overlay(Capsule().stroke(Ink.text.opacity(0.2)))
        }
    }
}

struct MenuOverlay: View {
    @Binding var soundOn: Bool
    let onResume: () -> Void
    let onChapters: () -> Void
    let onRestart: () -> Void

    var body: some View {
        ZStack {
            Ink.paper.opacity(0.84)
                .ignoresSafeArea()
                .onTapGesture(perform: onResume)
            VStack(spacing: 22) {
                Text("A Quiet Moment")
                    .font(.system(size: 30, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                VStack(alignment: .leading, spacing: 10) {
                    hint("hand.tap", "Tap a path and Hana walks there.")
                    hint("arrow.triangle.2.circlepath", "Drag the golden cranks and handles to move the world.")
                    hint("eye", "What looks connected is connected.")
                    hint("circle.dotted", "Pressure stones wake sleeping mechanisms.")
                    hint("leaf", "Wait a moment – Kiko will show you the way.")
                }
                .padding(.horizontal, 30)
                menuButton(soundOn ? "Sound: on" : "Sound: off", icon: soundOn ? "speaker.wave.2" : "speaker.slash") {
                    soundOn.toggle()
                }
                menuButton("Chapters", icon: "book", action: onChapters)
                menuButton("Restart chapter", icon: "arrow.counterclockwise", action: onRestart)
                menuButton("Continue", icon: "play", action: onResume)
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
                .frame(width: 250, height: 46)
                .background(Capsule().stroke(Ink.text.opacity(0.35), lineWidth: 1))
        }
    }
}

struct EndOverlay: View {
    let level: Int
    let onReplay: () -> Void
    let onSelect: (Int) -> Void
    let onChapters: () -> Void
    let onStore: () -> Void
    @EnvironmentObject private var store: Store
    @State private var appear = false

    private var isLast: Bool { level >= Catalog.count }
    private var next: Int { level + 1 }
    private var nextOwned: Bool { !isLast && store.owns(chapter: next) }

    private var message: String {
        if isLast { return "The cloud paths shine golden.\nThe journey is complete – for now." }
        if Catalog.act(of: next).id != Catalog.act(of: level).id {
            return "\(Catalog.act(of: level).title) is complete.\nThe wind is calling from further away."
        }
        return "The wind remembers you.\nThe path goes on."
    }

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 12) {
                Text("Chapter \(level) complete")
                    .font(.system(size: 28, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                Text(message)
                    .font(.system(size: 15, design: .serif))
                    .italic()
                    .multilineTextAlignment(.center)
                    .foregroundColor(Ink.soft)
                if isLast {
                    primary("Choose a chapter", icon: "book", action: onChapters)
                } else if nextOwned {
                    primary("Continue to Chapter \(next)", icon: "arrow.right") { onSelect(next) }
                } else {
                    primary("Unlock \(Catalog.act(of: next).title)", icon: "lock.open", action: onStore)
                }
                Button(action: onReplay) {
                    Label("Play again", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 16, design: .serif))
                        .foregroundColor(Ink.text)
                        .frame(width: 250, height: 44)
                        .background(Capsule().stroke(Ink.text.opacity(0.35)))
                }
            }
            .padding(26)
            .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Ink.paper.opacity(0.9)))
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
            .opacity(appear ? 1 : 0)
            .offset(y: appear ? 0 : 20)
        }
        .onAppear { withAnimation(.easeOut(duration: 1.2)) { appear = true } }
    }

    private func primary(_ title: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .font(.system(size: 16, weight: .semibold, design: .serif))
                .foregroundColor(Ink.paper)
                .frame(width: 250, height: 46)
                .background(Capsule().fill(Ink.accent.opacity(0.9)))
        }
        .padding(.top, 8)
    }
}
