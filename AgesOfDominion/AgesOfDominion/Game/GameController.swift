import SwiftUI
import SpriteKit
import Combine

enum InputMode: Equatable {
    case normal
    case placing(BuildingKind)
    case attackMove
    case nuke(Int)
    case orbital(Int)
    case rally(Int)
}

enum HUDAction: Equatable {
    case train(UnitKind)
    case build(BuildingKind)
    case ageUp
    case missile
    case launchNuke
    case orbital
    case rally
    case stop
    case attackMove
    case delete
    case cancelQueue(Int)
    case deselect
}

struct CommandButton: Identifiable {
    let id: String
    let icon: String
    let title: String
    let cost: String
    let enabled: Bool
    let tooltip: String
    let action: HUDAction
    var badge: String?
    var highlight = false
}

struct StatLine: Identifiable {
    var id: String { label }
    let label: String
    let value: String
}

struct UnitGroup: Identifiable {
    let id: String
    let icon: String
    let name: String
    let count: Int
}

struct QueueEntry: Identifiable {
    let id: Int
    let icon: String
    let title: String
    let progress: Double
}

struct SelectionSummary {
    var icon = ""
    var title = ""
    var subtitle = ""
    var hp: Double = 0
    var maxHP: Double = 0
    var colorIndex = 0
    var stats: [StatLine] = []
    var groups: [UnitGroup] = []
    var queue: [QueueEntry] = []
    var description = ""
    var isOwn = false
}

struct ResourceDisplay: Identifiable {
    let id: Int
    let icon: String
    let name: String
    let amount: Int
    let locked: Bool
}

struct DoctrineOffer: Identifiable {
    var id: Int { focus.rawValue }
    let focus: DoctrineFocus
    let name: String
    let description: String
    let timesChosen: Int
}

struct PlayerLine: Identifiable {
    let id: Int
    let name: String
    let colorIndex: Int
    let ageName: String
    let defeated: Bool
    let isAlly: Bool
}

struct HUDState {
    var resources: [ResourceDisplay] = []
    var popUsed = 0
    var popCap = 0
    var age = 0
    var ageName = ""
    var ageEra = ""
    var ageProgress: Double?
    var timeText = "00:00"
    var idleVillagers = 0
    var armyCount = 0
    var selection: SelectionSummary?
    var commands: [CommandButton] = []
    var doctrineAge: Int?
    var doctrineOffers: [DoctrineOffer] = []
    var notifications: [GameNotification] = []
    var modeHint: String?
    var result: GameResult?
    var wonderTexts: [String] = []
    var cameraRect = CGRect(x: 0, y: 0, width: 0.2, height: 0.2)
    var perkNames: [String] = []
    var players: [PlayerLine] = []
    var stats = PlayerStats()
}

enum Hit {
    case unit(Unit)
    case building(Building)
    case node(ResourceNode)
}

@MainActor
final class GameController: ObservableObject {
    @Published private(set) var hud = HUDState()
    @Published private(set) var minimap: CGImage?
    @Published var paused = false
    @Published var speed: Double = 1

    let world: GameWorld
    let scene: GameScene
    let settings: GameSettings
    private(set) var selectedUnits: [Int] = []
    private(set) var selectedSet = Set<Int>()
    private(set) var selectedBuilding: Int?
    private(set) var inspected: Int?
    var mode: InputMode = .normal {
        didSet {
            if case .placing = mode {} else { ghostOrigin = nil }
            scene.refreshGhost()
        }
    }
    var ghostOrigin: TilePos?
    let isTouch: Bool

    private var accumulator = 0.0
    private var hudTimer = 0.0
    private var minimapTimer = 0.0
    private let minimapScale = 2
    private var minimapBase: [UInt8] = []

    init(settings: GameSettings) {
        self.settings = settings
        world = GameWorld(settings: settings)
        scene = GameScene(size: CGSize(width: 1280, height: 800))
        #if os(iOS)
        isTouch = true
        #else
        isTouch = false
        #endif
        buildMinimapBase()
        scene.controller = self
        rebuildMinimap()
        publishHUD()
    }

    // MARK: - Spielschleife

    func tick(_ dt: Double) {
        if !paused && world.result == nil {
            accumulator += min(dt, 0.25) * speed
            let step = 1.0 / 30.0
            var steps = 0
            while accumulator >= step && steps < 10 {
                world.update(dt: step)
                accumulator -= step
                steps += 1
            }
            if steps == 10 { accumulator = 0 }
            cleanupSelection()
        }
        hudTimer -= dt
        if hudTimer <= 0 {
            hudTimer = 0.12
            publishHUD()
        }
        minimapTimer -= dt
        if minimapTimer <= 0 {
            minimapTimer = 0.5
            rebuildMinimap()
        }
    }

