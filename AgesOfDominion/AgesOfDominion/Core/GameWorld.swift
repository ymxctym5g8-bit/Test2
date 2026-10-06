import Foundation

enum GameResult: Equatable {
    case victory(String)
    case defeat(String)
}

/// Räumliches Raster für schnelle Nachbarschaftsabfragen.
struct SpatialGrid {
    let cellSize = 4
    let cols: Int
    let rows: Int
    private(set) var cells: [[Unit]]

    init(mapWidth: Int, mapHeight: Int) {
        cols = mapWidth / 4 + 1
        rows = mapHeight / 4 + 1
        cells = Array(repeating: [], count: cols * rows)
    }

    mutating func rebuild(_ units: [Unit]) {
        for i in 0..<cells.count { cells[i].removeAll(keepingCapacity: true) }
        for u in units where u.isAlive {
            let cx = Int(u.pos.x / 4).clamped(0, cols - 1)
            let cy = Int(u.pos.y / 4).clamped(0, rows - 1)
            cells[cy * cols + cx].append(u)
        }
    }

    func forEach(near p: Vec2, radius: Double, _ body: (Unit) -> Void) {
        let x0 = Int((p.x - radius) / 4).clamped(0, cols - 1), x1 = Int((p.x + radius) / 4).clamped(0, cols - 1)
        let y0 = Int((p.y - radius) / 4).clamped(0, rows - 1), y1 = Int((p.y + radius) / 4).clamped(0, rows - 1)
        let r2 = radius * radius
        for cy in y0...y1 {
            for cx in x0...x1 {
                for u in cells[cy * cols + cx] where u.isAlive && u.pos.distanceSquared(to: p) <= r2 { body(u) }
            }
        }
    }
}

final class GameWorld {
    let settings: GameSettings
    let map: GameMap
    let pathfinder: Pathfinder
    var players: [Player] = []
    var units: [Int: Unit] = [:]
    var buildings: [Int: Building] = [:]
    var nodes: [Int: ResourceNode] = [:]
    var ais: [AIController] = []
    var time: Double = 0
    var events: [WorldEvent] = []
    var notifications: [GameNotification] = []
    var strikes: [PendingStrike] = []
    var result: GameResult?
    var alertPos: Vec2?
    var alertTime: Double = -100
    let humanIndex = 0
    var startPositions: [TilePos] = []

    // Nebel des Krieges (Sicht des menschlichen Teams)
    var visible: [Bool]
    var explored: [Bool]
    var fogVersion = 0
    private var fogTimer: Double = 0
    private var victoryTimer: Double = 0

    var grid: SpatialGrid
    var popUsed: [Int] = []
    var popCap: [Int] = []
    private var nextID = 1
    private var notificationID = 0
    var rng: SeededRandom
    /// Wird bei Struktur-Änderungen (neue/entfernte Gebäude & Rohstoffe) erhöht.
    var structureVersion = 0
    // Pro Tick zwischengespeicherte Gebäudeeffekte
    var shieldGens: [(owner: Int, pos: Vec2)] = []
    var templeSpots: [(owner: Int, pos: Vec2)] = []
    var bahnhofCount: [Int] = []

    init(settings: GameSettings) {
        self.settings = settings
        let size = settings.mapSize.rawValue
        map = GameMap(width: size, height: size)
        pathfinder = Pathfinder(map: map)
        grid = SpatialGrid(mapWidth: size, mapHeight: size)
        visible = Array(repeating: false, count: size * size)
        explored = Array(repeating: settings.revealMap, count: size * size)
        rng = SeededRandom(seed: settings.seed)
        setup()
    }

    func newID() -> Int {
        nextID += 1
        return nextID
    }

    var human: Player { players[humanIndex] }

    // MARK: - Spielaufbau

    private static let aiNames = ["Imperium Aurelia", "Khanat Temur", "Republik Valoria", "Dynastie Qin-Hai"]

