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

/// Eine Welt mit ihren Kapiteln (Level-Nummern sind global: level1 … level6).
struct GameWorld: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let levels: ClosedRange<Int>

    static let all = [
        GameWorld(id: "wolkenpfad", title: "Wolkenpfad", subtitle: "Die stillen Türme", levels: 1...3),
        GameWorld(id: "neko", title: "Neko no Machi", subtitle: "猫の町 · Die Katzenstadt", levels: 4...6),
    ]

    static func of(level: Int) -> GameWorld { all.first { $0.levels.contains(level) } ?? all[0] }

    /// Kapitelnummer innerhalb der Welt (1 …).
    func chapter(of level: Int) -> Int { level - levels.lowerBound + 1 }
}

/// Spielfortschritt: aktuelles Kapitel und pro Welt das höchste freigeschaltete.
@MainActor
final class ChapterProgress: ObservableObject {
    static let levelCount = 6

    @Published var current: Int
    @Published private(set) var unlocked: [String: Int] = [:]

    private static func key(_ world: String) -> String { world == "wolkenpfad" ? "wolkenpfad.unlocked" : "\(world).unlocked" }

    init() {
        var u: [String: Int] = [:]
        for w in GameWorld.all {
            let saved = UserDefaults.standard.integer(forKey: ChapterProgress.key(w.id))
            u[w.id] = min(max(w.levels.lowerBound, saved), w.levels.upperBound)
        }
        let last = UserDefaults.standard.integer(forKey: "wolkenpfad.current")
        current = (1...ChapterProgress.levelCount).contains(last) ? last : (u["wolkenpfad"] ?? 1)
        unlocked = u
    }

    /// Höchstes freigeschaltetes Level je Welt; das erste Kapitel jeder Welt ist immer offen.
    var unlockedLevels: Set<Int> {
        var s = Set<Int>()
        for w in GameWorld.all {
            let u = unlocked[w.id] ?? w.levels.lowerBound
            for l in w.levels where l <= u { s.insert(l) }
        }
        return s
    }

    func select(_ level: Int) {
        current = min(max(1, level), ChapterProgress.levelCount)
        UserDefaults.standard.set(current, forKey: "wolkenpfad.current")
    }

    func complete(_ level: Int) {
        let w = GameWorld.of(level: level)
        let next = min(level + 1, w.levels.upperBound)
        if next > (unlocked[w.id] ?? w.levels.lowerBound) {
            unlocked[w.id] = next
            UserDefaults.standard.set(next, forKey: ChapterProgress.key(w.id))
        }
    }
}

struct RootView: View {
    @StateObject private var progress = ChapterProgress()
    /// Ein Neustart oder Kapitelwechsel erzeugt eine frische Spielwelt.
    @State private var session = UUID()

    var body: some View {
        GameScreen(levelIndex: progress.current, unlocked: progress.unlockedLevels,
                   onRestart: { session = UUID() },
                   onSelect: { level in
                       progress.select(level)
                       session = UUID()
                   },
                   onCompleted: { progress.complete($0) })
            .id(session)
            .background(Color(red: 0.99, green: 0.9, blue: 0.82).ignoresSafeArea())
    }
}