    private func cleanupSelection() {
        if selectedUnits.contains(where: { world.units[$0] == nil }) {
            selectedUnits.removeAll { world.units[$0] == nil }
            selectedSet = Set(selectedUnits)
        }
        if let b = selectedBuilding, world.buildings[b] == nil { selectedBuilding = nil }
        if let i = inspected, world.units[i] == nil && world.buildings[i] == nil && world.nodes[i] == nil { inspected = nil }
        if let i = inspected, let u = world.units[i], !world.isVisibleToHuman(u.pos) { inspected = nil }
    }

    var ownSelectedUnits: [Unit] {
        selectedUnits.compactMap { world.units[$0] }.filter { $0.owner == world.humanIndex }
    }

    var selectedBuildingObject: Building? { selectedBuilding.flatMap { world.buildings[$0] } }

    // MARK: - Auswahl

    func clearSelection() {
        selectedUnits = []
        selectedSet = []
        selectedBuilding = nil
        inspected = nil
    }

    func select(units ids: [Int]) {
        clearSelection()
        selectedUnits = ids
        selectedSet = Set(ids)
        publishHUD()
    }

    func select(building id: Int) {
        clearSelection()
        selectedBuilding = id
        publishHUD()
    }

    func hitTest(_ p: Vec2) -> Hit? {
        let extra = isTouch ? 0.55 : 0.25
        if let u = world.unit(at: p, extra: extra, filter: { u in
            (u.owner >= 0 && self.world.isAlly(u.owner, self.world.humanIndex)) || self.world.isVisibleToHuman(u.pos)
        }) {
            return .unit(u)
        }
        if let b = world.building(at: p), b.seenByHuman || world.isAlly(b.owner, world.humanIndex) {
            return .building(b)
        }
        if let n = world.node(at: p), n.exploredByHuman, n.style != .farm {
            return .node(n)
        }
        return nil
    }

    private func selectSameType(_ kind: UnitKind) {
        let rect = scene.visibleWorldRect()
        let ids = world.units.values.filter {
            $0.owner == world.humanIndex && $0.kind == kind && rect.contains(CGPoint(x: $0.pos.x, y: $0.pos.y))
        }.map { $0.id }
        select(units: ids)
    }

    func boxSelect(from a: Vec2, to b: Vec2, additive: Bool) {
        let minX = min(a.x, b.x), maxX = max(a.x, b.x), minY = min(a.y, b.y), maxY = max(a.y, b.y)
        var ids = world.units.values.filter {
            $0.owner == world.humanIndex && $0.pos.x >= minX - 0.2 && $0.pos.x <= maxX + 0.2 && $0.pos.y >= minY - 0.2 && $0.pos.y <= maxY + 0.2
        }
        // Wenn Militär dabei ist, Arbeiter ignorieren (wie in klassischen RTS)
        if ids.contains(where: { $0.stats.isMilitary }) { ids = ids.filter { !$0.isVillager } }
        guard !ids.isEmpty else {
            if !additive { clearSelection() }
            publishHUD()
            return
        }
        if additive {
            let merged = selectedUnits + ids.map { $0.id }.filter { !selectedSet.contains($0) }
            select(units: merged)
        } else {
            select(units: ids.map { $0.id })
        }
    }

    // MARK: - Eingaben (Weltkoordinaten)

    func placementOrigin(for kind: BuildingKind, at p: Vec2) -> TilePos {
        let s = Double(kind.stats.size)
        return TilePos(Int((p.x - s / 2).rounded()), Int((p.y - s / 2).rounded()))
    }

    func hover(at p: Vec2) {
        if case .placing(let kind) = mode {
            let o = placementOrigin(for: kind, at: p)
            if o != ghostOrigin {
                ghostOrigin = o
                scene.refreshGhost()
            }
        }
    }

    /// Verarbeitet einen Klick im Sondermodus. Gibt true zurück, wenn er verbraucht wurde.
    private func handleModeClick(at p: Vec2, keepPlacing: Bool) -> Bool {
        switch mode {
        case .normal:
            return false
        case .placing(let kind):
            let origin = placementOrigin(for: kind, at: p)
            if isTouch && ghostOrigin != origin {
                ghostOrigin = origin
                scene.refreshGhost()
                return true
            }
            let builders = ownSelectedUnits.filter { $0.isVillager }
            if let err = world.orderBuild(kind, owner: world.humanIndex, origin: origin, builders: builders) {
                world.notify("⛔️ " + err, player: world.humanIndex)
            } else {
                scene.showMarker(at: p, color: .cyan)
                if kind != .mauer && !keepPlacing { mode = .normal }
            }
        case .attackMove:
            world.commandMove(ownSelectedUnits, to: p, attackMove: true)
            scene.showMarker(at: p, color: .red)
            mode = .normal
        case .nuke(let bid):
            if let b = world.buildings[bid], let err = world.launchNuke(b, at: p) { world.notify(err, player: world.humanIndex) }
            mode = .normal
        case .orbital(let bid):
            if let b = world.buildings[bid], let err = world.orbitalStrike(b, at: p) { world.notify(err, player: world.humanIndex) }
            mode = .normal
        case .rally(let bid):
            if let b = world.buildings[bid] {
                world.setRally(b, p)
                scene.showMarker(at: p, color: .yellow)
            }
            mode = .normal
        }
        publishHUD()
        return true
    }

