import UIKit
import SceneKit

/// Farbpalette: pastellige Monument-Valley-Geometrie trifft warme Ghibli-Landschaftsmalerei.
enum Palette {
    static let grass = UIColor(red: 0.56, green: 0.76, blue: 0.43, alpha: 1)
    static let grassDeep = UIColor(red: 0.36, green: 0.6, blue: 0.36, alpha: 1)
    static let sand = UIColor(red: 0.95, green: 0.86, blue: 0.72, alpha: 1)
    static let stone = UIColor(red: 0.97, green: 0.91, blue: 0.81, alpha: 1)
    static let stoneSide = UIColor(red: 0.91, green: 0.8, blue: 0.69, alpha: 1)
    static let mauve = UIColor(red: 0.78, green: 0.64, blue: 0.68, alpha: 1)
    static let rock = UIColor(red: 0.72, green: 0.6, blue: 0.62, alpha: 1)
    static let rockDark = UIColor(red: 0.52, green: 0.44, blue: 0.55, alpha: 1)
    static let wood = UIColor(red: 0.8, green: 0.57, blue: 0.4, alpha: 1)
    static let teal = UIColor(red: 0.42, green: 0.74, blue: 0.75, alpha: 1)
    static let tealDark = UIColor(red: 0.3, green: 0.56, blue: 0.62, alpha: 1)
    static let tealTop = UIColor(red: 0.7, green: 0.9, blue: 0.86, alpha: 1)
    static let water = UIColor(red: 0.45, green: 0.74, blue: 0.86, alpha: 1)
    static let vermilion = UIColor(red: 0.86, green: 0.33, blue: 0.27, alpha: 1)
    static let brass = UIColor(red: 0.95, green: 0.78, blue: 0.42, alpha: 1)
    static let leaf = [
        UIColor(red: 0.42, green: 0.66, blue: 0.38, alpha: 1),
        UIColor(red: 0.52, green: 0.74, blue: 0.42, alpha: 1),
        UIColor(red: 0.34, green: 0.58, blue: 0.4, alpha: 1),
    ]
    static let blossom = [
        UIColor(red: 0.98, green: 0.78, blue: 0.84, alpha: 1),
        UIColor(red: 0.96, green: 0.68, blue: 0.78, alpha: 1),
        UIColor(red: 1.0, green: 0.88, blue: 0.9, alpha: 1),
    ]
}

/// Stimmung eines Kapitels: Himmel, Licht, Wolken, Partikel und Musik.
struct Theme {
    enum Particle { case petals, leaves, motes, dragonflies }

    let name: String
    let sky: [UIColor]
    let sun: UIColor
    let sunIntensity: CGFloat
    let ambient: UIColor
    let ambientIntensity: CGFloat
    let cloudLight: UIColor
    let cloudShadow: UIColor
    let cloudWarmShadow: UIColor
    let particle: Particle
    let stars: Bool
    let fireflies: Float
    let lanternBoost: CGFloat

