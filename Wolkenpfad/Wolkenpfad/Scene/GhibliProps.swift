import UIKit
import SceneKit

/// Requisiten der Ghibli-Kapitel. Ursprung = Mitte der Oberseite des Feldes; +x und +z zeigen zur Kamera.
extension Props {
    private static func swayAction(_ amount: CGFloat, _ duration: Double) -> SCNAction {
        let a = SCNAction.sequence([.rotateBy(x: amount * 0.6, y: 0, z: amount, duration: duration),
                                    .rotateBy(x: -amount * 0.6, y: 0, z: -amount, duration: duration)])
        a.timingMode = .easeInEaseOut
        return .repeatForever(a)
    }

    private static func bob(_ h: CGFloat, _ duration: Double) -> SCNAction {
        let a = SCNAction.sequence([.moveBy(x: 0, y: h, z: 0, duration: duration), .moveBy(x: 0, y: -h, z: 0, duration: duration)])
        a.timingMode = .easeInEaseOut
        return .repeatForever(a)
    }

    private static func glowMat(_ color: UIColor, alpha: CGFloat = 1) -> SCNMaterial {
        let m = SCNMaterial()
        m.diffuse.contents = color
        m.emission.contents = color
        m.lightingModel = .constant
        m.transparency = alpha
        return m
    }