    /// Linksklick (Mac).
    func primaryClick(at p: Vec2, additive: Bool, clickCount: Int) {
        if handleModeClick(at: p, keepPlacing: additive) { return }
        guard let hit = hitTest(p) else {
            if !additive { clearSelection() }
            publishHUD()
            return
        }
        switch hit {
        case .unit(let u):
            if u.owner == world.humanIndex {
                if clickCount >= 2 {
                    selectSameType(u.kind)
                } else if additive {
                    if selectedSet.contains(u.id) {
                        select(units: selectedUnits.filter { $0 != u.id })
                    } else {
                        select(units: selectedUnits + [u.id])
                    }
                } else {
                    select(units: [u.id])
                }
            } else {
                clearSelection()
                inspected = u.id
            }
        case .building(let b):
            if b.owner == world.humanIndex {
                select(building: b.id)
            } else {
                clearSelection()
                inspected = b.id
            }
        case .node(let n):
            clearSelection()
            inspected = n.id
        }
        publishHUD()
    }

    /// Rechtsklick (Mac): Kontextbefehl.
    func secondaryClick(at p: Vec2) {
        if case .normal = mode {} else {
            mode = .normal
            publishHUD()
            return
        }
        let units = ownSelectedUnits
        if !units.isEmpty {
            smartCommand(units, at: p)
            return
        }
        if let b = selectedBuildingObject, b.owner == world.humanIndex {
            world.setRally(b, p)
            scene.showMarker(at: p, color: .yellow)
        }
    }

    /// Antippen (iPhone/iPad).
    func tap(at p: Vec2) {
        if handleModeClick(at: p, keepPlacing: false) { return }
        let units = ownSelectedUnits
        let hit = hitTest(p)
        switch hit {
        case .unit(let u)? where u.owner == world.humanIndex:
            select(units: [u.id])
        case .building(let b)? where b.owner == world.humanIndex:
            let villagers = units.filter { $0.isVillager }
            let wantsWork = !b.isComplete || b.hp < b.maxHP - 1 || b.kind == .bauernhof ||
                (b.stats.dropSite && villagers.contains { $0.carry > 0 })
            if !villagers.isEmpty && wantsWork {
                smartCommand(units, at: p)
            } else {
                select(building: b.id)
            }
        default:
            if !units.isEmpty {
                smartCommand(units, at: p)
            } else if let hit = hit {
                clearSelection()
                switch hit {
                case .unit(let u): inspected = u.id
                case .building(let b): inspected = b.id
                case .node(let n): inspected = n.id
                }
            } else {
                clearSelection()
            }
        }
        publishHUD()
    }

    func doubleTap(at p: Vec2) {
        if case .unit(let u)? = hitTest(p), u.owner == world.humanIndex {
            selectSameType(u.kind)
        }
    }

    func smartCommand(_ units: [Unit], at p: Vec2) {
        let villagers = units.filter { $0.isVillager }
        let others = units.filter { !$0.isVillager }
        let me = world.humanIndex
        switch hitTest(p) {
        case .unit(let t)?:
            if world.isEnemy(me, t.owner) || (t.owner == gaiaOwner && t.isAnimal) {
                world.commandAttack(units, targetID: t.id)
                scene.showMarker(at: t.pos, color: .red)
                return
            }
        case .building(let b)?:
            if world.isEnemy(me, b.owner) {
                world.commandAttack(units, targetID: b.id)
                scene.showMarker(at: b.center, color: .red)
                return
            }
            if b.owner == me && !villagers.isEmpty {
                if !b.isComplete || b.hp < b.maxHP - 1 {
                    world.commandBuild(villagers, buildingID: b.id)
                } else if b.kind == .bauernhof, let nid = b.linkedNodeID {
                    world.commandGather(villagers, nodeID: nid)
                } else if b.stats.dropSite {
                    for v in villagers where v.carry > 0 {
                        v.order = .returnCargo
                        v.path = []
                    }
                } else {
                    world.commandMove(villagers, to: p, attackMove: false)
                }
                if !others.isEmpty { world.commandMove(others, to: p, attackMove: false) }
                scene.showMarker(at: b.center, color: .green)
                return
            }
        case .node(let n)?:
            if !villagers.isEmpty {
                world.commandGather(villagers, nodeID: n.id)
                if !others.isEmpty { world.commandMove(others, to: p, attackMove: false) }
                scene.showMarker(at: n.center, color: .yellow)
                return
            }
        case nil:
            break
        }
        world.commandMove(units, to: p, attackMove: false)
        scene.showMarker(at: p, color: .green)
    }