    static func named(_ n: String?) -> Theme {
        switch n {
        case "evening":
            return Theme(name: "evening",
                         sky: [UIColor(red: 0.42, green: 0.45, blue: 0.75, alpha: 1), UIColor(red: 0.78, green: 0.6, blue: 0.78, alpha: 1),
                               UIColor(red: 1.0, green: 0.74, blue: 0.56, alpha: 1), UIColor(red: 0.99, green: 0.6, blue: 0.45, alpha: 1),
                               UIColor(red: 0.85, green: 0.45, blue: 0.48, alpha: 1)],
                         sun: UIColor(red: 1, green: 0.78, blue: 0.55, alpha: 1), sunIntensity: 980,
                         ambient: UIColor(red: 0.62, green: 0.52, blue: 0.72, alpha: 1), ambientIntensity: 470,
                         cloudLight: UIColor(red: 1, green: 0.9, blue: 0.82, alpha: 1),
                         cloudShadow: UIColor(red: 0.72, green: 0.56, blue: 0.75, alpha: 1),
                         cloudWarmShadow: UIColor(red: 0.95, green: 0.6, blue: 0.55, alpha: 1),
                         particle: .leaves, stars: false, fireflies: 3, lanternBoost: 1.3)
        case "night":
            return Theme(name: "night",
                         sky: [UIColor(red: 0.07, green: 0.09, blue: 0.24, alpha: 1), UIColor(red: 0.14, green: 0.18, blue: 0.4, alpha: 1),
                               UIColor(red: 0.27, green: 0.28, blue: 0.52, alpha: 1), UIColor(red: 0.42, green: 0.36, blue: 0.58, alpha: 1),
                               UIColor(red: 0.55, green: 0.42, blue: 0.6, alpha: 1)],
                         sun: UIColor(red: 0.62, green: 0.7, blue: 1.0, alpha: 1), sunIntensity: 650,
                         ambient: UIColor(red: 0.36, green: 0.38, blue: 0.62, alpha: 1), ambientIntensity: 420,
                         cloudLight: UIColor(red: 0.62, green: 0.66, blue: 0.86, alpha: 1),
                         cloudShadow: UIColor(red: 0.3, green: 0.3, blue: 0.52, alpha: 1),
                         cloudWarmShadow: UIColor(red: 0.42, green: 0.32, blue: 0.55, alpha: 1),
                         particle: .motes, stars: true, fireflies: 9, lanternBoost: 2.2)
        case "town", "satoyama", "fuji":
            // Neko-no-Machi-Stil: kräftig blauer Himmel, weiße Kumuluswolken, klares Licht
            let haze = n == "satoyama" ? UIColor(red: 0.86, green: 0.91, blue: 0.86, alpha: 1)
                : UIColor(red: 0.9, green: 0.92, blue: 0.92, alpha: 1)
            return Theme(name: n ?? "town",
                         sky: [UIColor(red: 0.24, green: 0.5, blue: 0.84, alpha: 1), UIColor(red: 0.34, green: 0.6, blue: 0.88, alpha: 1),
                               UIColor(red: 0.58, green: 0.75, blue: 0.92, alpha: 1), UIColor(red: 0.8, green: 0.87, blue: 0.93, alpha: 1), haze],
                         sun: UIColor(red: 1, green: 0.98, blue: 0.94, alpha: 1), sunIntensity: 1100,
                         ambient: UIColor(red: 0.7, green: 0.74, blue: 0.85, alpha: 1), ambientIntensity: 520,
                         cloudLight: .white,
                         cloudShadow: UIColor(red: 0.72, green: 0.78, blue: 0.88, alpha: 1),
                         cloudWarmShadow: UIColor(red: 0.78, green: 0.8, blue: 0.9, alpha: 1),
                         particle: n == "town" ? .petals : (n == "fuji" ? .leaves : .dragonflies),
                         stars: false, fireflies: n == "satoyama" ? 4 : 2, lanternBoost: 1)
        default:
            return Theme(name: "day",
                         sky: [UIColor(red: 0.52, green: 0.73, blue: 0.93, alpha: 1), UIColor(red: 0.74, green: 0.86, blue: 0.95, alpha: 1),
                               UIColor(red: 0.99, green: 0.93, blue: 0.84, alpha: 1), UIColor(red: 0.99, green: 0.82, blue: 0.74, alpha: 1),
                               UIColor(red: 0.93, green: 0.72, blue: 0.74, alpha: 1)],
                         sun: UIColor(red: 1, green: 0.93, blue: 0.82, alpha: 1), sunIntensity: 1050,
                         ambient: UIColor(red: 0.62, green: 0.66, blue: 0.82, alpha: 1), ambientIntensity: 480,
                         cloudLight: .white,
                         cloudShadow: UIColor(red: 0.76, green: 0.78, blue: 0.9, alpha: 1),
                         cloudWarmShadow: UIColor(red: 0.93, green: 0.74, blue: 0.78, alpha: 1),
                         particle: .petals, stars: false, fireflies: 3, lanternBoost: 1)
        }
    }
}

/// Deterministischer kleiner Zufallsgenerator, damit die Welt bei jedem Start gleich aussieht.
struct Rand {
    private var s: UInt64
    init(_ seed: UInt64) { s = seed &* 6364136223846793005 &+ 1442695040888963407 }
    mutating func next() -> Double {
        s = s &* 6364136223846793005 &+ 1442695040888963407
        return Double((s >> 33) & 0xFFFFFF) / Double(0xFFFFFF)
    }
    mutating func range(_ a: Double, _ b: Double) -> Double { a + (b - a) * next() }
}

enum Art {
    // MARK: Texturen

