import UIKit
import SceneKit

/// Requisiten im Stil von „Neko no Machi“: klare Formen, flache Farben.
/// Ursprung jeweils = Mitte der Oberseite des Feldes.
enum NekoPalette {
    static let plaster = UIColor(red: 0.94, green: 0.9, blue: 0.82, alpha: 1)
    static let woodDark = UIColor(red: 0.42, green: 0.29, blue: 0.21, alpha: 1)
    static let wood = UIColor(red: 0.6, green: 0.42, blue: 0.27, alpha: 1)
    static let roof = UIColor(red: 0.37, green: 0.36, blue: 0.47, alpha: 1)
    static let red = UIColor(red: 0.85, green: 0.22, blue: 0.2, alpha: 1)
    static let vermilion = UIColor(red: 0.77, green: 0.27, blue: 0.17, alpha: 1)
    static let blue = UIColor(red: 0.25, green: 0.44, blue: 0.69, alpha: 1)
    static let straw = UIColor(red: 0.8, green: 0.68, blue: 0.43, alpha: 1)
    static let stone = UIColor(red: 0.66, green: 0.64, blue: 0.6, alpha: 1)
    static let leaf = UIColor(red: 0.47, green: 0.69, blue: 0.38, alpha: 1)
    static let noren = [UIColor(red: 0.2, green: 0.3, blue: 0.5, alpha: 1), UIColor(red: 0.36, green: 0.55, blue: 0.4, alpha: 1),
                        UIColor(red: 0.78, green: 0.3, blue: 0.28, alpha: 1)]
}