    // MARK: - HUD-Aktionen

    func perform(_ action: HUDAction) {
        let me = world.humanIndex
        switch action {
        case .train(let k):
            if let b = selectedBuildingObject, let err = world.trainUnit(b, k) { world.notify("⛔️ " + err, player: me) }
        case .build(let k):
            mode = .placing(k)
            if isTouch {
                ghostOrigin = placementOrigin(for: k, at: scene.cameraCenterWorld())
                scene.refreshGhost()
            }
        case .ageUp:
            let tc = selectedBuildingObject?.kind == .stadtzentrum ? selectedBuildingObject
                : world.buildings.values.first { $0.owner == me && $0.kind == .stadtzentrum && $0.isComplete }
            if let tc = tc, let err = world.queueAgeUp(tc) { world.notify("⛔️ " + err, player: me) }
        case .missile:
            if let b = selectedBuildingObject, let err = world.queueMissile(b) { world.notify("⛔️ " + err, player: me) }
        case .launchNuke:
            if let b = selectedBuildingObject { mode = .nuke(b.id) }
        case .orbital:
            if let b = selectedBuildingObject {
                if b.abilityCooldown > 0 {
                    world.notify("Satellit lädt noch (\(Int(b.abilityCooldown)) s).", player: me)
                } else {
                    mode = .orbital(b.id)
                }
            }
        case .rally:
            if let b = selectedBuildingObject { mode = .rally(b.id) }
        case .stop:
            world.commandStop(ownSelectedUnits)
        case .attackMove:
            mode = .attackMove
        case .delete:
            for u in ownSelectedUnits { world.deleteEntity(u.id) }
            if let b = selectedBuildingObject, b.owner == me { world.deleteEntity(b.id) }
        case .cancelQueue(let i):
            if let b = selectedBuildingObject, b.owner == me { world.cancelQueue(b, index: i) }
        case .deselect:
            clearSelection()
            mode = .normal
        }
        publishHUD()
    }

    func cancelMode() {
        if case .normal = mode {
            clearSelection()
        } else {
            mode = .normal
        }
        publishHUD()
    }

    func chooseDoctrine(_ focus: DoctrineFocus) {
        world.chooseDoctrine(player: world.humanIndex, focus: focus)
        publishHUD()
    }

    func selectIdleVillager() {
        let idle = world.units.values
            .filter { $0.owner == world.humanIndex && $0.isVillager && $0.order == .idle }
            .sorted { $0.id < $1.id }
        guard !idle.isEmpty else { return }
        let current = selectedUnits.first ?? -1
        let next = idle.first { $0.id > current } ?? idle[0]
        select(units: [next.id])
        scene.centerCamera(on: next.pos)
    }

    func selectArmy() {
        let ids = world.units.values.filter { $0.owner == world.humanIndex && $0.stats.isMilitary }.map { $0.id }
        select(units: ids)
    }

    func selectTownCenter() {
        if let tc = world.buildings.values.first(where: { $0.owner == world.humanIndex && $0.kind == .stadtzentrum }) {
            select(building: tc.id)
            scene.centerCamera(on: tc.center)
        }
    }

    func jumpToAlert() {
        if let p = world.alertPos { scene.centerCamera(on: p) }
    }

    func minimapTapped(normalized p: CGPoint) {
        let w = Double(world.map.width), h = Double(world.map.height)
        scene.centerCamera(on: Vec2(Double(p.x) * w, (1 - Double(p.y)) * h))
        publishHUD()
    }

    func togglePause() {
        paused.toggle()
    }

    // MARK: - Minikarte

    private func buildMinimapBase() {
        let m = world.map
        let s = minimapScale
        let w = m.width * s, h = m.height * s
        minimapBase = [UInt8](repeating: 255, count: w * h * 4)
        for ty in 0..<m.height {
            for tx in 0..<m.width {
                let c = ImageFactory.terrainColor(m.terrain[m.index(tx, ty)]).scaled(0.85)
                for dy in 0..<s {
                    for dx in 0..<s {
                        let x = tx * s + dx, y = (m.height - 1 - ty) * s + (s - 1 - dy)
                        let o = (y * w + x) * 4
                        minimapBase[o] = UInt8(c.r * 255)
                        minimapBase[o + 1] = UInt8(c.g * 255)
                        minimapBase[o + 2] = UInt8(c.b * 255)
                    }
                }
            }
        }
    }

