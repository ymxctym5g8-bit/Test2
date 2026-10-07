import UIKit
import SceneKit

func v3(_ s: SIMD3<Float>) -> SCNVector3 { SCNVector3(s.x, s.y, s.z) }
func s3(_ v: SCNVector3) -> SIMD3<Float> { SIMD3<Float>(v.x, v.y, v.z) }

/// Prozedural modellierte Requisiten. Ursprung = Mitte der Oberseite des Feldes.
enum Props {
    static let decorCategory = 1
    static let blockCategory = 2
    static let mechanismCategory = 4

    static func node(_ geometry: SCNGeometry, _ material: SCNMaterial, _ pos: SIMD3<Float> = .zero) -> SCNNode {
        geometry.materials = [material]
        let n = SCNNode(geometry: geometry)
        n.simdPosition = pos
        return n
    }

    static func sphere(_ r: Float, _ color: UIColor, _ pos: SIMD3<Float>, segments: Int = 18) -> SCNNode {
        let g = SCNSphere(radius: CGFloat(r))
        g.segmentCount = segments
        return node(g, Art.flat(color), pos)
    }

    // MARK: Pflanzen

    /// Runder, wolkiger Baum im Ghibli-Stil.
    static func tree(scale s: Float, variant: Int, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let trunk = node(SCNCylinder(radius: CGFloat(0.07 * s), height: CGFloat(0.6 * s)),
                         Art.flat(UIColor(red: 0.5, green: 0.36, blue: 0.3, alpha: 1)), SIMD3(0, 0.3 * s, 0))
        root.addChildNode(trunk)
        let canopy = SCNNode()
        canopy.simdPosition = SIMD3(0, 0.62 * s, 0)
        root.addChildNode(canopy)
        let colors: [UIColor]
        switch variant {
        case 2: colors = Palette.blossom
        case 1: colors = [UIColor(red: 0.62, green: 0.8, blue: 0.45, alpha: 1), Palette.leaf[1], UIColor(red: 0.7, green: 0.84, blue: 0.5, alpha: 1)]
        default: colors = Palette.leaf
        }
        let puffs: [SIMD4<Float>] = [
            SIMD4(0, 0.14, 0, 0.36), SIMD4(0.24, 0.0, 0.06, 0.26), SIMD4(-0.22, 0.02, -0.08, 0.27),
            SIMD4(0.06, 0.0, 0.24, 0.25), SIMD4(-0.06, 0.34, 0.03, 0.25), SIMD4(0.14, 0.24, -0.16, 0.21),
            SIMD4(-0.16, 0.2, 0.18, 0.2),
        ]
        for (i, p) in puffs.enumerated() {
            let c = colors[(i + Int(rng.next() * 3)) % colors.count]
            canopy.addChildNode(sphere(p.w * s, c, SIMD3(p.x, p.y, p.z) * s))
        }
        let sway = SCNAction.sequence([
            .rotateBy(x: 0.03, y: 0, z: 0.04, duration: 2.6),
            .rotateBy(x: -0.03, y: 0, z: -0.04, duration: 2.6),
        ])
        sway.timingMode = .easeInEaseOut
        canopy.runAction(.sequence([.wait(duration: rng.range(0, 2)), .repeatForever(sway)]))
        return root
    }

    static func bush(scale s: Float) -> SCNNode {
        let root = SCNNode()
        root.addChildNode(sphere(0.24 * s, Palette.leaf[0], SIMD3(0, 0.12 * s, 0)))
        root.addChildNode(sphere(0.18 * s, Palette.leaf[1], SIMD3(0.2 * s, 0.08 * s, 0.08 * s)))
        root.addChildNode(sphere(0.16 * s, Palette.leaf[2], SIMD3(-0.18 * s, 0.07 * s, 0.1 * s)))
        for i in 0..<3 {
            root.addChildNode(sphere(0.035 * s, .white, SIMD3(Float(i) * 0.12 - 0.1, 0.27 * s, 0.12)))
        }
        return root
    }

