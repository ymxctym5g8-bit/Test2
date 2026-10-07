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
    @StateObject private var game = GameCoordinator()
    let onRestart: () -> Void

    var body: some View {
        GeometryReader { geo in
            ZStack {
                SceneContainer(coordinator: game)
                    .ignoresSafeArea()
                    .onAppear { game.layout(size: geo.size) }
                    .onChange(of: geo.size) { game.layout(size: $0) }

                StoryText(text: game.story)
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
                                    .foregroundColor(Ink.text)
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
                    TitleOverlay { withAnimation(.easeInOut(duration: 1.2)) { game.startGame() } }
                        .transition(.opacity)
                }

                if game.menuOpen {
                    MenuOverlay(soundOn: $game.soundOn,
                                onResume: { game.menuOpen = false },
                                onRestart: onRestart)
                        .transition(.opacity)
                }

                if game.phase == .finished {
                    EndOverlay(onReplay: onRestart)
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.8), value: game.phase)
            .animation(.easeInOut(duration: 0.3), value: game.menuOpen)
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
    }
}

struct StoryText: View {
    let text: String?

    var body: some View {
        ZStack {
            if let t = text {
                Text(t)
                    .font(.system(size: 19, weight: .regular, design: .serif))
                    .italic()
                    .foregroundColor(Ink.text)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 34)
                    .shadow(color: .white.opacity(0.9), radius: 6)
                    .id(t)
                    .transition(.opacity.combined(with: .offset(y: 6)))
            }
        }
        .animation(.easeInOut(duration: 1.1), value: text)
    }
}

struct TitleOverlay: View {
    let onStart: () -> Void
    @State private var pulse = false

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
                Text("Kapitel I · Der Samen des Waldes")
                    .font(.system(size: 16, weight: .regular, design: .serif))
                    .italic()
                    .foregroundColor(Ink.soft)
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
    let onReplay: () -> Void
    @State private var appear = false

    var body: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 12) {
                Text("Kapitel I abgeschlossen")
                    .font(.system(size: 28, weight: .light, design: .serif))
                    .foregroundColor(Ink.text)
                Text("Der Wald erwacht. Doch hinter den Wolken\nwarten noch viele stille Türme.")
                    .font(.system(size: 15, design: .serif))
                    .italic()
                    .multilineTextAlignment(.center)
                    .foregroundColor(Ink.soft)
                Button(action: onReplay) {
                    Label("Noch einmal", systemImage: "arrow.counterclockwise")
                        .font(.system(size: 16, design: .serif))
                        .foregroundColor(Ink.text)
                        .frame(width: 200, height: 44)
                        .background(Capsule().stroke(Ink.text.opacity(0.35)))
                }
                .padding(.top, 8)
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