    private func rebuildMinimap() {
        let m = world.map
        let s = minimapScale
        let w = m.width * s, h = m.height * s
        var px = minimapBase
        func put(_ tx: Int, _ ty: Int, _ c: RGB, size: Int) {
            for dy in 0..<size {
                for dx in 0..<size {
                    let x = tx + dx, y = ty + dy
                    guard x >= 0, y >= 0, x < w, y < h else { continue }
                    let o = ((h - 1 - y) * w + x) * 4
                    px[o] = UInt8(c.r * 255)
                    px[o + 1] = UInt8(c.g * 255)
                    px[o + 2] = UInt8(c.b * 255)
                }
            }
        }
        for n in world.nodes.values where n.exploredByHuman && n.style != .tree {
            let c: RGB
            switch n.style {
            case .ironMine: c = RGB(0.7, 0.7, 0.75)
            case .goldMine: c = RGB(1, 0.85, 0.2)
            case .deposit: c = RGB(0.1, 0.1, 0.1)
            default: c = RGB(0.8, 0.3, 0.5)
            }
            put(n.origin.x * s, n.origin.y * s, c, size: n.size * s)
        }
        for n in world.nodes.values where n.exploredByHuman && n.style == .tree {
            put(n.origin.x * s, n.origin.y * s, RGB(0.12, 0.33, 0.12), size: s)
        }
        // Nebel
        for ty in 0..<m.height {
            for tx in 0..<m.width {
                let i = m.index(tx, ty)
                if world.visible[i] { continue }
                let f: Double = world.explored[i] ? 0.55 : 0.0
                for dy in 0..<s {
                    for dx in 0..<s {
                        let x = tx * s + dx, y = (m.height - 1 - ty) * s + (s - 1 - dy)
                        let o = (y * w + x) * 4
                        if f == 0 {
                            px[o] = 18; px[o + 1] = 18; px[o + 2] = 22
                        } else {
                            px[o] = UInt8(Double(px[o]) * f)
                            px[o + 1] = UInt8(Double(px[o + 1]) * f)
                            px[o + 2] = UInt8(Double(px[o + 2]) * f)
                        }
                    }
                }
            }
        }
        for b in world.buildings.values where b.seenByHuman || world.isAlly(b.owner, world.humanIndex) {
            put(b.origin.x * s, b.origin.y * s, PlayerPalette.rgb(b.owner).scaled(0.8), size: b.size * s)
        }
        for u in world.units.values {
            let own = u.owner >= 0 && world.isAlly(u.owner, world.humanIndex)
            guard own || world.isVisibleToHuman(u.pos) else { continue }
            let c = u.owner >= 0 ? PlayerPalette.rgb(u.owner).mixed(with: RGB(1, 1, 1), 0.25) : RGB(0.85, 0.75, 0.6)
            put(Int(u.pos.x * Double(s)) - 1, Int(u.pos.y * Double(s)) - 1, c, size: 3)
        }
        if let a = world.alertPos, world.time - world.alertTime < 6, Int(world.time * 3) % 2 == 0 {
            put(Int(a.x * Double(s)) - 3, Int(a.y * Double(s)) - 3, RGB(1, 0.1, 0.1), size: 7)
        }
        minimap = ImageFactory.image(width: w, height: h, rgba: px)
    }

    // MARK: - HUD-Zustand

    func publishHUD() {
        let me = world.human
        var s = HUDState()
        let age = me.age
        s.resources = ResourceKind.allCases.map {
            ResourceDisplay(id: $0.rawValue, icon: $0.icon(age: age), name: $0.name(age: age),
                            amount: Int(me.resources[$0]),
                            locked: $0 == .strategic && age < ResourceKind.strategicUnlockAge)
        }
        s.popUsed = world.popUsed[world.humanIndex]
        s.popCap = world.popCap[world.humanIndex]
        s.age = age
        s.ageName = Ages.info(age).name
        s.ageEra = Ages.info(age).era
        if me.researchingAge,
           let tc = world.buildings.values.first(where: { $0.owner == me.index && $0.queue.first == .ageUp }) {
            s.ageProgress = tc.queueProgress
        } else if me.researchingAge {
            s.ageProgress = 0
        }
        s.timeText = formatTime(world.time)
        var idle = 0, army = 0
        for u in world.units.values where u.owner == me.index {
            if u.isVillager, case .idle = u.order { idle += 1 }
            if u.stats.isMilitary { army += 1 }
        }
        s.idleVillagers = idle
        s.armyCount = army
        let (summary, commands) = selectionInfo()
        s.selection = summary
        s.commands = commands
        if let dAge = me.pendingDoctrineAge {
            s.doctrineAge = dAge
            s.doctrineOffers = DoctrineCatalog.choices(forAge: dAge).map {
                DoctrineOffer(focus: $0.focus, name: $0.name, description: $0.description, timesChosen: me.focusCount($0.focus))
            }
        }
        s.notifications = world.notifications.filter { world.time - $0.time < ($0.important ? 10 : 6) }
        s.modeHint = modeHint()
        s.result = world.result
        for b in world.buildings.values {
            if let t = b.wonderTimer {
                let owner = world.players[b.owner].name
                s.wonderTexts.append("🕍 Weltwunder (\(owner)): \(formatTime(max(0, t)))")
            }
        }
        let r = scene.visibleWorldRect()
        let mw = Double(world.map.width), mh = Double(world.map.height)
        s.cameraRect = CGRect(x: Double(r.minX) / mw, y: 1 - Double(r.maxY) / mh,
                              width: Double(r.width) / mw, height: Double(r.height) / mh)
        s.perkNames = me.perks.map { "\($0.focus.icon) \($0.name)" }
        s.players = world.players.map {
            PlayerLine(id: $0.index, name: $0.name, colorIndex: $0.colorIndex, ageName: Ages.info($0.age).name,
                       defeated: $0.isDefeated, isAlly: $0.team == me.team)
        }
        s.stats = me.stats
        hud = s
    }