    private func setup() {
        let playerCount = settings.opponents + 1
        var gen = MapGenerator(size: map.width, playerCount: playerCount, seed: settings.seed)
        gen.generateTerrain(into: map)
        startPositions = gen.startPositions()

        let res = settings.startResources()
        players.append(Player(index: 0, name: "Du", colorIndex: 0, team: 0, isHuman: true,
                              resources: res, age: settings.startAge))
        for i in 1..<playerCount {
            let p = Player(index: i, name: GameWorld.aiNames[(i - 1) % GameWorld.aiNames.count], colorIndex: i,
                           team: settings.alliedAI ? 1 : i, isHuman: false, resources: res, age: settings.startAge)
            p.handicap = settings.difficulty.gatherMult
            players.append(p)
        }
        popUsed = Array(repeating: 0, count: playerCount)
        popCap = Array(repeating: 0, count: playerCount)
        bahnhofCount = Array(repeating: 0, count: playerCount)

        for (i, s) in startPositions.enumerated() {
            let origin = TilePos(s.x - 1, s.y - 1)
            if let tc = createBuilding(.stadtzentrum, owner: i, origin: origin) { finishBuilding(tc) }
            placeStartResources(around: s)
            let villagers = 4 + settings.startAge / 2
            for _ in 0..<villagers { spawnUnit(.arbeiter, owner: i, near: s.center) }
            let infantry = UnitCatalog.trainable(at: .kaserne, age: settings.startAge).first ?? .keulenkrieger
            spawnUnit(infantry, owner: i, near: s.center)
            if settings.startAge > 0 {
                for k in 0..<2 {
                    let dir = Vec2(s.x > map.width / 2 ? -1 : 1, s.y > map.height / 2 ? -1 : 1)
                    let o = TilePos(s.x + Int(dir.x) * (3 + k * 3), s.y - Int(dir.y) * 4)
                    if canPlace(.haus, origin: o, owner: i, ignoreFog: true), let h = createBuilding(.haus, owner: i, origin: o) {
                        finishBuilding(h)
                    }
                }
            }
        }
        placeMapResources()
        for i in 1..<playerCount {
            ais.append(AIController(world: self, playerIndex: i, difficulty: settings.difficulty))
        }
        updatePopulation()
        updateFog(force: true)
    }

    private func randomSpot(near c: TilePos, minDist: Double, maxDist: Double, size: Int) -> TilePos? {
        for _ in 0..<60 {
            let a = rng.range(0, Double.pi * 2)
            let d = rng.range(minDist, maxDist)
            let t = TilePos(c.x + Int(cos(a) * d), c.y + Int(sin(a) * d))
            if areaFree(origin: t, size: size, margin: 1) { return t }
        }
        return nil
    }

    private func areaFree(origin: TilePos, size: Int, margin: Int) -> Bool {
        for dx in -margin..<(size + margin) {
            for dy in -margin..<(size + margin) {
                let x = origin.x + dx, y = origin.y + dy
                guard map.inBounds(x, y) else { return false }
                let i = map.index(x, y)
                if !map.terrain[i].isLand || map.footprint[i] != 0 { return false }
            }
        }
        return true
    }

    @discardableResult
    private func addNode(_ kind: ResourceKind, _ style: NodeStyle, origin: TilePos, size: Int, amount: Double,
                         blocks: Bool = true, infinite: Bool = false) -> ResourceNode? {
        for dx in 0..<size {
            for dy in 0..<size {
                let x = origin.x + dx, y = origin.y + dy
                guard map.inBounds(x, y) else { return nil }
                let i = map.index(x, y)
                if blocks && (!map.terrain[i].isLand || map.footprint[i] != 0) { return nil }
            }
        }
        let n = ResourceNode(id: newID(), kind: kind, style: style, origin: origin, size: size, amount: amount,
                             infinite: infinite, blocks: blocks, variant: rng.int(0, 3))
        nodes[n.id] = n
        if blocks { map.setBlock(n.tiles, id: Int32(n.id), blocks: true) }
        structureVersion += 1
        return n
    }

    private func growForest(from seed: TilePos, count: Int, avoid: [TilePos], avoidRadius: Int) {
        var p = seed
        var placed = 0
        var tries = 0
        while placed < count && tries < count * 6 {
            tries += 1
            p = TilePos(p.x + rng.int(-1, 1), p.y + rng.int(-1, 1))
            if !map.inBounds(p.x, p.y) { p = seed; continue }
            if avoid.contains(where: { $0.chebyshev(p) < avoidRadius }) { p = seed; continue }
            if addNode(.wood, .tree, origin: p, size: 1, amount: 120) != nil { placed += 1 }
        }
    }

