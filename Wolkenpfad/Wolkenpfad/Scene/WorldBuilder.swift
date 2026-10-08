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
    /// Kapitel, in denen von selbst Gras, Büsche und Ranken wachsen.
    private static let lush: Set<String> = ["meadow", "river", "lanterns", "mist", "grassvale", "mill", "storm", "bellflower",
                                             "giant", "sunbeam", "bridgeworks", "skygarden", "ruins", "horizon"]

    static func build(_ logic: LevelLogic, theme: Theme) -> WorldNodes {
        let w = WorldNodes()
        w.root.name = "level"
        let def = logic.def

        // Gruppen (Drehbrücken, Aufzüge, Spiegel, Harfenwirbel …)
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
        var lipCache: [String: SCNMaterial] = [:]
        let occupied = Set(def.blocks.map { $0.p })
        for (i, b) in def.blocks.enumerated() {
            let node: SCNNode
            if let st = b.stair {
                node = stairNode(material: b.m, dir: st, theme: theme)
            } else {
                let geo: SCNGeometry
                if let cached = boxCache[b.m] {
                    geo = cached
                } else {
                    let box = SCNBox(width: 1, height: 1, length: 1, chamferRadius: 0.025)
                    box.materials = Art.blockMaterials(b.m, theme: theme)
                    boxCache[b.m] = box
                    geo = box
                }
                node = SCNNode(geometry: geo)
                // Moosiger Rand, der leicht über die Kante hängt
                if (b.m == "grass" || b.m == "moss") && !occupied.contains(b.p + IVec3(0, 1, 0)) {
                    let lipMat: SCNMaterial
                    if let m = lipCache[b.m] { lipMat = m } else {
                        lipMat = Art.mat(Art.painted(theme.colors(b.m).top, seed: 13, dabs: 70, strength: 0.16 * theme.brush))
                        lipCache[b.m] = lipMat
                    }
                    let lip = SCNBox(width: 1.05, height: 0.08, length: 1.05, chamferRadius: 0.035)
                    lip.materials = [lipMat]
                    let ln = SCNNode(geometry: lip)
                    ln.simdPosition = SIMD3(0, 0.47, 0)
                    ln.categoryBitMask = Props.blockCategory
                    node.addChildNode(ln)
                }
                if b.m == "light" || b.m == "ghost" {
                    node.castsShadow = false
                    node.runAction(.repeatForever(.sequence([.fadeOpacity(to: 0.82, duration: 1.6), .fadeOpacity(to: 1, duration: 1.6)])))
                }
            }
            node.name = "block:\(i)"
            node.categoryBitMask = Props.blockCategory
            node.enumerateChildNodes { c, _ in c.categoryBitMask = Props.blockCategory }
            let (parent, local) = parentAndLocal(b.p, group: b.g)
            node.simdPosition = local
            parent.addChildNode(node)
            w.blockNodes[i] = node
            if b.walk && (b.m == "grass" || b.m == "moss") && b.g == nil {
                w.grassTiles.append(b.p.float3 + SIMD3(0, 0.5, 0))
            }
        }

        // Dekoration
        var decorCells = Set<IVec3>()
        for (i, d) in def.decor.enumerated() {
            decorCells.insert(d.p)
            let seed = UInt64(i * 7919 + 17)
            let (parent, local) = parentAndLocal(d.p, group: d.g)
            guard let made = makeDecor(d, seed: seed, def: def, theme: theme, w: w) else { continue }
            place(made.0, at: local + made.1, rotation: Float(d.r), in: parent)
        }

        // Verbindungen: Seile, Wimpel, Harfensaiten
        for (i, d) in def.decor.enumerated() where ["rope", "pennant", "harpstring"].contains(d.t) {
            guard let to = d.to else { continue }
            let h: Float = d.t == "harpstring" ? 1.2 * Float(d.s) : 0.9 * Float(d.s)
            let a = d.p.float3 + SIMD3(0, 0.5 + h, 0), b = to.float3 + SIMD3(0, 0.5 + h, 0)
            let n = Props.span(d.t, from: a, to: b, seed: UInt64(i + 5))
            n.enumerateHierarchy { c, _ in c.categoryBitMask = Props.decorCategory }
            let (parent, _) = parentAndLocal(d.p, group: d.g)
            if parent === w.root { w.root.addChildNode(n) }
        }

        // Ghibli: Die Natur erobert sich die Steine zurück – kleine Büsche, Gras und Ranken
        if lush.contains(theme.name) {
            let reserved = Set([def.start, def.goal] + (def.plates ?? []).map { $0.at } + def.texts.map { $0.at })
            for (i, b) in def.blocks.enumerated() where b.g == nil && b.stair == nil {
                let p = b.p
                guard !occupied.contains(p + IVec3(0, 1, 0)), !decorCells.contains(p), !reserved.contains(p) else { continue }
                guard ["grass", "moss", "stone", "rock", "stonedark"].contains(b.m) else { continue }
                var rng = Rand(UInt64(abs(p.x * 73856093 ^ p.y * 19349663 ^ p.z * 83492791)) &+ 7)
                let roll = rng.next()
                if !b.walk && roll < 0.42 {
                    let pick = rng.next()
                    let n: SCNNode = pick < 0.35 ? Props.bush(scale: Float(rng.range(0.6, 0.9)))
                        : pick < 0.7 ? Props.grass(scale: 1, seed: UInt64(i))
                        : pick < 0.85 ? Props.flowers(scale: 0.8, seed: UInt64(i)) : Props.mushroom(scale: 0.8)
                    place(n, at: p.float3 + SIMD3(0, 0.5, 0), rotation: Float(rng.range(0, 6)), in: w.root)
                } else if b.walk && roll < 0.1 && (b.m == "grass" || b.m == "moss") {
                    place(Props.grass(scale: 0.7, seed: UInt64(i)), at: p.float3 + SIMD3(0, 0.5, 0), rotation: 0, in: w.root)
                }
                // Ranken an Inselkanten (vorne frei, darunter frei)
                if !occupied.contains(p + IVec3(0, 0, 1)) && !occupied.contains(p + IVec3(0, -1, 0)) && rng.next() < 0.22 {
                    place(Props.vines(scale: 0.8, seed: UInt64(i + 3)), at: p.float3 + SIMD3(0, 0.5, 0.5), rotation: 0, in: w.root)
                }
            }
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

    private static func place(_ node: SCNNode, at p: SIMD3<Float>, rotation: Float, in parent: SCNNode) {
        node.enumerateHierarchy { c, _ in
            if c.categoryBitMask != Props.mechanismCategory { c.categoryBitMask = Props.decorCategory }
        }
        let holder = SCNNode()
        holder.addChildNode(node)
        holder.simdPosition = p
        holder.eulerAngles.y = rotation
        holder.categoryBitMask = Props.decorCategory
        parent.addChildNode(holder)
    }

    /// Ein Dekorationsobjekt und seine Lage relativ zur Feldmitte.
    private static func makeDecor(_ d: DecorDef, seed: UInt64, def: LevelDef, theme: Theme, w: WorldNodes) -> (SCNNode, SIMD3<Float>)? {
        let s = Float(d.s)
        let top = SIMD3<Float>(0, 0.5, 0), front = SIMD3<Float>(0, 0.5, 0.5)
        switch d.t {
        case "tree":
            let n = Props.tree(scale: s, variant: d.variant ?? 0, seed: seed)
            if let endTree = def.ending?.tree, d.p == endTree { w.shrineTree = n }
            return (n, top)
        case "bush": return (Props.bush(scale: s), top)
        case "flowers": return (Props.flowers(scale: s, seed: seed), top)
        case "grass": return (Props.grass(scale: s, seed: seed), top)
        case "tallgrass": return (Props.tallGrass(scale: s, seed: seed), top)
        case "mushroom": return (Props.mushroom(scale: s), top)
        case "rock": return (Props.rock(scale: s), top)
        case "bamboo": return (Props.bamboo(scale: s, seed: seed), top)
        case "oak": return (Props.oak(scale: s, seed: seed), top)
        case "bellflower": return (Props.bellflower(scale: s, seed: seed, lights: theme.night), top)
        case "butterflies": return (Props.butterflies(scale: s, seed: seed), top)
        case "cloudpuff": return (Props.cloudPuff(scale: s, seed: seed), top)
        case "lantern": return (Props.lantern(scale: s, boost: theme.lanternBoost), top)
        case "torii": return (Props.torii(scale: s), top)
        case "millwheel": return (Props.millwheel(face: d.face ?? "+z"), .zero)
        case "windmill": return (Props.windmill(face: d.face ?? "+z", scale: s), top)
        case "house": return (Props.house(variant: d.variant ?? 0, scale: s), top)
        case "chest": return (Props.chest(scale: s), top)
        case "beam": return (Props.beam(scale: s), top)
        case "notebook": return (Props.notebook(), top)
        case "letters": return (Props.letters(seed: seed), front)
        case "vine": return (Props.vines(scale: s, seed: seed), front)
        case "scaffold": return (Props.scaffold(scale: s), top)
        case "pillar": return (Props.pillar(scale: s, seed: seed), top)
        case "gear": return (Props.gear(face: d.face ?? "+z", scale: s), .zero)
        case "mirror": return (Props.mirror(scale: s), top)
        case "vent": return (Props.vent(), top)
        case "lightshaft": return (Props.lightShaft(scale: s), top)
        case "windharp": return (Props.windharp(scale: s), top)
        case "kodama": return (Props.kodama(scale: s, seed: seed), top)
        case "oldwoman": return (Props.oldWoman(), top)
        case "guardian": return (Props.guardian(scale: s), top)
        case "projection": return (Props.projection(scale: s), top)
        case "giantface":
            let face = d.face ?? "+z"
            return (Props.giantFace(face: face, scale: s), face == "+x" ? SIMD3(0.52, 0.5, 0) : SIMD3(0, 0.5, 0.52))
        case "pond": return (Props.pondDetails(), top)
        case "waterfall": return (Props.waterfall(), SIMD3(0.52, 0.4, 0))
        case "rope", "pennant", "harpstring":
            // Pfosten am Anfang; die Leine selbst entsteht danach
            if d.t == "harpstring" { return (Props.billboardGlow(size: 0.5, color: UIColor(hex: 0xFFF0C8, alpha: 0.8)).withPosition(SIMD3(0, 1.2 * s, 0)), top) }
            return (Props.cylinder(0.03, 0.9 * s, UIColor(hex: 0x8A6A44), SIMD3(0, 0.45 * s, 0)), top)
        case "altar":
            let (a, seedNode) = Props.altar(scale: s)
            w.seed = seedNode
            if let item = def.goalItem, item != "seed" {
                seedNode.childNodes.forEach { $0.removeFromParentNode() }
                seedNode.addChildNode(Props.goalItem(item))
            }
            return (a, top)
        case "crank":
            let (c, spinner) = Props.crank(face: d.face ?? "+x")
            c.name = "crank:\(d.g ?? "")"
            if let g = d.g {
                w.spinners[g] = spinner
                w.handles[g] = c
            }
            return (c, .zero)
        case "handle":
            let h = Props.liftHandle(axis: d.axis ?? "y")
            h.name = "crank:\(d.g ?? "")"
            if let g = d.g { w.handles[g] = h }
            return (h, .zero)
        default:
            return nil
        }
    }

    /// Treppe aus vier Stufen; Grundform steigt Richtung −Z an.
    static func stairNode(material: String, dir: String, theme: Theme) -> SCNNode {
        let root = SCNNode()
        let mats = Art.blockMaterials(material, theme: theme)
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

        // Luftperspektive: ferne Teile verblassen im Dunst
        if let haze = theme.haze {
            scene.fogColor = haze
            scene.fogStartDistance = 86
            scene.fogEndDistance = 170
            scene.fogDensityExponent = 1.2
        }

        // Ferne, gemalte Kulisse zwischen Himmelswolken und Wolkenmeer
        let bw = scale * 2.4
        let plane = SCNPlane(width: CGFloat(bw), height: CGFloat(bw / 2))
        let bm = SCNMaterial()
        bm.diffuse.contents = Art.backdrop(theme.backdrop, theme: theme)
        bm.lightingModel = .constant
        bm.writesToDepthBuffer = false
        plane.materials = [bm]
        let backdrop = SCNNode(geometry: plane)
        backdrop.simdPosition = basis.world(u: 0, v: -2.4 * scale / 11, depth: -24)
        backdrop.constraints = [SCNBillboardConstraint()]
        backdrop.renderingOrder = -55
        backdrop.castsShadow = false
        backdrop.categoryBitMask = Props.decorCategory
        scene.rootNode.addChildNode(backdrop)

        // Licht: Sonne (oder Mond) und Himmelslicht
        let sun = SCNNode()
        let light = SCNLight()
        light.type = .directional
        light.color = theme.sun
        light.intensity = theme.sunIntensity
        light.castsShadow = true
        light.shadowMode = .forward
        light.shadowColor = UIColor(red: 0.3, green: 0.22, blue: 0.4, alpha: theme.night ? 0.3 : 0.4)
        light.shadowRadius = 5
        light.shadowSampleCount = 8
        light.shadowMapSize = CGSize(width: 2048, height: 2048)
        light.orthographicScale = 16
        light.zNear = 1
        light.zFar = 90
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

        // Gewitter: ab und zu ein fahler Blitz
        if theme.lightning {
            let flash = SCNNode()
            flash.light = SCNLight()
            flash.light?.type = .ambient
            flash.light?.color = UIColor(hex: 0xDDE6FF)
            flash.light?.intensity = 0
            scene.rootNode.addChildNode(flash)
            let strike = SCNAction.customAction(duration: 0.5) { node, t in
                let k = t / 0.5
                node.light?.intensity = k < 0.15 ? 1600 : (k < 0.3 ? 200 : (k < 0.42 ? 1100 : CGFloat(1 - k) * 600))
            }
            let thunder = SCNAction.run { _ in SoundEngine.shared.rumble() }
            flash.runAction(.repeatForever(.sequence([.wait(duration: 9, withRange: 8), strike,
                                                      .customAction(duration: 0) { n, _ in n.light?.intensity = 0 }, thunder])))
        }

        // Wolken: hinten am Himmel, unten als Wolkenmeer und ein paar ganz vorne
        var clouds: [SCNNode] = []
        let sky: [(u: Float, v: Float, d: Float, w: Float, warm: Bool)] = [
            (-5, 7.5, -30, 9, false), (5.5, 9.5, -32, 11, false), (-1, 12, -34, 8, true),
            (6, 2, -28, 7, true), (-6.5, 1, -28, 8, false),
            (-5, -8.5, -12, 11, true), (2, -9.5, -14, 13, false), (7, -7.5, -16, 10, true),
            (-1, -11, -10, 14, false), (-7, -10.5, -9, 12, false), (5, -11.5, -8, 13, true),
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
        let glowColor = theme.stars ? UIColor(red: 0.8, green: 0.86, blue: 1, alpha: 0.7) : theme.sun.withAlphaComponent(0.85)
        let sunGlow = Props.billboardGlow(size: CGFloat(scale * 1.6), color: glowColor)
        sunGlow.simdPosition = basis.world(u: 3.5 * scale / 11, v: 8 * scale / 11, depth: -40)
        sunGlow.renderingOrder = -60
        sunGlow.castsShadow = false
        scene.rootNode.addChildNode(sunGlow)
        if theme.stars {
            let disc = SCNNode(geometry: SCNSphere(radius: CGFloat(scale * 0.035)))
            disc.geometry?.materials = [Art.mat(UIColor(red: 1, green: 0.98, blue: 0.9, alpha: 1), lighting: .constant)]
            disc.simdPosition = sunGlow.simdPosition + ViewBasis.back * 1
            disc.castsShadow = false
            scene.rootNode.addChildNode(disc)
        }

        // Treibende Teilchen
        let emitter = SCNNode()
        let ps = SCNParticleSystem()
        ps.particleLifeSpan = 12
        ps.particleSize = 0.09
        ps.particleSizeVariation = 0.03
        ps.emitterShape = SCNBox(width: CGFloat(scale * 1.6), height: 0.2, length: CGFloat(scale * 1.6), chamferRadius: 0)
        ps.birthLocation = .volume
        ps.birthRate = theme.particleRate
        ps.particleVelocity = 0.25
        ps.emittingDirection = SCNVector3(-0.3, -1, 0.2)
        ps.spreadingAngle = 30
        ps.acceleration = SCNVector3(-0.05, -0.08, 0.03)
        ps.particleAngularVelocity = 90
        ps.particleAngularVelocityVariation = 120
        ps.isLightingEnabled = false
        ps.warmupDuration = 10
        var height: Float = 9
        switch theme.particle {
        case .petals: ps.particleImage = Art.petal()
        case .leaves: ps.particleImage = Art.leaf()
        case .letters:
            ps.particleImage = Art.letterPaper(); ps.particleSize = 0.14
            ps.acceleration = SCNVector3(-0.25, -0.05, 0.12)
        case .seeds:
            ps.particleImage = Art.seedFluff(); ps.particleSize = 0.1
            ps.acceleration = SCNVector3(-0.12, 0.01, 0.06); ps.particleAngularVelocity = 30
            height = 4
            ps.emitterShape = SCNBox(width: CGFloat(scale * 1.6), height: CGFloat(scale * 0.8), length: CGFloat(scale * 1.6), chamferRadius: 0)
        case .motes, .spores, .dust, .goldmotes:
            let col: UIColor = theme.particle == .spores ? UIColor(hex: 0x9CFFD8)
                : theme.particle == .dust ? UIColor(hex: 0xFFE2B0)
                : theme.particle == .goldmotes ? UIColor(hex: 0xFFD27A) : UIColor(red: 0.75, green: 1, blue: 0.85, alpha: 1)
            ps.particleImage = Art.glow(color: col)
            ps.blendMode = .additive
            ps.particleSize = theme.particle == .dust ? 0.05 : 0.08
            ps.acceleration = SCNVector3(0, 0.02, 0)
            ps.particleVelocity = 0.1
            ps.spreadingAngle = 180
            height = 3
            ps.emitterShape = SCNBox(width: CGFloat(scale * 1.5), height: CGFloat(scale * 0.9), length: CGFloat(scale * 1.5), chamferRadius: 0)
        case .butterflies:
            ps.particleImage = Art.butterfly(UIColor(hex: 0xFFE07A))
            ps.blendMode = .additive
            ps.particleSize = 0.14
            ps.particleAngularVelocity = 0
            ps.acceleration = SCNVector3(0.02, 0.03, 0)
            ps.particleVelocity = 0.3
            ps.spreadingAngle = 180
            height = 3
            ps.emitterShape = SCNBox(width: CGFloat(scale * 1.4), height: CGFloat(scale * 0.8), length: CGFloat(scale * 1.4), chamferRadius: 0)
        case .dragonflies:
            ps.particleImage = Art.dragonfly(); ps.particleSize = 0.14; ps.particleAngularVelocity = 0
            ps.emittingDirection = SCNVector3(1, 0, -0.3); ps.particleVelocity = 0.6; height = 3
        case .rain:
            ps.particleImage = Art.raindrop()
            ps.particleSize = 0.12
            ps.particleLifeSpan = 1.6
            ps.particleVelocity = 9
            ps.emittingDirection = SCNVector3(-0.15, -1, 0.1)
            ps.spreadingAngle = 2
            ps.acceleration = SCNVector3(0, -4, 0)
            ps.particleAngularVelocity = 0
            ps.particleAngularVelocityVariation = 0
            ps.stretchFactor = 0.08
            ps.warmupDuration = 2
            height = 12
        }
        ps.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        emitter.addParticleSystem(ps)
        emitter.simdPosition = basis.target + SIMD3(0, height, 0)
        scene.rootNode.addChildNode(emitter)

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
