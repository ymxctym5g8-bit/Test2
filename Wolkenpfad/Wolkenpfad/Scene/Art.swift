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

    static func skyGradient() -> UIImage {
        let size = CGSize(width: 8, height: 512)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            let colors = [
                UIColor(red: 0.52, green: 0.73, blue: 0.93, alpha: 1).cgColor,
                UIColor(red: 0.74, green: 0.86, blue: 0.95, alpha: 1).cgColor,
                UIColor(red: 0.99, green: 0.93, blue: 0.84, alpha: 1).cgColor,
                UIColor(red: 0.99, green: 0.82, blue: 0.74, alpha: 1).cgColor,
                UIColor(red: 0.93, green: 0.72, blue: 0.74, alpha: 1).cgColor,
            ] as CFArray
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 0.3, 0.6, 0.82, 1])!
            ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: size.height), options: [])
        }
    }

    /// Ghibli-Kumuluswolke: übereinander gestapelte, weich verlaufende Kuppeln mit lavendelfarbener Unterseite.
    static func cloud(seed: UInt64, warm: Bool = false) -> UIImage {
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
            let shadow = warm ? UIColor(red: 0.93, green: 0.74, blue: 0.78, alpha: 1) : UIColor(red: 0.76, green: 0.78, blue: 0.9, alpha: 1)
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
                let g = CGGradient(colorsSpace: space, colors: [UIColor.white.cgColor,
                                                                UIColor(white: 1, alpha: 0.95).cgColor,
                                                                UIColor(white: 1, alpha: 0).cgColor] as CFArray,
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