extension Props {
    static func box(_ w: Float, _ h: Float, _ l: Float, _ color: UIColor, _ pos: SIMD3<Float>, chamfer: CGFloat = 0.01) -> SCNNode {
        node(SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(l), chamferRadius: chamfer), Art.flat(color), pos)
    }

    static func boxTex(_ w: Float, _ h: Float, _ l: Float, _ image: UIImage, _ pos: SIMD3<Float>) -> SCNNode {
        node(SCNBox(width: CGFloat(w), height: CGFloat(h), length: CGFloat(l), chamferRadius: 0.01), Art.mat(image), pos)
    }

    static func cylinder(_ r: Float, _ h: Float, _ color: UIColor, _ pos: SIMD3<Float>) -> SCNNode {
        node(SCNCylinder(radius: CGFloat(r), height: CGFloat(h)), Art.flat(color), pos)
    }

    /// Satteldach aus zwei geneigten Platten, First entlang X.
    static func gableRoof(width: Float, depth: Float, rise: Float, color: UIColor, at y: Float) -> SCNNode {
        let roof = SCNNode()
        let slope = (depth / 2 * depth / 2 + rise * rise).squareRoot()
        let angle = atan2(rise, depth / 2)
        for side: Float in [1, -1] {
            let plate = box(width, 0.05, slope + 0.08, color, .zero)
            plate.simdPosition = SIMD3(0, y + rise / 2, side * depth / 4)
            plate.eulerAngles.x = side * angle
            roof.addChildNode(plate)
        }
        roof.addChildNode(box(width + 0.04, 0.06, 0.08, color.withAlphaComponent(1), SIMD3(0, y + rise + 0.01, 0)))
        return roof
    }

    // MARK: Kleinstadt

    /// Zweistöckiges Holzhaus mit Ziegeldach; Variante 1 = Laden mit Markise und Noren.
    static func house(variant: Int, scale s: Float) -> SCNNode {
        let root = SCNNode()
        let wall = Art.neko(NekoPalette.plaster, .beams)
        root.addChildNode(boxTex(0.82, 0.62, 0.78, wall, SIMD3(0, 0.31, 0)))
        root.addChildNode(gableRoof(width: 0.98, depth: 0.96, rise: 0.26, color: NekoPalette.roof, at: 0.6))
        // Schiebetür und Fenster auf der Vorderseite (+Z)
        root.addChildNode(box(0.26, 0.3, 0.02, UIColor(red: 0.96, green: 0.93, blue: 0.84, alpha: 1), SIMD3(0.18, 0.16, 0.395)))
        root.addChildNode(box(0.02, 0.3, 0.025, NekoPalette.woodDark, SIMD3(0.18, 0.16, 0.4)))
        root.addChildNode(box(0.2, 0.14, 0.02, UIColor(red: 0.98, green: 0.92, blue: 0.7, alpha: 1), SIMD3(-0.2, 0.44, 0.395)))
        if variant == 1 {
            // Laden: gestreifte Markise und Noren-Vorhang
            let awning = SCNNode()
            for k in 0..<6 {
                let stripe = box(0.135, 0.04, 0.2, k % 2 == 0 ? NekoPalette.red : .white, SIMD3(-0.34 + Float(k) * 0.135, 0, 0))
                awning.addChildNode(stripe)
            }
            awning.simdPosition = SIMD3(0, 0.36, 0.48)
            awning.eulerAngles.x = 0.35
            root.addChildNode(awning)
            root.addChildNode(box(0.22, 0.12, 0.02, NekoPalette.noren[0], SIMD3(0.18, 0.26, 0.41)))
            root.addChildNode(chochin(scale: 0.6).withPosition(SIMD3(-0.3, 0.3, 0.45)))
        } else {
            // Wohnhaus mit kleiner Wäscheleine unter dem Fenster
            root.addChildNode(box(0.86, 0.03, 0.12, NekoPalette.woodDark, SIMD3(0, 0.34, 0.44)))
        }
        root.scale = SCNVector3(s, s, s)
        return root
    }

    /// Strommast an der hinteren Ecke des Feldes.
    static func powerPole(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let grey = UIColor(red: 0.52, green: 0.46, blue: 0.4, alpha: 1)
        root.addChildNode(cylinder(0.035, 1.7, grey, SIMD3(0, 0.85, 0)))
        root.addChildNode(box(0.42, 0.04, 0.04, grey, SIMD3(0, 1.55, 0)))
        root.addChildNode(box(0.3, 0.03, 0.03, grey, SIMD3(0, 1.42, 0)))
        for x: Float in [-0.18, 0.18] {
            root.addChildNode(cylinder(0.018, 0.05, .white, SIMD3(x, 1.59, 0)))
        }
        root.scale = SCNVector3(s, s, s)
        return root
    }

    /// Leicht durchhängende Leitung zwischen zwei Punkten, optional mit Spatzen.
    static func wire(from a: SIMD3<Float>, to b: SIMD3<Float>, sparrows: Int) -> SCNNode {
        let root = SCNNode()
        let sag: Float = 0.25
        var pts: [SIMD3<Float>] = []
        for i in 0...8 {
            let t = Float(i) / 8
            var p = a + (b - a) * t
            p.y -= sag * 4 * t * (1 - t)
            pts.append(p)
        }
        let dark = Art.flat(UIColor(red: 0.2, green: 0.18, blue: 0.2, alpha: 1))
        for i in 0..<8 {
            let p0 = pts[i], p1 = pts[i + 1]
            let d = p1 - p0
            let len = (d.x * d.x + d.y * d.y + d.z * d.z).squareRoot()
            let seg = node(SCNCylinder(radius: 0.008, height: CGFloat(len)), dark, (p0 + p1) / 2)
            seg.look(at: v3(p1), up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 1, 0))
            root.addChildNode(seg)
        }
        for k in 0..<sparrows {
            let t = Float(k + 1) / Float(sparrows + 1)
            let i = min(7, Int(t * 8))
            let bird = Characters.sparrow(scale: 0.55)
            bird.simdPosition = pts[i] + SIMD3(0, 0.05, 0)
            root.addChildNode(bird)
        }
        root.castsShadow = false
        return root
    }

    /// Wäscheleine an der Vorderkante eines Feldes.
    static func laundry(seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let cols = [UIColor(red: 0.95, green: 0.6, blue: 0.62, alpha: 1), UIColor(red: 0.98, green: 0.88, blue: 0.5, alpha: 1),
                    UIColor(red: 0.62, green: 0.84, blue: 0.62, alpha: 1), .white, UIColor(red: 0.6, green: 0.75, blue: 0.95, alpha: 1)]
        for x: Float in [-0.45, 0.45] { root.addChildNode(cylinder(0.015, 0.5, NekoPalette.woodDark, SIMD3(x, -0.05, 0.04))) }
        root.addChildNode(cylinder(0.006, 0.9, UIColor(white: 0.25, alpha: 1), SIMD3(0, 0.18, 0.04)).rotated(z: .pi / 2))
        for k in 0..<4 {
            let x = -0.32 + Float(k) * 0.21
            let cloth = box(0.15, Float(rng.range(0.14, 0.24)), 0.01, cols[k % cols.count], .zero)
            cloth.simdPosition = SIMD3(x, 0.18 - 0.09, 0.05)
            let sway = SCNAction.sequence([.rotateBy(x: 0.12, y: 0, z: 0, duration: 1.4), .rotateBy(x: -0.12, y: 0, z: 0, duration: 1.4)])
            sway.timingMode = .easeInEaseOut
            cloth.runAction(.sequence([.wait(duration: rng.range(0, 1)), .repeatForever(sway)]))
            root.addChildNode(cloth)
        }
        return root
    }

    static func vending() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box(0.32, 0.56, 0.24, NekoPalette.blue, SIMD3(0.28, 0.28, -0.28)))
        let panel = box(0.24, 0.26, 0.01, .white, SIMD3(0.28, 0.38, -0.155))
        panel.geometry?.firstMaterial?.diffuse.contents = Art.neko(UIColor(red: 0.95, green: 0.95, blue: 0.95, alpha: 1), .dots)
        panel.geometry?.firstMaterial?.emission.contents = UIColor(white: 0.4, alpha: 1)
        root.addChildNode(panel)
        let cans = [NekoPalette.red, UIColor(red: 0.98, green: 0.78, blue: 0.2, alpha: 1), NekoPalette.leaf, NekoPalette.blue]
        for (i, c) in cans.enumerated() {
            root.addChildNode(cylinder(0.022, 0.05, c, SIMD3(0.21 + Float(i) * 0.045, 0.42, -0.148)))
        }
        root.addChildNode(box(0.2, 0.04, 0.01, UIColor(white: 0.15, alpha: 1), SIMD3(0.28, 0.12, -0.155)))
        return root
    }

    static func postbox() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder(0.025, 0.2, UIColor(white: 0.3, alpha: 1), SIMD3(0.3, 0.1, 0.3)))
        root.addChildNode(cylinder(0.09, 0.26, NekoPalette.red, SIMD3(0.3, 0.33, 0.3)))
        root.addChildNode(sphere(0.09, NekoPalette.red, SIMD3(0.3, 0.46, 0.3)))
        root.addChildNode(box(0.08, 0.015, 0.02, UIColor(white: 0.15, alpha: 1), SIMD3(0.3, 0.4, 0.385)))
        return root
    }

    static func bench() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box(0.5, 0.04, 0.16, NekoPalette.wood, SIMD3(0, 0.16, -0.3)))
        root.addChildNode(box(0.5, 0.1, 0.03, NekoPalette.wood, SIMD3(0, 0.26, -0.37)))
        for x: Float in [-0.2, 0.2] { root.addChildNode(box(0.04, 0.16, 0.14, NekoPalette.woodDark, SIMD3(x, 0.08, -0.3))) }
        return root
    }

    static func planter(seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        for (i, x) in [Float(-0.32), 0.32].enumerated() {
            root.addChildNode(box(0.22, 0.14, 0.16, UIColor(red: 0.7, green: 0.42, blue: 0.3, alpha: 1), SIMD3(x, 0.07, -0.33)))
            root.addChildNode(sphere(0.1, NekoPalette.leaf, SIMD3(x, 0.18, -0.33)))
            for k in 0..<3 {
                root.addChildNode(sphere(0.03, [Palette.blossom[0], .white, UIColor(red: 1, green: 0.85, blue: 0.4, alpha: 1)][(k + i) % 3],
                                         SIMD3(x + Float(rng.range(-0.07, 0.07)), 0.26, -0.33 + Float(rng.range(-0.05, 0.05))), segments: 8))
            }
        }
        return root
    }

    /// Rote Papierlaterne (Chōchin).
    static func chochin(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let paper = Art.flat(NekoPalette.red, emission: UIColor(red: 0.45, green: 0.08, blue: 0.04, alpha: 1))
        let body = node(SCNSphere(radius: 0.09), paper)
        body.scale = SCNVector3(1, 1.3, 1)
        root.addChildNode(body)
        root.addChildNode(cylinder(0.06, 0.02, UIColor(white: 0.12, alpha: 1), SIMD3(0, 0.115, 0)))
        root.addChildNode(cylinder(0.06, 0.02, UIColor(white: 0.12, alpha: 1), SIMD3(0, -0.115, 0)))
        let glow = billboardGlow(size: 0.5, color: UIColor(red: 1, green: 0.6, blue: 0.4, alpha: 0.8))
        root.addChildNode(glow)
        root.scale = SCNVector3(s, s, s)
        return root
    }

    // MARK: Satoyama

    /// Bauernhaus mit dickem Strohdach.
    static func minka(scale s: Float) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(boxTex(0.8, 0.42, 0.72, Art.neko(UIColor(red: 0.55, green: 0.38, blue: 0.24, alpha: 1), .beams,
                                                              accent: UIColor(red: 0.32, green: 0.22, blue: 0.16, alpha: 1)), SIMD3(0, 0.21, 0)))
        let thatch = node(SCNPyramid(width: 1.08, height: 0.62, length: 1.0), Art.mat(Art.neko(NekoPalette.straw, .grass, seed: 301)),
                          SIMD3(0, 0.4, 0))
        root.addChildNode(thatch)
        root.addChildNode(box(0.5, 0.08, 0.14, UIColor(red: 0.3, green: 0.24, blue: 0.2, alpha: 1), SIMD3(0, 0.98, 0)))
        root.addChildNode(sphere(0.12, NekoPalette.leaf, SIMD3(0.18, 1.0, 0)))
        root.addChildNode(box(0.22, 0.26, 0.02, UIColor(red: 0.96, green: 0.92, blue: 0.82, alpha: 1), SIMD3(-0.15, 0.14, 0.365)))
        root.scale = SCNVector3(s, s, s)
        return root
    }

    /// Drei Jizō-Statuen mit roten Lätzchen.
    static func jizo() -> SCNNode {
        let root = SCNNode()
        for (i, x) in [Float(-0.16), 0, 0.16].enumerated() {
            let z: Float = -0.3 + (i == 1 ? -0.04 : 0)
            root.addChildNode(node(SCNCapsule(capRadius: 0.06, height: 0.2), Art.flat(NekoPalette.stone), SIMD3(x, 0.1, z)))
            root.addChildNode(sphere(0.055, NekoPalette.stone, SIMD3(x, 0.24, z)))
            root.addChildNode(node(SCNCone(topRadius: 0.03, bottomRadius: 0.07, height: 0.07), Art.flat(NekoPalette.red), SIMD3(x, 0.15, z + 0.015)))
        }
        root.addChildNode(box(0.5, 0.03, 0.16, NekoPalette.woodDark, SIMD3(0, 0.32, -0.3)))
        return root
    }

    static func kakashi() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder(0.018, 0.55, NekoPalette.woodDark, SIMD3(0.3, 0.27, -0.3)))
        root.addChildNode(cylinder(0.014, 0.4, NekoPalette.woodDark, SIMD3(0.3, 0.42, -0.3)).rotated(z: .pi / 2))
        root.addChildNode(box(0.16, 0.16, 0.08, NekoPalette.blue, SIMD3(0.3, 0.38, -0.3)))
        root.addChildNode(sphere(0.06, UIColor(red: 0.95, green: 0.92, blue: 0.85, alpha: 1), SIMD3(0.3, 0.52, -0.3)))
        root.addChildNode(node(SCNCone(topRadius: 0.01, bottomRadius: 0.12, height: 0.07), Art.flat(NekoPalette.straw), SIMD3(0.3, 0.6, -0.3)))
        return root
    }

    static func haystack() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(node(SCNCone(topRadius: 0.02, bottomRadius: 0.22, height: 0.45), Art.mat(Art.neko(NekoPalette.straw, .grass, seed: 302)),
                               SIMD3(0, 0.22, 0)))
        root.addChildNode(cylinder(0.12, 0.03, UIColor(red: 0.55, green: 0.4, blue: 0.25, alpha: 1), SIMD3(0, 0.25, 0)))
        return root
    }

    // MARK: Fuji

    /// Fünfstöckige Pagode – das Wahrzeichen am See.
    static func pagoda(scale s: Float) -> SCNNode {
        let root = SCNNode()
        var y: Float = 0
        for level in 0..<5 {
            let w = 0.72 - Float(level) * 0.08
            let h: Float = 0.32
            root.addChildNode(boxTex(w, h, w, Art.neko(NekoPalette.vermilion, .wood, accent: NekoPalette.plaster), SIMD3(0, y + h / 2, 0)))
            root.addChildNode(box(w + 0.32, 0.05, w + 0.32, UIColor(red: 0.22, green: 0.2, blue: 0.24, alpha: 1), SIMD3(0, y + h + 0.025, 0)))
            root.addChildNode(box(w + 0.2, 0.04, w + 0.2, UIColor(red: 0.3, green: 0.28, blue: 0.32, alpha: 1), SIMD3(0, y + h + 0.07, 0)))
            y += h + 0.09
        }
        root.addChildNode(cylinder(0.025, 0.55, Palette.brass, SIMD3(0, y + 0.27, 0)))
        for k in 0..<5 { root.addChildNode(cylinder(0.05, 0.02, Palette.brass, SIMD3(0, y + 0.08 + Float(k) * 0.08, 0))) }
        root.scale = SCNVector3(s, s, s)
        return root
    }

    /// Aussichtsturm „Fuji-mi-dai“.
    static func lookout() -> SCNNode {
        let root = SCNNode()
        for x: Float in [-0.3, 0.3] {
            for z: Float in [-0.3, 0.3] { root.addChildNode(cylinder(0.025, 0.9, NekoPalette.woodDark, SIMD3(x, 0.45, z))) }
        }
        root.addChildNode(box(0.74, 0.05, 0.74, NekoPalette.wood, SIMD3(0, 0.9, 0)))
        root.addChildNode(box(0.74, 0.03, 0.03, NekoPalette.wood, SIMD3(0, 1.08, 0.36)))
        root.addChildNode(box(0.03, 0.03, 0.74, NekoPalette.wood, SIMD3(0.36, 1.08, 0)))
        root.addChildNode(box(0.34, 0.12, 0.02, UIColor(red: 0.94, green: 0.9, blue: 0.8, alpha: 1), SIMD3(0, 0.62, 0.32)))
        return root
    }

    /// Dango-Stand mit Noren und Spießen.
    static func dangoStall() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(box(0.72, 0.32, 0.4, NekoPalette.wood, SIMD3(0, 0.16, -0.18)))
        root.addChildNode(box(0.84, 0.05, 0.56, UIColor(red: 0.3, green: 0.24, blue: 0.2, alpha: 1), SIMD3(0, 0.66, -0.12)))
        for x: Float in [-0.36, 0.36] { root.addChildNode(cylinder(0.02, 0.36, NekoPalette.woodDark, SIMD3(x, 0.48, 0.1))) }
        for k in 0..<4 {
            root.addChildNode(box(0.17, 0.14, 0.01, k % 2 == 0 ? NekoPalette.noren[0] : .white, SIMD3(-0.27 + Float(k) * 0.18, 0.56, 0.15)))
        }
        for k in 0..<3 {
            let x = -0.15 + Float(k) * 0.15
            root.addChildNode(cylinder(0.006, 0.2, NekoPalette.wood, SIMD3(x, 0.4, 0.03)))
            for (j, c) in [Palette.blossom[1], UIColor.white, UIColor(red: 0.6, green: 0.8, blue: 0.5, alpha: 1)].enumerated() {
                root.addChildNode(sphere(0.03, c, SIMD3(x, 0.36 + Float(j) * 0.055, 0.03), segments: 10))
            }
        }
        return root
    }

    static func pineRock() -> SCNNode {
        let root = SCNNode()
        let rock = sphere(0.3, NekoPalette.stone, SIMD3(0, 0.12, 0))
        rock.scale = SCNVector3(1, 0.7, 0.85)
        root.addChildNode(rock)
        let pine = tree(scale: 0.7, variant: 7, seed: 77)
        pine.simdPosition = SIMD3(0.05, 0.25, 0)
        root.addChildNode(pine)
        return root
    }

    // MARK: Sammelobjekte & Ziel

    /// Schwebendes Sushi-Stück (Nigiri, Maki oder Inari).
    static func sushi(kind: Int) -> SCNNode {
        let root = SCNNode()
        let inner = SCNNode()
        root.addChildNode(inner)
        switch kind % 3 {
        case 0:
            inner.addChildNode(box(0.16, 0.07, 0.09, .white, .zero, chamfer: 0.03))
            inner.addChildNode(box(0.18, 0.03, 0.1, UIColor(red: 0.98, green: 0.55, blue: 0.38, alpha: 1), SIMD3(0, 0.05, 0), chamfer: 0.012))
        case 1:
            inner.addChildNode(cylinder(0.07, 0.08, UIColor(red: 0.16, green: 0.22, blue: 0.16, alpha: 1), .zero))
            inner.addChildNode(cylinder(0.058, 0.082, .white, .zero))
            inner.addChildNode(cylinder(0.022, 0.084, UIColor(red: 0.95, green: 0.45, blue: 0.4, alpha: 1), .zero))
        default:
            inner.addChildNode(box(0.15, 0.08, 0.1, UIColor(red: 0.78, green: 0.52, blue: 0.24, alpha: 1), .zero, chamfer: 0.04))
        }
        let glow = billboardGlow(size: 0.5, color: UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 0.7))
        root.addChildNode(glow)
        inner.runAction(.repeatForever(.rotateBy(x: 0, y: .pi * 2, z: 0, duration: 4)))
        let bob = SCNAction.sequence([.moveBy(x: 0, y: 0.06, z: 0, duration: 1.1), .moveBy(x: 0, y: -0.06, z: 0, duration: 1.1)])
        bob.timingMode = .easeInEaseOut
        root.runAction(.repeatForever(bob))
        return root
    }

    /// Goldenes Glöckchen als Zielgegenstand in den Neko-Kapiteln.
    static func bell() -> SCNNode {
        let n = SCNNode()
        let gold = Art.flat(Palette.brass, emission: UIColor(red: 0.5, green: 0.35, blue: 0.05, alpha: 1))
        n.addChildNode(node(SCNSphere(radius: 0.075), gold))
        n.addChildNode(node(SCNTorus(ringRadius: 0.075, pipeRadius: 0.012), Art.flat(NekoPalette.red), .zero))
        n.addChildNode(box(0.05, 0.01, 0.01, UIColor(white: 0.15, alpha: 1), SIMD3(0, -0.03, 0.07)))
        n.addChildNode(node(SCNTorus(ringRadius: 0.02, pipeRadius: 0.006), gold, SIMD3(0, 0.085, 0)))
        return n
    }
}