    private func placeStartResources(around s: TilePos) {
        let others = startPositions
        // Beeren
        if let b = randomSpot(near: s, minDist: 5, maxDist: 7, size: 2) {
            for dx in 0..<3 { for dy in 0..<2 {
                addNode(.food, .berries, origin: TilePos(b.x + dx, b.y + dy), size: 1, amount: 150)
            } }
        }
        // Wälder
        for _ in 0..<2 {
            if let f = randomSpot(near: s, minDist: 9, maxDist: 13, size: 1) {
                growForest(from: f, count: 28, avoid: others, avoidRadius: 6)
            }
        }
        if let m = randomSpot(near: s, minDist: 7, maxDist: 10, size: 2) {
            addNode(.iron, .ironMine, origin: m, size: 2, amount: 2000)
        }
        if let m = randomSpot(near: s, minDist: 8, maxDist: 11, size: 2) {
            addNode(.gold, .goldMine, origin: m, size: 2, amount: 1800)
        }
        if let m = randomSpot(near: s, minDist: 11, maxDist: 15, size: 2) {
            addNode(.strategic, .deposit, origin: m, size: 2, amount: 3000)
        }
        for _ in 0..<4 {
            if let d = randomSpot(near: s, minDist: 7, maxDist: 11, size: 1) {
                spawnUnit(.hirsch, owner: gaiaOwner, near: d.center)
            }
        }
        for _ in 0..<2 {
            if let d = randomSpot(near: s, minDist: 12, maxDist: 16, size: 1) {
                spawnUnit(.mammut, owner: gaiaOwner, near: d.center)
            }
        }
    }

    private func placeMapResources() {
        let n = map.width
        let scale = Double(n * n) / Double(96 * 96)
        func randomLandTile(minStartDist: Int) -> TilePos? {
            for _ in 0..<80 {
                let t = TilePos(rng.int(2, n - 3), rng.int(2, n - 3))
                if startPositions.contains(where: { $0.chebyshev(t) < minStartDist }) { continue }
                if areaFree(origin: t, size: 2, margin: 1) { return t }
            }
            return nil
        }
        for _ in 0..<Int(22 * scale) {
            if let t = randomLandTile(minStartDist: 14) { growForest(from: t, count: rng.int(12, 34), avoid: startPositions, avoidRadius: 10) }
        }
        for _ in 0..<Int(5 * scale) {
            if let t = randomLandTile(minStartDist: 16) { addNode(.iron, .ironMine, origin: t, size: 2, amount: 2500) }
            if let t = randomLandTile(minStartDist: 16) { addNode(.gold, .goldMine, origin: t, size: 2, amount: 2200) }
        }
        for _ in 0..<Int(6 * scale) {
            if let t = randomLandTile(minStartDist: 18) { addNode(.strategic, .deposit, origin: t, size: 2, amount: 4000) }
        }
        for _ in 0..<Int(5 * scale) {
            if let t = randomLandTile(minStartDist: 14) {
                for _ in 0..<4 {
                    addNode(.food, .berries, origin: TilePos(t.x + rng.int(-2, 2), t.y + rng.int(-2, 2)), size: 1, amount: 150)
                }
            }
        }
        for _ in 0..<Int(8 * scale) {
            if let t = randomLandTile(minStartDist: 16) { spawnUnit(.mammut, owner: gaiaOwner, near: t.center) }
            if let t = randomLandTile(minStartDist: 14) { spawnUnit(.hirsch, owner: gaiaOwner, near: t.center) }
        }
    }

    // MARK: - Hilfsfunktionen

    func mods(_ owner: Int) -> Modifiers? { owner >= 0 ? players[owner].mods : nil }

    func isEnemy(_ a: Int, _ b: Int) -> Bool {
        guard a >= 0, b >= 0, a != b else { return false }
        return players[a].team != players[b].team
    }

    func isAlly(_ a: Int, _ b: Int) -> Bool {
        guard a >= 0, b >= 0 else { return false }
        return players[a].team == players[b].team
    }

    func notify(_ text: String, player: Int, important: Bool = false) {
        guard player == humanIndex || player == -2 else { return }
        if let last = notifications.last, last.text == text, time - last.time < 3 { return }
        notificationID += 1
        notifications.append(GameNotification(id: notificationID, text: text, time: time, important: important))
        if notifications.count > 6 { notifications.removeFirst(notifications.count - 6) }
    }

    func entityExists(_ id: Int) -> Bool { units[id] != nil || buildings[id] != nil }

    func unitAge(_ u: Unit) -> Int { u.owner >= 0 ? u.stats.age : 0 }

    func effectiveAttack(_ u: Unit) -> Double {
        var a = u.stats.attack
        if let m = mods(u.owner) {
            a *= m.attackMult(u.stats.category)
            if u.auraBoost { a *= 1 + 0.2 * m.heroAura }
        }
        return a
    }

    func effectiveArmor(_ u: Unit) -> Double { u.stats.armor + (mods(u.owner)?.armorBonus(u.stats.category) ?? 0) }

    func effectiveRange(_ u: Unit) -> Double {
        var r = u.stats.range
        if u.stats.isRanged, let m = mods(u.owner) { r += m.rangeBonus(u.stats.category) }
        return r
    }