    /// Blumen an den Feldrändern, damit die Laufmitte frei bleibt.
    static func flowers(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        let heads = [UIColor.white, Palette.blossom[0], UIColor(red: 1, green: 0.9, blue: 0.45, alpha: 1),
                     UIColor(red: 0.75, green: 0.7, blue: 0.95, alpha: 1)]
        for i in 0..<9 {
            let a = Double(i) / 9 * .pi * 2 + rng.range(-0.2, 0.2)
            let r = rng.range(0.32, 0.44)
            let x = Float(cos(a) * r) * s, z = Float(sin(a) * r) * s
            let h = Float(rng.range(0.05, 0.12)) * s
            root.addChildNode(node(SCNCylinder(radius: 0.008, height: CGFloat(h)), Art.flat(Palette.grassDeep), SIMD3(x, h / 2, z)))
            root.addChildNode(sphere(0.028 * s, heads[i % heads.count], SIMD3(x, h + 0.02, z), segments: 8))
        }
        return root
    }

    static func grass(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        for _ in 0..<12 {
            let x = Float(rng.range(-0.45, 0.45)), z = Float(rng.range(-0.45, 0.45))
            if abs(x) < 0.3 && abs(z) < 0.3 { continue }
            let h = Float(rng.range(0.08, 0.18)) * s
            let blade = node(SCNCone(topRadius: 0, bottomRadius: 0.022, height: CGFloat(h)),
                             Art.flat(rng.next() > 0.5 ? Palette.grassDeep : Palette.leaf[1]), SIMD3(x, h / 2, z))
            blade.eulerAngles = SCNVector3(Float(rng.range(-0.3, 0.3)), 0, Float(rng.range(-0.3, 0.3)))
            root.addChildNode(blade)
        }
        return root
    }

    static func mushroom(scale s: Float) -> SCNNode {
        let root = SCNNode()
        for (i, off) in [SIMD3<Float>(0.3, 0, -0.3), SIMD3<Float>(0.38, 0, -0.18)].enumerated() {
            let k = i == 0 ? Float(1) : 0.7
            root.addChildNode(node(SCNCylinder(radius: CGFloat(0.025 * k), height: CGFloat(0.09 * k)),
                                   Art.flat(UIColor(white: 0.97, alpha: 1)), off + SIMD3(0, 0.045 * k, 0)))
            let cap = sphere(0.065 * k, Palette.vermilion, off + SIMD3(0, 0.09 * k, 0))
            cap.scale = SCNVector3(1, 0.6, 1)
            root.addChildNode(cap)
            root.addChildNode(sphere(0.013 * k, .white, off + SIMD3(0.02, 0.125 * k, 0.03), segments: 6))
        }
        root.scale = SCNVector3(s, s, s)
        return root
    }

    static func rock(scale s: Float) -> SCNNode {
        let r = sphere(0.3 * s, Palette.rock, SIMD3(0, 0.08, 0))
        r.scale = SCNVector3(1, 0.55, 0.8)
        return r
    }

    /// Hängende Ranken an der sichtbaren Vorderkante eines Blocks.
    static func vines(scale s: Float, seed: UInt64) -> SCNNode {
        var rng = Rand(seed)
        let root = SCNNode()
        for i in 0..<5 {
            let x = Float(i) * 0.2 - 0.4 + Float(rng.range(-0.04, 0.04))
            let len = Float(rng.range(0.4, 1.1)) * s
            root.addChildNode(node(SCNCylinder(radius: 0.012, height: CGFloat(len)), Art.flat(Palette.grassDeep),
                                   SIMD3(x, -len / 2, 0.02)))
            var y: Float = -0.08
            while y > -len {
                root.addChildNode(sphere(0.035, Palette.leaf[Int(rng.next() * 2.99)], SIMD3(x + Float(rng.range(-0.03, 0.03)), y, 0.04), segments: 8))
                y -= Float(rng.range(0.1, 0.18))
            }
        }
        return root
    }

    // MARK: Architektur

