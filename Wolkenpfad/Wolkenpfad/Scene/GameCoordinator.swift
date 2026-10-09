import UIKit
import SceneKit
import Combine

/// Läuft auf SceneKits Render-Thread: lässt Kiko Hana sanft hinterherschweben.
final class FrameTicker: NSObject, SCNSceneRendererDelegate {
    weak var hana: SCNNode?
    weak var kiko: SCNNode?
    var hint: SIMD3<Float>?
    weak var camera: SCNNode?
    /// Mittelpunkt der Kamera (Offset 0) und erlaubter Bereich entlang der Bildschirm-Senkrechten.
    var cameraBase = SIMD3<Float>(repeating: 0)
    var followRange: ClosedRange<Float> = 0...0
    private var camOffset: Float = 0
    private var camInitialized = false
    private var lastTime: TimeInterval = 0
    private var kikoPos = SIMD3<Float>(repeating: 0)
    private var initialized = false

    func renderer(_ renderer: SCNSceneRenderer, updateAtTime time: TimeInterval) {
        guard let hana = hana, let kiko = kiko else { return }
        let dt = Float(lastTime == 0 ? 1.0 / 60 : min(0.05, time - lastTime))
        lastTime = time
        let hp = hana.presentation.simdWorldPosition
        let target = hint ?? (hp + SIMD3<Float>(-0.42, 0.68, 0.34))
        if !initialized {
            kikoPos = target
            initialized = true
        }
        let k = min(1, dt * (hint == nil ? 2.6 : 1.5))
        kikoPos += (target - kikoPos) * k
        let bob = sin(Float(time) * 2.3) * 0.06
        kiko.simdPosition = kikoPos + SIMD3<Float>(0, bob, 0)

        // Hohe Level: die Kamera gleitet mit Hana nach oben und unten
        if let cam = camera {
            let range = followRange
            let focus = hint ?? hp
            let want = min(max(dot3(focus - cameraBase, ViewBasis.up), range.lowerBound), range.upperBound)
            if !camInitialized {
                camOffset = want
                camInitialized = true
            }
            camOffset += (want - camOffset) * min(1, dt * 1.4)
            cam.simdPosition = cameraBase + ViewBasis.up * camOffset + ViewBasis.back * 80
        }
    }
}

@MainActor
final class GameCoordinator: NSObject, ObservableObject {
    enum Phase { case title, playing, ending, finished }

    @Published private(set) var phase: Phase = .title
    @Published private(set) var story: String?
    @Published var menuOpen = false {
        didSet { scene.isPaused = menuOpen }
    }
    @Published var soundOn = true {
        didSet { audio.enabled = soundOn }
    }

    let view: SCNView
    let levelIndex: Int
    let chapterTitle: String
    private let theme: Theme
    /// Dunkle Kapitel brauchen helle Schrift.
    var isNight: Bool { theme.night }
    private var pressed: Set<String> { logic.pressed }
    /// Gesteuerte Gruppen, die gerade fahren.
    private var animating = Set<String>()
    private let scene = SCNScene()
    private let logic: LevelLogic
    private let world: WorldNodes
    private let cameraNode = SCNNode()
    private let camera = SCNCamera()
    private var basis: ViewBasis
    private var baseScale: Float = 10
    private var sun: SCNNode?
    private let hana: SCNNode
    private let hanaBody: SCNNode
    private let kiko: SCNNode
    private let ticker = FrameTicker()
    private let audio = SoundEngine.shared
    private let haptic: UIImpactFeedbackGenerator
    private let rigid: UIImpactFeedbackGenerator

    private var currentTile: Int
    private var walking = false
    private var queuedPath: [Int] = []
    private var pendingTarget: Int?
    private var mechanismBusy = false
    private var shownTexts = Set<Int>()
    private var lastInteraction = Date()
    private var hintTimer: Timer?
    private var storyToken = 0
    private var lastLayoutSize: CGSize = .zero

    private struct Drag {
        let group: String
        let rotator: Bool
        let start: Float
        var value: Float
        var lastAngle: Float
        let allowed: ClosedRange<Int>
        var detent: Int
        let pivot: SIMD3<Float>
        let axisScreen: CGVector
        let startTouch: CGPoint
    }
    private var drag: Drag?