    private func modeHint() -> String? {
        let touch = isTouch
        switch mode {
        case .normal: return nil
        case .placing(let k):
            let name = BuildingCatalog.name(k, age: world.human.age)
            return touch ? "\(name): Tippe zum Positionieren, erneut tippen zum Bauen." :
                "\(name) platzieren – Klick: bauen, Shift: weitere, Rechtsklick/Esc: abbrechen"
        case .attackMove: return touch ? "Angriffsbewegung: Ziel antippen." : "Angriffsbewegung: Ziel anklicken."
        case .nuke: return "☢️ Ziel für die Atomrakete wählen!"
        case .orbital: return "🛰️ Ziel für den Orbitalschlag wählen!"
        case .rally: return "🚩 Sammelpunkt festlegen."
        }
    }

    private func orderText(_ u: Unit) -> String {
        switch u.order {
        case .idle: return "Untätig"
        case .move: return "Marschiert"
        case .attackMove: return "Angriffsbewegung"
        case .attack: return u.isVillager ? "Jagt / kämpft" : "Kämpft"
        case .gather: return "Sammelt \(u.gatherKind?.name(age: world.human.age) ?? "")"
        case .returnCargo: return "Liefert ab"
        case .build(let id):
            if let b = world.buildings[id], b.isComplete { return "Repariert" }
            return "Baut"
        }
    }

    private func fmt(_ v: Double) -> String {
        v == v.rounded() ? String(Int(v)) : String(format: "%.1f", v)
    }