    func effectiveSpeed(_ u: Unit) -> Double {
        var s = u.stats.speed * (mods(u.owner)?.speedMult(u.stats.category) ?? 1)
        if u.stats.movement == .land {
            let t = map.terrainAt(u.pos.tile)
            if t == .sand { s *= 0.9 }
        }
        return s
    }

    func unitCost(_ kind: UnitKind, owner: Int) -> ResourceBundle {
        kind.stats.cost * players[owner].mods.unitCost
    }

    func buildingCost(_ kind: BuildingKind, owner: Int) -> ResourceBundle {
        kind.stats.cost * players[owner].mods.costMult(for: kind)
    }

    func buildingMaxHP(_ kind: BuildingKind, owner: Int) -> Double {
        let s = kind.stats
        guard owner >= 0 else { return s.hp }
        let p = players[owner]
        let ageF = s.scalesWithAge ? 1 + 0.22 * Double(p.age) : 1
        return s.hp * ageF * p.mods.buildingHP
    }

    func buildingAttack(_ b: Building) -> Double {
        let p = players[b.owner]
        var a = b.stats.attack * (1 + 0.35 * Double(p.age))
        if b.kind == .turm { a *= p.mods.towerAttack }
        return a
    }

    func buildingCanHitAir(_ b: Building) -> Bool { b.kind == .turm && players[b.owner].age >= 6 }

    func count(_ kind: BuildingKind, owner: Int, includeIncomplete: Bool = true) -> Int {
        buildings.values.filter { $0.owner == owner && $0.kind == kind && (includeIncomplete || $0.isComplete) }.count
    }

    func availableBuildings(for owner: Int) -> [BuildingKind] {
        let age = players[owner].age
        return BuildingCatalog.villagerBuildOrder.filter { k in
            let s = k.stats
            if s.minAge > age { return false }
            if let o = s.obsoleteAge, age >= o { return false }
            if k == .wunder && !settings.wonderVictory { return false }
            return true
        }
    }

    // MARK: - Erzeugen & Entfernen

    @discardableResult
    func spawnUnit(_ kind: UnitKind, owner: Int, near p: Vec2) -> Unit? {
        let stats = kind.stats
        var pos = p
        if stats.movement != .air {
            guard let t = map.nearestPassable(to: p.tile, stats.movement, maxRadius: 14) else { return nil }
            if t != p.tile {
                pos = t.center + Vec2(rng.range(-0.25, 0.25), rng.range(-0.25, 0.25))
            }
        }
        let hpMult = owner >= 0 ? players[owner].mods.hpMult(stats.category) : 1
        let u = Unit(id: newID(), kind: kind, owner: owner, pos: pos, hpMult: hpMult)
        units[u.id] = u
        return u
    }

    func createBuilding(_ kind: BuildingKind, owner: Int, origin: TilePos) -> Building? {
        let b = Building(id: newID(), kind: kind, owner: owner, origin: origin, maxHP: buildingMaxHP(kind, owner: owner))
        buildings[b.id] = b
        map.setBlock(b.tiles, id: Int32(b.id), blocks: kind.stats.blocks)
        structureVersion += 1
        // Einheiten aus dem Bauplatz schieben
        if kind.stats.blocks {
            for u in units.values where u.stats.movement != .air && b.contains(u.pos) {
                if let t = map.nearestPassable(to: u.pos.tile, u.stats.movement) { u.pos = t.center }
            }
        }
        return b
    }

    func finishBuilding(_ b: Building) {
        let wasComplete = b.isComplete
        b.progress = 1
        b.hp = max(b.hp, b.maxHP)
        if b.kind == .bauernhof && b.linkedNodeID == nil {
            let n = ResourceNode(id: newID(), kind: .food, style: .farm, origin: b.origin, size: 2, amount: 1,
                                 infinite: true, blocks: false)
            nodes[n.id] = n
            n.linkedBuildingID = b.id
            n.exploredByHuman = explored[map.index(b.origin.x, b.origin.y)]
            b.linkedNodeID = n.id
        }
        if b.kind == .wunder && settings.wonderVictory {
            b.wonderTimer = 300
            notify("🕍 Ein Weltwunder wurde vollendet! Es muss 5 Minuten bestehen.", player: -2, important: true)
        }
        if !wasComplete && b.owner >= 0 {
            players[b.owner].stats.buildingsBuilt += 1
            if b.owner == humanIndex && time > 1 {
                notify("\(BuildingCatalog.name(b.kind, age: players[b.owner].age)) fertiggestellt.", player: b.owner)
            }
        }
        structureVersion += 1
    }