    /// „Handgemalte“ Fläche: Grundfarbe mit weichen, halbtransparenten Pinseltupfern.
    static func painted(_ base: UIColor, seed: UInt64, dabs: Int = 70, strength: CGFloat = 0.09,
                        stripes: Bool = false, dots: Bool = false, emblem: Bool = false) -> UIImage {
        let size = CGSize(width: 128, height: 128)
        var rng = Rand(seed)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            base.setFill()
            c.fill(CGRect(origin: .zero, size: size))
            for _ in 0..<dabs {
                let light = rng.next() > 0.5
                let a = CGFloat(rng.range(0.3, 1)) * strength
                (light ? UIColor.white : UIColor(red: 0.25, green: 0.15, blue: 0.3, alpha: 1)).withAlphaComponent(a).setFill()
                let r = CGFloat(rng.range(5, 18))
                let x = CGFloat(rng.range(-10, 138)), y = CGFloat(rng.range(-10, 138))
                c.fillEllipse(in: CGRect(x: x - r, y: y - r * 0.6, width: r * 2, height: r * 1.2))
            }
            if stripes {
                for i in 0..<5 {
                    UIColor(white: 0, alpha: 0.08).setFill()
                    c.fill(CGRect(x: 0, y: CGFloat(i) * 25.6, width: 128, height: 2))
                }
            }
            if dots {
                UIColor.white.withAlphaComponent(0.22).setFill()
                for ix in 0..<4 {
                    for iy in 0..<4 {
                        c.fillEllipse(in: CGRect(x: 12 + CGFloat(ix) * 32, y: 12 + CGFloat(iy) * 32, width: 8, height: 8))
                    }
                }
            }
            if emblem {
                UIColor.white.withAlphaComponent(0.55).setStroke()
                c.setLineWidth(5)
                c.strokeEllipse(in: CGRect(x: 30, y: 30, width: 68, height: 68))
                c.setLineWidth(3)
                c.strokeEllipse(in: CGRect(x: 48, y: 48, width: 32, height: 32))
            }
            // weicher Rand, damit Blockkanten wie gemalt wirken
            UIColor(white: 0, alpha: 0.06).setStroke()
            c.setLineWidth(4)
            c.stroke(CGRect(origin: .zero, size: size).insetBy(dx: 1, dy: 1))
        }
    }

    static func skyGradient(_ theme: Theme) -> UIImage {
        let size = CGSize(width: 256, height: 1024)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let colors = theme.sky.map { $0.cgColor } as CFArray
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.3, 0.6, 0.82, 1])!
            ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: size.height), options: [])
            if theme.stars {
                var rng = Rand(77)
                for _ in 0..<160 {
                    let x = CGFloat(rng.range(0, 256)), y = CGFloat(rng.range(0, 620))
                    let r = CGFloat(rng.range(0.4, 1.4))
                    UIColor(white: 1, alpha: CGFloat(rng.range(0.35, 0.95)) * (1 - y / 700)).setFill()
                    ctx.cgContext.fillEllipse(in: CGRect(x: x - r, y: y - r * 0.25, width: r * 2, height: r * 0.5))
                }
            }
        }
    }

    /// Ferne Kulisse im flachen Neko-no-Machi-Stil: Hügel mit Dächern, Reisterrassen oder der Fuji am See.
    static func backdrop(_ name: String) -> UIImage {
        let size = CGSize(width: 1024, height: 512)
        var rng = Rand(name == "fuji" ? 31 : (name == "town" ? 11 : 21))
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            func hill(_ base: CGFloat, _ amp: CGFloat, _ color: UIColor, phase: CGFloat, freq: CGFloat) {
                let path = CGMutablePath()
                path.move(to: CGPoint(x: 0, y: 512))
                for i in 0...64 {
                    let x = CGFloat(i) * 16
                    let y = base - amp * (0.6 * sin(x / 1024 * .pi * freq + phase) + 0.4 * sin(x / 1024 * .pi * freq * 2.3 + phase * 1.7))
                    path.addLine(to: CGPoint(x: x, y: y))
                }
                path.addLine(to: CGPoint(x: 1024, y: 512))
                path.closeSubpath()
                color.setFill()
                c.addPath(path)
                c.fillPath()
            }
            switch name {
            case "fuji":
                // Der Berg mit Schneekappe
                let mountain = CGMutablePath()
                mountain.move(to: CGPoint(x: 120, y: 330))
                mountain.addCurve(to: CGPoint(x: 450, y: 92), control1: CGPoint(x: 300, y: 270), control2: CGPoint(x: 400, y: 140))
                mountain.addLine(to: CGPoint(x: 574, y: 92))
                mountain.addCurve(to: CGPoint(x: 904, y: 330), control1: CGPoint(x: 624, y: 140), control2: CGPoint(x: 724, y: 270))
                mountain.closeSubpath()
                UIColor(red: 0.45, green: 0.55, blue: 0.75, alpha: 1).setFill()
                c.addPath(mountain)
                c.fillPath()
                let snow = CGMutablePath()
                snow.move(to: CGPoint(x: 362, y: 170))
                snow.addCurve(to: CGPoint(x: 450, y: 92), control1: CGPoint(x: 400, y: 140), control2: CGPoint(x: 430, y: 110))
                snow.addLine(to: CGPoint(x: 574, y: 92))
                snow.addCurve(to: CGPoint(x: 662, y: 170), control1: CGPoint(x: 594, y: 110), control2: CGPoint(x: 624, y: 140))
                for k in 0..<6 {
                    let x = 662 - CGFloat(k + 1) * 300 / 7
                    snow.addLine(to: CGPoint(x: x + 22, y: 150 + CGFloat(k % 2) * 34))
                    snow.addLine(to: CGPoint(x: x, y: 170))
                }
                snow.closeSubpath()
                UIColor(red: 0.97, green: 0.98, blue: 1, alpha: 1).setFill()
                c.addPath(snow)
                c.fillPath()
                hill(338, 14, UIColor(red: 0.5, green: 0.6, blue: 0.62, alpha: 1), phase: 0.6, freq: 3)
                // See mit Spiegelbild
                UIColor(red: 0.5, green: 0.68, blue: 0.86, alpha: 1).setFill()
                c.fill(CGRect(x: 0, y: 340, width: 1024, height: 172))
                c.saveGState()
                c.translateBy(x: 0, y: 340 * 2 + 4)
                c.scaleBy(x: 1, y: -1)
                c.setAlpha(0.28)
                UIColor(red: 0.35, green: 0.45, blue: 0.7, alpha: 1).setFill()
                c.addPath(mountain)
                c.fillPath()
                UIColor.white.setFill()
                c.addPath(snow)
                c.fillPath()
                c.restoreGState()
                UIColor.white.withAlphaComponent(0.5).setFill()
                for _ in 0..<26 {
                    let x = CGFloat(rng.range(40, 980)), y = CGFloat(rng.range(360, 500))
                    c.fill(CGRect(x: x, y: y, width: CGFloat(rng.range(20, 70)), height: 2))
                }
                // Rote Ahorne am Ufer
                for _ in 0..<14 {
                    let x = CGFloat(rng.range(0, 1024)), r = CGFloat(rng.range(16, 30))
                    UIColor(red: 0.84 + CGFloat(rng.range(0, 0.1)), green: CGFloat(rng.range(0.3, 0.55)), blue: 0.2, alpha: 1).setFill()
                    c.fillEllipse(in: CGRect(x: x - r, y: 334 - r, width: r * 2, height: r * 1.4))
                }
            case "satoyama":
                hill(250, 40, UIColor(red: 0.55, green: 0.7, blue: 0.62, alpha: 1), phase: 0.3, freq: 2.2)
                hill(300, 34, UIColor(red: 0.47, green: 0.66, blue: 0.42, alpha: 1), phase: 1.4, freq: 3)
                // Terrassenlinien
                for k in 0..<7 {
                    let y = CGFloat(330 + k * 24)
                    UIColor(red: 0.62 + CGFloat(k % 2) * 0.06, green: 0.78, blue: 0.48, alpha: 1).setFill()
                    c.fill(CGRect(x: 0, y: y, width: 1024, height: 24))
                    UIColor(red: 0.4, green: 0.55, blue: 0.32, alpha: 1).setFill()
                    c.fill(CGRect(x: 0, y: y, width: 1024, height: 3))
                }
                // Strohdächer
                for _ in 0..<4 {
                    let x = CGFloat(rng.range(80, 940)), y = CGFloat(rng.range(290, 320))
                    UIColor(red: 0.72, green: 0.6, blue: 0.4, alpha: 1).setFill()
                    let roof = CGMutablePath()
                    roof.move(to: CGPoint(x: x - 34, y: y))
                    roof.addLine(to: CGPoint(x: x, y: y - 28))
                    roof.addLine(to: CGPoint(x: x + 34, y: y))
                    roof.closeSubpath()
                    c.addPath(roof)
                    c.fillPath()
                    UIColor(red: 0.95, green: 0.9, blue: 0.8, alpha: 1).setFill()
                    c.fill(CGRect(x: x - 24, y: y, width: 48, height: 16))
                }
            default:
                hill(260, 36, UIColor(red: 0.56, green: 0.68, blue: 0.72, alpha: 1), phase: 0.9, freq: 2.4)
                hill(310, 26, UIColor(red: 0.5, green: 0.66, blue: 0.5, alpha: 1), phase: 2.1, freq: 3.4)
                // Ziegeldächer der Kleinstadt
                for k in 0..<16 {
                    let x = CGFloat(k) * 66 + CGFloat(rng.range(-10, 10)), y = CGFloat(rng.range(318, 352))
                    let w = CGFloat(rng.range(46, 62))
                    UIColor(red: 0.95, green: 0.9, blue: 0.82, alpha: 1).setFill()
                    c.fill(CGRect(x: x - w / 2 + 4, y: y, width: w - 8, height: 30))
                    UIColor(red: 0.37 + CGFloat(rng.range(0, 0.08)), green: 0.36, blue: 0.47, alpha: 1).setFill()
                    let roof = CGMutablePath()
                    roof.move(to: CGPoint(x: x - w / 2, y: y + 2))
                    roof.addLine(to: CGPoint(x: x - w / 4, y: y - 16))
                    roof.addLine(to: CGPoint(x: x + w / 4, y: y - 16))
                    roof.addLine(to: CGPoint(x: x + w / 2, y: y + 2))
                    roof.closeSubpath()
                    c.addPath(roof)
                    c.fillPath()
                }
                UIColor(red: 0.62, green: 0.74, blue: 0.56, alpha: 1).setFill()
                c.fill(CGRect(x: 0, y: 380, width: 1024, height: 132))
            }
            // weicher Übergang nach unten ins Wolkenmeer
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [UIColor(white: 1, alpha: 0).cgColor, UIColor(white: 1, alpha: 1).cgColor] as CFArray,
                               locations: [0, 1])!
            c.setBlendMode(.destinationOut)
            c.drawLinearGradient(g, start: CGPoint(x: 0, y: 400), end: CGPoint(x: 0, y: 512), options: [])
        }
    }

    /// Kleine Libelle für die Satoyama-Landschaft.
    static func dragonfly() -> UIImage {
        let size = CGSize(width: 32, height: 32)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            UIColor(red: 0.85, green: 0.92, blue: 1, alpha: 0.75).setFill()
            c.fillEllipse(in: CGRect(x: 3, y: 9, width: 12, height: 5))
            c.fillEllipse(in: CGRect(x: 17, y: 9, width: 12, height: 5))
            c.fillEllipse(in: CGRect(x: 4, y: 15, width: 11, height: 4))
            c.fillEllipse(in: CGRect(x: 17, y: 15, width: 11, height: 4))
            UIColor(red: 0.85, green: 0.3, blue: 0.2, alpha: 1).setFill()
            c.fill(CGRect(x: 15, y: 6, width: 2.5, height: 22))
            c.fillEllipse(in: CGRect(x: 13.5, y: 4, width: 5, height: 5))
        }
    }

    /// Flache Muster im Stil von Neko no Machi: klare Flächen, wenige Details.
    enum Pattern { case plain, pavers, roofTiles, beams, mortar, grass, rice, planks, dots, emblem, leaves, wood }

    static func neko(_ base: UIColor, _ pattern: Pattern, accent: UIColor? = nil, seed: UInt64 = 1) -> UIImage {
        let size = CGSize(width: 128, height: 128)
        var rng = Rand(seed)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            base.setFill()
            c.fill(CGRect(origin: .zero, size: size))
            let dark = UIColor(white: 0, alpha: 0.12)
            let light = UIColor(white: 1, alpha: 0.18)
            switch pattern {
            case .plain:
                break
            case .pavers:
                dark.setStroke()
                c.setLineWidth(3)
                for i in 0...4 {
                    c.move(to: CGPoint(x: 0, y: CGFloat(i) * 32)); c.addLine(to: CGPoint(x: 128, y: CGFloat(i) * 32))
                }
                for row in 0..<4 {
                    for k in 0...2 {
                        let x = CGFloat(k) * 64 + (row % 2 == 0 ? 0 : 32)
                        c.move(to: CGPoint(x: x, y: CGFloat(row) * 32)); c.addLine(to: CGPoint(x: x, y: CGFloat(row + 1) * 32))
                    }
                }
                c.strokePath()
            case .roofTiles:
                for row in 0..<8 {
                    (row % 2 == 0 ? light : dark).setFill()
                    c.fill(CGRect(x: 0, y: CGFloat(row) * 16 + 12, width: 128, height: 4))
                    UIColor(white: 0, alpha: 0.1).setFill()
                    for k in 0..<8 {
                        c.fillEllipse(in: CGRect(x: CGFloat(k) * 16 + (row % 2 == 0 ? 0 : 8), y: CGFloat(row) * 16 + 2, width: 12, height: 10))
                    }
                }
            case .beams:
                (accent ?? UIColor(red: 0.42, green: 0.29, blue: 0.21, alpha: 1)).setFill()
                c.fill(CGRect(x: 0, y: 0, width: 128, height: 10))
                c.fill(CGRect(x: 0, y: 118, width: 128, height: 10))
                c.fill(CGRect(x: 0, y: 0, width: 9, height: 128))
                c.fill(CGRect(x: 119, y: 0, width: 9, height: 128))
                c.fill(CGRect(x: 0, y: 60, width: 128, height: 6))
            case .mortar:
                dark.setStroke()
                c.setLineWidth(3)
                for row in 0..<5 {
                    let y = CGFloat(row) * 26
                    c.move(to: CGPoint(x: 0, y: y)); c.addLine(to: CGPoint(x: 128, y: y))
                    var x = CGFloat(row % 2 == 0 ? 0 : 20)
                    while x < 128 {
                        c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x, y: y + 26))
                        x += CGFloat(rng.range(30, 48))
                    }
                }
                c.strokePath()
            case .grass:
                for _ in 0..<70 {
                    (rng.next() > 0.5 ? light : dark).setStroke()
                    c.setLineWidth(2)
                    let x = CGFloat(rng.range(0, 128)), y = CGFloat(rng.range(0, 128))
                    c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x + CGFloat(rng.range(-3, 3)), y: y - 7))
                    c.strokePath()
                }
            case .rice:
                light.setFill()
                c.fill(CGRect(x: 0, y: 0, width: 128, height: 128))
                UIColor(red: 0.42, green: 0.66, blue: 0.3, alpha: 1).setStroke()
                c.setLineWidth(2.5)
                for row in 0..<6 {
                    for k in 0..<7 {
                        let x = 10 + CGFloat(k) * 18 + (row % 2 == 0 ? 0 : 9), y = 14 + CGFloat(row) * 21
                        for d in [-4, 0, 4] {
                            c.move(to: CGPoint(x: x, y: y)); c.addLine(to: CGPoint(x: x + CGFloat(d), y: y - 10))
                        }
                    }
                }
                c.strokePath()
            case .planks:
                dark.setFill()
                for i in 0..<5 { c.fill(CGRect(x: 0, y: CGFloat(i) * 26 + 24, width: 128, height: 3)) }
            case .dots:
                UIColor.white.withAlphaComponent(0.3).setFill()
                for ix in 0..<4 { for iy in 0..<4 {
                    c.fillEllipse(in: CGRect(x: 12 + CGFloat(ix) * 32, y: 12 + CGFloat(iy) * 32, width: 8, height: 8))
                } }
            case .emblem:
                UIColor.white.withAlphaComponent(0.6).setStroke()
                c.setLineWidth(5)
                c.strokeEllipse(in: CGRect(x: 30, y: 30, width: 68, height: 68))
                c.setLineWidth(3)
                c.strokeEllipse(in: CGRect(x: 48, y: 48, width: 32, height: 32))
            case .leaves:
                for _ in 0..<26 {
                    [UIColor(red: 0.86, green: 0.3, blue: 0.2, alpha: 0.85), UIColor(red: 0.96, green: 0.72, blue: 0.2, alpha: 0.85),
                     UIColor(red: 0.9, green: 0.5, blue: 0.2, alpha: 0.85)][Int(rng.next() * 2.99)].setFill()
                    let x = CGFloat(rng.range(0, 124)), y = CGFloat(rng.range(0, 124))
                    c.fillEllipse(in: CGRect(x: x, y: y, width: 6, height: 4))
                }
            case .wood:
                (accent ?? UIColor.white).setFill()
                c.fill(CGRect(x: 0, y: 40, width: 128, height: 14))
                UIColor(red: 0.25, green: 0.18, blue: 0.16, alpha: 1).setFill()
                c.fill(CGRect(x: 0, y: 0, width: 128, height: 6))
                c.fill(CGRect(x: 0, y: 122, width: 128, height: 6))
            }
        }
    }

    /// Fallendes Ahornblatt für die Abendstimmung.
    static func leaf() -> UIImage {
        let size = CGSize(width: 32, height: 32)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            UIColor(red: 0.95, green: 0.5, blue: 0.2, alpha: 1).setFill()
            let path = UIBezierPath()
            for i in 0..<10 {
                let a = CGFloat(i) / 10 * .pi * 2 - .pi / 2
                let r: CGFloat = i % 2 == 0 ? 14 : 6
                let pt = CGPoint(x: 16 + cos(a) * r, y: 16 + sin(a) * r)
                if i == 0 { path.move(to: pt) } else { path.addLine(to: pt) }
            }
            path.close()
            path.fill()
            UIColor(red: 1, green: 0.8, blue: 0.4, alpha: 0.5).setFill()
            c.fillEllipse(in: CGRect(x: 12, y: 12, width: 8, height: 8))
        }
    }

    /// Ghibli-Kumuluswolke: übereinander gestapelte, weich verlaufende Kuppeln mit lavendelfarbener Unterseite.
    static func cloud(seed: UInt64, warm: Bool = false, theme: Theme = Theme.named(nil)) -> UIImage {
        let size = CGSize(width: 512, height: 256)
        var rng = Rand(seed)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            let space = CGColorSpaceCreateDeviceRGB()
            var puffs: [(CGPoint, CGFloat)] = []
            let count = 9
            for i in 0..<count {
                let t = CGFloat(i) / CGFloat(count - 1)
                let x = 70 + t * 372 + CGFloat(rng.range(-20, 20))
                let mid = 1 - abs(t - 0.5) * 2
                let r = CGFloat(rng.range(38, 58)) + mid * 40
                let y = 190 - r * 0.75 - mid * 20
                puffs.append((CGPoint(x: x, y: y), r))
            }
            let shadow = warm ? theme.cloudWarmShadow : theme.cloudShadow
            let light = theme.cloudLight
            // Schattenschicht
            for (p, r) in puffs {
                let g = CGGradient(colorsSpace: space, colors: [shadow.withAlphaComponent(0.95).cgColor,
                                                                shadow.withAlphaComponent(0).cgColor] as CFArray,
                                   locations: [0.75, 1])!
                c.drawRadialGradient(g, startCenter: CGPoint(x: p.x, y: p.y + r * 0.18), startRadius: 0,
                                     endCenter: CGPoint(x: p.x, y: p.y + r * 0.18), endRadius: r, options: [])
            }
            // Lichtschicht
            for (p, r) in puffs {
                let center = CGPoint(x: p.x - r * 0.12, y: p.y - r * 0.12)
                let g = CGGradient(colorsSpace: space, colors: [light.cgColor,
                                                                light.withAlphaComponent(0.95).cgColor,
                                                                light.withAlphaComponent(0).cgColor] as CFArray,
                                   locations: [0, 0.68, 1])!
                c.drawRadialGradient(g, startCenter: center, startRadius: 0, endCenter: center, endRadius: r * 0.86, options: [])
            }
        }
    }

    static func glow(color: UIColor = .white) -> UIImage {
        let size = CGSize(width: 64, height: 64)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [color.cgColor, color.withAlphaComponent(0.35).cgColor, color.withAlphaComponent(0).cgColor] as CFArray,
                               locations: [0, 0.35, 1])!
            ctx.cgContext.drawRadialGradient(g, startCenter: CGPoint(x: 32, y: 32), startRadius: 0,
                                             endCenter: CGPoint(x: 32, y: 32), endRadius: 32, options: [])
        }
    }

    static func petal() -> UIImage {
        let size = CGSize(width: 32, height: 32)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            Palette.blossom[1].setFill()
            c.fillEllipse(in: CGRect(x: 6, y: 10, width: 20, height: 12))
            UIColor.white.withAlphaComponent(0.6).setFill()
            c.fillEllipse(in: CGRect(x: 10, y: 13, width: 9, height: 5))
        }
    }

    static func ring() -> UIImage {
        let size = CGSize(width: 128, height: 128)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let c = ctx.cgContext
            UIColor.white.setStroke()
            c.setLineWidth(7)
            c.strokeEllipse(in: CGRect(x: 8, y: 8, width: 112, height: 112))
        }
    }

    // MARK: Materialien

    static func mat(_ contents: Any, lighting: SCNMaterial.LightingModel = .lambert) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = contents
        m.lightingModel = lighting
        return m
    }

    static func flat(_ color: UIColor, emission: UIColor? = nil) -> SCNMaterial {
        let m = mat(color)
        if let e = emission { m.emission.contents = e }
        return m
    }

    /// Materialien für einen Würfel in SceneKits Reihenfolge: vorne, rechts, hinten, links, oben, unten.
    static func blockMaterials(_ name: String) -> [SCNMaterial] {
        let top: SCNMaterial
        let side: SCNMaterial
        switch name {
        case "grass":
            top = mat(painted(Palette.grass, seed: 11, dabs: 90, strength: 0.13))
            side = mat(painted(Palette.sand, seed: 12))
        case "stone":
            top = mat(painted(Palette.stone, seed: 21, dabs: 40, strength: 0.06))
            side = mat(painted(Palette.stoneSide, seed: 22))
        case "stonedark":
            top = mat(painted(Palette.mauve, seed: 31))
            side = mat(painted(Palette.mauve, seed: 32))
        case "rock":
            top = mat(painted(Palette.rock, seed: 41, strength: 0.12))
            side = mat(painted(Palette.rock, seed: 42, strength: 0.12))
        case "rockdark":
            top = mat(painted(Palette.rockDark, seed: 51, strength: 0.12))
            side = mat(painted(Palette.rockDark, seed: 52, strength: 0.12))
        case "water":
            top = mat(painted(Palette.water, seed: 61, dabs: 30, strength: 0.18))
            top.emission.contents = UIColor(red: 0.1, green: 0.18, blue: 0.24, alpha: 1)
            side = mat(painted(Palette.sand, seed: 62))
        case "wood":
            top = mat(painted(Palette.wood, seed: 71, stripes: true))
            side = mat(painted(Palette.wood.withAlphaComponent(1), seed: 72, strength: 0.12, stripes: true))
        case "teal":
            top = mat(painted(Palette.teal, seed: 81, dots: true))
            side = mat(painted(Palette.teal, seed: 82, dots: true))
        case "tealdark":
            top = mat(painted(Palette.tealDark, seed: 91))
            side = mat(painted(Palette.tealDark, seed: 92, dots: true))
        case "raft":
            top = mat(painted(UIColor(red: 0.72, green: 0.5, blue: 0.34, alpha: 1), seed: 111, strength: 0.14, stripes: true))
            side = mat(painted(UIColor(red: 0.6, green: 0.4, blue: 0.28, alpha: 1), seed: 112, stripes: true))
        case "gate":
            top = mat(painted(Palette.vermilion, seed: 121, dabs: 30, emblem: true))
            side = mat(painted(Palette.vermilion, seed: 122, dabs: 30, emblem: true))
            side.emission.contents = UIColor(red: 0.18, green: 0.04, blue: 0.02, alpha: 1)
        // ---- Neko-no-Machi-Materialien (flach, klar) ----
        case "pavement":
            top = mat(neko(UIColor(red: 0.85, green: 0.8, blue: 0.69, alpha: 1), .pavers, seed: 201))
            side = mat(neko(UIColor(red: 0.93, green: 0.89, blue: 0.82, alpha: 1), .beams, accent: UIColor(red: 0.62, green: 0.58, blue: 0.52, alpha: 1)))
        case "garden":
            top = mat(neko(UIColor(red: 0.47, green: 0.69, blue: 0.38, alpha: 1), .grass, seed: 202))
            side = mat(neko(UIColor(red: 0.93, green: 0.89, blue: 0.82, alpha: 1), .beams, accent: UIColor(red: 0.62, green: 0.58, blue: 0.52, alpha: 1)))
        case "roof":
            top = mat(neko(UIColor(red: 0.42, green: 0.41, blue: 0.52, alpha: 1), .roofTiles, seed: 203))
            side = mat(neko(UIColor(red: 0.94, green: 0.9, blue: 0.82, alpha: 1), .beams))
        case "foundation":
            top = mat(neko(UIColor(red: 0.64, green: 0.62, blue: 0.57, alpha: 1), .mortar, seed: 204))
            side = mat(neko(UIColor(red: 0.64, green: 0.62, blue: 0.57, alpha: 1), .mortar, seed: 205))
        case "foundationdark":
            top = mat(neko(UIColor(red: 0.54, green: 0.52, blue: 0.47, alpha: 1), .mortar, seed: 206))
            side = mat(neko(UIColor(red: 0.54, green: 0.52, blue: 0.47, alpha: 1), .mortar, seed: 207))
        case "woodplank":
            top = mat(neko(UIColor(red: 0.6, green: 0.42, blue: 0.27, alpha: 1), .planks))
            side = mat(neko(UIColor(red: 0.5, green: 0.34, blue: 0.22, alpha: 1), .planks))
        case "mech":
            top = mat(neko(UIColor(red: 0.25, green: 0.44, blue: 0.69, alpha: 1), .dots))
            side = mat(neko(UIColor(red: 0.25, green: 0.44, blue: 0.69, alpha: 1), .dots))
        case "mechdark":
            top = mat(neko(UIColor(red: 0.18, green: 0.33, blue: 0.56, alpha: 1), .plain))
            side = mat(neko(UIColor(red: 0.18, green: 0.33, blue: 0.56, alpha: 1), .dots))
        case "mechtop":
            top = mat(neko(UIColor(red: 0.5, green: 0.65, blue: 0.85, alpha: 1), .emblem))
            side = mat(neko(UIColor(red: 0.25, green: 0.44, blue: 0.69, alpha: 1), .dots))
        case "satograss":
            top = mat(neko(UIColor(red: 0.56, green: 0.75, blue: 0.37, alpha: 1), .grass, seed: 208))
            side = mat(neko(UIColor(red: 0.72, green: 0.6, blue: 0.45, alpha: 1), .plain))
        case "paddy":
            top = mat(neko(UIColor(red: 0.55, green: 0.76, blue: 0.68, alpha: 1), .rice))
            side = mat(neko(UIColor(red: 0.72, green: 0.6, blue: 0.45, alpha: 1), .plain))
        case "earth":
            top = mat(neko(UIColor(red: 0.8, green: 0.71, blue: 0.54, alpha: 1), .grass, seed: 209))
            side = mat(neko(UIColor(red: 0.85, green: 0.76, blue: 0.63, alpha: 1), .beams))
        case "earthdark":
            top = mat(neko(UIColor(red: 0.61, green: 0.52, blue: 0.38, alpha: 1), .plain))
            side = mat(neko(UIColor(red: 0.61, green: 0.52, blue: 0.38, alpha: 1), .mortar, seed: 210))
        case "autumn":
            top = mat(neko(UIColor(red: 0.69, green: 0.68, blue: 0.38, alpha: 1), .leaves, seed: 211))
            side = mat(neko(UIColor(red: 0.74, green: 0.71, blue: 0.66, alpha: 1), .mortar, seed: 212))
        case "stonegrey":
            top = mat(neko(UIColor(red: 0.81, green: 0.79, blue: 0.76, alpha: 1), .pavers, seed: 213))
            side = mat(neko(UIColor(red: 0.72, green: 0.7, blue: 0.66, alpha: 1), .mortar, seed: 214))
        case "stonegreydark":
            top = mat(neko(UIColor(red: 0.58, green: 0.56, blue: 0.53, alpha: 1), .plain))
            side = mat(neko(UIColor(red: 0.58, green: 0.56, blue: 0.53, alpha: 1), .mortar, seed: 215))
        case "pagoda":
            top = mat(neko(UIColor(red: 0.66, green: 0.42, blue: 0.24, alpha: 1), .planks))
            side = mat(neko(UIColor(red: 0.77, green: 0.27, blue: 0.17, alpha: 1), .wood, accent: UIColor(red: 0.94, green: 0.9, blue: 0.82, alpha: 1)))
        case "tealtop":
            top = mat(painted(Palette.tealTop, seed: 101, dabs: 30, emblem: true))
            side = mat(painted(Palette.teal, seed: 102, dots: true))
        default:
            top = mat(Palette.stone)
            side = mat(Palette.stoneSide)
        }
        let bottom = mat(Palette.rockDark)
        return [side, side, side, side, top, bottom]
    }
}
