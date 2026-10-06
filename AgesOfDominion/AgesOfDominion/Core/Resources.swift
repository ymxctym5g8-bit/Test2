import Foundation

/// Die fünf Rohstoffe. Der fünfte ("strategic") verschiebt seinen Charakter mit
/// den Epochen: Öl im Dampf- und Industriezeitalter, Uran im Atomzeitalter,
/// Silizium in der Kybernetik-, Nano- und Fusionszukunft.
enum ResourceKind: Int, CaseIterable {
    case food, wood, iron, gold, strategic

    /// Ab dieser Epoche kann der strategische Rohstoff abgebaut werden.
    static let strategicUnlockAge = 5

    func name(age: Int) -> String {
        switch self {
        case .food: return "Nahrung"
        case .wood: return "Holz"
        case .iron: return "Eisen"
        case .gold: return "Gold"
        case .strategic:
            if age >= 9 { return "Silizium" }
            if age >= 7 { return "Uran" }
            return "Öl"
        }
    }

    func icon(age: Int) -> String {
        switch self {
        case .food: return "🍖"
        case .wood: return "🪵"
        case .iron: return "⛓️"
        case .gold: return "🪙"
        case .strategic:
            if age >= 9 { return "💠" }
            if age >= 7 { return "☢️" }
            return "🛢️"
        }
    }

    /// Basis-Sammelrate pro Sekunde und Arbeiter.
    var baseGatherRate: Double {
        switch self {
        case .food: return 0.85
        case .wood: return 0.7
        case .iron: return 0.55
        case .gold: return 0.55
        case .strategic: return 0.45
        }
    }
}

struct ResourceBundle: Equatable {
    var amounts: [Double]

    init(food: Double = 0, wood: Double = 0, iron: Double = 0, gold: Double = 0, strategic: Double = 0) {
        amounts = [food, wood, iron, gold, strategic]
    }

    static let zero = ResourceBundle()

    subscript(kind: ResourceKind) -> Double {
        get { amounts[kind.rawValue] }
        set { amounts[kind.rawValue] = newValue }
    }

    var isZero: Bool { amounts.allSatisfy { $0 <= 0.000_1 } }
    var total: Double { amounts.reduce(0, +) }

    func covers(_ cost: ResourceBundle) -> Bool {
        for i in 0..<amounts.count where amounts[i] + 0.000_1 < cost.amounts[i] { return false }
        return true
    }

    /// Welche Rohstoffe fehlen (für Fehlermeldungen).
    func missing(for cost: ResourceBundle) -> [ResourceKind] {
        ResourceKind.allCases.filter { self[$0] + 0.000_1 < cost[$0] }
    }

    static func + (a: ResourceBundle, b: ResourceBundle) -> ResourceBundle {
        var r = a
        for i in 0..<r.amounts.count { r.amounts[i] += b.amounts[i] }
        return r
    }

    static func - (a: ResourceBundle, b: ResourceBundle) -> ResourceBundle {
        var r = a
        for i in 0..<r.amounts.count { r.amounts[i] -= b.amounts[i] }
        return r
    }

    static func * (a: ResourceBundle, s: Double) -> ResourceBundle {
        var r = a
        for i in 0..<r.amounts.count { r.amounts[i] = (r.amounts[i] * s).rounded() }
        return r
    }

    static func += (a: inout ResourceBundle, b: ResourceBundle) { a = a + b }
    static func -= (a: inout ResourceBundle, b: ResourceBundle) { a = a - b }

    /// Kompakte Darstellung, z. B. "🍖60 🪵40".
    func shortText(age: Int) -> String {
        ResourceKind.allCases
            .filter { self[$0] > 0 }
            .map { "\($0.icon(age: age))\(Int(self[$0]))" }
            .joined(separator: " ")
    }
}