    func canPlace(_ kind: BuildingKind, origin: TilePos, owner: Int, ignoreFog: Bool = false) -> Bool {
        let s = kind.stats
        var coast = false
        for dx in 0..<s.size {
            for dy in 0..<s.size {
                let x = origin.x + dx, y = origin.y + dy
                guard map.inBounds(x, y) else { return false }
                let i = map.index(x, y)
                if !map.terrain[i].isLand || map.footprint[i] != 0 { return false }
                if owner == humanIndex && !ignoreFog && !explored[i] { return false }
            }
        }
        if s.needsCoast {
            for dx in -1...s.size {
                for dy in -1...s.size where dx == -1 || dy == -1 || dx == s.size || dy == s.size {
                    if map.terrainAt(TilePos(origin.x + dx, origin.y + dy)).isWater { coast = true }
                }
            }
            if !coast { return false }
        }
        return true
    }

    // MARK: - Befehle

    /// Versucht, ein Gebäude zu platzieren. Gibt eine Fehlermeldung zurück oder nil bei Erfolg.
    @discardableResult
    func orderBuild(_ kind: BuildingKind, owner: Int, origin: TilePos, builders: [Unit]) -> String? {
        let p = players[owner]
        guard availableBuildings(for: owner).contains(kind) else { return "Noch nicht verfügbar." }
        if let maxC = kind.stats.maxCount, count(kind, owner: owner) >= maxC { return "Maximal \(maxC) erlaubt." }
        guard canPlace(kind, origin: origin, owner: owner) else {
            return kind.stats.needsCoast ? "Muss an der Küste stehen." : "Hier kann nicht gebaut werden."
        }
        let cost = buildingCost(kind, owner: owner)
        guard p.resources.covers(cost) else { return missingText(p.resources.missing(for: cost), owner: owner) }
        p.resources -= cost
        guard let b = createBuilding(kind, owner: owner, origin: origin) else { return "Fehler" }
        commandBuild(builders, buildingID: b.id)
        return nil
    }

    func missingText(_ kinds: [ResourceKind], owner: Int) -> String {
        let age = players[owner].age
        return "Nicht genug " + kinds.map { $0.name(age: age) }.joined(separator: ", ") + "."
    }

    @discardableResult
    func trainUnit(_ b: Building, _ kind: UnitKind) -> String? {
        let p = players[b.owner]
        guard b.isComplete else { return "Gebäude ist noch im Bau." }
        guard b.queue.count < 6 else { return "Warteschlange voll." }
        guard UnitCatalog.trainable(at: b.kind, age: p.age).contains(kind) else { return "Nicht verfügbar." }
        if kind.stats.category == .hero {
            let heroAlive = units.values.contains { $0.owner == b.owner && $0.stats.category == .hero }
            let heroQueued = buildings.values.contains { $0.owner == b.owner && $0.queue.contains { item in
                if case .unit(let k) = item { return k.stats.category == .hero }
                return false
            } }
            if heroAlive || heroQueued { return "Es kann nur einen Helden geben." }
        }
        let cost = unitCost(kind, owner: b.owner)
        guard p.resources.covers(cost) else { return missingText(p.resources.missing(for: cost), owner: b.owner) }
        p.resources -= cost
        b.queue.append(.unit(kind))
        b.queueCost.append(cost)
        return nil
    }

    @discardableResult
    func queueAgeUp(_ b: Building) -> String? {
        let p = players[b.owner]
        guard b.kind == .stadtzentrum, b.isComplete else { return "Nur im Stadtzentrum." }
        guard p.age < min(Ages.count - 1, settings.maxAge) else { return "Höchste Epoche erreicht." }
        guard !p.researchingAge else { return "Epochensprung läuft bereits." }
        guard p.pendingDoctrineAge == nil else { return "Wähle zuerst eine Doktrin." }
        let cost = Ages.info(p.age + 1).advanceCost
        guard p.resources.covers(cost) else { return missingText(p.resources.missing(for: cost), owner: b.owner) }
        guard b.queue.count < 6 else { return "Warteschlange voll." }
        p.resources -= cost
        p.researchingAge = true
        b.queue.append(.ageUp)
        b.queueCost.append(cost)
        return nil
    }

    static let missileCost = ResourceBundle(iron: 400, gold: 400, strategic: 800)

    @discardableResult
    func queueMissile(_ b: Building) -> String? {
        let p = players[b.owner]
        guard b.kind == .raketensilo, b.isComplete else { return "Silo nicht bereit." }
        guard b.missiles + b.queue.count < 2 else { return "Maximal 2 Raketen pro Silo." }
        let cost = GameWorld.missileCost
        guard p.resources.covers(cost) else { return missingText(p.resources.missing(for: cost), owner: b.owner) }
        p.resources -= cost
        b.queue.append(.missile)
        b.queueCost.append(cost)
        return nil
    }