    private func selectionInfo() -> (SelectionSummary?, [CommandButton]) {
        let me = world.human
        let units = selectedUnits.compactMap { world.units[$0] }
        if !units.isEmpty {
            var s = SelectionSummary()
            s.isOwn = true
            s.colorIndex = me.colorIndex
            if units.count == 1, let u = units.first {
                s.icon = u.stats.emoji
                s.title = u.stats.name
                s.subtitle = "\(u.stats.category.name) · \(Ages.info(u.stats.age).name) · \(orderText(u))"
                s.hp = u.hp
                s.maxHP = u.maxHP
                s.description = u.stats.description
                if u.stats.attack > 0 {
                    s.stats.append(StatLine(label: "Angriff", value: fmt(world.effectiveAttack(u))))
                }
                if u.stats.heal > 0 { s.stats.append(StatLine(label: "Heilung", value: fmt(u.stats.heal * me.mods.healPower) + "/s")) }
                s.stats.append(StatLine(label: "Rüstung", value: fmt(world.effectiveArmor(u))))
                if u.stats.isRanged { s.stats.append(StatLine(label: "Reichweite", value: fmt(world.effectiveRange(u)))) }
                s.stats.append(StatLine(label: "Tempo", value: fmt(world.effectiveSpeed(u))))
                if u.carry > 0, let k = u.carryKind {
                    s.stats.append(StatLine(label: "Trägt", value: "\(Int(u.carry)) \(k.icon(age: me.age))"))
                }
                if u.auraBoost { s.stats.append(StatLine(label: "Heldenaura", value: "aktiv")) }
            } else {
                s.icon = "👥"
                s.title = "\(units.count) Einheiten"
                s.hp = units.reduce(0) { $0 + $1.hp }
                s.maxHP = units.reduce(0) { $0 + $1.maxHP }
                var counts: [UnitKind: Int] = [:]
                for u in units { counts[u.kind, default: 0] += 1 }
                s.groups = counts.sorted { $0.value > $1.value }.map {
                    UnitGroup(id: $0.key.rawValue, icon: $0.key.stats.emoji, name: $0.key.stats.name, count: $0.value)
                }
                s.subtitle = s.groups.prefix(3).map { "\($0.count)× \($0.name)" }.joined(separator: ", ")
            }
            return (s, unitCommands(units))
        }
        if let b = selectedBuildingObject {
            return (buildingSummary(b), b.owner == me.index ? buildingCommands(b) : [])
        }
        if let i = inspected {
            if let u = world.units[i] {
                var s = SelectionSummary()
                s.icon = u.stats.emoji
                s.title = u.stats.name
                s.subtitle = u.owner >= 0 ? "\(world.players[u.owner].name) · \(Ages.info(u.stats.age).name)" : "Wildtier"
                s.hp = u.hp
                s.maxHP = u.maxHP
                s.colorIndex = u.owner
                s.description = u.stats.description
                if u.stats.attack > 0 { s.stats.append(StatLine(label: "Angriff", value: fmt(world.effectiveAttack(u)))) }
                s.stats.append(StatLine(label: "Rüstung", value: fmt(world.effectiveArmor(u))))
                return (s, [])
            }
            if let b = world.buildings[i] { return (buildingSummary(b), []) }
            if let n = world.nodes[i] {
                var s = SelectionSummary()
                let age = me.age
                switch n.style {
                case .tree: s.icon = "🌲"; s.title = "Baum"
                case .berries: s.icon = "🫐"; s.title = "Beerenstrauch"
                case .ironMine: s.icon = "⛓️"; s.title = "Eisenmine"
                case .goldMine: s.icon = "🪙"; s.title = "Goldmine"
                case .deposit:
                    s.icon = ResourceKind.strategic.icon(age: max(age, 5))
                    s.title = "Vorkommen: \(ResourceKind.strategic.name(age: max(age, 5)))"
                case .carcass: s.icon = "🍖"; s.title = "Jagdbeute"
                case .farm: s.icon = "🌾"; s.title = "Feld"
                }
                s.subtitle = n.infinite ? "Unerschöpflich" : "Verbleibend: \(Int(n.amount)) \(n.kind.name(age: max(age, n.kind == .strategic ? 5 : age)))"
                if n.kind == .strategic && age < ResourceKind.strategicUnlockAge {
                    s.description = "Kann ab dem Dampfzeitalter abgebaut werden. Später liefert es Uran und Silizium."
                }
                s.colorIndex = -1
                return (s, [])
            }
        }
        return (nil, [])
    }

    private func buildingSummary(_ b: Building) -> SelectionSummary {
        var s = SelectionSummary()
        let ownerAge = b.owner >= 0 ? world.players[b.owner].age : 0
        s.icon = BuildingCatalog.emoji(b.kind, age: ownerAge)
        s.title = BuildingCatalog.name(b.kind, age: ownerAge)
        s.isOwn = b.owner == world.humanIndex
        s.colorIndex = b.owner
        s.hp = b.hp
        s.maxHP = b.maxHP
        s.description = b.stats.description
        if !b.isComplete {
            s.subtitle = "Im Bau – \(Int(b.progress * 100)) %"
        } else if b.owner != world.humanIndex {
            s.subtitle = world.players[b.owner].name
        } else {
            s.subtitle = Ages.info(ownerAge).name
        }
        if b.stats.pop > 0 { s.stats.append(StatLine(label: "Bevölkerung", value: "+\(b.stats.pop)")) }
        if b.stats.attack > 0 && b.isComplete { s.stats.append(StatLine(label: "Angriff", value: fmt(world.buildingAttack(b).rounded()))) }
        if b.stats.dropSite { s.stats.append(StatLine(label: "Abgabestelle", value: "✓")) }
        if b.kind == .raketensilo { s.stats.append(StatLine(label: "Raketen", value: "\(b.missiles)")) }
        if b.kind == .orbitaluplink {
            s.stats.append(StatLine(label: "Satellit", value: b.abilityCooldown > 0 ? "\(Int(b.abilityCooldown)) s" : "bereit"))
        }
        if let t = b.wonderTimer { s.stats.append(StatLine(label: "Sieg in", value: formatTime(max(0, t)))) }
        if s.isOwn {
            s.queue = b.queue.enumerated().map { i, item in
                let icon: String
                switch item {
                case .unit(let k): icon = k.stats.emoji
                case .ageUp: icon = "⏫"
                case .missile: icon = "☢️"
                }
                return QueueEntry(id: i, icon: icon, title: item.title, progress: i == 0 ? b.queueProgress : 0)
            }
        }
        return s
    }

