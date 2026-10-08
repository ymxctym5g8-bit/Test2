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
}