extension SCNNode {
    func withPosition(_ p: SIMD3<Float>) -> SCNNode {
        simdPosition = p
        return self
    }

    func rotated(z: Float) -> SCNNode {
        eulerAngles.z = z
        return self
    }
}

// MARK: - Figuren der Neko-Kapitel

extension Characters {
    struct CatColors {
        let fur: UIColor
        let stripe: UIColor
        let patch: UIColor?
        let white: UIColor

        static let mochi = CatColors(fur: UIColor(red: 0.93, green: 0.58, blue: 0.27, alpha: 1),
                                     stripe: UIColor(red: 0.78, green: 0.4, blue: 0.16, alpha: 1), patch: nil, white: .white)
        static let calico = CatColors(fur: UIColor(white: 0.97, alpha: 1), stripe: UIColor(white: 0.97, alpha: 1),
                                      patch: UIColor(red: 0.9, green: 0.55, blue: 0.25, alpha: 1), white: .white)
        static let black = CatColors(fur: UIColor(white: 0.16, alpha: 1), stripe: UIColor(white: 0.1, alpha: 1), patch: nil,
                                     white: UIColor(white: 0.85, alpha: 1))
        static let grey = CatColors(fur: UIColor(red: 0.6, green: 0.6, blue: 0.64, alpha: 1), stripe: UIColor(red: 0.42, green: 0.42, blue: 0.46, alpha: 1),
                                    patch: nil, white: .white)
        static let all = [mochi, calico, black, grey]
    }