    private func unitCommands(_ units: [Unit]) -> [CommandButton] {
        let me = world.human
        guard units.contains(where: { $0.owner == me.index }) else { return [] }
        var cmds: [CommandButton] = []
        if units.contains(where: { $0.isVillager }) {
            for k in world.availableBuildings(for: me.index) {
                let cost = world.buildingCost(k, owner: me.index)
                let affordable = me.resources.covers(cost)
                var reason = ""
                var enabled = affordable
                if let maxC = k.stats.maxCount, world.count(k, owner: me.index) >= maxC {
                    enabled = false
                    reason = " (Maximum erreicht)"
                }
                cmds.append(CommandButton(id: "b-\(k.rawValue)", icon: BuildingCatalog.emoji(k, age: me.age),
                                          title: BuildingCatalog.name(k, age: me.age), cost: cost.shortText(age: me.age),
                                          enabled: enabled, tooltip: k.stats.description + reason, action: .build(k)))
            }
        }
        if units.contains(where: { $0.stats.attack > 0 && !$0.isVillager }) {
            cmds.append(CommandButton(id: "attackmove", icon: "🎯", title: "Angriffs­bewegung", cost: "", enabled: true,
                                      tooltip: "Bewegt sich zum Ziel und greift unterwegs alle Feinde an.", action: .attackMove))
        }
        cmds.append(CommandButton(id: "stop", icon: "✋", title: "Halt", cost: "", enabled: true,
                                  tooltip: "Alle Befehle abbrechen.", action: .stop))
        cmds.append(CommandButton(id: "delete", icon: "🗑️", title: "Entlassen", cost: "", enabled: true,
                                  tooltip: "Ausgewählte Einheiten entlassen.", action: .delete))
        return cmds
    }

    private func buildingCommands(_ b: Building) -> [CommandButton] {
        let me = world.human
        var cmds: [CommandButton] = []
        guard b.isComplete else {
            return [CommandButton(id: "delete", icon: "🗑️", title: "Abbrechen", cost: "", enabled: true,
                                  tooltip: "Baustelle abreißen.", action: .delete)]
        }
        for k in UnitCatalog.trainable(at: b.kind, age: me.age) {
            let cost = world.unitCost(k, owner: me.index)
            let queued = b.queue.filter { $0 == .unit(k) }.count
            var btn = CommandButton(id: "u-\(k.rawValue)", icon: k.stats.emoji, title: k.stats.name,
                                    cost: cost.shortText(age: me.age), enabled: me.resources.covers(cost),
                                    tooltip: "\(k.stats.description)\nLP \(Int(k.stats.hp)) · Angriff \(fmt(k.stats.attack)) · Rüstung \(fmt(k.stats.armor))",
                                    action: .train(k))
            if queued > 0 { btn.badge = "\(queued)" }
            if k.stats.category == .hero { btn.highlight = true }
            cmds.append(btn)
        }
        if b.kind == .stadtzentrum {
            if me.age < min(Ages.count - 1, world.settings.maxAge) {
                let next = Ages.info(me.age + 1)
                let enabled = !me.researchingAge && me.pendingDoctrineAge == nil && me.resources.covers(next.advanceCost)
                cmds.append(CommandButton(id: "ageup", icon: "⏫", title: "→ \(next.name)",
                                          cost: next.advanceCost.shortText(age: me.age + 1), enabled: enabled,
                                          tooltip: "Epochensprung: \(next.description)\nDas \(Ages.info(me.age).townCenterName) wird zur \(next.townCenterName).",
                                          action: .ageUp, highlight: true))
            }
        }
        if b.kind == .raketensilo {
            cmds.append(CommandButton(id: "missile", icon: "☢️", title: "Atomrakete bauen",
                                      cost: GameWorld.missileCost.shortText(age: me.age),
                                      enabled: me.resources.covers(GameWorld.missileCost) && b.missiles + b.queue.count < 2,
                                      tooltip: "Baut eine Atomrakete (60 s).", action: .missile))
            cmds.append(CommandButton(id: "launch", icon: "🚀", title: "Abschuss", cost: "\(b.missiles) bereit",
                                      enabled: b.missiles > 0, tooltip: "Ziel auf der Karte wählen.", action: .launchNuke,
                                      highlight: b.missiles > 0))
        }
        if b.kind == .orbitaluplink {
            cmds.append(CommandButton(id: "orbital", icon: "🛰️", title: "Orbitalschlag",
                                      cost: b.abilityCooldown > 0 ? "\(Int(b.abilityCooldown)) s" : "bereit",
                                      enabled: b.abilityCooldown <= 0, tooltip: "Verheerender Satellitenschlag.",
                                      action: .orbital, highlight: b.abilityCooldown <= 0))
        }
        if !UnitCatalog.trainable(at: b.kind, age: me.age).isEmpty {
            cmds.append(CommandButton(id: "rally", icon: "🚩", title: "Sammelpunkt", cost: "", enabled: true,
                                      tooltip: "Wohin neue Einheiten laufen.", action: .rally))
        }
        cmds.append(CommandButton(id: "delete", icon: "🗑️", title: "Abreißen", cost: "", enabled: true,
                                  tooltip: "Gebäude abreißen.", action: .delete))
        return cmds
    }
}
