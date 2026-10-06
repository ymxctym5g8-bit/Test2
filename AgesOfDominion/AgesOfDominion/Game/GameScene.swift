import SpriteKit
#if os(macOS)
import AppKit
#else
import UIKit
#endif

final class GameScene: SKScene {
    weak var controller: GameController?

    let cam = SKCameraNode()
    private let terrainNode = SKSpriteNode()
    private let fogNode = SKSpriteNode()
    private let resourceLayer = SKNode()
    private let buildingLayer = SKNode()
    private let unitLayer = SKNode()
    private let airLayer = SKNode()
    private let effectLayer = SKNode()
    private let overlayLayer = SKNode()
    private var unitSprites: [Int: UnitSprite] = [:]
    private var buildingSprites: [Int: BuildingSprite] = [:]
    private var nodeSprites: [Int: SKNode] = [:]
    private var lastStructureVersion = -1
    private var lastFogVersion = -1
    private var lastHumanAge = -1
    private var lastTime: TimeInterval = 0
    private let ghost = SKSpriteNode(texture: TextureBank.shared.pixel)
    private let ghostIcon = emojiLabel("", size: 24)
    private let selectionBox = SKShapeNode()
    private let rallyFlag = emojiLabel("🚩", size: 22)
    private var didSetup = false
    private var fogPixels: [UInt8] = []
    private var shake: CGFloat = 0
    private var cameraBase = CGPoint.zero

    // Eingabezustand
    private var dragStart: CGPoint?
    private var dragCurrent: CGPoint?
    private var isBoxSelecting = false
    #if os(macOS)
    private var pressedKeys = Set<UInt16>()
    #endif

    private var world: GameWorld? { controller?.world }

    override func didMove(to view: SKView) {
        guard !didSetup, let world = world else { return }
        didSetup = true
        scaleMode = .resizeFill
        backgroundColor = SKColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 1)
        addChild(cam)
        camera = cam

        let mapSize = CGSize(width: CGFloat(world.map.width) * tileSize, height: CGFloat(world.map.height) * tileSize)
        if let img = ImageFactory.terrainImage(map: world.map, ppt: 8, seed: world.settings.seed) {
            let tex = SKTexture(cgImage: img)
            tex.filteringMode = .nearest
            terrainNode.texture = tex
        }
        terrainNode.anchorPoint = .zero
        terrainNode.size = mapSize
        terrainNode.zPosition = -10
        addChild(terrainNode)

        resourceLayer.zPosition = 5
        buildingLayer.zPosition = 10
        unitLayer.zPosition = 20
        effectLayer.zPosition = 35
        airLayer.zPosition = 40
        overlayLayer.zPosition = 60
        for l in [resourceLayer, buildingLayer, unitLayer, effectLayer, airLayer, overlayLayer] { addChild(l) }

        fogNode.anchorPoint = .zero
        fogNode.size = mapSize
        fogNode.zPosition = 50
        addChild(fogNode)
        fogPixels = [UInt8](repeating: 0, count: world.map.width * world.map.height * 4)

        ghost.isHidden = true
        ghost.alpha = 0.45
        ghost.colorBlendFactor = 1
        ghost.addChild(ghostIcon)
        ghostIcon.zPosition = 1
        overlayLayer.addChild(ghost)

        selectionBox.strokeColor = SKColor(red: 0.4, green: 1, blue: 0.4, alpha: 1)
        selectionBox.fillColor = SKColor(red: 0.4, green: 1, blue: 0.4, alpha: 0.12)
        selectionBox.lineWidth = 1.5
        selectionBox.isHidden = true
        overlayLayer.addChild(selectionBox)

        rallyFlag.isHidden = true
        overlayLayer.addChild(rallyFlag)

