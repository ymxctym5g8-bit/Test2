import Foundation

enum Difficulty: Int, CaseIterable, Identifiable {
    case easy, normal, hard, brutal

    var id: Int { rawValue }

    var name: String {
        switch self {
        case .easy: return "Leicht"
        case .normal: return "Normal"
        case .hard: return "Schwer"
        case .brutal: return "Brutal"
        }
    }

    /// Sammelraten-Multiplikator der KI.
    var gatherMult: Double {
        switch self {
        case .easy: return 0.75
        case .normal: return 1.0
        case .hard: return 1.2
        case .brutal: return 1.45
        }
    }

    /// Wie schnell die KI Entscheidungen trifft (Sekunden zwischen Denkzyklen).
    var thinkInterval: Double {
        switch self {
        case .easy: return 2.0
        case .normal: return 1.2
        case .hard: return 0.8
        case .brutal: return 0.6
        }
    }

    var firstAttackTime: Double {
        switch self {
        case .easy: return 720
        case .normal: return 480
        case .hard: return 330
        case .brutal: return 240
        }
    }

    var minAgeInterval: Double {
        switch self {
        case .easy: return 420
        case .normal: return 260
        case .hard: return 180
        case .brutal: return 130
        }
    }

    var villagerCap: Int {
        switch self {
        case .easy: return 22
        case .normal: return 32
        case .hard: return 42
        case .brutal: return 55
        }
    }
}

enum MapSize: Int, CaseIterable, Identifiable {
    case small = 72, medium = 96, large = 128

    var id: Int { rawValue }

    var name: String {
        switch self {
        case .small: return "Klein"
        case .medium: return "Mittel"
        case .large: return "Groß"
        }
    }
}

struct GameSettings {
    var mapSize: MapSize = .medium
    var opponents: Int = 1
    var difficulty: Difficulty = .normal
    var startAge: Int = 0
    var maxAge: Int = 11
    var alliedAI = false
    var wonderVictory = true
    var revealMap = false
    var seed: UInt64 = UInt64.random(in: 1...UInt64.max - 1)

    static let startAgeChoices = [0, 3, 5, 7, 9]

    func startResources() -> ResourceBundle {
        switch startAge {
        case 0: return ResourceBundle(food: 250, wood: 250, iron: 100, gold: 100)
        case 1...4: return ResourceBundle(food: 1000, wood: 1000, iron: 700, gold: 600)
        case 5...6: return ResourceBundle(food: 2000, wood: 1500, iron: 1500, gold: 1500, strategic: 500)
        default: return ResourceBundle(food: 3000, wood: 2000, iron: 2500, gold: 2500, strategic: 2000)
        }
    }
}
