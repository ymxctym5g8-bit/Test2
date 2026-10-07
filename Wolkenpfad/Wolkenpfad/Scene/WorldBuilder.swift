import UIKit
import SceneKit

/// Isometrische Blickbasis: Kamera schaut entlang −(1,1,1).
struct ViewBasis {
    var target: SIMD3<Float>
    static let right = SIMD3<Float>(1, 0, -1) / Float(2).squareRoot()
    static let up = SIMD3<Float>(-1, 2, -1) / Float(6).squareRoot()
    static let back = SIMD3<Float>(1, 1, 1) / Float(3).squareRoot()

    static func project(_ p: SIMD3<Float>) -> SIMD2<Float> {
        SIMD2(dot3(p, right), dot3(p, up))
    }

    /// Weltpunkt zu Bildschirmkoordinaten (u, v) und Tiefe (zur Kamera hin positiv).
    func world(u: Float, v: Float, depth: Float) -> SIMD3<Float> {
        target + ViewBasis.right * u + ViewBasis.up * v + ViewBasis.back * depth
    }
}

@inline(__always) func dot3(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> Float { a.x * b.x + a.y * b.y + a.z * b.z }

/// Alle SceneKit-Knoten eines Levels.
final class WorldNodes {
    let root = SCNNode()
    var groupNodes: [String: SCNNode] = [:]
    var blockNodes: [Int: SCNNode] = [:]
    var spinners: [String: SCNNode] = [:]
    var handles: [String: SCNNode] = [:]
    var seed: SCNNode?
    var shrineTree: SCNNode?
    var grassTiles: [SIMD3<Float>] = []
    var plates: [String: (node: SCNNode, rune: SCNMaterial)] = [:]
}

enum WorldBuilder {
    static func build(_ logic: LevelLogic, theme: Theme) -> WorldNodes {
        let w = WorldNodes()
        w.root.name = "level"
        let def = logic.def

        // Gruppen (Drehbrücke, Aufzug, Bogenarm)
        for g in def.groups {
            let n = SCNNode()
            n.name = "group:\(g.id)"
            let v = logic.value(of: g.id)
            if g.isRotator, let pivot = g.pivot {
                n.simdPosition = pivot.float3
                n.eulerAngles.y = Float(v) * .pi / 2
            } else if let axis = g.axis {
                n.simdPosition = axis.float3 * Float(v)
            }
            w.root.addChildNode(n)
            w.groupNodes[g.id] = n
        }

        func parentAndLocal(_ p: IVec3, group: String?) -> (SCNNode, SIMD3<Float>) {
            guard let gid = group, let g = logic.groupsByID[gid], let parent = w.groupNodes[gid] else {
                return (w.root, p.float3)
            }
            if g.isRotator, let pivot = g.pivot { return (parent, (p - pivot).float3) }
            return (parent, p.float3)
        }

        // Blöcke
        var boxCache: [String: SCNGeometry] = [:]
        var lipMaterial: SCNMaterial?
        let occupied = Set(def.blocks.map { $0.p })
        for (i, b) in def.blocks.enumerated() {
            let node: SCNNode
            if let st = b.stair {
                node = stairNode(material: b.m, dir: st)
            } else {
                let geo: SCNGeometry
                if let cached = boxCache[b.m] {
                    geo = cached
                } else {
                    let box = SCNBox(width: 1, height: 1, length: 1, chamferRadius: 0.025)
                    box.materials = Art.blockMaterials(b.m)
                    boxCache[b.m] = box
                    geo = box
                }
                node = SCNNode(geometry: geo)
                // Moosiger Grasrand, der leicht über die Kante hängt
                if b.m == "grass" && !occupied.contains(b.p + IVec3(0, 1, 0)) {
                    if lipMaterial == nil { lipMaterial = Art.mat(Art.painted(Palette.grass, seed: 13, dabs: 60, strength: 0.15)) }
                    let lip = SCNBox(width: 1.05, height: 0.08, length: 1.05, chamferRadius: 0.035)
                    lip.materials = [lipMaterial!]
                    let ln = SCNNode(geometry: lip)
                    ln.simdPosition = SIMD3(0, 0.47, 0)
                    ln.categoryBitMask = Props.blockCategory
                    node.addChildNode(ln)
                }
            }
            node.name = "block:\(i)"
            node.categoryBitMask = Props.blockCategory
            node.enumerateChildNodes { c, _ in c.categoryBitMask = Props.blockCategory }
            let (parent, local) = parentAndLocal(b.p, group: b.g)
            node.simdPosition = local
            parent.addChildNode(node)
            w.blockNodes[i] = node
            if b.walk && b.m == "grass" && b.g == nil { w.grassTiles.append(b.p.float3 + SIMD3(0, 0.5, 0)) }
        }

        // Dekoration
        for (i, d) in def.decor.enumerated() {
            let s = Float(d.s)
            let seed = UInt64(i * 7919 + 17)
            let (parent, local) = parentAndLocal(d.p, group: d.g)
            var n: SCNNode?
            var offset = SIMD3<Float>(0, 0.5, 0)
            switch d.t {
            case "tree":
                n = Props.tree(scale: s, variant: d.variant ?? 0, seed: seed)
                if let endTree = def.ending?.tree, d.p == endTree { w.shrineTree = n }
            case "bush": n = Props.bush(scale: s)
            case "flowers": n = Props.flowers(scale: s, seed: seed)
            case "grass": n = Props.grass(scale: s, seed: seed)
            case "mushroom": n = Props.mushroom(scale: s)
            case "rock": n = Props.rock(scale: s)
            case "lantern": n = Props.lantern(scale: s, boost: theme.lanternBoost)
            case "bamboo": n = Props.bamboo(scale: s, seed: seed)
            case "millwheel":
                n = Props.millwheel(face: d.face ?? "+z")
                offset = .zero
            case "vine":
                n = Props.vines(scale: s, seed: seed)
                offset = SIMD3(0, 0.5, 0.5)
            case "torii": n = Props.torii(scale: s)
            case "altar":
                let (a, seedNode) = Props.altar(scale: s)
                n = a
                w.seed = seedNode
            case "pond": n = Props.pondDetails()
            case "waterfall":
                n = Props.waterfall()
                offset = SIMD3(0.52, 0.4, 0)
            case "crank":
                let (c, spinner) = Props.crank(face: d.face ?? "+x")
                c.name = "crank:\(d.g ?? "")"
                n = c
                offset = .zero
                if let g = d.g {
                    w.spinners[g] = spinner
                    w.handles[g] = c
                }
            case "handle":
                let h = Props.liftHandle(axis: d.axis ?? "y")
                h.name = "crank:\(d.g ?? "")"
                n = h
                offset = .zero
                if let g = d.g { w.handles[g] = h }
            default: break
            }
            guard let node = n else { continue }
            node.enumerateHierarchy { c, _ in
                if c.categoryBitMask != Props.mechanismCategory { c.categoryBitMask = Props.decorCategory }
            }
            let holder = SCNNode()
            holder.addChildNode(node)
            holder.simdPosition = local + offset
            holder.eulerAngles.y = Float(d.r)
            holder.categoryBitMask = Props.decorCategory
            parent.addChildNode(holder)
        }

        // Druckplatten
        for plate in def.plates ?? [] {
            let (node, rune) = Props.plate()
            node.simdPosition = plate.at.float3 + SIMD3(0, 0.5, 0)
            node.enumerateHierarchy { c, _ in c.categoryBitMask = Props.decorCategory }
            w.root.addChildNode(node)
            w.plates[plate.id] = (node, rune)
            let pulse = SCNAction.sequence([.fadeOpacity(to: 0.75, duration: 1.2), .fadeOpacity(to: 1, duration: 1.2)])
            node.runAction(.repeatForever(pulse))
        }
        return w
    }

    /// Treppe aus vier Stufen; Grundform steigt Richtung −Z an.
    static func stairNode(material: String, dir: String) -> SCNNode {
        let root = SCNNode()
        let mats = Art.blockMaterials(material)
        // Sockel unter den Stufen
        for i in 0..<4 {
            let h = Float(i + 1) * 0.25
            let box = SCNBox(width: 1, height: CGFloat(h), length: 0.25, chamferRadius: 0.012)
            box.materials = mats
            let n = SCNNode(geometry: box)
            n.simdPosition = SIMD3(0, -0.5 + h / 2, 0.5 - 0.125 - Float(i) * 0.25)
            root.addChildNode(n)
        }
        let steps: [String: Float] = ["-z": 0, "-x": 1, "+z": 2, "+x": 3]
        root.eulerAngles.y = (steps[dir] ?? 0) * .pi / 2
        return root
    }
}

// MARK: - Himmel, Wolken, Licht

enum Atmosphere {
    static func setup(scene: SCNScene, basis: ViewBasis, scale: Float, theme: Theme) -> (sun: SCNNode, clouds: [SCNNode]) {
        scene.background.contents = Art.skyGradient(theme)

        // Licht: warme Abendsonne + bläuliches Himmelslicht
        let sun = SCNNode()
        let light = SCNLight()
        light.type = .directional
        light.color = theme.sun
        light.intensity = theme.sunIntensity
        light.castsShadow = true
        light.shadowMode = .forward
        light.shadowColor = UIColor(red: 0.3, green: 0.2, blue: 0.4, alpha: 0.38)
        light.shadowRadius = 4
        light.shadowSampleCount = 8
        light.shadowMapSize = CGSize(width: 2048, height: 2048)
        light.orthographicScale = 14
        light.zNear = 1
        light.zFar = 80
        light.categoryBitMask = -1
        sun.light = light
        sun.simdPosition = basis.target + SIMD3(14, 30, 6)
        sun.look(at: v3(basis.target), up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 0, -1))
        scene.rootNode.addChildNode(sun)

        let ambient = SCNNode()
        ambient.light = SCNLight()
        ambient.light?.type = .ambient
        ambient.light?.color = theme.ambient
        ambient.light?.intensity = theme.ambientIntensity
        scene.rootNode.addChildNode(ambient)

        // Wolken: hinten am Himmel, unten als Wolkenmeer und ein paar ganz vorne
        var clouds: [SCNNode] = []
        let sky: [(u: Float, v: Float, d: Float, w: Float, warm: Bool)] = [
            (-5, 7.5, -30, 9, false), (5.5, 9.5, -32, 11, false), (-1, 12, -34, 8, true),
            (6, 2, -28, 7, true), (-6.5, 1, -28, 8, false),
            // Wolkenmeer
            (-5, -8.5, -12, 11, true), (2, -9.5, -14, 13, false), (7, -7.5, -16, 10, true),
            (-1, -11, -10, 14, false), (-7, -10.5, -9, 12, false), (5, -11.5, -8, 13, true),
            // Vordergrund (halb transparent über dem Inselfels)
            (-4.5, -7.2, 18, 7, false), (4.8, -8.4, 20, 8, true),
        ]
        for (i, c) in sky.enumerated() {
            let plane = SCNPlane(width: CGFloat(c.w * scale / 11), height: CGFloat(c.w * scale / 22))
            let m = SCNMaterial()
            m.diffuse.contents = Art.cloud(seed: UInt64(100 + i), warm: c.warm, theme: theme)
            m.lightingModel = .constant
            m.isDoubleSided = true
            m.writesToDepthBuffer = false
            m.transparency = c.d > 0 ? 0.82 : 1
            plane.materials = [m]
            let n = SCNNode(geometry: plane)
            n.simdPosition = basis.world(u: c.u * scale / 11, v: c.v * scale / 11, depth: c.d)
            n.constraints = [SCNBillboardConstraint()]
            n.renderingOrder = c.d > 0 ? 50 : -50
            n.castsShadow = false
            n.categoryBitMask = Props.decorCategory
            let drift = Float(i % 2 == 0 ? 1 : -1) * Float(0.6 + Double(i % 3) * 0.3)
            let move = SCNAction.move(by: v3(ViewBasis.right * drift), duration: 18 + Double(i % 4) * 4)
            move.timingMode = .easeInEaseOut
            n.runAction(.repeatForever(.sequence([move, move.reversed()])))
            scene.rootNode.addChildNode(n)
            clouds.append(n)
        }

        // Sonne – oder nachts der Mond – hinter allem
        let glowColor = theme.stars ? UIColor(red: 0.8, green: 0.86, blue: 1, alpha: 0.7)
            : (theme.name == "evening" ? UIColor(red: 1, green: 0.75, blue: 0.5, alpha: 0.9) : UIColor(red: 1, green: 0.95, blue: 0.8, alpha: 0.8))
        let sunGlow = Props.billboardGlow(size: CGFloat(scale * 1.6), color: glowColor)
        sunGlow.simdPosition = basis.world(u: 3.5 * scale / 11, v: 8 * scale / 11, depth: -40)
        sunGlow.renderingOrder = -60
        sunGlow.castsShadow = false
        scene.rootNode.addChildNode(sunGlow)
        if theme.stars {
            let moon = SCNNode(geometry: SCNPlane(width: CGFloat(scale * 0.16), height: CGFloat(scale * 0.16)))
            let mm = SCNMaterial()
            mm.diffuse.contents = Art.glow(color: UIColor(red: 0.98, green: 0.97, blue: 0.9, alpha: 1))
            mm.lightingModel = .constant
            mm.writesToDepthBuffer = false
            moon.geometry?.materials = [mm]
            moon.constraints = [SCNBillboardConstraint()]
            moon.simdPosition = sunGlow.simdPosition + ViewBasis.back * 0.5
            moon.renderingOrder = -59
            moon.castsShadow = false
            let disc = SCNNode(geometry: SCNSphere(radius: CGFloat(scale * 0.035)))
            disc.geometry?.materials = [Art.mat(UIColor(red: 1, green: 0.98, blue: 0.9, alpha: 1), lighting: .constant)]
            disc.simdPosition = moon.simdPosition + ViewBasis.back * 0.5
            disc.castsShadow = false
            scene.rootNode.addChildNode(moon)
            scene.rootNode.addChildNode(disc)
        }

        // Treibende Blütenblätter
        let petals = SCNNode()
        let ps = SCNParticleSystem()
        switch theme.particle {
        case .petals: ps.particleImage = Art.petal()
        case .leaves: ps.particleImage = Art.leaf()
        case .motes:
            ps.particleImage = Art.glow(color: UIColor(red: 0.75, green: 1, blue: 0.85, alpha: 1))
            ps.blendMode = .additive
        }
        ps.birthRate = theme.particle == .motes ? 4 : 2.2
        ps.particleLifeSpan = 12
        ps.particleSize = 0.09
        ps.particleSizeVariation = 0.03
        ps.emitterShape = SCNBox(width: CGFloat(scale * 1.6), height: 0.2, length: CGFloat(scale * 1.6), chamferRadius: 0)
        ps.birthLocation = .volume
        ps.particleVelocity = 0.25
        ps.emittingDirection = SCNVector3(-0.3, -1, 0.2)
        ps.spreadingAngle = 30
        ps.acceleration = SCNVector3(-0.05, -0.08, 0.03)
        ps.particleAngularVelocity = 90
        ps.particleAngularVelocityVariation = 120
        ps.isLightingEnabled = false
        ps.warmupDuration = 10
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        petals.addParticleSystem(ps)
        petals.simdPosition = basis.target + SIMD3(0, 9, 0)
        scene.rootNode.addChildNode(petals)

        return (sun, clouds)
    }

    /// Glühwürmchen rund um den Schrein.
    static func fireflies(at p: SIMD3<Float>, rate: CGFloat = 3) -> SCNNode {
        let n = SCNNode()
        let ps = SCNParticleSystem()
        ps.particleImage = Art.glow(color: UIColor(red: 1, green: 0.95, blue: 0.6, alpha: 1))
        ps.birthRate = rate
        ps.particleLifeSpan = 4
        ps.particleSize = 0.07
        ps.emitterShape = SCNBox(width: 2.4, height: 1.2, length: 2.4, chamferRadius: 0)
        ps.birthLocation = .volume
        ps.particleVelocity = 0.12
        ps.spreadingAngle = 180
        ps.blendMode = .additive
        ps.isLightingEnabled = false
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        n.addParticleSystem(ps)
        n.simdPosition = p
        return n
    }

    static func burst(at p: SIMD3<Float>, color: UIColor, count: CGFloat = 160) -> SCNNode {
        let n = SCNNode()
        let ps = SCNParticleSystem()
        ps.particleImage = Art.glow(color: color)
        ps.birthRate = count
        ps.emissionDuration = 0.12
        ps.loops = false
        ps.particleLifeSpan = 0.9
        ps.particleLifeSpanVariation = 0.3
        ps.particleSize = 0.09
        ps.particleVelocity = 1.4
        ps.particleVelocityVariation = 0.8
        ps.spreadingAngle = 180
        ps.dampingFactor = 2
        ps.blendMode = .additive
        ps.isLightingEnabled = false
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        n.addParticleSystem(ps)
        n.simdPosition = p
        n.runAction(.sequence([.wait(duration: 2), .removeFromParentNode()]))
        return n
    }

    static func petalBurst(at p: SIMD3<Float>) -> SCNNode {
        let n = SCNNode()
        let ps = SCNParticleSystem()
        ps.particleImage = Art.petal()
        ps.birthRate = 220
        ps.emissionDuration = 0.4
        ps.loops = false
        ps.particleLifeSpan = 5
        ps.particleSize = 0.11
        ps.particleVelocity = 2.4
        ps.particleVelocityVariation = 1.2
        ps.spreadingAngle = 70
        ps.emittingDirection = SCNVector3(0, 1, 0)
        ps.acceleration = SCNVector3(-0.3, -0.6, 0.2)
        ps.dampingFactor = 1.2
        ps.particleAngularVelocity = 180
        ps.particleAngularVelocityVariation = 200
        ps.isLightingEnabled = false
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        n.addParticleSystem(ps)
        n.simdPosition = p
        n.runAction(.sequence([.wait(duration: 7), .removeFromParentNode()]))
        return n
    }
}
