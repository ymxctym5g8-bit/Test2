import SwiftUI

@main
struct WolkenpfadApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.light)
        }
    }
}

/// Spielfortschritt: aktuelles und höchstes freigeschaltetes Kapitel.
@MainActor
final class ChapterProgress: ObservableObject {
    static let levelCount = 3
    private let key = "wolkenpfad.unlocked"

    @Published var current: Int
    @Published private(set) var unlocked: Int

    init() {
        let saved = UserDefaults.standard.integer(forKey: "wolkenpfad.unlocked")
        let u = min(max(1, saved), ChapterProgress.levelCount)
        unlocked = u
        current = u
    }

    func complete(_ level: Int) {
        let next = min(level + 1, ChapterProgress.levelCount)
        if next > unlocked {
            unlocked = next
            UserDefaults.standard.set(next, forKey: key)
        }
    }
}

struct RootView: View {
    @StateObject private var progress = ChapterProgress()
    /// Ein Neustart oder Kapitelwechsel erzeugt eine frische Spielwelt.
    @State private var session = UUID()

    var body: some View {
        GameScreen(levelIndex: progress.current, unlocked: progress.unlocked, levelCount: ChapterProgress.levelCount,
                   onRestart: { session = UUID() },
                   onSelect: { level in
                       progress.current = min(max(1, level), ChapterProgress.levelCount)
                       session = UUID()
                   },
                   onCompleted: { progress.complete($0) })
            .id(session)
            .background(Color(red: 0.99, green: 0.9, blue: 0.82).ignoresSafeArea())
    }
}