        let start = world.startPositions.first?.center ?? Vec2(10, 10)
        #if os(iOS)
        cam.setScale(1.1)
        setupGestures(in: view)
        #else
        cam.setScale(1.15)
        #endif
        centerCamera(on: start)
        sync(time: 0)
    }

    override func didChangeSize(_ oldSize: CGSize) {
        super.didChangeSize(oldSize)
        if didSetup { clampCamera() }
    }

    // MARK: - Kamera

    func centerCamera(on p: Vec2) {
        cameraBase = p.scenePoint
        clampCamera()
    }

    func cameraCenterWorld() -> Vec2 { cameraBase.worldVec }

    private func clampCamera() {
        guard let world = world else { return }
        let w = CGFloat(world.map.width) * tileSize, h = CGFloat(world.map.height) * tileSize
        let halfW = size.width * cam.xScale / 2, halfH = size.height * cam.yScale / 2
        let margin: CGFloat = 4 * tileSize
        cameraBase.x = min(max(cameraBase.x, halfW - margin), max(halfW - margin, w - halfW + margin))
        cameraBase.y = min(max(cameraBase.y, halfH - margin), max(halfH - margin, h - halfH + margin + 3 * tileSize))
        cam.position = cameraBase
    }

    func pan(byView dx: CGFloat, _ dy: CGFloat) {
        cameraBase.x -= dx * cam.xScale
        cameraBase.y -= dy * cam.yScale
        clampCamera()
    }

    func zoom(by factor: CGFloat) {
        let s = min(2.8, max(0.45, cam.xScale * factor))
        cam.setScale(s)
        clampCamera()
    }

    /// Sichtbarer Bereich in Weltkoordinaten (Kacheln).
    func visibleWorldRect() -> CGRect {
        let w = size.width * cam.xScale, h = size.height * cam.yScale
        return CGRect(x: (cameraBase.x - w / 2) / tileSize, y: (cameraBase.y - h / 2) / tileSize,
                      width: w / tileSize, height: h / tileSize)
    }

    // MARK: - Frame-Update

    override func update(_ currentTime: TimeInterval) {
        let dt = lastTime == 0 ? 1.0 / 60 : min(0.1, currentTime - lastTime)
        lastTime = currentTime
        #if os(macOS)
        applyKeyboardPan(dt: dt)
        #endif
        controller?.tick(dt)
        if shake > 0 {
            shake = max(0, shake - CGFloat(dt) * 30)
            cam.position = CGPoint(x: cameraBase.x + CGFloat.random(in: -shake...shake),
                                   y: cameraBase.y + CGFloat.random(in: -shake...shake))
        } else {
            cam.position = cameraBase
        }
        sync(time: world?.time ?? 0)
    }

    private func sync(time: Double) {
        guard let world = world, let controller = controller else { return }
        let me = world.humanIndex
        let humanAge = world.human.age
        if humanAge != lastHumanAge {
            lastHumanAge = humanAge
            // Vorkommen zeigen nun Uran/Silizium
            for (id, s) in nodeSprites where world.nodes[id]?.style == .deposit {
                s.removeFromParent()
                nodeSprites[id] = nil
            }
            lastStructureVersion = -1
        }
        if world.fogVersion != lastFogVersion {
            lastFogVersion = world.fogVersion
            updateFogTexture(world)
            syncNodes(world, humanAge: humanAge)
        } else if world.structureVersion != lastStructureVersion {
            syncNodes(world, humanAge: humanAge)
        }
        lastStructureVersion = world.structureVersion

        // Gebäude
        var seenB = Set<Int>()
        for b in world.buildings.values {
            let own = b.owner >= 0 && world.isAlly(b.owner, me)
            guard own || b.seenByHuman else { continue }
            seenB.insert(b.id)
            let sprite: BuildingSprite
            if let s = buildingSprites[b.id] {
                sprite = s
            } else {
                sprite = BuildingSprite(building: b)
                sprite.zPosition = -CGFloat(b.center.y) * 0.01
                buildingLayer.addChild(sprite)
                buildingSprites[b.id] = sprite
            }
            let age = b.owner >= 0 ? world.players[b.owner].age : 0
            sprite.update(b, ownerAge: age, selected: controller.selectedBuilding == b.id || controller.inspected == b.id)
        }
        for (id, s) in buildingSprites where !seenB.contains(id) {
            s.removeFromParent()
            buildingSprites[id] = nil
        }

        // Einheiten
        var seenU = Set<Int>()
        for u in world.units.values {
            let own = u.owner >= 0 && world.isAlly(u.owner, me)
            guard own || world.isVisibleToHuman(u.pos) else { continue }
            seenU.insert(u.id)
            let sprite: UnitSprite
            if let s = unitSprites[u.id] {
                sprite = s
            } else {
                sprite = UnitSprite(unit: u)
                (u.isAir ? airLayer : unitLayer).addChild(sprite)
                unitSprites[u.id] = sprite
            }
            sprite.zPosition = -CGFloat(u.pos.y) * 0.01
            sprite.update(u, selected: controller.selectedSet.contains(u.id) || controller.inspected == u.id, time: time)
        }
        for (id, s) in unitSprites where !seenU.contains(id) {
            s.removeFromParent()
            unitSprites[id] = nil
        }

        // Ereignisse
        for e in world.events { spawnEffect(e, world: world) }
        world.events.removeAll(keepingCapacity: true)

        // Sammelpunkt
        if let b = controller.selectedBuildingObject, b.owner == me, let r = b.rallyPoint {
            rallyFlag.isHidden = false
            rallyFlag.position = r.scenePoint
        } else {
            rallyFlag.isHidden = true
        }
    }

    private func syncNodes(_ world: GameWorld, humanAge: Int) {
        for n in world.nodes.values where n.exploredByHuman && nodeSprites[n.id] == nil {
            if let s = NodeSpriteFactory.make(n, humanAge: humanAge) {
                s.zPosition = -CGFloat(n.center.y) * 0.01
                resourceLayer.addChild(s)
                nodeSprites[n.id] = s
            }
        }
        for (id, s) in nodeSprites where world.nodes[id] == nil {
            s.removeFromParent()
            nodeSprites[id] = nil
        }
    }

    private func updateFogTexture(_ world: GameWorld) {
        let w = world.map.width, h = world.map.height
        for y in 0..<h {
            let row = (h - 1 - y) * w
            for x in 0..<w {
                let i = y * w + x
                let a: UInt8 = world.visible[i] ? 0 : (world.explored[i] ? 120 : 245)
                let o = (row + x) * 4
                fogPixels[o] = 0
                fogPixels[o + 1] = 0
                fogPixels[o + 2] = UInt8(Double(a) * 0.04)
                fogPixels[o + 3] = a
            }
        }
        if let img = ImageFactory.image(width: w, height: h, rgba: fogPixels) {
            let tex = SKTexture(cgImage: img)
            tex.filteringMode = .linear
            fogNode.texture = tex
        }
    }

    // MARK: - Overlays

    func refreshGhost() {
        guard let controller = controller, let world = world else { return }
        if case .placing(let kind) = controller.mode, let o = controller.ghostOrigin {
            let s = CGFloat(kind.stats.size)
            ghost.isHidden = false
            ghost.size = CGSize(width: s * tileSize, height: s * tileSize)
            ghost.position = CGPoint(x: (CGFloat(o.x) + s / 2) * tileSize, y: (CGFloat(o.y) + s / 2) * tileSize)
            let ok = world.canPlace(kind, origin: o, owner: world.humanIndex)
            ghost.color = ok ? SKColor(red: 0.3, green: 1, blue: 0.4, alpha: 1) : SKColor(red: 1, green: 0.2, blue: 0.2, alpha: 1)
            ghostIcon.text = BuildingCatalog.emoji(kind, age: world.human.age)
            ghostIcon.fontSize = min(40, s * tileSize * 0.5)
        } else {
            ghost.isHidden = true
        }
    }

    func showMarker(at p: Vec2, color: SKColor) {
        let ring = SKSpriteNode(texture: TextureBank.shared.ring)
        ring.size = CGSize(width: 34, height: 34)
        ring.color = color
        ring.colorBlendFactor = 1
        ring.position = p.scenePoint
        overlayLayer.addChild(ring)
        ring.run(.sequence([.group([.scale(to: 0.2, duration: 0.45), .fadeOut(withDuration: 0.45)]), .removeFromParent()]))
    }

    private func updateSelectionBox() {
        guard isBoxSelecting, let a = dragStart, let b = dragCurrent else {
            selectionBox.isHidden = true
            return
        }
        let rect = CGRect(x: min(a.x, b.x), y: min(a.y, b.y), width: abs(a.x - b.x), height: abs(a.y - b.y))
        selectionBox.path = CGPath(rect: rect, transform: nil)
        selectionBox.isHidden = false
    }

    // MARK: - Effekte

    private func spawnEffect(_ e: WorldEvent, world: GameWorld) {
        switch e {
        case let .projectile(from, to, style, air):
            guard world.isVisibleToHuman(from) || world.isVisibleToHuman(to) else { return }
            var start = from.scenePoint
            var end = to.scenePoint
            if air { end.y += 10 }
            start.y += 6
            spawnProjectile(from: start, to: end, style: style)
        case let .explosion(at, radius):
            guard world.isVisibleToHuman(at) else { return }
            explosion(at: at.scenePoint, radius: CGFloat(radius) * tileSize, color: SKColor(red: 1, green: 0.6, blue: 0.2, alpha: 1))
        case let .nukeLaunch(from, to, delay):
            let rocket = emojiLabel("🚀", size: 34)
            rocket.position = from.scenePoint
            let dx = to.scenePoint.x - from.scenePoint.x, dy = to.scenePoint.y - from.scenePoint.y
            rocket.zRotation = atan2(dy, dx) - .pi / 4
            rocket.zPosition = 10
            overlayLayer.addChild(rocket)
            let up = SKAction.scale(to: 2.0, duration: delay / 2)
            let down = SKAction.scale(to: 1.0, duration: delay / 2)
            rocket.run(.sequence([.group([.move(to: to.scenePoint, duration: delay), .sequence([up, down])]), .removeFromParent()]))
        case let .nuke(at, radius):
            let p = at.scenePoint
            let r = CGFloat(radius) * tileSize
            let flash = SKSpriteNode(texture: TextureBank.shared.glow)
            flash.size = CGSize(width: r * 4, height: r * 4)
            flash.color = .white
            flash.colorBlendFactor = 1
            flash.position = p
            flash.zPosition = 20
            overlayLayer.addChild(flash)
            flash.run(.sequence([.group([.scale(to: 1.6, duration: 1.6), .fadeOut(withDuration: 1.6)]), .removeFromParent()]))
            explosion(at: p, radius: r * 1.3, color: SKColor(red: 1, green: 0.45, blue: 0.1, alpha: 1), duration: 2.2)
            let mushroom = emojiLabel("🍄", size: r * 0.9)
            mushroom.position = p
            mushroom.zPosition = 21
            overlayLayer.addChild(mushroom)
            mushroom.run(.sequence([.group([.moveBy(x: 0, y: r * 0.6, duration: 3), .scale(to: 1.6, duration: 3),
                                            .sequence([.wait(forDuration: 1.5), .fadeOut(withDuration: 1.5)])]),
                                    .removeFromParent()]))
            if visibleWorldRect().insetBy(dx: -10, dy: -10).contains(CGPoint(x: at.x, y: at.y)) { shake = 26 }
        case let .orbital(at, radius):
            let p = at.scenePoint
            let r = CGFloat(radius) * tileSize
            let beam = SKSpriteNode(texture: TextureBank.shared.pixel)
            beam.size = CGSize(width: r * 0.7, height: 3000)
            beam.anchorPoint = CGPoint(x: 0.5, y: 0)
            beam.color = SKColor(red: 0.5, green: 0.9, blue: 1, alpha: 1)
            beam.colorBlendFactor = 1
            beam.alpha = 0.85
            beam.position = p
            beam.zPosition = 15
            overlayLayer.addChild(beam)
            beam.run(.sequence([.group([.scaleX(to: 0.1, duration: 1.0), .fadeOut(withDuration: 1.0)]), .removeFromParent()]))
            explosion(at: p, radius: r, color: SKColor(red: 0.5, green: 0.9, blue: 1, alpha: 1), duration: 1.2)
            if visibleWorldRect().contains(CGPoint(x: at.x, y: at.y)) { shake = 12 }
        case let .death(at, emoji):
            guard world.isVisibleToHuman(at) else { return }
            let l = emojiLabel(emoji, size: 18)
            l.position = at.scenePoint
            l.alpha = 0.8
            effectLayer.addChild(l)
            l.run(.sequence([.group([.rotate(byAngle: .pi / 2, duration: 0.6), .fadeOut(withDuration: 0.9),
                                     .moveBy(x: 0, y: -6, duration: 0.9)]), .removeFromParent()]))
        case let .heal(at):
            guard world.isVisibleToHuman(at) else { return }
            let l = SKLabelNode(text: "✚")
            l.fontName = "Avenir-Heavy"
            l.fontSize = 14
            l.fontColor = SKColor(red: 0.3, green: 1, blue: 0.4, alpha: 1)
            l.position = at.scenePoint
            effectLayer.addChild(l)
            l.run(.sequence([.group([.moveBy(x: 0, y: 18, duration: 0.7), .fadeOut(withDuration: 0.7)]), .removeFromParent()]))
        case let .buildingDestroyed(at, size):
            guard world.isVisibleToHuman(at) else { return }
            let r = CGFloat(size) * tileSize * 0.6
            explosion(at: at.scenePoint, radius: r, color: SKColor(red: 1, green: 0.5, blue: 0.15, alpha: 1), duration: 0.9)
            let smoke = emojiLabel("💨", size: r)
            smoke.position = at.scenePoint
            effectLayer.addChild(smoke)
            smoke.run(.sequence([.group([.moveBy(x: 10, y: 30, duration: 1.6), .fadeOut(withDuration: 1.6)]), .removeFromParent()]))
        }
    }

    private func explosion(at p: CGPoint, radius: CGFloat, color: SKColor, duration: Double = 0.45) {
        let g = SKSpriteNode(texture: TextureBank.shared.glow)
        let d = max(16, radius * 2.2)
        g.size = CGSize(width: d, height: d)
        g.color = color
        g.colorBlendFactor = 1
        g.position = p
        g.setScale(0.3)
        effectLayer.addChild(g)
        g.run(.sequence([.group([.scale(to: 1, duration: duration * 0.5), .fadeOut(withDuration: duration)]), .removeFromParent()]))
    }

    private func spawnProjectile(from a: CGPoint, to b: CGPoint, style: ProjectileStyle) {
        let dx = b.x - a.x, dy = b.y - a.y
        let dist = (dx * dx + dy * dy).squareRoot()
        let angle = atan2(dy, dx)
        if style == .laser {
            let path = CGMutablePath()
            path.move(to: a)
            path.addLine(to: b)
            let line = SKShapeNode(path: path)
            line.strokeColor = SKColor(red: 0.4, green: 1, blue: 1, alpha: 1)
            line.lineWidth = 2
            line.glowWidth = 2
            effectLayer.addChild(line)
            line.run(.sequence([.fadeOut(withDuration: 0.18), .removeFromParent()]))
            return
        }
        let p = SKSpriteNode(texture: style == .plasma || style == .shell ? TextureBank.shared.glow : TextureBank.shared.pixel)
        var speed: CGFloat = 520
        p.colorBlendFactor = 1
        switch style {
        case .arrow:
            p.size = CGSize(width: 12, height: 2)
            p.color = SKColor(red: 0.45, green: 0.3, blue: 0.15, alpha: 1)
            speed = 420
        case .bullet:
            p.size = CGSize(width: 6, height: 2)
            p.color = .yellow
            speed = 900
        case .shell:
            p.size = CGSize(width: 10, height: 10)
            p.color = SKColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1)
            speed = 380
        case .rocket:
            p.size = CGSize(width: 10, height: 3)
            p.color = .orange
            speed = 480
        case .plasma:
            p.size = CGSize(width: 14, height: 14)
            p.color = SKColor(red: 1, green: 0.3, blue: 1, alpha: 1)
            speed = 600
        case .flame:
            p.size = CGSize(width: 8, height: 8)
            p.color = .orange
            speed = 300
        case .laser:
            break
        }
        p.position = a
        p.zRotation = angle
        effectLayer.addChild(p)
        let duration = Double(max(0.05, dist / speed))
        if style == .shell {
            // Ballistischer Bogen
            let up = SKAction.moveBy(x: 0, y: min(60, dist * 0.25), duration: duration / 2)
            up.timingMode = .easeOut
            let down = up.reversed()
            down.timingMode = .easeIn
            p.run(.sequence([.group([.move(to: b, duration: duration), .sequence([up, down])]), .removeFromParent()]))
        } else {
            p.run(.sequence([.move(to: b, duration: duration), .removeFromParent()]))
        }
    }

    // MARK: - Eingabe (gemeinsam)

    private func worldPoint(_ scenePoint: CGPoint) -> Vec2 { scenePoint.worldVec }

    private func beginDrag(at p: CGPoint) {
        dragStart = p
        dragCurrent = p
        isBoxSelecting = false
    }

    private func finishBoxSelect(additive: Bool) {
        if let a = dragStart, let b = dragCurrent, isBoxSelecting {
            controller?.boxSelect(from: worldPoint(a), to: worldPoint(b), additive: additive)
        }
        isBoxSelecting = false
        dragStart = nil
        dragCurrent = nil
        updateSelectionBox()
    }

    // MARK: - macOS

    #if os(macOS)
    func handleMouseDown(_ event: NSEvent) {
        let p = event.location(in: self)
        if event.modifierFlags.contains(.control) {
            controller?.secondaryClick(at: worldPoint(p))
            return
        }
        beginDrag(at: p)
    }

    func handleMouseDragged(_ event: NSEvent) {
        let p = event.location(in: self)
        guard let start = dragStart else { return }
        dragCurrent = p
        let viewDist = hypot(p.x - start.x, p.y - start.y) / cam.xScale
        if case .normal? = controller?.mode, viewDist > 6 { isBoxSelecting = true }
        updateSelectionBox()
        controller?.hover(at: worldPoint(p))
    }

    func handleMouseUp(_ event: NSEvent) {
        let p = event.location(in: self)
        let additive = event.modifierFlags.contains(.shift)
        if isBoxSelecting {
            dragCurrent = p
            finishBoxSelect(additive: additive)
            return
        }
        guard dragStart != nil else { return }
        dragStart = nil
        dragCurrent = nil
        controller?.primaryClick(at: worldPoint(p), additive: additive, clickCount: event.clickCount)
    }

    func handleRightMouseDown(_ event: NSEvent) {
        controller?.secondaryClick(at: worldPoint(event.location(in: self)))
    }

    func handleMouseMoved(_ event: NSEvent) {
        controller?.hover(at: worldPoint(event.location(in: self)))
    }

    func handleScroll(_ event: NSEvent) {
        if event.hasPreciseScrollingDeltas {
            pan(byView: -event.scrollingDeltaX, event.scrollingDeltaY)
        } else {
            zoom(by: event.scrollingDeltaY > 0 ? 0.9 : 1.1)
        }
    }

    func handleMagnify(_ event: NSEvent) {
        zoom(by: 1 - event.magnification)
    }

    func handleKeyDown(_ event: NSEvent) {
        pressedKeys.insert(event.keyCode)
        guard let c = controller else { return }
        switch event.keyCode {
        case 53: c.cancelMode()                              // Esc
        case 51, 117: c.perform(.delete)                     // Entf
        case 49: c.togglePause()                             // Leertaste
        default: break
        }
        switch event.charactersIgnoringModifiers?.lowercased() ?? "" {
        case ".": c.selectIdleVillager()
        case "h": c.selectTownCenter()
        case "q": c.perform(.attackMove)
        case "x": c.perform(.stop)
        case "m": c.selectArmy()
        case "e": c.perform(.ageUp)
        case "j": c.jumpToAlert()
        case "+", "=": zoom(by: 0.9)
        case "-": zoom(by: 1.1)
        default: break
        }
    }

    func handleKeyUp(_ event: NSEvent) {
        pressedKeys.remove(event.keyCode)
    }

    private func applyKeyboardPan(dt: Double) {
        guard !pressedKeys.isEmpty else { return }
        var dx: CGFloat = 0, dy: CGFloat = 0
        // Pfeiltasten + WASD
        if pressedKeys.contains(123) || pressedKeys.contains(0) { dx += 1 }
        if pressedKeys.contains(124) || pressedKeys.contains(2) { dx -= 1 }
        if pressedKeys.contains(125) || pressedKeys.contains(1) { dy += 1 }
        if pressedKeys.contains(126) || pressedKeys.contains(13) { dy -= 1 }
        if dx != 0 || dy != 0 {
            let speed = CGFloat(900 * dt)
            pan(byView: dx * speed, dy * speed)
        }
    }
    #endif

    // MARK: - iOS

    #if os(iOS)
    private func setupGestures(in view: SKView) {
        let tap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
        view.addGestureRecognizer(tap)
        let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
        doubleTap.numberOfTapsRequired = 2
        view.addGestureRecognizer(doubleTap)
        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        longPress.minimumPressDuration = 0.3
        view.addGestureRecognizer(longPress)
        let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        pan.maximumNumberOfTouches = 2
        pan.require(toFail: longPress)
        view.addGestureRecognizer(pan)
        let pinch = UIPinchGestureRecognizer(target: self, action: #selector(handlePinch(_:)))
        view.addGestureRecognizer(pinch)
    }

    private func scenePoint(_ g: UIGestureRecognizer) -> CGPoint {
        guard let view = view else { return .zero }
        return convertPoint(fromView: g.location(in: view))
    }

    @objc private func handleTap(_ g: UITapGestureRecognizer) {
        controller?.tap(at: worldPoint(scenePoint(g)))
    }

    @objc private func handleDoubleTap(_ g: UITapGestureRecognizer) {
        controller?.doubleTap(at: worldPoint(scenePoint(g)))
    }

    @objc private func handleLongPress(_ g: UILongPressGestureRecognizer) {
        let p = scenePoint(g)
        switch g.state {
        case .began:
            beginDrag(at: p)
            isBoxSelecting = true
            updateSelectionBox()
        case .changed:
            dragCurrent = p
            updateSelectionBox()
        case .ended:
            dragCurrent = p
            if let a = dragStart, hypot(a.x - p.x, a.y - p.y) / cam.xScale < 12 {
                isBoxSelecting = false
                dragStart = nil
                updateSelectionBox()
                controller?.doubleTap(at: worldPoint(p))
            } else {
                finishBoxSelect(additive: false)
            }
        default:
            isBoxSelecting = false
            dragStart = nil
            updateSelectionBox()
        }
    }

    @objc private func handlePan(_ g: UIPanGestureRecognizer) {
        guard let view = view else { return }
        let t = g.translation(in: view)
        pan(byView: t.x, -t.y)
        g.setTranslation(.zero, in: view)
    }

    @objc private func handlePinch(_ g: UIPinchGestureRecognizer) {
        if g.state == .changed || g.state == .ended {
            zoom(by: 1 / g.scale)
            g.scale = 1
        }
    }
    #endif
}