    /// Steinlaterne (Tōrō) mit warm glimmendem Licht.
    static func lantern(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let stone = Art.flat(UIColor(red: 0.86, green: 0.82, blue: 0.78, alpha: 1))
        root.addChildNode(node(SCNCylinder(radius: 0.07, height: 0.06), stone, SIMD3(0, 0.03, 0)))
        root.addChildNode(node(SCNCylinder(radius: 0.03, height: 0.2), stone, SIMD3(0, 0.16, 0)))
        let box = SCNBox(width: 0.13, height: 0.11, length: 0.13, chamferRadius: 0.01)
        let lightMat = Art.flat(UIColor(red: 1, green: 0.85, blue: 0.55, alpha: 1), emission: UIColor(red: 1, green: 0.7, blue: 0.35, alpha: 1))
        root.addChildNode(node(box, lightMat, SIMD3(0, 0.31, 0)))
        let roof = SCNPyramid(width: 0.24, height: 0.09, length: 0.24)
        root.addChildNode(node(roof, Art.flat(UIColor(red: 0.5, green: 0.45, blue: 0.55, alpha: 1)), SIMD3(0, 0.365, 0)))
        let glow = billboardGlow(size: 0.55, color: UIColor(red: 1, green: 0.78, blue: 0.45, alpha: 1))
        glow.simdPosition = SIMD3(0, 0.31, 0)
        root.addChildNode(glow)
        glow.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.55, duration: 1.4), .fadeOpacity(to: 1, duration: 1.2)])))
        root.simdPosition = SIMD3(0.32, 0, -0.32)
        let wrapper = SCNNode()
        wrapper.addChildNode(root)
        wrapper.scale = SCNVector3(s, s, s)
        return wrapper
    }

    static func torii(scale s: Float) -> SCNNode {
        let root = SCNNode()
        let red = Art.flat(Palette.vermilion)
        let dark = Art.flat(UIColor(red: 0.28, green: 0.22, blue: 0.28, alpha: 1))
        for x: Float in [-0.42, 0.42] {
            root.addChildNode(node(SCNCylinder(radius: 0.045, height: 1.0), red, SIMD3(x, 0.5, 0)))
            root.addChildNode(node(SCNCylinder(radius: 0.06, height: 0.08), dark, SIMD3(x, 0.04, 0)))
        }
        root.addChildNode(node(SCNBox(width: 1.0, height: 0.05, length: 0.07, chamferRadius: 0.01), red, SIMD3(0, 0.74, 0)))
        root.addChildNode(node(SCNBox(width: 1.12, height: 0.07, length: 0.1, chamferRadius: 0.01), red, SIMD3(0, 0.92, 0)))
        root.addChildNode(node(SCNBox(width: 1.26, height: 0.06, length: 0.13, chamferRadius: 0.02), dark, SIMD3(0, 0.99, 0)))
        root.addChildNode(node(SCNBox(width: 0.06, height: 0.16, length: 0.06, chamferRadius: 0), red, SIMD3(0, 0.83, 0)))
        root.scale = SCNVector3(s, s, s)
        return root
    }

    /// Altar mit dem leuchtenden Samen – dem Ziel des Kapitels.
    static func altar(scale s: Float) -> (SCNNode, SCNNode) {
        let root = SCNNode()
        let stone = Art.flat(UIColor(red: 0.9, green: 0.86, blue: 0.82, alpha: 1))
        root.addChildNode(node(SCNBox(width: 0.5, height: 0.18, length: 0.24, chamferRadius: 0.03), stone, SIMD3(0, 0.09, -0.32)))
        root.addChildNode(node(SCNBox(width: 0.36, height: 0.08, length: 0.18, chamferRadius: 0.02), stone, SIMD3(0, 0.22, -0.32)))
        let seed = SCNNode()
        seed.name = "seed"
        let core = sphere(0.075, UIColor(red: 0.85, green: 1, blue: 0.6, alpha: 1), .zero)
        core.geometry?.firstMaterial?.emission.contents = UIColor(red: 0.6, green: 0.95, blue: 0.4, alpha: 1)
        seed.addChildNode(core)
        let leafMat = Art.flat(Palette.leaf[1], emission: UIColor(red: 0.2, green: 0.4, blue: 0.1, alpha: 1))
        let sprout = node(SCNSphere(radius: 0.04), leafMat, SIMD3(0.03, 0.08, 0))
        sprout.scale = SCNVector3(1.4, 0.4, 0.8)
        sprout.eulerAngles.z = -0.6
        seed.addChildNode(sprout)
        let glow = billboardGlow(size: 0.7, color: UIColor(red: 0.8, green: 1, blue: 0.6, alpha: 1))
        seed.addChildNode(glow)
        seed.simdPosition = SIMD3(0, 0.42, -0.32)
        let float = SCNAction.sequence([.moveBy(x: 0, y: 0.06, z: 0, duration: 1.3), .moveBy(x: 0, y: -0.06, z: 0, duration: 1.3)])
        float.timingMode = .easeInEaseOut
        seed.runAction(.repeatForever(float))
        seed.runAction(.repeatForever(.rotateBy(x: 0, y: .pi * 2, z: 0, duration: 6)))
        root.addChildNode(seed)
        root.scale = SCNVector3(s, s, s)
        return (root, seed)
    }

    /// Kurbelrad an einer Blockseite – zum Drehen eines Mechanismus.
    static func crank(face: String) -> (SCNNode, SCNNode) {
        let root = SCNNode()
        let spinner = SCNNode()
        let brass = Art.flat(Palette.brass, emission: UIColor(red: 0.25, green: 0.16, blue: 0.02, alpha: 1))
        let ring = SCNTorus(ringRadius: 0.3, pipeRadius: 0.04)
        spinner.addChildNode(node(ring, brass))
        for i in 0..<4 {
            let spoke = node(SCNCylinder(radius: 0.02, height: 0.58), brass)
            spoke.eulerAngles.y = Float(i) * .pi / 4
            spoke.eulerAngles.z = .pi / 2
            spinner.addChildNode(spoke)
        }
        spinner.addChildNode(sphere(0.07, Palette.brass, .zero))
        let knob = node(SCNCylinder(radius: 0.05, height: 0.16), Art.flat(Palette.vermilion), SIMD3(0.3, 0.08, 0))
        spinner.addChildNode(knob)
        // Unsichtbare, großzügige Trefferfläche für Finger
        let hit = SCNNode(geometry: SCNSphere(radius: 0.6))
        let invisible = SCNMaterial()
        invisible.colorBufferWriteMask = []
        invisible.writesToDepthBuffer = false
        hit.geometry?.materials = [invisible]
        hit.castsShadow = false
        root.addChildNode(hit)
        root.addChildNode(spinner)
        // Das Rad liegt flach (Achse = Y); an die Blockseite kippen
        if face == "+z" {
            root.eulerAngles.x = .pi / 2
            root.simdPosition = SIMD3(0, 0, 0.56)
        } else {
            root.eulerAngles.z = -.pi / 2
            root.simdPosition = SIMD3(0.56, 0, 0)
        }
        root.categoryBitMask = mechanismCategory
        root.enumerateHierarchy { n, _ in n.categoryBitMask = mechanismCategory }
        return (root, spinner)
    }

    /// Griff der Aufzugssäule mit Pfeilen nach oben und unten.
    static func liftHandle() -> SCNNode {
        let root = SCNNode()
        let brass = Art.flat(Palette.brass, emission: UIColor(red: 0.25, green: 0.16, blue: 0.02, alpha: 1))
        let ring = node(SCNTorus(ringRadius: 0.16, pipeRadius: 0.035), brass)
        ring.eulerAngles.z = .pi / 2
        root.addChildNode(ring)
        for dir: Float in [1, -1] {
            let arrow = node(SCNCone(topRadius: 0, bottomRadius: 0.07, height: 0.12), brass, SIMD3(0, 0.3 * dir, 0))
            if dir < 0 { arrow.eulerAngles.x = .pi }
            root.addChildNode(arrow)
        }
        root.simdPosition = SIMD3(0.53, -0.1, 0)
        root.enumerateHierarchy { n, _ in n.categoryBitMask = mechanismCategory }
        let pulse = SCNAction.sequence([.scale(to: 1.12, duration: 0.9), .scale(to: 1.0, duration: 0.9)])
        pulse.timingMode = .easeInEaseOut
        root.runAction(.repeatForever(pulse))
        return root
    }

    static func pondDetails() -> SCNNode {
        let root = SCNNode()
        let pad = Art.flat(Palette.leaf[0])
        for (i, p) in [SIMD3<Float>(-0.2, 0.01, 0.15), SIMD3<Float>(0.18, 0.01, -0.12), SIMD3<Float>(0.05, 0.01, 0.28)].enumerated() {
            let n = node(SCNCylinder(radius: CGFloat(0.09 - Float(i) * 0.015), height: 0.01), pad, p)
            root.addChildNode(n)
        }
        root.addChildNode(sphere(0.03, Palette.blossom[0], SIMD3(-0.2, 0.03, 0.15), segments: 8))
        return root
    }

    /// Wasserfall, der über die Inselkante ins Wolkenmeer stürzt.
    static func waterfall() -> SCNNode {
        let root = SCNNode()
        let ps = SCNParticleSystem()
        ps.particleImage = Art.glow(color: UIColor(red: 0.85, green: 0.95, blue: 1, alpha: 1))
        ps.birthRate = 70
        ps.particleLifeSpan = 1.6
        ps.particleSize = 0.16
        ps.particleSizeVariation = 0.06
        ps.particleColor = UIColor(red: 0.8, green: 0.92, blue: 1, alpha: 0.85)
        ps.emitterShape = SCNBox(width: 0.05, height: 0.02, length: 0.7, chamferRadius: 0)
        ps.birthLocation = .volume
        ps.emittingDirection = SCNVector3(0.4, -1, 0)
        ps.spreadingAngle = 4
        ps.particleVelocity = 0.6
        ps.acceleration = SCNVector3(0, -2.2, 0)
        ps.blendMode = .alpha
        ps.isLightingEnabled = false
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: fadeOutAnimation())]
        root.addParticleSystem(ps)
        return root
    }

    static func fadeOutAnimation() -> CAAnimation {
        let a = CAKeyframeAnimation()
        a.values = [0.0, 0.9, 0.9, 0.0]
        a.keyTimes = [0, 0.1, 0.7, 1]
        return a
    }

    static func billboardGlow(size: CGFloat, color: UIColor) -> SCNNode {
        let plane = SCNPlane(width: size, height: size)
        let m = SCNMaterial()
        m.diffuse.contents = Art.glow(color: color)
        m.lightingModel = .constant
        m.blendMode = .add
        m.writesToDepthBuffer = false
        plane.materials = [m]
        let n = SCNNode(geometry: plane)
        n.constraints = [SCNBillboardConstraint()]
        n.categoryBitMask = decorCategory
        n.castsShadow = false
        return n
    }
}