    /// Mochi, die orange Tigerkatze. Ursprung = Pfoten, Blickrichtung = +Z.
    static func cat(_ colors: CatColors = .mochi, scale: Float = 1) -> (root: SCNNode, body: SCNNode) {
        let root = SCNNode()
        root.name = "hero"
        let body = SCNNode()
        body.name = "body"
        root.addChildNode(body)
        let fur = Art.flat(colors.fur)
        let torso = Props.node(SCNCapsule(capRadius: 0.1, height: 0.4), fur, SIMD3(0, 0.2, 0))
        torso.eulerAngles.x = .pi / 2
        body.addChildNode(torso)
        body.addChildNode(Props.sphere(0.085, colors.white, SIMD3(0, 0.18, 0.13)))
        if let patch = colors.patch {
            body.addChildNode(Props.sphere(0.07, patch, SIMD3(0.05, 0.27, -0.06)))
            body.addChildNode(Props.sphere(0.05, UIColor(white: 0.15, alpha: 1), SIMD3(-0.05, 0.26, 0.05)))
        }
        for z: Float in [-0.1, 0, 0.1] {
            body.addChildNode(Props.box(0.17, 0.02, 0.035, colors.stripe, SIMD3(0, 0.3, z)))
        }
        for (x, z) in [(Float(-0.055), Float(0.12)), (0.055, 0.12), (-0.055, -0.12), (0.055, -0.12)] {
            body.addChildNode(Props.cylinder(0.033, 0.13, colors.fur, SIMD3(x, 0.065, z)))
            body.addChildNode(Props.sphere(0.035, colors.white, SIMD3(x, 0.02, z + 0.01), segments: 8))
        }
        // Kopf
        let head = SCNNode()
        head.simdPosition = SIMD3(0, 0.34, 0.2)
        body.addChildNode(head)
        let skull = Props.sphere(0.115, colors.fur, .zero)
        skull.scale = SCNVector3(1.1, 0.95, 1)
        head.addChildNode(skull)
        head.addChildNode(Props.sphere(0.05, colors.white, SIMD3(0, -0.035, 0.085)))
        head.addChildNode(Props.sphere(0.014, UIColor(red: 0.95, green: 0.55, blue: 0.6, alpha: 1), SIMD3(0, -0.01, 0.125), segments: 6))
        for x: Float in [-0.045, 0.045] {
            head.addChildNode(Props.sphere(0.017, UIColor(red: 0.15, green: 0.2, blue: 0.12, alpha: 1), SIMD3(x, 0.02, 0.1), segments: 8))
            let ear = Props.node(SCNCone(topRadius: 0, bottomRadius: 0.045, height: 0.085), Art.flat(colors.fur), SIMD3(x * 1.55, 0.1, -0.01))
            ear.eulerAngles.z = x > 0 ? -0.25 : 0.25
            head.addChildNode(ear)
            let inner = Props.node(SCNCone(topRadius: 0, bottomRadius: 0.025, height: 0.05), Art.flat(UIColor(red: 0.98, green: 0.7, blue: 0.7, alpha: 1)),
                                   SIMD3(x * 1.55, 0.095, 0.012))
            inner.eulerAngles.z = ear.eulerAngles.z
            head.addChildNode(inner)
        }
        // Schwanz: nach oben gebogen, wedelt langsam
        let tail = SCNNode()
        tail.simdPosition = SIMD3(0, 0.24, -0.22)
        body.addChildNode(tail)
        var p = SIMD3<Float>(0, 0, 0)
        for k in 0..<5 {
            p += SIMD3(0, 0.055, -0.03 + Float(k) * 0.012)
            tail.addChildNode(Props.sphere(0.03, k % 2 == 0 ? colors.fur : colors.stripe, p, segments: 8))
        }
        let wag = SCNAction.sequence([.rotateBy(x: 0, y: 0, z: 0.3, duration: 0.9), .rotateBy(x: 0, y: 0, z: -0.3, duration: 0.9)])
        wag.timingMode = .easeInEaseOut
        tail.runAction(.repeatForever(wag))
        root.scale = SCNVector3(scale * 1.05, scale * 1.05, scale * 1.05)
        root.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
        return (root, body)
    }