    func cancelQueue(_ b: Building, index: Int) {
        guard index < b.queue.count else { return }
        let item = b.queue.remove(at: index)
        let cost = b.queueCost.remove(at: index)
        players[b.owner].resources += cost
        if item == .ageUp { players[b.owner].researchingAge = false }
        if index == 0 { b.queueProgress = 0 }
    }

    @discardableResult
    func launchNuke(_ b: Building, at target: Vec2) -> String? {
        guard b.kind == .raketensilo, b.missiles > 0 else { return "Keine Rakete bereit." }
        b.missiles -= 1
        let flight = 4.0
        strikes.append(PendingStrike(pos: target, timer: flight, radius: 6, damage: 950, owner: b.owner, isNuke: true))
        events.append(.nukeLaunch(from: b.center, to: target, delay: flight))
        notify("☢️ Atomrakete gestartet!", player: -2, important: true)
        return nil
    }

    @discardableResult
    func orbitalStrike(_ b: Building, at target: Vec2) -> String? {
        guard b.kind == .orbitaluplink, b.isComplete else { return "Uplink nicht bereit." }
        guard b.abilityCooldown <= 0 else { return "Satellit lädt noch (\(Int(b.abilityCooldown)) s)." }
        b.abilityCooldown = 90
        strikes.append(PendingStrike(pos: target, timer: 1.5, radius: 3.5, damage: 750, owner: b.owner, isNuke: false))
        notify("🛰️ Orbitalschlag angefordert!", player: b.owner, important: true)
        return nil
    }

    func chooseDoctrine(player: Int, focus: DoctrineFocus) {
        let p = players[player]
        guard let age = p.pendingDoctrineAge else { return }
        guard let perk = DoctrineCatalog.choices(forAge: age).first(where: { $0.focus == focus }) else { return }
        p.pendingDoctrineAge = nil
        applyPerk(perk, to: p)
        notify("\(focus.icon) Doktrin gewählt: \(perk.name)", player: player)
    }

    private func applyPerk(_ perk: DoctrinePerk, to p: Player) {
        p.perks.append(perk)
        perk.apply(&p.mods)
        refreshStats(of: p)
    }

    /// Passt Lebenspunkte nach Epochensprung oder Doktrin an.
    private func refreshStats(of p: Player) {
        for u in units.values where u.owner == p.index {
            let newMax = u.stats.hp * p.mods.hpMult(u.stats.category)
            if abs(newMax - u.maxHP) > 0.01 {
                u.hp *= newMax / u.maxHP
                u.maxHP = newMax
            }
        }
        for b in buildings.values where b.owner == p.index {
            let newMax = buildingMaxHP(b.kind, owner: p.index)
            if abs(newMax - b.maxHP) > 0.01 {
                b.hp *= newMax / b.maxHP
                b.maxHP = newMax
            }
        }
    }

    func advanceAge(_ p: Player) {
        p.age += 1
        p.researchingAge = false
        refreshStats(of: p)
        let info = Ages.info(p.age)
        if p.isHuman {
            notify("🏛️ Neue Epoche: \(info.name)! Das Stadtzentrum wird zur \(info.townCenterName).", player: p.index, important: true)
        } else {
            notify("\(p.name) erreicht die Epoche \(info.name).", player: -2)
        }
        p.pendingDoctrineAge = p.age
        structureVersion += 1
    }

    func autoChooseDoctrine(_ p: Player, preferred: DoctrineFocus) {
        guard p.pendingDoctrineAge != nil else { return }
        let focus: DoctrineFocus = rng.unit() < 0.65 ? preferred : DoctrineFocus.allCases[rng.int(0, 2)]
        chooseDoctrine(player: p.index, focus: focus)
    }

    func commandStop(_ us: [Unit]) {
        for u in us {
            u.order = .idle
            u.path = []
            u.resumeAttackMove = nil
            u.autoTarget = false
            u.homePos = u.pos
        }
    }

    func commandMove(_ us: [Unit], to dest: Vec2, attackMove: Bool) {
        let movers = us.filter { $0.stats.speed > 0 }
        guard !movers.isEmpty else { return }
        let slots = formationSlots(count: movers.count, around: dest)
        // Einheiten nach Abstand zum Ziel sortieren, damit Slots sinnvoll verteilt werden
        let sorted = movers.sorted { $0.pos.distanceSquared(to: dest) < $1.pos.distanceSquared(to: dest) }
        for (i, u) in sorted.enumerated() {
            let slot = slots[i]
            u.resumeAttackMove = nil
            u.autoTarget = false
            u.order = attackMove ? .attackMove(slot) : .move(slot)
            u.homePos = slot
            computePath(u, to: slot)
        }
    }