// MARK: - Figuren

enum Characters {
    /// Hana: Mädchen mit rotem Umhang und Strohhut. Ursprung = Füße, Blickrichtung = +Z.
    static func hana() -> (root: SCNNode, body: SCNNode) {
        let root = SCNNode()
        root.name = "hana"
        let body = SCNNode()
        body.name = "body"
        root.addChildNode(body)
        let skin = UIColor(red: 1, green: 0.87, blue: 0.76, alpha: 1)
        let hair = UIColor(red: 0.3, green: 0.2, blue: 0.18, alpha: 1)
        let straw = UIColor(red: 0.97, green: 0.86, blue: 0.56, alpha: 1)
        for x: Float in [-0.05, 0.05] {
            body.addChildNode(Props.node(SCNCylinder(radius: 0.024, height: 0.09), Art.flat(UIColor(red: 0.35, green: 0.28, blue: 0.3, alpha: 1)), SIMD3(x, 0.045, 0)))
        }
        body.addChildNode(Props.node(SCNCone(topRadius: 0.055, bottomRadius: 0.16, height: 0.32), Art.flat(Palette.vermilion), SIMD3(0, 0.24, 0)))
        // Kragen
        body.addChildNode(Props.node(SCNCylinder(radius: 0.07, height: 0.03), Art.flat(.white), SIMD3(0, 0.395, 0)))
        body.addChildNode(Props.sphere(0.095, skin, SIMD3(0, 0.47, 0.005)))
        let hairNode = Props.sphere(0.1, hair, SIMD3(0, 0.485, -0.028))
        body.addChildNode(hairNode)
        for x: Float in [-0.034, 0.034] {
            body.addChildNode(Props.sphere(0.012, UIColor(red: 0.15, green: 0.1, blue: 0.12, alpha: 1), SIMD3(x, 0.475, 0.09), segments: 8))
            body.addChildNode(Props.sphere(0.014, UIColor(red: 1, green: 0.62, blue: 0.62, alpha: 1), SIMD3(x * 1.55, 0.45, 0.082), segments: 8))
        }
        let hat = SCNNode()
        hat.addChildNode(Props.node(SCNCylinder(radius: 0.17, height: 0.012), Art.flat(straw), .zero))
        hat.addChildNode(Props.node(SCNCylinder(radius: 0.083, height: 0.07), Art.flat(straw), SIMD3(0, 0.035, 0)))
        hat.addChildNode(Props.node(SCNCylinder(radius: 0.086, height: 0.022), Art.flat(Palette.vermilion), SIMD3(0, 0.014, 0)))
        hat.simdPosition = SIMD3(0, 0.55, -0.01)
        hat.eulerAngles.x = -0.12
        body.addChildNode(hat)
        root.scale = SCNVector3(1.15, 1.15, 1.15)
        root.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
        return (root, body)
    }

