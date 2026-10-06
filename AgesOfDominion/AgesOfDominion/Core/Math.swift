import Foundation

/// 2D-Vektor in Kachel-Koordinaten (1.0 = eine Kachel). Die Simulation ist
/// komplett plattformunabhängig und kennt keine Bildschirmpunkte.
struct Vec2: Equatable, Hashable {
    var x: Double
    var y: Double

    static let zero = Vec2(0, 0)

    init(_ x: Double, _ y: Double) {
        self.x = x
        self.y = y
    }

    static func + (a: Vec2, b: Vec2) -> Vec2 { Vec2(a.x + b.x, a.y + b.y) }
    static func - (a: Vec2, b: Vec2) -> Vec2 { Vec2(a.x - b.x, a.y - b.y) }
    static func * (a: Vec2, s: Double) -> Vec2 { Vec2(a.x * s, a.y * s) }
    static func / (a: Vec2, s: Double) -> Vec2 { Vec2(a.x / s, a.y / s) }
    static func += (a: inout Vec2, b: Vec2) { a = a + b }
    static func -= (a: inout Vec2, b: Vec2) { a = a - b }

    var length: Double { (x * x + y * y).squareRoot() }
    var lengthSquared: Double { x * x + y * y }

    var normalized: Vec2 {
        let l = length
        return l > 0.000_1 ? Vec2(x / l, y / l) : .zero
    }

    func distance(to o: Vec2) -> Double { (self - o).length }
    func distanceSquared(to o: Vec2) -> Double { (self - o).lengthSquared }

    var tile: TilePos { TilePos(Int(x.rounded(.down)), Int(y.rounded(.down))) }
}

struct TilePos: Hashable {
    var x: Int
    var y: Int

    init(_ x: Int, _ y: Int) {
        self.x = x
        self.y = y
    }

    var center: Vec2 { Vec2(Double(x) + 0.5, Double(y) + 0.5) }

    func chebyshev(_ o: TilePos) -> Int { max(abs(x - o.x), abs(y - o.y)) }
}

/// Deterministischer Zufallsgenerator (SplitMix64) für reproduzierbare Karten.
struct SeededRandom: RandomNumberGenerator {
    private var state: UInt64

    init(seed: UInt64) { state = seed &+ 0x9E37_79B9_7F4A_7C15 }

    mutating func next() -> UInt64 {
        state &+= 0x9E37_79B9_7F4A_7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }

    mutating func unit() -> Double { Double(next() >> 11) / Double(1 << 53) }
    mutating func range(_ lo: Double, _ hi: Double) -> Double { lo + (hi - lo) * unit() }
    mutating func int(_ lo: Int, _ hi: Int) -> Int { lo + Int(next() % UInt64(max(1, hi - lo + 1))) }
}

/// Plattformneutrale Farbe für die Datentabellen.
struct RGB: Equatable {
    var r: Double
    var g: Double
    var b: Double

    init(_ r: Double, _ g: Double, _ b: Double) {
        self.r = r
        self.g = g
        self.b = b
    }

    func mixed(with o: RGB, _ t: Double) -> RGB {
        RGB(r + (o.r - r) * t, g + (o.g - g) * t, b + (o.b - b) * t)
    }

    func scaled(_ f: Double) -> RGB { RGB(min(1, r * f), min(1, g * f), min(1, b * f)) }
}

extension Double {
    func clamped(_ lo: Double, _ hi: Double) -> Double { Swift.min(hi, Swift.max(lo, self)) }
}

extension Int {
    func clamped(_ lo: Int, _ hi: Int) -> Int { Swift.min(hi, Swift.max(lo, self)) }
}

func formatTime(_ seconds: Double) -> String {
    let s = Int(seconds.rounded(.down))
    return String(format: "%02d:%02d", s / 60, s % 60)
}
