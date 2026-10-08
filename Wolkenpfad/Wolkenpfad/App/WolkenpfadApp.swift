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

/// Spielfortschritt: aktuelles Kapitel und abgeschlossene Kapitel.
@MainActor
final class ChapterProgress: ObservableObject {
    @Published var current: Int
    @Published private(set) var completed: Set<Int>

    private let completedKey = "wolkenpfad.completed"
    private let currentKey = "wolkenpfad.current"

    init() {
        var done = Set(UserDefaults.standard.array(forKey: completedKey) as? [Int] ?? [])
        // ältere Spielstände: höchstes freigeschaltetes Kapitel des Prologs
        let legacy = UserDefaults.standard.integer(forKey: "wolkenpfad.unlocked")
        if legacy > 1 { for n in 1..<min(legacy, 4) { done.insert(n) } }
        completed = done
        let saved = UserDefaults.standard.integer(forKey: currentKey)
        current = (1...Catalog.count).contains(saved) ? saved : (1...3).first { !done.contains($0) } ?? 1
    }

    /// Erreicht: das erste Kapitel, jedes Kapitel nach einem abgeschlossenen, und der Anfang jedes Akts.
    func reached(_ n: Int) -> Bool {
        n == 1 || completed.contains(n - 1) || Catalog.act(of: n).chapters.lowerBound == n
    }

    func select(_ n: Int) {
        current = min(max(1, n), Catalog.count)
        UserDefaults.standard.set(current, forKey: currentKey)
    }

    func complete(_ n: Int) {
        completed.insert(n)
        UserDefaults.standard.set(Array(completed).sorted(), forKey: completedKey)
    }
}

struct RootView: View {
    @StateObject private var progress = ChapterProgress()
    @StateObject private var store = Store()
    /// Ein Neustart oder Kapitelwechsel erzeugt eine frische Spielwelt.
    @State private var session = UUID()

    var body: some View {
        GameScreen(levelIndex: progress.current,
                   onRestart: { session = UUID() },
                   onSelect: { level in
                       progress.select(level)
                       session = UUID()
                   },
                   onCompleted: { progress.complete($0) })
            .id(session)
            .environmentObject(progress)
            .environmentObject(store)
            .background(Color(red: 0.99, green: 0.9, blue: 0.82).ignoresSafeArea())
    }
}
