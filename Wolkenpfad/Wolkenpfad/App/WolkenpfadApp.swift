import SwiftUI

@main
struct EchoesOfTheSkyApp: App {
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

    /// Wo „Continue“ im Hauptmenü weitermacht: das aktuelle Kapitel oder, wenn es schon
    /// geschafft ist, das nächste noch offene.
    var continueChapter: Int {
        if !completed.contains(current) { return current }
        if current < Catalog.count, let next = (current + 1...Catalog.count).first(where: { !completed.contains($0) }) {
            return next
        }
        return current
    }

    var started: Bool { !completed.isEmpty || current > 1 }
    var finishedAll: Bool { completed.count >= Catalog.count }

    func select(_ n: Int) {
        current = min(max(1, n), Catalog.count)
        UserDefaults.standard.set(current, forKey: currentKey)
    }

    func complete(_ n: Int) {
        completed.insert(n)
        UserDefaults.standard.set(Array(completed).sorted(), forKey: completedKey)
    }

    /// Neue Reise: Fortschritt löschen (Käufe bleiben erhalten).
    func reset() {
        completed = []
        UserDefaults.standard.set([Int](), forKey: completedKey)
        UserDefaults.standard.removeObject(forKey: "wolkenpfad.unlocked")
        select(1)
    }
}

/// Einstellungen, die das Spiel überdauern.
enum GameSettings {
    static let soundKey = "echoes.sound"
    static let hapticsKey = "echoes.haptics"
    static var sound: Bool { UserDefaults.standard.object(forKey: soundKey) as? Bool ?? true }
    static var haptics: Bool { UserDefaults.standard.object(forKey: hapticsKey) as? Bool ?? true }
}

struct RootView: View {
    @StateObject private var progress = ChapterProgress()
    @StateObject private var store = Store()
    /// Gerade gespieltes Kapitel; nil = Hauptmenü.
    @State private var playing: Int?
    /// Ein Neustart oder Kapitelwechsel erzeugt eine frische Spielwelt.
    @State private var session = UUID()

    var body: some View {
        ZStack {
            if let chapter = playing {
                GameScreen(levelIndex: chapter,
                           onRestart: { session = UUID() },
                           onSelect: { play($0) },
                           onCompleted: { progress.complete($0) },
                           onMainMenu: { withAnimation(.easeInOut(duration: 0.9)) { playing = nil } })
                    .id(session)
                    .transition(.opacity)
            } else {
                MainMenu(onPlay: { play($0) })
                    .transition(.opacity)
            }
        }
        .environmentObject(progress)
        .environmentObject(store)
        .background(Color(red: 0.99, green: 0.9, blue: 0.82).ignoresSafeArea())
    }

    private func play(_ n: Int) {
        progress.select(n)
        session = UUID()
        withAnimation(.easeInOut(duration: 0.9)) { playing = n }
    }
}