    /// Verbindet zwei Punkte mit einem dünnen Zylinder.
    static func segment(_ a: SIMD3<Float>, _ b: SIMD3<Float>, radius: CGFloat, material: SCNMaterial) -> SCNNode {
        let d = b - a
        let len = (d.x * d.x + d.y * d.y + d.z * d.z).squareRoot()
        let n = node(SCNCylinder(radius: radius, height: CGFloat(max(len, 0.001))), material, (a + b) / 2)
        n.look(at: v3(b), up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 1, 0))
        return n
    }

    // MARK: Pflanzen und Wolken

    /// Mannshohes, im Wind wogendes Gras.
    static func tallGrass(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode(), sway = SCNNode()
        root.addChildNode(sway)
        let greens = [UIColor(hex: 0x8DBA4E), UIColor(hex: 0xA8C85E), UIColor(hex: 0x6F9E44), UIColor(hex: 0xC8C46A)]
        for _ in 0..<16 {
            let h = Float(rng.range(0.55, 1.05)) * s
            let x = Float(rng.range(-0.42, 0.25)), z = Float(rng.range(-0.42, 0.2))
            let blade = node(SCNCone(topRadius: 0, bottomRadius: CGFloat(0.02 * s), height: CGFloat(h)),
                             Art.flat(greens[Int(rng.next() * 4) % 4]), SIMD3(x, h / 2, z))
            blade.eulerAngles = SCNVector3(Float(rng.range(-0.15, 0.15)), 0, Float(rng.range(-0.2, 0.2)))
            sway.addChildNode(blade)
        }
        for _ in 0..<3 {
            let x = Float(rng.range(-0.35, 0.15)), z = Float(rng.range(-0.35, 0.15)), h = Float(rng.range(0.8, 1.1)) * s
            sway.addChildNode(sphere(0.045 * s, UIColor(hex: 0xE8DCA0), SIMD3(x, h, z), segments: 8))
        }
        sway.runAction(.sequence([.wait(duration: rng.range(0, 1.5)), swayAction(0.07, 1.6)]))
        return root
    }

    /// Weiche Wolke, die auf einem Block ruht.
    static func cloudPuff(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let m = Art.flat(UIColor(white: 0.98, alpha: 1), emission: UIColor(white: 0.25, alpha: 1))
        for _ in 0..<5 {
            let r = Float(rng.range(0.14, 0.26)) * s
            root.addChildNode(node(SCNSphere(radius: CGFloat(r)), m, SIMD3(Float(rng.range(-0.3, 0.2)), r * 0.7, Float(rng.range(-0.3, 0.2)))))
        }
        root.runAction(bob(0.04, 2.2))
        return root
    }

    /// Hohle Riesen-Eiche, die in den Wolken wurzelt.
    static func oak(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let bark = Art.mat(Art.painted(UIColor(hex: 0x6E5442), seed: seed, dabs: 120, strength: 0.18, stripes: true))
        let trunk = node(SCNCylinder(radius: CGFloat(0.42 * s), height: CGFloat(2.2 * s)), bark, SIMD3(-0.1, 1.1 * s, -0.1))
        root.addChildNode(trunk)
        // Höhle im Stamm (zur Kamera hin)
        let hollow = node(SCNSphere(radius: CGFloat(0.22 * s)), Art.flat(UIColor(hex: 0x1E1612)), SIMD3(0.18 * s, 0.55 * s, 0.18 * s))
        hollow.scale = SCNVector3(0.8, 1.4, 0.5)
        hollow.eulerAngles.y = .pi / 4
        root.addChildNode(hollow)
        for k in 0..<5 {                      // Wurzeln
            let a = Float(k) * 1.26
            root.addChildNode(segment(SIMD3(-0.1, 0.35 * s, -0.1), SIMD3(cos(a) * 0.55 * s, -0.05, sin(a) * 0.55 * s), radius: CGFloat(0.07 * s), material: bark))
        }
        let canopy = SCNNode()
        canopy.simdPosition = SIMD3(-0.1, 2.3 * s, -0.1)
        let greens = [UIColor(hex: 0x3E6E3E), UIColor(hex: 0x4E8048), UIColor(hex: 0x355E3A)]
        for k in 0..<9 {
            let a = Float(k) * 0.7
            canopy.addChildNode(sphere(Float(rng.range(0.45, 0.7)) * s, greens[k % 3],
                                       SIMD3(cos(a) * 0.6 * s, Float(rng.range(-0.1, 0.5)) * s, sin(a) * 0.6 * s)))
        }
        canopy.runAction(swayAction(0.02, 3))
        root.addChildNode(canopy)
        return root
    }

    /// Riesige, blau leuchtende Glockenblume mit einem kleinen Haus im Kelch.
    static func bellflower(scale s: Float, seed: UInt64, lights: Bool) -> SCNNode {
        let root = SCNNode()
        let stem = Art.flat(UIColor(hex: 0x4E7E5A))
        var p = SIMD3<Float>(-0.25, 0, -0.25)
        let pts: [SIMD3<Float>] = [SIMD3(-0.25, 0.6, -0.2), SIMD3(-0.15, 1.2, -0.1), SIMD3(0.05, 1.6, 0.0), SIMD3(0.25, 1.75, 0.1)]
        for q in pts { root.addChildNode(segment(p * s, q * s, radius: CGFloat(0.04 * s), material: stem)); p = q }
        let bell = SCNNode()
        bell.simdPosition = SIMD3(0.3, 1.6, 0.12) * s
        let petal = Art.flat(UIColor(hex: 0x7E9CF6), emission: UIColor(hex: 0x2E40A0))
        let cup = node(SCNCone(topRadius: CGFloat(0.12 * s), bottomRadius: CGFloat(0.36 * s), height: CGFloat(0.42 * s)), petal, SIMD3(0, -0.1 * s, 0))
        bell.addChildNode(cup)
        bell.addChildNode(sphere(0.13 * s, UIColor(hex: 0x8EAAFF), SIMD3(0, 0.1 * s, 0)))
        // Häuschen im Kelch
        let house = SCNNode()
        house.addChildNode(box(0.2 * s, 0.16 * s, 0.18 * s, UIColor(hex: 0xF4E6D0), SIMD3(0, -0.36 * s, 0)))
        house.addChildNode(box(0.07 * s, 0.07 * s, 0.01, UIColor(hex: 0xFFD98A), SIMD3(0.03 * s, -0.35 * s, 0.095 * s)))
        house.addChildNode(node(SCNPyramid(width: CGFloat(0.26 * s), height: CGFloat(0.1 * s), length: CGFloat(0.22 * s)),
                                Art.flat(UIColor(hex: 0x6E5A8E)), SIMD3(0, -0.28 * s, 0)))
        bell.addChildNode(house)
        bell.addChildNode(billboardGlow(size: CGFloat(0.9 * s), color: UIColor(hex: 0x9CB8FF, alpha: 0.8)))
        if lights {
            let l = SCNLight(); l.type = .omni; l.color = UIColor(hex: 0x9CB8FF); l.intensity = 260; l.attenuationEndDistance = 3
            let ln = SCNNode(); ln.light = l; ln.simdPosition = SIMD3(0, -0.4 * s, 0); bell.addChildNode(ln)
        }
        bell.runAction(swayAction(0.04, 2.4))
        root.addChildNode(bell)
        return root
    }

    /// Ein paar leuchtende Schmetterlinge, die umherflattern.
    static func butterflies(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let colors = [UIColor(hex: 0xFFE07A), UIColor(hex: 0xFF9ACB), UIColor(hex: 0x9CE8FF)]
        for k in 0..<4 {
            let plane = SCNPlane(width: CGFloat(0.16 * s), height: CGFloat(0.13 * s))
            let m = SCNMaterial()
            m.diffuse.contents = Art.butterfly(colors[k % 3])
            m.lightingModel = .constant
            m.blendMode = .add
            m.writesToDepthBuffer = false
            m.isDoubleSided = true
            plane.materials = [m]
            let b = SCNNode(geometry: plane)
            b.constraints = [SCNBillboardConstraint()]
            let orbit = SCNNode()
            orbit.simdPosition = SIMD3(0, Float(rng.range(0.3, 0.9)) * s, 0)
            b.simdPosition = SIMD3(Float(rng.range(0.15, 0.4)) * s, 0, 0)
            orbit.addChildNode(b)
            orbit.runAction(.repeatForever(.rotateBy(x: 0, y: .pi * 2 * (k % 2 == 0 ? 1 : -1), z: 0, duration: rng.range(5, 9))))
            orbit.runAction(bob(0.12, rng.range(0.8, 1.4)))
            let flap = SCNAction.sequence([.scale(to: 0.55, duration: 0.12), .scale(to: 1, duration: 0.12)])
            b.runAction(.repeatForever(flap))
            root.addChildNode(orbit)
        }
        return root
    }

    // MARK: Gebautes

    static func chest(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let wood = UIColor(hex: 0x8A5C3A), brass = Palette.brass
        root.addChildNode(box(0.44 * s, 0.24 * s, 0.28 * s, wood, SIMD3(-0.1, 0.12 * s, -0.12)))
        let lid = node(SCNCylinder(radius: CGFloat(0.14 * s), height: CGFloat(0.44 * s)), Art.flat(UIColor(hex: 0x7A4E30)), SIMD3(-0.1, 0.24 * s, -0.12))
        lid.eulerAngles.z = .pi / 2
        lid.scale = SCNVector3(1, 1, 0.55)
        root.addChildNode(lid)
        for x: Float in [-0.24, 0.04] { root.addChildNode(box(0.03 * s, 0.32 * s, 0.3 * s, brass, SIMD3(x, 0.16 * s, -0.12))) }
        root.addChildNode(box(0.06 * s, 0.07 * s, 0.02, brass, SIMD3(-0.1, 0.2 * s, 0.03)))
        return root
    }

    /// Dachsparren als A-Rahmen im Dachboden.
    static func beam(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let wood = Art.mat(Art.painted(UIColor(hex: 0x7E5236), seed: 9, stripes: true))
        root.addChildNode(segment(SIMD3(-0.45, 0, -0.4), SIMD3(-0.05, 1.5 * s, -0.4), radius: 0.05, material: wood))
        root.addChildNode(segment(SIMD3(0.35, 0, -0.4), SIMD3(-0.05, 1.5 * s, -0.4), radius: 0.05, material: wood))
        root.addChildNode(segment(SIMD3(-0.32, 0.75 * s, -0.4), SIMD3(0.22, 0.75 * s, -0.4), radius: 0.04, material: wood))
        root.addChildNode(segment(SIMD3(-0.05, 1.5 * s, -0.45), SIMD3(-0.05, 1.5 * s, 0.45), radius: 0.05, material: wood))
        return root
    }

    /// Großvaters vergilbtes Notizbuch, aufgeschlagen auf einem kleinen Pult.
    static func notebook() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder(0.03, 0.3, UIColor(hex: 0x7A5236), SIMD3(-0.15, 0.15, -0.15)))
        let book = SCNNode()
        book.simdPosition = SIMD3(-0.15, 0.32, -0.15)
        book.eulerAngles.x = -0.5
        for (x, a) in [(Float(-0.08), Float(0.12)), (0.08, -0.12)] {
            let page = box(0.15, 0.012, 0.2, UIColor(hex: 0xF2E4C0), SIMD3(x, 0, 0))
            page.eulerAngles.z = a
            book.addChildNode(page)
        }
        book.addChildNode(box(0.33, 0.008, 0.22, UIColor(hex: 0x6E3E2E), SIMD3(0, -0.012, 0)))
        book.addChildNode(billboardGlow(size: 0.5, color: UIColor(hex: 0xFFE6A0, alpha: 0.6)))
        root.addChildNode(book)
        return root
    }

    /// Unzustellbare Briefe, die an einer Schnur im Wind flattern (an der Vorderkante).
    static func letters(seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let string = Art.flat(UIColor(hex: 0x8A7A64))
        root.addChildNode(segment(SIMD3(-0.45, 0.02, 0.02), SIMD3(0.45, 0.02, 0.02), radius: 0.006, material: string))
        for k in 0..<4 {
            let x = -0.33 + Float(k) * 0.22
            let pivot = SCNNode()
            pivot.simdPosition = SIMD3(x, 0.02, 0.03)
            let paper = SCNPlane(width: 0.14, height: 0.1)
            let m = SCNMaterial(); m.diffuse.contents = Art.letterPaper(); m.isDoubleSided = true
            paper.materials = [m]
            let p = SCNNode(geometry: paper)
            p.simdPosition = SIMD3(0, -0.06, 0)
            pivot.addChildNode(p)
            let flutter = SCNAction.sequence([.rotateBy(x: 0.5, y: 0, z: 0.1, duration: rng.range(0.5, 0.9)),
                                              .rotateBy(x: -0.5, y: 0, z: -0.1, duration: rng.range(0.5, 0.9))])
            pivot.runAction(.repeatForever(flutter))
            root.addChildNode(pivot)
        }
        return root
    }

    /// Lichtschacht: schräg einfallendes, staubiges Licht.
    static func lightShaft(scale s: Float) -> SCNNode {
        let plane = SCNPlane(width: CGFloat(0.7 * s), height: CGFloat(3 * s))
        let m = SCNMaterial()
        m.diffuse.contents = UIGraphicsImageRenderer(size: CGSize(width: 32, height: 128)).image { ctx in
            let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(),
                               colors: [UIColor(hex: 0xFFE8B0, alpha: 0).cgColor, UIColor(hex: 0xFFE8B0, alpha: 0.5).cgColor,
                                        UIColor(hex: 0xFFE8B0, alpha: 0.12).cgColor] as CFArray, locations: [0, 0.6, 1])!
            ctx.cgContext.drawLinearGradient(g, start: .zero, end: CGPoint(x: 0, y: 128), options: [])
        }
        m.lightingModel = .constant
        m.blendMode = .add
        m.writesToDepthBuffer = false
        m.isDoubleSided = true
        plane.materials = [m]
        let n = SCNNode(geometry: plane)
        n.simdPosition = SIMD3(0, 1.4 * s, 0)
        n.eulerAngles = SCNVector3(0, Float.pi / 4, 0.35)
        n.castsShadow = false
        n.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.6, duration: 2.5), .fadeOpacity(to: 1, duration: 2.5)])))
        let root = SCNNode()
        root.addChildNode(n)
        return root
    }

    /// Alte, bemooste Windmühle mit sich drehenden Flügeln.
    static func windmill(face: String, scale s: Float) -> SCNNode {
        let root = SCNNode()
        let tower = Art.mat(Art.painted(UIColor(hex: 0xE6DCC4), seed: 41, dabs: 90, strength: 0.14))
        root.addChildNode(node(SCNCone(topRadius: CGFloat(0.18 * s), bottomRadius: CGFloat(0.3 * s), height: CGFloat(1.1 * s)), tower, SIMD3(-0.1, 0.55 * s, -0.1)))
        root.addChildNode(node(SCNCone(topRadius: 0, bottomRadius: CGFloat(0.24 * s), height: CGFloat(0.28 * s)), Art.flat(UIColor(hex: 0x7E5236)), SIMD3(-0.1, 1.24 * s, -0.1)))
        root.addChildNode(sphere(0.14 * s, UIColor(hex: 0x6E9E58), SIMD3(-0.24 * s, 0.2 * s, 0.05)))   // Moos
        let hub = SCNNode()
        hub.simdPosition = SIMD3(-0.1, 1.0 * s, -0.1) + (face == "+x" ? SIMD3(0.24 * s, 0, 0) : SIMD3(0, 0, 0.24 * s))
        if face == "+x" { hub.eulerAngles.y = .pi / 2 }
        let sails = SCNNode()
        let cloth = Art.mat(Art.painted(UIColor(hex: 0xF0E6D0), seed: 42, stripes: true))
        for k in 0..<4 {
            let arm = SCNNode()
            arm.eulerAngles.z = Float(k) * .pi / 2
            arm.addChildNode(box(0.03 * s, 0.75 * s, 0.03, UIColor(hex: 0x6E4A30), SIMD3(0, 0.38 * s, 0)))
            let sail = node(SCNBox(width: CGFloat(0.18 * s), height: CGFloat(0.55 * s), length: 0.01, chamferRadius: 0), cloth, SIMD3(0.1 * s, 0.45 * s, 0))
            arm.addChildNode(sail)
            sails.addChildNode(arm)
        }
        sails.runAction(.repeatForever(.rotateBy(x: 0, y: 0, z: -.pi * 2, duration: 9)))
        hub.addChildNode(sails)
        root.addChildNode(hub)
        return root
    }

    /// Holzgerüst der Brückenbauerin.
    static func scaffold(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let wood = Art.flat(UIColor(hex: 0x9C7048))
        for (x, z) in [(Float(-0.4), Float(-0.4)), (0.1, -0.4), (-0.4, 0.05), (0.1, 0.05)] {
            root.addChildNode(cylinder(0.025, 1.3 * s, UIColor(hex: 0x8A6240), SIMD3(x, 0.65 * s, z)))
        }
        root.addChildNode(box(0.6, 0.04, 0.55, UIColor(hex: 0xB08458), SIMD3(-0.15, 0.7 * s, -0.17)))
        root.addChildNode(segment(SIMD3(-0.4, 0.1, -0.4), SIMD3(0.1, 1.2 * s, -0.4), radius: 0.018, material: wood))
        root.addChildNode(segment(SIMD3(0.1, 0.1, 0.05), SIMD3(0.1, 1.2 * s, -0.4), radius: 0.018, material: wood))
        root.addChildNode(box(0.14, 0.1, 0.1, UIColor(hex: 0x6E9AB8), SIMD3(-0.25, 0.77 * s, -0.25)))   // Werkzeugkiste
        return root
    }

    /// Steinsäule eines alten Tempels, oben abgebrochen und bemoost.
    static func pillar(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let h = Float(rng.range(1.2, 1.8)) * s
        let stone = Art.mat(Art.painted(UIColor(hex: 0xDCD4C2), seed: seed, dabs: 100, strength: 0.14, stripes: true))
        root.addChildNode(node(SCNCylinder(radius: CGFloat(0.22 * s), height: CGFloat(h)), stone, SIMD3(-0.1, h / 2, -0.1)))
        root.addChildNode(box(0.6 * s, 0.1, 0.6 * s, UIColor(hex: 0xC8C0AE), SIMD3(-0.1, 0.05, -0.1)))
        root.addChildNode(sphere(0.16 * s, UIColor(hex: 0x6E9E58), SIMD3(-0.05, h, -0.05)))
        root.addChildNode(sphere(0.1 * s, UIColor(hex: 0x86B266), SIMD3(-0.25, h * 0.4, 0.05)))
        return root
    }

    /// Schlafender steinerner Wächter – eine Maschine der Vergangenheit.
    static func guardian(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let body = Art.mat(Art.painted(UIColor(hex: 0x9A8E7A), seed: 77, dabs: 120, strength: 0.16))
        let torso = node(SCNSphere(radius: CGFloat(0.32 * s)), body, SIMD3(-0.1, 0.32 * s, -0.12))
        torso.scale = SCNVector3(1, 0.9, 0.85)
        root.addChildNode(torso)
        let head = node(SCNCylinder(radius: CGFloat(0.13 * s), height: CGFloat(0.22 * s)), body, SIMD3(-0.02, 0.66 * s, -0.04))
        head.eulerAngles.x = 0.4
        root.addChildNode(head)
        let eye = sphere(0.035 * s, UIColor(hex: 0x6EE0C8), SIMD3(0.04, 0.68 * s, 0.07))
        eye.geometry?.firstMaterial?.emission.contents = UIColor(hex: 0x3EA090)
        eye.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.25, duration: 2.5), .fadeOpacity(to: 1, duration: 2.5)])))
        root.addChildNode(eye)
        for x: Float in [-0.42, 0.22] {
            root.addChildNode(segment(SIMD3(x * s, 0.45 * s, -0.1), SIMD3((x + 0.1) * s, 0.02, 0.18), radius: CGFloat(0.05 * s), material: body))
        }
        root.addChildNode(sphere(0.12 * s, UIColor(hex: 0x6E9E58), SIMD3(-0.18, 0.6 * s, -0.18)))
        root.addChildNode(Props.flowers(scale: 0.5 * s, seed: 31).withPosition(SIMD3(-0.15, 0.58 * s, -0.15)))
        return root
    }

    /// Großvaters Erinnerung: eine leuchtende, halb durchsichtige Gestalt.
    static func projection(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let m = glowMat(UIColor(hex: 0xBFD8FF), alpha: 0.55)
        m.blendMode = .add
        m.writesToDepthBuffer = false
        root.addChildNode(node(SCNCapsule(capRadius: CGFloat(0.12 * s), height: CGFloat(0.55 * s)), m, SIMD3(0, 0.36 * s, 0)))
        root.addChildNode(node(SCNSphere(radius: CGFloat(0.09 * s)), m, SIMD3(0, 0.74 * s, 0)))
        root.addChildNode(node(SCNCylinder(radius: CGFloat(0.13 * s), height: 0.02), m, SIMD3(0, 0.8 * s, 0)))   // Hutkrempe
        root.addChildNode(node(SCNCylinder(radius: CGFloat(0.07 * s), height: CGFloat(0.08 * s)), m, SIMD3(0, 0.85 * s, 0)))
        root.addChildNode(segment(SIMD3(0.12 * s, 0.4 * s, 0), SIMD3(0.24 * s, 0.05, 0.05), radius: CGFloat(0.015 * s), material: m))  // Stock
        root.addChildNode(billboardGlow(size: CGFloat(1.4 * s), color: UIColor(hex: 0x9CC0FF, alpha: 0.6)))
        root.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.5, duration: 1.8), .fadeOpacity(to: 1, duration: 1.8)])))
        root.runAction(bob(0.05, 2))
        root.castsShadow = false
        return root
    }

    /// Die alte Brückenbauerin mit Schutzbrille und Schraubenschlüssel.
    static func oldWoman() -> SCNNode {
        let root = SCNNode(), body = SCNNode()
        root.addChildNode(body)
        body.addChildNode(node(SCNCone(topRadius: 0.08, bottomRadius: 0.17, height: 0.38), Art.flat(UIColor(hex: 0x5E6E8E)), SIMD3(0, 0.19, 0)))
        body.addChildNode(node(SCNTorus(ringRadius: 0.09, pipeRadius: 0.035), Art.flat(UIColor(hex: 0xC9463F)), SIMD3(0, 0.39, 0)))   // Schal
        let head = SCNNode()
        head.simdPosition = SIMD3(0, 0.48, 0.02)
        head.addChildNode(sphere(0.085, UIColor(hex: 0xF0D2B8), .zero))
        head.addChildNode(sphere(0.07, UIColor(hex: 0xE8E4DC), SIMD3(0, 0.05, -0.03)))                // weißes Haar
        head.addChildNode(sphere(0.045, UIColor(hex: 0xE8E4DC), SIMD3(0, 0.1, -0.07)))                // Dutt
        for x: Float in [-0.035, 0.035] {
            let lens = node(SCNTorus(ringRadius: 0.022, pipeRadius: 0.007), Art.flat(Palette.brass), SIMD3(x, 0.03, 0.075))
            lens.eulerAngles.x = .pi / 2
            head.addChildNode(lens)
        }
        body.addChildNode(head)
        let arm = segment(SIMD3(0.12, 0.3, 0.02), SIMD3(0.2, 0.15, 0.1), radius: 0.025, material: Art.flat(UIColor(hex: 0x5E6E8E)))
        body.addChildNode(arm)
        body.addChildNode(box(0.03, 0.18, 0.03, UIColor(hex: 0x9AA0A8), SIMD3(0.22, 0.12, 0.12)))  // Schraubenschlüssel
        body.eulerAngles.y = .pi / 4
        body.runAction(bob(0.012, 1.2))
        return root
    }

    /// Steinerne Ringöffnung, aus der der Atem des Riesen als warmer Wind steigt.
    static func vent() -> SCNNode {
        let root = SCNNode()
        root.addChildNode(node(SCNTube(innerRadius: 0.18, outerRadius: 0.28, height: 0.12), Art.flat(UIColor(hex: 0x8A8A74)), SIMD3(0, 0.06, 0)))
        let ps = SCNParticleSystem()
        ps.particleImage = Art.glow(color: UIColor(white: 1, alpha: 1))
        ps.birthRate = 12
        ps.particleLifeSpan = 2.2
        ps.particleSize = 0.05
        ps.emitterShape = SCNCylinder(radius: 0.18, height: 0.02)
        ps.birthLocation = .surface
        ps.particleVelocity = 0.7
        ps.emittingDirection = SCNVector3(0, 1, 0)
        ps.spreadingAngle = 12
        ps.isLightingEnabled = false
        ps.blendMode = .additive
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: fadeOutAnimation())]
        let e = SCNNode(); e.addParticleSystem(ps); e.simdPosition = SIMD3(0, 0.12, 0)
        root.addChildNode(e)
        return root
    }

    /// Bemoostes Gesicht des schlafenden Riesen an einer Blockseite.
    static func giantFace(face: String, scale s: Float) -> SCNNode {
        let root = SCNNode()
        let faceNode = SCNNode()
        root.addChildNode(faceNode)
        let rock = Art.mat(Art.painted(UIColor(hex: 0x8A8C76), seed: 51, dabs: 120, strength: 0.18))
        let brow = node(SCNBox(width: CGFloat(0.8 * s), height: CGFloat(0.12 * s), length: 0.08, chamferRadius: 0.04), rock, SIMD3(0, -0.2 * s, 0.04))
        faceNode.addChildNode(brow)
        let dark = Art.flat(UIColor(hex: 0x4E5444))
        for x: Float in [-0.2, 0.2] {   // geschlossene Augen
            let lid = node(SCNTorus(ringRadius: CGFloat(0.09 * s), pipeRadius: 0.015), dark, SIMD3(x * s, -0.33 * s, 0.06))
            lid.eulerAngles.x = .pi / 2
            lid.scale = SCNVector3(1, 1, 0.45)
            faceNode.addChildNode(lid)
        }
        let nose = node(SCNSphere(radius: CGFloat(0.09 * s)), rock, SIMD3(0, -0.5 * s, 0.07))
        nose.scale = SCNVector3(0.9, 1.3, 0.8)
        faceNode.addChildNode(nose)
        faceNode.addChildNode(node(SCNBox(width: CGFloat(0.3 * s), height: 0.03, length: 0.03, chamferRadius: 0.012), dark, SIMD3(0, -0.72 * s, 0.06)))
        for k in 0..<4 { faceNode.addChildNode(sphere(0.08 * s, UIColor(hex: 0x6E9E58), SIMD3(Float(k) * 0.24 - 0.36, -0.08 * s, 0.05))) }
        faceNode.runAction(.repeatForever(.sequence([.scale(to: 1.03, duration: 2.6), .scale(to: 1, duration: 2.6)])))
        if face == "+x" { root.eulerAngles.y = .pi / 2 }
        return root
    }

    /// Sonnenspiegel auf einem Ständer (sitzt meist auf einer Drehgruppe).
    static func mirror(scale s: Float) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(cylinder(0.025, 0.4 * s, Palette.brass, SIMD3(0, 0.2 * s, 0)))
        let frame = SCNNode()
        frame.simdPosition = SIMD3(0, 0.5 * s, 0)
        frame.eulerAngles.x = -0.35
        frame.addChildNode(node(SCNTorus(ringRadius: CGFloat(0.2 * s), pipeRadius: 0.025), Art.flat(Palette.brass), .zero).rotated(x: .pi / 2))
        let glass = SCNMaterial()
        glass.diffuse.contents = UIColor(hex: 0xFFF4D0)
        glass.emission.contents = UIColor(hex: 0xFFD98A)
        glass.lightingModel = .constant
        frame.addChildNode(node(SCNCylinder(radius: CGFloat(0.19 * s), height: 0.012), glass, .zero).rotated(x: .pi / 2))
        frame.addChildNode(billboardGlow(size: CGFloat(0.9 * s), color: UIColor(hex: 0xFFE6A0, alpha: 0.8)))
        root.addChildNode(frame)
        return root
    }

    /// Messingzahnrad an einer Blockseite, dreht sich langsam.
    static func gear(face: String, scale s: Float) -> SCNNode {
        let root = SCNNode(), wheel = SCNNode()
        let brass = Art.flat(Palette.brass)
        wheel.addChildNode(node(SCNCylinder(radius: CGFloat(0.26 * s), height: 0.06), brass, .zero))
        wheel.addChildNode(node(SCNCylinder(radius: CGFloat(0.08 * s), height: 0.08), Art.flat(UIColor(hex: 0x8A6A3A)), .zero))
        for k in 0..<10 {
            let a = Float(k) / 10 * .pi * 2
            wheel.addChildNode(box(0.07 * s, 0.06, 0.07 * s, Palette.brass, SIMD3(cos(a) * 0.29 * s, 0, sin(a) * 0.29 * s)))
        }
        wheel.runAction(.repeatForever(.rotateBy(x: 0, y: .pi * 2, z: 0, duration: 12)))
        let mount = SCNNode()
        mount.addChildNode(wheel)
        mount.eulerAngles.x = .pi / 2
        root.addChildNode(mount)
        if face == "+x" {
            root.eulerAngles.y = .pi / 2
            root.simdPosition = SIMD3(0.53, 0, 0)
        } else {
            root.simdPosition = SIMD3(0, 0, 0.53)
        }
        let holder = SCNNode()
        holder.addChildNode(root)
        return holder
    }

    /// Windharfe: Holzrahmen mit leuchtenden Saiten (klein im Dachboden, riesig im Herz der Wolken).
    static func windharp(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let wood = Art.mat(Art.painted(UIColor(hex: 0x9C6A44), seed: 61, stripes: true))
        let gold = Art.flat(Palette.brass, emission: UIColor(hex: 0x3A2A08))
        let base = SIMD3<Float>(-0.25, 0.05, -0.2) * s, top = SIMD3<Float>(-0.25, 0.9, -0.2) * s
        root.addChildNode(segment(base, top, radius: CGFloat(0.035 * s), material: wood))
        var prev = top
        let arc: [SIMD3<Float>] = (1...6).map { k in
            let t = Float(k) / 6
            return SIMD3(-0.25 + 0.6 * t, 0.9 - 0.55 * t * t, -0.2 + 0.18 * t) * s
        }
        for p in arc { root.addChildNode(segment(prev, p, radius: CGFloat(0.03 * s), material: gold)); prev = p }
        root.addChildNode(segment(base, SIMD3(0.35, 0.05, -0.02) * s, radius: CGFloat(0.035 * s), material: wood))
        let string = glowMat(UIColor(hex: 0xFFF2C8), alpha: 0.85)
        for k in 1...5 {
            let t = Float(k) / 6
            let a = SIMD3<Float>(-0.25 + 0.6 * t, 0.05, -0.2 + 0.18 * t) * s
            let b = SIMD3<Float>(-0.25 + 0.6 * t, 0.9 - 0.55 * t * t, -0.2 + 0.18 * t) * s
            let st = segment(a, b, radius: CGFloat(0.006 * s), material: string)
            st.runAction(.repeatForever(.sequence([.wait(duration: Double(k) * 0.3), .fadeOpacity(to: 0.4, duration: 0.6), .fadeOpacity(to: 1, duration: 0.6)])))
            root.addChildNode(st)
        }
        root.addChildNode(billboardGlow(size: CGFloat(1.4 * s), color: UIColor(hex: 0xFFE6B0, alpha: 0.5)).withPosition(SIMD3(0, 0.5, 0) * s))
        return root
    }

    /// Kodama: kleiner neugieriger Waldgeist mit rasselndem Kopf.
    static func kodama(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let white = Art.flat(UIColor(hex: 0xF4F4EC), emission: UIColor(white: 0.18, alpha: 1))
        let dark = Art.flat(UIColor(hex: 0x2A2A2E))
        for k in 0..<3 {
            let k0 = SCNNode()
            k0.simdPosition = SIMD3(Float(k) * 0.24 - 0.3, 0, Float(rng.range(-0.25, 0.1)))
            let h = Float(rng.range(0.85, 1.15)) * s
            k0.addChildNode(node(SCNCapsule(capRadius: CGFloat(0.06 * h), height: CGFloat(0.22 * h)), white, SIMD3(0, 0.11 * h, 0)))
            let head = SCNNode()
            head.simdPosition = SIMD3(0, 0.3 * h, 0)
            let skull = node(SCNSphere(radius: CGFloat(0.1 * h)), white, .zero)
            skull.scale = SCNVector3(1.15, 0.95, 1)
            head.addChildNode(skull)
            for (x, y) in [(Float(-0.035), Float(0.015)), (0.04, 0.02), (0.0, -0.035)] {
                head.addChildNode(node(SCNSphere(radius: CGFloat(0.022 * h)), dark, SIMD3(x * h * 10 / 10, y * h, 0.088 * h)))
            }
            head.eulerAngles.y = .pi / 4
            let rattle = SCNAction.sequence([.wait(duration: rng.range(2, 6)), .rotateBy(x: 0, y: 0, z: 0.35, duration: 0.06),
                                             .rotateBy(x: 0, y: 0, z: -0.7, duration: 0.1), .rotateBy(x: 0, y: 0, z: 0.35, duration: 0.06)])
            head.runAction(.repeatForever(rattle))
            k0.addChildNode(head)
            root.addChildNode(k0)
        }
        return root
    }

    // MARK: Verbindungen (Seil, Wimpel, Harfensaite)

    static func span(_ kind: String, from a: SIMD3<Float>, to b: SIMD3<Float>, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let sag: Float = kind == "harpstring" ? 0 : 0.18
        var pts: [SIMD3<Float>] = []
        for i in 0...10 {
            let t = Float(i) / 10
            var p = a + (b - a) * t
            p.y -= sag * 4 * t * (1 - t)
            pts.append(p)
        }
        let m: SCNMaterial
        switch kind {
        case "harpstring": m = glowMat(UIColor(hex: 0xFFF0C8), alpha: 0.9)
        default: m = Art.flat(UIColor(hex: 0x8A7050))
        }
        for i in 0..<10 { root.addChildNode(segment(pts[i], pts[i + 1], radius: kind == "harpstring" ? 0.012 : 0.01, material: m)) }
        if kind == "pennant" {
            let cols = [UIColor(hex: 0xC9463F), UIColor(hex: 0xF0C23E), UIColor(hex: 0x4F8FC8), UIColor(hex: 0xF4F0E6), UIColor(hex: 0x6FA86A)]
            for i in 1..<10 {
                let flag = SCNNode(geometry: SCNPyramid(width: 0.1, height: 0.14, length: 0.01))
                flag.geometry?.materials = [Art.flat(cols[Int(rng.next() * 5) % 5])]
                flag.simdPosition = pts[i] - SIMD3(0, 0.02, 0)
                flag.eulerAngles.x = .pi
                root.addChildNode(flag)
            }
        }
        if kind == "harpstring" {
            root.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.55, duration: 1.1), .fadeOpacity(to: 1, duration: 1.1)])))
        }
        root.castsShadow = false
        return root
    }

    // MARK: Zielgegenstände

    /// Gegenstand, der über dem Zielaltar schwebt.
    static func goalItem(_ kind: String) -> SCNNode {
        let n = SCNNode()
        switch kind {
        case "harp":
            n.addChildNode(windharp(scale: 0.32).withPosition(SIMD3(0.02, -0.14, 0.04)))
        case "letter":
            let plane = SCNPlane(width: 0.22, height: 0.16)
            let m = SCNMaterial(); m.diffuse.contents = Art.letterPaper(); m.isDoubleSided = true; m.emission.contents = UIColor(white: 0.25, alpha: 1)
            plane.materials = [m]
            n.addChildNode(SCNNode(geometry: plane))
        case "feather":
            let f = node(SCNSphere(radius: 0.1), glowMat(UIColor(hex: 0xF8F6FF), alpha: 1), .zero)
            f.scale = SCNVector3(0.35, 1.2, 0.08)
            f.eulerAngles.z = 0.5
            n.addChildNode(f)
            n.addChildNode(segment(SIMD3(-0.05, -0.12, 0), SIMD3(0.05, 0.1, 0), radius: 0.006, material: Art.flat(UIColor(hex: 0xC8B890))))
        case "gear":
            let g = gear(face: "+z", scale: 0.4)
            g.childNodes.first?.simdPosition = .zero
            n.addChildNode(g)
        case "prism":
            let p = node(SCNPyramid(width: 0.14, height: 0.16, length: 0.14), glowMat(UIColor(hex: 0xE8F4FF), alpha: 0.85), .zero)
            n.addChildNode(p)
            let p2 = node(SCNPyramid(width: 0.14, height: 0.16, length: 0.14), glowMat(UIColor(hex: 0xFFE0F4), alpha: 0.85), .zero)
            p2.eulerAngles.x = .pi
            n.addChildNode(p2)
        case "lamp":
            n.addChildNode(cylinder(0.05, 0.14, UIColor(hex: 0x9C7048), SIMD3(0, -0.02, 0)))
            n.addChildNode(node(SCNSphere(radius: 0.065), glowMat(UIColor(hex: 0x9CFFD8), alpha: 0.95), SIMD3(0, 0.06, 0)))
        case "string":
            let coil = node(SCNTorus(ringRadius: 0.07, pipeRadius: 0.012), glowMat(UIColor(hex: 0xFFF0C8)), .zero)
            coil.eulerAngles.x = .pi / 2
            n.addChildNode(coil)
            n.addChildNode(node(SCNTorus(ringRadius: 0.05, pipeRadius: 0.01), glowMat(UIColor(hex: 0xFFE0A0)), SIMD3(0, 0.03, 0)).rotated(x: .pi / 2))
        case "heart":
            let h = node(SCNSphere(radius: 0.09), glowMat(UIColor(hex: 0xFFB8D4)), .zero)
            n.addChildNode(h)
            n.addChildNode(node(SCNSphere(radius: 0.12), glowMat(UIColor(hex: 0xC8E8FF), alpha: 0.35), .zero))
        case "bell":
            n.addChildNode(bell())
        default:
            return n
        }
        n.addChildNode(billboardGlow(size: 0.75, color: UIColor(hex: 0xFFE8B0, alpha: 0.85)))
        return n
    }
}

extension SCNNode {
    func rotated(x: Float) -> SCNNode {
        eulerAngles.x = x
        return self
    }
}