    static func startWalking(_ body: SCNNode) {
        guard body.action(forKey: "walk") == nil else { return }
        let bob = SCNAction.sequence([
            .group([.moveBy(x: 0, y: 0.03, z: 0, duration: 0.12), .rotateTo(x: 0, y: 0, z: 0.06, duration: 0.12)]),
            .group([.moveBy(x: 0, y: -0.03, z: 0, duration: 0.12), .rotateTo(x: 0, y: 0, z: -0.06, duration: 0.12)]),
        ])
        body.runAction(.repeatForever(bob), forKey: "walk")
    }

    static func stopWalking(_ body: SCNNode) {
        body.removeAction(forKey: "walk")
        body.runAction(.group([.move(to: SCNVector3Zero, duration: 0.1), .rotateTo(x: 0, y: 0, z: 0, duration: 0.1)]))
    }

    /// Kiko: ein kleiner, weißer Waldgeist mit Blättchen auf dem Kopf.
    static func kiko(scale: Float = 1) -> SCNNode {
        let root = SCNNode()
        let inner = SCNNode()
        inner.name = "inner"
        root.addChildNode(inner)
        let white = Art.flat(UIColor(white: 0.98, alpha: 1), emission: UIColor(white: 0.32, alpha: 1))
        let bodyN = Props.node(SCNSphere(radius: 0.1), white, SIMD3(0, 0, 0))
        bodyN.scale = SCNVector3(1, 0.85, 1)
        inner.addChildNode(bodyN)
        let head = SCNNode()
        head.name = "head"
        head.simdPosition = SIMD3(0, 0.15, 0)
        inner.addChildNode(head)
        let headBall = Props.node(SCNSphere(radius: 0.125), white.copy() as! SCNMaterial, .zero)
        headBall.scale = SCNVector3(1.12, 0.92, 1)
        head.addChildNode(headBall)
        let black = UIColor(red: 0.12, green: 0.1, blue: 0.14, alpha: 1)
        for x: Float in [-0.045, 0.045] {
            head.addChildNode(Props.sphere(0.02, black, SIMD3(x, 0.01, 0.108), segments: 8))
        }
        head.addChildNode(Props.sphere(0.009, black, SIMD3(0, -0.035, 0.115), segments: 6))
        let leafMat = Art.flat(Palette.leaf[1])
        for (i, ang) in [Float(0.5), -0.5].enumerated() {
            let leaf = Props.node(SCNSphere(radius: 0.05), leafMat, SIMD3(Float(i) * 0.05 - 0.025, 0.13, 0))
            leaf.scale = SCNVector3(1.3, 0.35, 0.7)
            leaf.eulerAngles.z = ang
            head.addChildNode(leaf)
        }
        for x: Float in [-0.11, 0.11] {
            inner.addChildNode(Props.node(SCNSphere(radius: 0.03), white.copy() as! SCNMaterial, SIMD3(x, -0.01, 0.02)))
        }
        let glow = Props.billboardGlow(size: 0.75, color: UIColor(red: 0.9, green: 1, blue: 0.95, alpha: 0.6))
        glow.simdPosition = SIMD3(0, 0.08, -0.05)
        root.addChildNode(glow)
        // Kopfrasseln wie bei den Waldgeistern
        let rattle = SCNAction.sequence([
            .wait(duration: 3.5, withRange: 3),
            .rotateBy(x: 0, y: 0, z: 0.35, duration: 0.07),
            .rotateBy(x: 0, y: 0, z: -0.7, duration: 0.1),
            .rotateBy(x: 0, y: 0, z: 0.55, duration: 0.09),
            .rotateBy(x: 0, y: 0, z: -0.2, duration: 0.08),
        ])
        head.runAction(.repeatForever(rattle))
        inner.eulerAngles.y = .pi / 4   // schaut zur Kamera
        root.scale = SCNVector3(scale, scale, scale)
        root.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
        return root
    }
}