    private func formationSlots(count: Int, around c: Vec2) -> [Vec2] {
        if count == 1 { return [c] }
        var slots: [Vec2] = []
        let spacing = 0.85
        var ring = 0
        while slots.count < count {
            if ring == 0 {
                slots.append(c)
            } else {
                let n = ring * 6
                for k in 0..<n where slots.count < count {
                    let a = Double(k) / Double(n) * Double.pi * 2
                    slots.append(c + Vec2(cos(a), sin(a)) * (Double(ring) * spacing))
                }
            }
            ring += 1
        }
        return slots
    }

    func commandAttack(_ us: [Unit], targetID: Int) {
        for u in us where u.stats.attack > 0 && u.id != targetID {
            if let t = units[targetID], !canAttack(u, t) { continue }
            if let b = buildings[targetID], !canAttack(u, b) { continue }
            u.order = .attack(targetID)
            u.autoTarget = false
            u.resumeAttackMove = nil
            u.path = []
            u.repathTimer = 0
        }
    }

    func commandGather(_ us: [Unit], nodeID: Int) {
        guard let n = nodes[nodeID] else { return }
        for u in us where u.isVillager {
            if n.kind == .strategic && players[u.owner].age < ResourceKind.strategicUnlockAge {
                notify("Dieser Rohstoff kann erst ab dem Dampfzeitalter abgebaut werden.", player: u.owner)
                continue
            }
            u.order = .gather(nodeID)
            u.gatherNodeID = nodeID
            u.gatherKind = n.kind
            u.lastTargetPos = n.center
            u.path = []
            u.repathTimer = 0
        }
    }

    func commandBuild(_ us: [Unit], buildingID: Int) {
        for u in us where u.isVillager {
            u.order = .build(buildingID)
            u.path = []
            u.repathTimer = 0
        }
    }

    func setRally(_ b: Building, _ p: Vec2) { b.rallyPoint = p }

    func deleteEntity(_ id: Int) {
        if let u = units[id] { u.hp = 0 }
        if let b = buildings[id] { b.hp = 0 }
    }

    // MARK: - Abfragen

    func unit(at p: Vec2, extra: Double = 0.25, filter: (Unit) -> Bool = { _ in true }) -> Unit? {
        var best: Unit?
        var bestD = Double.infinity
        for u in units.values where u.isAlive && filter(u) {
            let d = u.pos.distance(to: p)
            if d <= u.stats.radius + extra && d < bestD { best = u; bestD = d }
        }
        return best
    }

    func building(at p: Vec2) -> Building? {
        let t = p.tile
        guard map.inBounds(t.x, t.y) else { return nil }
        let id = Int(map.footprint[map.index(t.x, t.y)])
        return buildings[id]
    }

    func node(at p: Vec2) -> ResourceNode? {
        let t = p.tile
        guard map.inBounds(t.x, t.y) else { return nil }
        let id = Int(map.footprint[map.index(t.x, t.y)])
        if let n = nodes[id] { return n }
        // Nicht-blockierende Knoten (Kadaver, Felder)
        for n in nodes.values where !n.blocks && n.linkedBuildingID == nil && n.center.distance(to: p) < 0.7 {
            return n
        }
        return nil
    }

    func isVisibleToHuman(_ p: Vec2) -> Bool {
        let t = p.tile
        guard map.inBounds(t.x, t.y) else { return false }
        return visible[map.index(t.x, t.y)]
    }

    func isExploredByHuman(_ p: Vec2) -> Bool {
        let t = p.tile
        guard map.inBounds(t.x, t.y) else { return false }
        return explored[map.index(t.x, t.y)]
    }

    // MARK: - Nebel des Krieges

    func updateFog(force: Bool = false) {
        let w = map.width, h = map.height
        for i in 0..<visible.count { visible[i] = settings.revealMap }
        func reveal(_ c: Vec2, _ r: Double) {
            let ri = Int(r.rounded(.up))
            let cx = Int(c.x), cy = Int(c.y)
            let r2 = r * r
            for y in max(0, cy - ri)...min(h - 1, cy + ri) {
                let dy = Double(y) + 0.5 - c.y
                for x in max(0, cx - ri)...min(w - 1, cx + ri) {
                    let dx = Double(x) + 0.5 - c.x
                    if dx * dx + dy * dy <= r2 { visible[y * w + x] = true }
                }
            }
        }
        let team = human.team
        for u in units.values where u.owner >= 0 && players[u.owner].team == team && u.isAlive {
            reveal(u.pos, u.stats.sight)
        }
        for b in buildings.values where b.owner >= 0 && players[b.owner].team == team {
            reveal(b.center, b.isComplete ? b.stats.sight + Double(b.size) / 2 : 2.5)
        }
        for i in 0..<visible.count where visible[i] { explored[i] = true }
        for b in buildings.values where !b.seenByHuman {
            if b.tiles.contains(where: { visible[map.index($0.x, $0.y)] }) { b.seenByHuman = true }
        }
        for n in nodes.values where !n.exploredByHuman {
            if explored[map.index(n.origin.x, n.origin.y)] { n.exploredByHuman = true }
        }
        fogVersion += 1
    }

