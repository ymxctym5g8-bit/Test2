import Foundation

/// Ein Kapitel der Reise.
struct ChapterInfo: Identifiable {
    let id: Int
    let title: String
    let act: Int
}

/// Prolog und drei Akte. Die Akte I–III werden per In-App-Kauf freigeschaltet.
struct ActInfo: Identifiable {
    let id: Int
    let title: String
    let subtitle: String
    let chapters: ClosedRange<Int>
    /// Produkt-ID im App Store (nil = kostenlos).
    let productID: String?
}

enum Catalog {
    /// Alle drei Akte in einem Kauf.
    static let journeyID = "com.example.Wolkenpfad.journey"

    static let acts: [ActInfo] = [
        ActInfo(id: 0, title: "Prologue", subtitle: "The Forest Seeds", chapters: 1...3, productID: nil),
        ActInfo(id: 1, title: "Act I", subtitle: "The Call of the Sky", chapters: 4...8, productID: "com.example.Wolkenpfad.act1"),
        ActInfo(id: 2, title: "Act II", subtitle: "The Search for the Light", chapters: 9...13, productID: "com.example.Wolkenpfad.act2"),
        ActInfo(id: 3, title: "Act III", subtitle: "The Heart of the Sky", chapters: 14...18, productID: "com.example.Wolkenpfad.act3"),
    ]

    static let chapters: [ChapterInfo] = [
        "The Seed of the Forest", "The Song of the River", "The Tower of Lanterns",
        "The Hum in the Attic", "The First Step into the Mist", "The Valley of Whispering Grass",
        "The Mill of Forgotten Letters", "The Storm Is Coming",
        "The Lake of Glass", "The Town of Bellflowers", "The Sleeping Giant", "The Maze of Sunbeams",
        "The Old Bridge-Builder",
        "The Ascent to the Sky Garden", "The Ruins of the First Storm", "Echoes of the Past",
        "The Heart of the Clouds", "A New Horizon",
    ].enumerated().map { i, title in
        let n = i + 1
        return ChapterInfo(id: n, title: title, act: acts.first { $0.chapters.contains(n) }?.id ?? 0)
    }

    static var count: Int { chapters.count }
    static var productIDs: [String] { acts.compactMap { $0.productID } + [journeyID] }

    static func chapter(_ n: Int) -> ChapterInfo { chapters[max(0, min(count - 1, n - 1))] }
    static func act(of chapter: Int) -> ActInfo { acts.first { $0.chapters.contains(chapter) } ?? acts[0] }

    static func roman(_ n: Int) -> String {
        let table: [(Int, String)] = [(10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]
        var n = n, out = ""
        for (v, s) in table { while n >= v { out += s; n -= v } }
        return out
    }
}