    /// Spatz – Begleiter in den Neko-Kapiteln und Gast auf den Stromleitungen.
    static func sparrow(scale: Float = 1) -> SCNNode {
        let root = SCNNode()
        let inner = SCNNode()
        inner.name = "inner"
        root.addChildNode(inner)
        let brown = UIColor(red: 0.55, green: 0.4, blue: 0.28, alpha: 1)
        let bodyN = Props.sphere(0.07, brown, .zero)
        bodyN.scale = SCNVector3(1, 0.9, 1.25)
        inner.addChildNode(bodyN)
        inner.addChildNode(Props.sphere(0.05, UIColor(red: 0.93, green: 0.88, blue: 0.78, alpha: 1), SIMD3(0, -0.015, 0.03)))
        inner.addChildNode(Props.sphere(0.048, UIColor(red: 0.45, green: 0.3, blue: 0.22, alpha: 1), SIMD3(0, 0.06, 0.06)))
        for x: Float in [-0.035, 0.035] {
            inner.addChildNode(Props.sphere(0.011, UIColor(white: 0.1, alpha: 1), SIMD3(x, 0.07, 0.1), segments: 6))
            inner.addChildNode(Props.sphere(0.013, UIColor(white: 0.12, alpha: 1), SIMD3(x * 1.2, 0.045, 0.085), segments: 6))
        }
        let beak = Props.node(SCNCone(topRadius: 0, bottomRadius: 0.014, height: 0.03), Art.flat(UIColor(white: 0.2, alpha: 1)), SIMD3(0, 0.055, 0.115))
        beak.eulerAngles.x = .pi / 2
        inner.addChildNode(beak)
        let tail = Props.box(0.05, 0.012, 0.07, UIColor(red: 0.4, green: 0.28, blue: 0.2, alpha: 1), SIMD3(0, 0.01, -0.1))
        tail.eulerAngles.x = -0.4
        inner.addChildNode(tail)
        for x: Float in [-1, 1] {
            let wing = Props.sphere(0.045, UIColor(red: 0.5, green: 0.35, blue: 0.24, alpha: 1), SIMD3(x * 0.06, 0.01, -0.01))
            wing.scale = SCNVector3(0.35, 0.8, 1.3)
            let flap = SCNAction.sequence([.wait(duration: 2, withRange: 2), .rotateBy(x: 0, y: 0, z: CGFloat(x) * 0.7, duration: 0.08),
                                           .rotateBy(x: 0, y: 0, z: CGFloat(-x) * 0.7, duration: 0.08)])
            wing.runAction(.repeatForever(flap))
            inner.addChildNode(wing)
        }
        inner.eulerAngles.y = .pi / 4
        let hop = SCNAction.sequence([.wait(duration: 3, withRange: 3), .moveBy(x: 0, y: 0.04, z: 0, duration: 0.08), .moveBy(x: 0, y: -0.04, z: 0, duration: 0.08)])
        inner.runAction(.repeatForever(hop))
        root.scale = SCNVector3(scale, scale, scale)
        root.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
        root.castsShadow = false
        return root
    }
}