    init(levelIndex: Int) {
        self.levelIndex = levelIndex
        let def = LevelDef.load("level\(levelIndex)")
        chapterTitle = def.name
        theme = Theme.named(def.theme)
        logic = LevelLogic(def: def)
        world = WorldBuilder.build(logic, theme: theme)
        basis = ViewBasis(target: .zero)
        let (h, body) = Characters.hana()
        hana = h
        hanaBody = body
        kiko = Characters.kiko()
        currentTile = logic.startBlock
        view = SCNView(frame: .zero, options: nil)
        haptic = UIImpactFeedbackGenerator(style: .soft)
        rigid = UIImpactFeedbackGenerator(style: .rigid)
        super.init()
        setupScene()
        setupView()
        audio.start()
        audio.playMusic(theme: theme.song)
        hintTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] timer in
            guard let self = self else {
                timer.invalidate()
                return
            }
            Task { @MainActor in self.tickHints() }
        }
    }

    // MARK: - Aufbau

    private func setupScene() {
        scene.rootNode.addChildNode(world.root)

        // Kamera: orthografisch, isometrischer Blick entlang −(1,1,1)
        let (center, extent) = levelExtent()
        basis = ViewBasis(target: center)
        baseScale = extent
        camera.usesOrthographicProjection = true
        camera.orthographicScale = Double(extent)
        camera.zNear = 1
        camera.zFar = 300
        camera.wantsHDR = true
        camera.wantsExposureAdaptation = false
        camera.bloomIntensity = 0.55
        camera.bloomThreshold = 0.85
        camera.bloomBlurRadius = 10
        camera.vignettingIntensity = 0.35
        camera.vignettingPower = 0.6
        camera.saturation = 1.05
        cameraNode.camera = camera
        cameraNode.simdPosition = center + ViewBasis.back * 80
        cameraNode.look(at: v3(center), up: SCNVector3(0, 1, 0), localFront: SCNVector3(0, 0, -1))
        scene.rootNode.addChildNode(cameraNode)

        let atmos = Atmosphere.setup(scene: scene, basis: basis, scale: extent, theme: theme)
        sun = atmos.sun
        if let goal = logic.tiles[logic.goalBlock] {
            scene.rootNode.addChildNode(Atmosphere.fireflies(at: goal.center + SIMD3(0, 0.6, 0.5), rate: CGFloat(theme.fireflies)))
        }
        if theme.stars {
            // Nachts schweben überall Glühwürmchen
            scene.rootNode.addChildNode(Atmosphere.fireflies(at: center, rate: 6))
        }
        ticker.camera = cameraNode
        ticker.cameraBase = center

        // Figuren
        if let start = logic.tiles[logic.startBlock] {
            hana.simdPosition = start.center
            hana.eulerAngles.y = .pi / 4
        }
        scene.rootNode.addChildNode(hana)
        scene.rootNode.addChildNode(kiko)
        ticker.hana = hana
        ticker.kiko = kiko
    }

    private func setupView() {
        view.scene = scene
        view.pointOfView = cameraNode
        view.delegate = ticker
        view.backgroundColor = UIColor(red: 0.99, green: 0.9, blue: 0.82, alpha: 1)
        view.antialiasingMode = .multisampling4X
        view.preferredFramesPerSecond = 60
        view.isPlaying = true
        view.rendersContinuously = true
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        pan.maximumNumberOfTouches = 1
        view.addGestureRecognizer(tap)
        view.addGestureRecognizer(pan)
    }

    /// Mittelpunkt und benötigte halbe Bildhöhe, damit das ganze Level sichtbar ist.
    private func levelExtent() -> (SIMD3<Float>, Float) {
        var umin = Float.greatestFiniteMagnitude, umax = -Float.greatestFiniteMagnitude
        var vmin = Float.greatestFiniteMagnitude, vmax = -Float.greatestFiniteMagnitude
        for i in logic.def.blocks.indices {
            let c = logic.worldCell(i).0.float3
            for dx: Float in [-0.5, 0.5] {
                for dy: Float in [-0.5, 0.5] {
                    for dz: Float in [-0.5, 0.5] {
                        let p = ViewBasis.project(c + SIMD3(dx, dy, dz))
                        umin = min(umin, p.x); umax = max(umax, p.x)
                        vmin = min(vmin, p.y); vmax = max(vmax, p.y)
                    }
                }
            }
        }
        let uc = (umin + umax) / 2
        let vc = (vmin + vmax) / 2 + 0.8   // etwas mehr Himmel oben für Titel und Texte
        let center = ViewBasis.right * uc + ViewBasis.up * vc
        let halfH = (vmax - vmin) / 2 + 1.4
        let halfW = (umax - umin) / 2 + 0.8
        // Hochformat-iPhone: Breite ist meist der begrenzende Faktor
        return (center, max(halfH, halfW / 0.46))
    }

    /// Passt den Bildausschnitt an das tatsächliche Seitenverhältnis an.
    func layout(size: CGSize) {
        guard size.width > 0, size.height > 0, size != lastLayoutSize else { return }
        lastLayoutSize = size
        var umin = Float.greatestFiniteMagnitude, umax = -Float.greatestFiniteMagnitude
        var vmin = Float.greatestFiniteMagnitude, vmax = -Float.greatestFiniteMagnitude
        for i in logic.def.blocks.indices {
            let p = ViewBasis.project(logic.worldCell(i).0.float3 - basis.target)
            umin = min(umin, p.x - 0.9); umax = max(umax, p.x + 0.9)
            vmin = min(vmin, p.y - 1); vmax = max(vmax, p.y + 1)
        }
        let aspect = Float(size.width / size.height)
        let halfW = max(abs(umin), abs(umax)) + 0.4
        let halfH = max(abs(vmin), abs(vmax)) + 1.6
        // Breite passt immer; sehr hohe Level werden nicht verkleinert, sondern befahren
        baseScale = max(min(halfH, 13.5), halfW / aspect)
        let lo = vmin - 0.6 + baseScale, hi = vmax + 1.6 - baseScale
        ticker.followRange = lo < hi ? lo...hi : 0...0
        camera.orthographicScale = Double(phase == .finished || phase == .ending ? baseScale * 1.12 : baseScale)
    }

    // MARK: - Spielablauf

    func startGame() {
        guard phase == .title else { return }
        phase = .playing
        lastInteraction = Date()
        audio.chime([0, 4, 7], spacing: 0.2, amp: 0.08)
        checkStory(at: currentTile)
    }

    private func say(_ text: String, duration: Double = 6) {
        storyToken += 1
        let token = storyToken
        story = text
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
            if self.storyToken == token { self.story = nil }
        }
    }

    private func checkStory(at tile: Int) {
        guard !shownTexts.contains(tile) else { return }
        let cell = logic.def.blocks[tile].p
        if let t = logic.def.texts.first(where: { $0.at == cell }), logic.def.blocks[tile].g == nil {
            shownTexts.insert(tile)
            say(t.text)
        }
    }

    // MARK: - Tippen & Laufen

    @objc private func handleTap(_ g: UITapGestureRecognizer) {
        guard phase == .playing, !menuOpen else { return }
        lastInteraction = Date()
        ticker.hint = nil
        guard !mechanismBusy, drag == nil else { return }
        let p = g.location(in: view)
        guard let target = tile(atScreen: p) else { return }
        showRipple(at: target)
        if walking {
            pendingTarget = target
            return
        }
        walk(to: target)
    }

    private func blockIndex(of node: SCNNode?) -> Int? {
        var n = node
        while let c = n {
            if let name = c.name, name.hasPrefix("block:") { return Int(name.dropFirst(6)) }
            n = c.parent
        }
        return nil
    }

    private func groupID(of node: SCNNode?) -> String? {
        var n = node
        while let c = n {
            if let name = c.name {
                if name.hasPrefix("crank:") { return String(name.dropFirst(6)) }
                if name.hasPrefix("group:") { return String(name.dropFirst(6)) }
            }
            n = c.parent
        }
        return nil
    }

    private func tile(atScreen p: CGPoint) -> Int? {
        let hits = view.hitTest(p, options: [
            .categoryBitMask: Props.blockCategory,
            .searchMode: SCNHitTestSearchMode.closest.rawValue,
            .ignoreHiddenNodes: true,
        ])
        if let first = hits.first, let idx = blockIndex(of: first.node), logic.tiles[idx] != nil {
            return idx
        }
        // Großzügiger Fallback: nächstgelegenes Feld in Bildschirmnähe
        var best: Int?
        var bestD: CGFloat = 46
        var bestDepth: Float = -.greatestFiniteMagnitude
        for (i, t) in logic.tiles {
            let sp = view.projectPoint(v3(t.center))
            let d = hypot(CGFloat(sp.x) - p.x, CGFloat(sp.y) - p.y)
            let depth = dot3(t.center, ViewBasis.back)
            if d < bestD - 4 || (abs(d - bestD) <= 4 && depth > bestDepth) {
                best = i
                bestD = d
                bestDepth = depth
            }
        }
        return best
    }

    private func walk(to target: Int) {
        guard target != currentTile else { return }
        guard let path = logic.path(from: currentTile, to: target), !path.isEmpty else {
            audio.blocked()
            let shake = SCNAction.sequence([.rotateBy(x: 0, y: 0.25, z: 0, duration: 0.08),
                                            .rotateBy(x: 0, y: -0.5, z: 0, duration: 0.12),
                                            .rotateBy(x: 0, y: 0.25, z: 0, duration: 0.08)])
            hanaBody.runAction(shake)
            return
        }
        queuedPath = path
        walking = true
        reparent(hana, to: scene.rootNode)
        Characters.startWalking(hanaBody)
        stepNext()
    }

    private func stepNext() {
        if let pt = pendingTarget {
            pendingTarget = nil
            if let p = logic.path(from: currentTile, to: pt) { queuedPath = p }
        }
        guard !queuedPath.isEmpty else {
            finishWalking()
            return
        }
        let next = queuedPath.removeFirst()
        guard let a = logic.tiles[currentTile], let b = logic.tiles[next],
              let ports = logic.ports[currentTile]?[next] else {
            queuedPath = []
            finishWalking()
            return
        }
        let action = segment(from: a.center, portA: ports.0, portB: ports.1, to: b.center)
        hana.runAction(action, forKey: "move") { [weak self] in
            Task { @MainActor in self?.arrived(at: next) }
        }
    }

    private func segment(from a: SIMD3<Float>, portA: SIMD3<Float>, portB: SIMD3<Float>, to b: SIMD3<Float>) -> SCNAction {
        let speed: Float = 2.1
        var acts: [SCNAction] = []
        func leg(_ from: SIMD3<Float>, _ to: SIMD3<Float>) {
            let d = to - from
            let len = (d.x * d.x + d.y * d.y + d.z * d.z).squareRoot()
            guard len > 0.001 else { return }
            var parts: [SCNAction] = [.move(to: v3(to), duration: TimeInterval(len / speed))]
            if abs(d.x) + abs(d.z) > 0.001 {
                parts.append(.rotateTo(x: 0, y: CGFloat(atan2(d.x, d.z)), z: 0, duration: 0.12, usesShortestUnitArc: true))
            }
            acts.append(.group(parts))
        }
        leg(a, portA)
        acts.append(.run { _ in SoundEngine.shared.step() })
        if distSq(portA, portB) > 0.0001 {
            // Unmögliche Verbindung: für die Kamera deckungsgleich – ein unsichtbarer Sprung
            let target = v3(portB)
            acts.append(.run { node in node.position = target })
        }
        leg(portB, b)
        return .sequence(acts)
    }

    private func arrived(at t: Int) {
        currentTile = t
        checkStory(at: t)
        if t == logic.goalBlock {
            queuedPath = []
            pendingTarget = nil
            finishWalking()
            beginEnding()
            return
        }
        if let plate = logic.def.plates?.first(where: { logic.block(at: $0.at) == t }), !pressed.contains(plate.id) {
            queuedPath = []
            pendingTarget = nil
            finishWalking()
            press(plate.id)
            return
        }
        stepNext()
    }

    // MARK: - Druckplatten

    private func press(_ id: String) {
        logic.press(id)
        audio.plate()
        rigid.impactOccurred(intensity: 0.9)
        if let p = world.plates[id] {
            p.node.removeAllActions()
            p.node.opacity = 1
            p.node.runAction(.moveBy(x: 0, y: -0.03, z: 0, duration: 0.2))
            SCNTransaction.begin()
            SCNTransaction.animationDuration = 0.6
            p.rune.emission.contents = UIColor(red: 1, green: 0.85, blue: 0.45, alpha: 1)
            SCNTransaction.commit()
            scene.rootNode.addChildNode(Atmosphere.burst(at: p.node.simdWorldPosition + SIMD3(0, 0.1, 0),
                                                        color: UIColor(red: 1, green: 0.9, blue: 0.55, alpha: 1), count: 120))
        }
        applyTriggers()
    }

    /// Bewegt alle gesteuerten Gruppen, deren Auslöser sich geändert haben (Platten oder gekoppelte Stellungen).
    private func applyTriggers() {
        let pending = logic.pendingTriggers().filter { !animating.contains($0.key) }
        guard !pending.isEmpty else { return }
        audio.rumble()
        for (group, value) in pending.sorted(by: { $0.key < $1.key }) {
            guard let node = world.groupNodes[group], let g = logic.groupsByID[group] else { continue }
            animating.insert(group)
            mechanismBusy = true
            let oldEdges = logic.edges
            SCNTransaction.begin()
            SCNTransaction.animationDuration = 1.6
            SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            if g.isRotator {
                node.eulerAngles.y = Float(value) * .pi / 2
            } else if let axis = g.axis {
                node.simdPosition = axis.float3 * Float(value)
            }
            SCNTransaction.completionBlock = { [weak self] in
                Task { @MainActor in
                    self?.animating.remove(group)
                    self?.mechanismSettled(group: group, value: value, oldEdges: oldEdges)
                }
            }
            SCNTransaction.commit()
            // Kiko schaut kurz zum bewegten Teil
            ticker.hint = node.simdWorldPosition + ViewBasis.back * 1.2 + SIMD3(0, 0.6, 0)
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                self.ticker.hint = nil
            }
        }
    }

    private func finishWalking() {
        walking = false
        Characters.stopWalking(hanaBody)
        // Steht Hana auf einem beweglichen Teil, fährt sie mit
        if let g = logic.groupOf(block: currentTile), let node = world.groupNodes[g] {
            reparent(hana, to: node)
        }
    }

    private func reparent(_ node: SCNNode, to parent: SCNNode) {
        guard node.parent !== parent else { return }
        let wt = node.worldTransform
        node.removeFromParentNode()
        parent.addChildNode(node)
        node.transform = parent.convertTransform(wt, from: nil)
    }

    private func showRipple(at t: Int) {
        guard let tile = logic.tiles[t] else { return }
        let plane = SCNPlane(width: 0.8, height: 0.8)
        let m = SCNMaterial()
        m.diffuse.contents = Art.ring()
        m.lightingModel = .constant
        m.writesToDepthBuffer = false
        m.isDoubleSided = true
        plane.materials = [m]
        let n = SCNNode(geometry: plane)
        n.eulerAngles.x = -.pi / 2
        n.simdPosition = tile.center + SIMD3(0, 0.03, 0)
        n.castsShadow = false
        n.renderingOrder = 10
        n.scale = SCNVector3(0.3, 0.3, 0.3)
        scene.rootNode.addChildNode(n)
        n.runAction(.sequence([.group([.scale(to: 1.1, duration: 0.5), .fadeOut(duration: 0.5)]), .removeFromParentNode()]))
    }

    // MARK: - Mechanismen

    @objc private func handlePan(_ g: UIPanGestureRecognizer) {
        switch g.state {
        case .began:
            guard phase == .playing, !menuOpen, !walking, !mechanismBusy else { return }
            let t = g.translation(in: view)
            let loc = g.location(in: view)
            let start = CGPoint(x: loc.x - t.x, y: loc.y - t.y)
            guard let gid = mechanism(atScreen: start), let gdef = logic.groupsByID[gid], gdef.locked != true else { return }
            lastInteraction = Date()
            ticker.hint = nil
            let v = logic.value(of: gid)
            let allowed = allowedRange(gid, current: v)
            if gdef.isRotator {
                let pivot = gdef.pivot?.float3 ?? .zero
                let ang = planeAngle(screen: start, pivot: pivot) ?? 0
                drag = Drag(group: gid, rotator: true, start: Float(v) * .pi / 2, value: Float(v) * .pi / 2,
                            lastAngle: ang, allowed: allowed, detent: v, pivot: pivot,
                            axisScreen: .zero, startTouch: start)
            } else {
                let axis = gdef.axis?.float3 ?? SIMD3(0, 1, 0)
                let base = (world.groupNodes[gid]?.simdWorldPosition ?? .zero) + (gdef.handle?.float3 ?? .zero)
                let p0 = view.projectPoint(v3(base))
                let p1 = view.projectPoint(v3(base + axis))
                drag = Drag(group: gid, rotator: false, start: Float(v), value: Float(v), lastAngle: 0,
                            allowed: allowed, detent: v, pivot: base,
                            axisScreen: CGVector(dx: CGFloat(p1.x - p0.x), dy: CGFloat(p1.y - p0.y)), startTouch: start)
            }
            haptic.prepare()
        case .changed:
            guard var d = drag, let node = world.groupNodes[d.group] else { return }
            let loc = g.location(in: view)
            if d.rotator {
                guard let ang = planeAngle(screen: loc, pivot: d.pivot) else { return }
                var delta = ang - d.lastAngle
                while delta > .pi { delta -= 2 * .pi }
                while delta < -.pi { delta += 2 * .pi }
                d.lastAngle = ang
                let lo = Float(d.allowed.lowerBound) * .pi / 2, hi = Float(d.allowed.upperBound) * .pi / 2
                d.value = rubber(d.value + delta, lo, hi, margin: 0.18)
                node.eulerAngles.y = d.value
                world.spinners[d.group]?.eulerAngles.y = -d.value * 2.5
                let det = Int((d.value / (.pi / 2)).rounded())
                if det != d.detent {
                    d.detent = det
                    detentFeedback()
                }
            } else {
                let a = d.axisScreen
                let len2 = a.dx * a.dx + a.dy * a.dy
                guard len2 > 1 else { return }
                let delta = ((loc.x - d.startTouch.x) * a.dx + (loc.y - d.startTouch.y) * a.dy) / len2
                d.value = rubber(d.start + Float(delta), Float(d.allowed.lowerBound), Float(d.allowed.upperBound), margin: 0.15)
                if let axis = logic.groupsByID[d.group]?.axis?.float3 { node.simdPosition = axis * d.value }
                let det = Int(d.value.rounded())
                if det != d.detent {
                    d.detent = det
                    detentFeedback()
                }
            }
            drag = d
        case .ended, .cancelled, .failed:
            guard let d = drag else { return }
            drag = nil
            release(d)
        default:
            break
        }
    }

    private func rubber(_ v: Float, _ lo: Float, _ hi: Float, margin: Float) -> Float {
        if v < lo { return lo - min(margin, (lo - v) * 0.3) }
        if v > hi { return hi + min(margin, (v - hi) * 0.3) }
        return v
    }

    private func detentFeedback() {
        audio.click()
        haptic.impactOccurred(intensity: 0.6)
    }

    private func mechanism(atScreen p: CGPoint) -> String? {
        let hits = view.hitTest(p, options: [
            .categoryBitMask: Props.blockCategory | Props.mechanismCategory,
            .searchMode: SCNHitTestSearchMode.all.rawValue,
            .ignoreHiddenNodes: true,
        ])
        // Kurbeln haben Vorrang, danach bewegliche Blöcke
        for h in hits where h.node.categoryBitMask == Props.mechanismCategory {
            if let g = groupID(of: h.node) { return g }
        }
        if let first = hits.first, let g = groupID(of: first.node) { return g }
        return nil
    }

    /// Winkel des Fingers um den Drehpunkt, gemessen auf der waagerechten Ebene durch den Drehpunkt.
    private func planeAngle(screen p: CGPoint, pivot: SIMD3<Float>) -> Float? {
        let near = s3(view.unprojectPoint(SCNVector3(Float(p.x), Float(p.y), 0)))
        let far = s3(view.unprojectPoint(SCNVector3(Float(p.x), Float(p.y), 1)))
        let dir = far - near
        guard abs(dir.y) > 0.0001 else { return nil }
        let t = (pivot.y - near.y) / dir.y
        let hit = near + dir * t
        // Positiver Winkel entspricht positiver Drehung um +Y: (1,0) → (cos θ, −sin θ)
        return atan2(-(hit.z - pivot.z), hit.x - pivot.x)
    }

    private func allowedRange(_ gid: String, current v: Int) -> ClosedRange<Int> {
        guard let g = logic.groupsByID[gid] else { return v...v }
        let span = g.isRotator && !g.isBounded ? 4 : 50
        var lo = v, hi = v
        while lo - 1 >= g.range.lowerBound && v - (lo - 1) <= span && logic.isFree(group: gid, value: lo - 1) { lo -= 1 }
        while hi + 1 <= g.range.upperBound && (hi + 1) - v <= span && logic.isFree(group: gid, value: hi + 1) { hi += 1 }
        return lo...hi
    }

    private func release(_ d: Drag) {
        guard let node = world.groupNodes[d.group] else { return }
        var target: Int
        if d.rotator {
            target = Int((d.value / (.pi / 2)).rounded()).clamped(d.allowed)
        } else {
            target = Int(d.value.rounded()).clamped(d.allowed)
        }
        // Gekoppelte Teile fahren mit – die Endstellung braucht auch für sie Platz
        // und Hanas Feld muss unter ihren Füßen bleiben
        let settles = { (v: Int) in
            self.logic.isSettleFree(group: d.group, value: v) && self.logic.keepsTile(self.currentTile, group: d.group, value: v)
        }
        if !settles(target) {
            let current = logic.value(of: d.group)
            target = Array(d.allowed).sorted { abs($0 - target) < abs($1 - target) }
                .first { settles($0) } ?? current
        }
        mechanismBusy = true
        let oldEdges = logic.edges
        SCNTransaction.begin()
        SCNTransaction.animationDuration = 0.38
        SCNTransaction.animationTimingFunction = CAMediaTimingFunction(name: .easeOut)
        if d.rotator {
            node.eulerAngles.y = Float(target) * .pi / 2
            world.spinners[d.group]?.eulerAngles.y = -Float(target) * .pi / 2 * 2.5
        } else if let axis = logic.groupsByID[d.group]?.axis?.float3 {
            node.simdPosition = axis * Float(target)
        }
        SCNTransaction.completionBlock = { [weak self] in
            Task { @MainActor in self?.mechanismSettled(group: d.group, value: target, oldEdges: oldEdges) }
        }
        SCNTransaction.commit()
    }

    private func mechanismSettled(group: String, value: Int, oldEdges: Set<EdgeKey>) {
        let changed = value != logic.value(of: group)
        logic.setState(group, value)
        mechanismBusy = !animating.isEmpty
        defer { applyTriggers() }
        guard changed else { return }
        audio.settle()
        rigid.impactOccurred(intensity: 0.7)
        let fresh = logic.edges.subtracting(oldEdges)
        guard !fresh.isEmpty else { return }
        var illusion = false
        for e in fresh {
            if let p = logic.ports[e.a]?[e.b] {
                scene.rootNode.addChildNode(Atmosphere.burst(at: p.0 + SIMD3(0, 0.05, 0),
                                                            color: UIColor(red: 1, green: 0.92, blue: 0.6, alpha: 1), count: 90))
            }
            if logic.isIllusion(e.a, e.b) { illusion = true }
        }
        // Nur Verbindungen feiern, die Hana tatsächlich weiterbringen
        audio.connect(illusion: illusion)
    }

    // MARK: - Hinweise

    private func tickHints() {
        guard phase == .playing, !menuOpen, !walking, drag == nil else { return }
        guard Date().timeIntervalSince(lastInteraction) > 14 else { return }
        lastInteraction = Date()
        guard let pos = hintPosition() else { return }
        ticker.hint = pos + ViewBasis.back * 1.2 + SIMD3(0, 0.3, 0)
        audio.hint()
        let pulse = SCNAction.sequence([.scale(to: 1.35, duration: 0.3), .scale(to: 1, duration: 0.3)])
        kiko.runAction(.sequence([.wait(duration: 1.2), .repeat(pulse, count: 3)]))
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 6_000_000_000)
            self.ticker.hint = nil
        }
    }

    /// Welcher Mechanismus ist gerade der nächste Schritt?
    private func hintPosition() -> SIMD3<Float>? {
        let reach = logic.reachable(from: currentTile)
        for h in logic.def.hints ?? [] {
            if let cell = h.reach {
                let idx = logic.block(at: cell) ?? logic.def.blocks.firstIndex(where: { $0.p == cell })
                guard let b = idx, reach.contains(b) else { continue }
            }
            if let need = h.pressed, !need.allSatisfy({ pressed.contains($0) }) { continue }
            if let not = h.unpressed, not.contains(where: { pressed.contains($0) }) { continue }
            return position(ofTarget: h.target)
        }
        return reach.contains(logic.goalBlock) ? logic.tiles[logic.goalBlock]?.center : nil
    }

    private func position(ofTarget t: String) -> SIMD3<Float>? {
        if t == "goal" { return logic.tiles[logic.goalBlock]?.center }
        if let plate = world.plates[t] { return plate.node.simdWorldPosition }
        if let h = world.handles[t] { return h.presentation.simdWorldPosition }
        return world.groupNodes[t]?.presentation.simdWorldPosition
    }

    // MARK: - Finale

    private func beginEnding() {
        phase = .ending
        ticker.hint = nil
        audio.ending()
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        hana.runAction(.rotateTo(x: 0, y: .pi, z: 0, duration: 0.4, usesShortestUnitArc: true))
        let bow = SCNAction.sequence([.wait(duration: 0.5), .rotateBy(x: 0.35, y: 0, z: 0, duration: 0.5),
                                      .wait(duration: 0.6), .rotateBy(x: -0.35, y: 0, z: 0, duration: 0.5)])
        hanaBody.runAction(bow)
        let ending = logic.def.ending
        say(ending?.text ?? "Where a seed takes root, the forest returns.", duration: 7)

        guard let goal = logic.tiles[logic.goalBlock] else { return }
        let treeSpot = ending.map { $0.tree.float3 + SIMD3(0, 0.5, 0) } ?? goal.center + SIMD3(0, 0, 2)

        if let seed = world.seed {
            let worldPos = seed.simdWorldPosition
            seed.removeAllActions()
            reparent(seed, to: scene.rootNode)
            seed.simdPosition = worldPos
            let rise = SCNAction.group([.moveBy(x: 0, y: 0.7, z: 0, duration: 1.6), .scale(to: 2.2, duration: 1.6)])
            rise.timingMode = .easeInEaseOut
            let fly = SCNAction.move(to: v3(treeSpot + SIMD3(0, 0.4, 0)), duration: 1.1)
            fly.timingMode = .easeIn
            seed.runAction(.sequence([rise, .wait(duration: 0.3), fly, .group([.scale(to: 0.1, duration: 0.25), .fadeOut(duration: 0.25)]),
                                      .removeFromParentNode()]))
        }

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 3_300_000_000)
            self.growGreatTree(at: treeSpot)
            try? await Task.sleep(nanoseconds: 900_000_000)
            self.bloomWorld()
            try? await Task.sleep(nanoseconds: 1_300_000_000)
            self.awakenSpirits()
            try? await Task.sleep(nanoseconds: 4_500_000_000)
            self.phase = .finished
        }

        // Kamera zieht sich sanft zurück, das Licht wird golden
        SCNTransaction.begin()
        SCNTransaction.animationDuration = 6
        camera.orthographicScale = Double(baseScale * 1.12)
        sun?.light?.color = UIColor(red: 1, green: 0.85, blue: 0.66, alpha: 1)
        SCNTransaction.commit()
    }

    private func growGreatTree(at p: SIMD3<Float>) {
        scene.rootNode.addChildNode(Atmosphere.burst(at: p + SIMD3(0, 0.4, 0), color: UIColor(red: 0.85, green: 1, blue: 0.7, alpha: 1), count: 260))
        audio.chime([12, 14, 16, 19], spacing: 0.09, amp: 0.1)
        if let old = world.shrineTree {
            old.runAction(.sequence([.scale(to: 0.01, duration: 0.4), .removeFromParentNode()]))
        }
        let tree = Props.tree(scale: 2.4, variant: theme.treeVariant, seed: 4242)
        tree.simdPosition = p
        tree.scale = SCNVector3(0.01, 0.01, 0.01)
        tree.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
        scene.rootNode.addChildNode(tree)
        let grow = SCNAction.scale(to: 1, duration: 3.2)
        grow.timingMode = .easeOut
        tree.runAction(grow)
        scene.rootNode.addChildNode(Atmosphere.petalBurst(at: p + SIMD3(0, 2.2, 0)))
        // Dauerhafter Blütenregen vom großen Baum
        let rain = SCNParticleSystem()
        rain.particleImage = [.leaves, .letters].contains(theme.particle) ? Art.leaf() : Art.petal()
        rain.birthRate = 8
        rain.particleLifeSpan = 6
        rain.particleSize = 0.1
        rain.emitterShape = SCNSphere(radius: 1.2)
        rain.birthLocation = .volume
        rain.particleVelocity = 0.3
        rain.acceleration = SCNVector3(-0.2, -0.35, 0.15)
        rain.particleAngularVelocity = 120
        rain.isLightingEnabled = false
        rain.propertyControllers = [.opacity: SCNParticlePropertyController(animation: Props.fadeOutAnimation())]
        let emitter = SCNNode()
        emitter.simdPosition = p + SIMD3(0, 2.0, 0)
        emitter.addParticleSystem(rain)
        scene.rootNode.addChildNode(emitter)
    }

    private func bloomWorld() {
        for (i, pos) in world.grassTiles.enumerated() {
            let f = Props.flowers(scale: 0.9, seed: UInt64(900 + i))
            f.simdPosition = pos
            f.scale = SCNVector3(0.01, 0.01, 0.01)
            f.enumerateHierarchy { n, _ in n.categoryBitMask = Props.decorCategory }
            scene.rootNode.addChildNode(f)
            f.runAction(.sequence([.wait(duration: Double(i) * 0.06), .scale(to: 1, duration: 0.5)]))
        }
    }

    private func awakenSpirits() {
        let spots: [SIMD3<Float>] = (logic.def.ending?.spirits ?? []).map { $0.float3 + SIMD3(0, 0.5, 0) }
        for (i, p) in spots.enumerated() {
            // Die Waldgeister kommen heraus
            let k = Characters.kiko(scale: 0.7)
            k.simdPosition = p + SIMD3(Float(i % 2) * 0.25 - 0.12, 0.12, 0.2)
            let size: CGFloat = 0.7
            k.scale = SCNVector3(0.01, 0.01, 0.01)
            scene.rootNode.addChildNode(k)
            let pop = SCNAction.scale(to: size, duration: 0.35)
            pop.timingMode = .easeOut
            let lift: CGFloat = 0.08
            let bob = SCNAction.sequence([.moveBy(x: 0, y: lift, z: 0, duration: 0.9), .moveBy(x: 0, y: -lift, z: 0, duration: 0.9)])
            bob.timingMode = .easeInEaseOut
            k.runAction(.sequence([.wait(duration: Double(i) * 0.25), pop, .repeatForever(bob)]))
            if i % 3 == 0 {
                Task { @MainActor in
                    try? await Task.sleep(nanoseconds: UInt64(Double(i) * 0.25 * 1_000_000_000))
                    self.audio.chime([9 + i], spacing: 0, amp: 0.05)
                }
            }
        }
    }
}

extension Int {
    func clamped(_ r: ClosedRange<Int>) -> Int { Swift.min(r.upperBound, Swift.max(r.lowerBound, self)) }
}