    // MARK: - Hauptschleife

    func update(dt: Double) {
        guard result == nil else { return }
        time += dt
        updatePopulation()
        refreshCaches()
        grid.rebuild(Array(units.values))
        updateHeroAuras()

        let allBuildings = Array(buildings.values)
        for b in allBuildings where b.isAlive { updateBuilding(b, dt: dt) }
        let allUnits = Array(units.values)
        for u in allUnits where u.isAlive { updateUnit(u, dt: dt) }
        separateUnits(allUnits, dt: dt)
        updateStrikes(dt: dt)
        removeDead()
        applyPassiveIncome(dt: dt)

        for ai in ais { ai.update(dt: dt) }

        fogTimer -= dt
        if fogTimer <= 0 {
            fogTimer = 0.25
            updateFog()
        }
        victoryTimer -= dt
        if victoryTimer <= 0 {
            victoryTimer = 1
            checkVictory()
        }
    }

    func updatePopulation() {
        for i in 0..<players.count { popUsed[i] = 0; popCap[i] = 0 }
        for u in units.values where u.owner >= 0 { popUsed[u.owner] += u.stats.pop }
        for b in buildings.values where b.owner >= 0 && b.isComplete { popCap[b.owner] += b.stats.pop }
        for i in 0..<players.count {
            popCap[i] = min(popCap[i], 200 + players[i].mods.popBonus)
        }
    }

    private func refreshCaches() {
        shieldGens.removeAll(keepingCapacity: true)
        templeSpots.removeAll(keepingCapacity: true)
        for i in 0..<bahnhofCount.count { bahnhofCount[i] = 0 }
        for b in buildings.values where b.isComplete && b.owner >= 0 {
            switch b.kind {
            case .schildgenerator: shieldGens.append((b.owner, b.center))
            case .tempel: templeSpots.append((b.owner, b.center))
            case .bahnhof: bahnhofCount[b.owner] += 1
            default: break
            }
        }
    }

    private func updateHeroAuras() {
        let heroes = units.values.filter { $0.stats.category == .hero && $0.isAlive }
        for u in units.values { u.auraBoost = false }
        for hero in heroes {
            grid.forEach(near: hero.pos, radius: 6) { u in
                if u.owner == hero.owner && u.id != hero.id { u.auraBoost = true }
            }
        }
    }

    private func applyPassiveIncome(dt: Double) {
        for p in players where !p.isDefeated {
            let inc = p.mods.passiveIncome
            if !inc.isZero {
                for k in ResourceKind.allCases where inc[k] > 0 {
                    if k == .strategic && p.age < ResourceKind.strategicUnlockAge { continue }
                    p.resources[k] += inc[k] * dt
                }
            }
        }
    }

    private func checkVictory() {
        // Weltwunder
        for b in buildings.values {
            if let t = b.wonderTimer, t <= 0, b.isAlive {
                let team = players[b.owner].team
                result = team == human.team
                    ? .victory("Euer Weltwunder hat die Zeitalter überdauert.")
                    : .defeat("\(players[b.owner].name) hat mit einem Weltwunder gesiegt.")
                return
            }
        }
        for p in players where !p.isDefeated {
            let hasBuilding = buildings.values.contains { $0.owner == p.index && $0.kind != .mauer && $0.kind != .bauernhof }
            let hasVillager = units.values.contains { $0.owner == p.index && $0.isVillager }
            if !hasBuilding && !hasVillager {
                p.isDefeated = true
                notify(p.isHuman ? "Eure Zivilisation ist gefallen." : "💀 \(p.name) wurde vernichtet!", player: -2, important: true)
            }
        }
        if human.isDefeated {
            result = .defeat("Eure Zivilisation wurde vernichtet.")
            return
        }
        let enemiesAlive = players.contains { !$0.isDefeated && $0.team != human.team }
        if !enemiesAlive {
            result = .victory("Alle feindlichen Zivilisationen wurden besiegt.")
        }
    }
}
