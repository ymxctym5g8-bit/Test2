import Foundation

/// Computergegner: Wirtschaft, Bauordnung, Epochensprünge, Armee und Angriffswellen.
final class AIController {
    unowned let world: GameWorld
    let playerIndex: Int
    let difficulty: Difficulty
    let personality: DoctrineFocus
    private var thinkTimer: Double
    private var nextAttackTime: Double
    private var wave = 0
    private var lastAgeUpTime: Double = 0
    private var rebalanceTimer: Double = 20
    private var specialTimer: Double = 5
    private var attackTargetID: Int?

    init(world: GameWorld, playerIndex: Int, difficulty: Difficulty) {
        self.world = world
        self.playerIndex = playerIndex
        self.difficulty = difficulty
        self.personality = DoctrineFocus.allCases[(playerIndex + Int(world.settings.seed % 3)) % 3]
        thinkTimer = Double(playerIndex) * 0.3
        nextAttackTime = difficulty.firstAttackTime
    }

    private var player: Player { world.players[playerIndex] }

    func update(dt: Double) {
        guard !player.isDefeated else { return }
        thinkTimer -= dt
        guard thinkTimer <= 0 else { return }
        let interval = difficulty.thinkInterval
        thinkTimer = interval

        if player.pendingDoctrineAge != nil {
            world.autoChooseDoctrine(player, preferred: personality)
        }
        let myUnits = world.units.values.filter { $0.owner == playerIndex }
        let myBuildings = world.buildings.values.filter { $0.owner == playerIndex }
        let villagers = myUnits.filter { $0.isVillager }
        let army = myUnits.filter { $0.stats.isMilitary }

        manageEconomy(villagers: villagers, buildings: myBuildings)
        manageConstruction(villagers: villagers, buildings: myBuildings)
        manageAgeUp(villagers: villagers, buildings: myBuildings)
        manageMilitary(villagerCount: villagers.count, buildings: myBuildings)
        manageArmy(army: army, buildings: myBuildings)
        specialTimer -= interval
        if specialTimer <= 0 {
            specialTimer = 6
            useSpecialWeapons(buildings: myBuildings)
        }
    }

    private var townCenter: Building? {
        world.buildings.values.first { $0.owner == playerIndex && $0.kind == .stadtzentrum && $0.isComplete }
    }

    private var basePos: Vec2 {
        townCenter?.center ?? world.startPositions[min(playerIndex, world.startPositions.count - 1)].center
    }

    // MARK: Wirtschaft

    private func desiredShares() -> [ResourceKind: Double] {
        switch player.age {
        case 0: return [.food: 0.6, .wood: 0.4]
        case 1: return [.food: 0.45, .wood: 0.35, .iron: 0.1, .gold: 0.1]
        case 2: return [.food: 0.4, .wood: 0.3, .iron: 0.15, .gold: 0.15]
        case 3: return [.food: 0.35, .wood: 0.2, .iron: 0.2, .gold: 0.25]
        case 4: return [.food: 0.3, .wood: 0.2, .iron: 0.25, .gold: 0.25]
        case 5, 6: return [.food: 0.3, .wood: 0.15, .iron: 0.2, .gold: 0.2, .strategic: 0.15]
        default: return [.food: 0.25, .wood: 0.1, .iron: 0.2, .gold: 0.2, .strategic: 0.25]
        }
    }

    private func gatherKind(of u: Unit) -> ResourceKind? {
        switch u.order {
        case .gather, .returnCargo: return u.gatherKind
        default: return nil
        }
    }

    private func manageEconomy(villagers: [Unit], buildings: [Building]) {
        // Arbeiter nachbilden
        let target = min(difficulty.villagerCap, 14 + player.age * 4)
        if let tc = townCenter, villagers.count < target, tc.queue.filter({ $0 == .unit(.arbeiter) }).count < 2 {
            world.trainUnit(tc, .arbeiter)
        }
        let shares = desiredShares()
        var counts: [ResourceKind: Int] = [:]
        for v in villagers { if let k = gatherKind(of: v) { counts[k, default: 0] += 1 } }

        func neediest() -> ResourceKind {
            var best: ResourceKind = .food
            var bestDeficit = -Double.infinity
            for (k, share) in shares {
                let have = Double(counts[k] ?? 0)
                let deficit = share * Double(max(1, villagers.count)) - have
                if deficit > bestDeficit {
                    bestDeficit = deficit
                    best = k
                }
            }
            return best
        }

        for v in villagers {
            guard case .idle = v.order else { continue }
            if v.carry > 0 {
                v.order = .returnCargo
                continue
            }
            let kind = neediest()
            if assign(v, to: kind) {
                counts[kind, default: 0] += 1
            } else if kind == .food, buildFarm(with: v) {
                counts[.food, default: 0] += 1
            } else {
                // Ausweichen auf Holz
                if assign(v, to: .wood) { counts[.wood, default: 0] += 1 }
            }
        }

        // Gelegentlich umverteilen
        rebalanceTimer -= difficulty.thinkInterval
        if rebalanceTimer <= 0 {
            rebalanceTimer = 15
            let total = Double(max(1, villagers.count))
            var over: ResourceKind?
            var overBy = 0.0
            for (k, c) in counts {
                let excess = Double(c) - (shares[k] ?? 0) * total
                if excess > overBy + 1 {
                    overBy = excess
                    over = k
                }
            }
            if let o = over, let v = villagers.first(where: { gatherKind(of: $0) == o && $0.carry < 1 }) {
                let need = neediest()
                if need != o { _ = assign(v, to: need) }
            }
        }
    }

    private func assign(_ v: Unit, to kind: ResourceKind) -> Bool {
        if let n = world.findNode(kind: kind, near: basePos, owner: playerIndex, radius: 34, except: v.id) {
            world.commandGather([v], nodeID: n.id)
            return true
        }
        return false
    }

    private func buildFarm(with v: Unit) -> Bool {
        guard player.age >= 1 else { return false }
        let cost = world.buildingCost(.bauernhof, owner: playerIndex)
        guard player.resources.covers(cost) else { return false }
        guard let spot = findSpot(for: .bauernhof, near: basePos, minDist: 3, maxDist: 10) else { return false }
        return world.orderBuild(.bauernhof, owner: playerIndex, origin: spot, builders: [v]) == nil
    }

    // MARK: Bauen

    private func plan() -> [(BuildingKind, Int)] {
        let a = player.age
        var p: [(BuildingKind, Int)] = [(.kaserne, 1), (.lager, 1)]
        if a >= 1 { p += [(.stall, 1), (.lager, 2), (.tempel, 1), (.turm, 1)] }
        if a >= 2 { p += [(.werkstatt, 1), (.kaserne, 2)] }
        if a >= 3 { p += [(.turm, 2), (.stall, 2)] }
        if a >= 4 { p += [(.stadtzentrum, 2)] }
        if a >= 5 { p += [(.bahnhof, 1), (.werkstatt, 2)] }
        if a >= 6 { p += [(.fabrik, 1), (.flugplatz, 1)] }
        if a >= 7 { p += [(.radar, 1), (.fabrik, 2)] }
        if a >= 7 && difficulty != .easy { p += [(.raketensilo, 1)] }
        if a >= 8 { p += [(.flugplatz, 2), (.bahnhof, 2)] }
        if a >= 10 { p += [(.schildgenerator, 1), (.orbitaluplink, 1)] }
        return p
    }

    private func manageConstruction(villagers: [Unit], buildings: [Building]) {
        guard !villagers.isEmpty else { return }
        let underConstruction = buildings.filter { !$0.isComplete }
        if underConstruction.count >= 2 { return }

        // Stadtzentrum wieder aufbauen
        if townCenter == nil && !buildings.contains(where: { $0.kind == .stadtzentrum }) {
            tryBuild(.stadtzentrum, near: basePos, villagers: villagers, builders: 4)
            return
        }
        // Häuser
        let used = world.popUsed[playerIndex], cap = world.popCap[playerIndex]
        let houseBuilding = underConstruction.contains { $0.kind == .haus }
        if cap - used < 6 + player.age && cap < 200 + player.mods.popBonus && !houseBuilding {
            if tryBuild(.haus, near: basePos, villagers: villagers, builders: 1) { return }
        }
        for (kind, count) in plan() {
            guard world.availableBuildings(for: playerIndex).contains(kind) else { continue }
            let have = buildings.filter { $0.kind == kind }.count
            if have < count {
                let anchor = kind == .lager ? lagerSpot() : basePos
                if tryBuild(kind, near: anchor, villagers: villagers, builders: kind == .stadtzentrum ? 3 : 2) { return }
                // Wenn das Wichtigste nicht bezahlbar ist, sparen
                return
            }
        }
    }

    private func lagerSpot() -> Vec2 {
        let existing = world.buildings.values.filter { $0.owner == playerIndex && $0.stats.dropSite }
        var best: Vec2 = basePos
        var bestD = Double.infinity
        for n in world.nodes.values where (n.style == .tree || n.style == .ironMine || n.style == .goldMine) {
            let dBase = n.center.distance(to: basePos)
            guard dBase > 7 && dBase < 26 else { continue }
            if existing.contains(where: { $0.center.distance(to: n.center) < 7 }) { continue }
            if dBase < bestD {
                bestD = dBase
                best = n.center
            }
        }
        return best
    }

    @discardableResult
    private func tryBuild(_ kind: BuildingKind, near anchor: Vec2, villagers: [Unit], builders: Int) -> Bool {
        let cost = world.buildingCost(kind, owner: playerIndex)
        guard player.resources.covers(cost) else { return false }
        let minD: Double = kind == .lager ? 1 : (kind == .turm ? 6 : 4)
        let maxD: Double = kind == .turm ? 12 : 16
        guard let spot = findSpot(for: kind, near: anchor, minDist: minD, maxDist: maxD) else { return false }
        let chosen = villagers
            .filter { if case .build = $0.order { return false }; return true }
            .sorted { $0.pos.distanceSquared(to: spot.center) < $1.pos.distanceSquared(to: spot.center) }
            .prefix(builders)
        guard !chosen.isEmpty else { return false }
        return world.orderBuild(kind, owner: playerIndex, origin: spot, builders: Array(chosen)) == nil
    }

    private func findSpot(for kind: BuildingKind, near c: Vec2, minDist: Double, maxDist: Double) -> TilePos? {
        let size = kind.stats.size
        for attempt in 0..<70 {
            let a = world.rng.range(0, Double.pi * 2)
            let d = minDist + (maxDist - minDist) * Double(attempt) / 70.0 + world.rng.range(0, 2)
            let t = TilePos(Int(c.x + cos(a) * d) - size / 2, Int(c.y + sin(a) * d) - size / 2)
            guard world.canPlace(kind, origin: t, owner: playerIndex) else { continue }
            // Freiraum lassen, damit Wege nicht verbaut werden
            if kind != .mauer && kind != .bauernhof && !hasMargin(origin: t, size: size) { continue }
            return t
        }
        return nil
    }

    private func hasMargin(origin: TilePos, size: Int) -> Bool {
        let m = world.map
        for dx in -1...size {
            for dy in -1...size where dx == -1 || dy == -1 || dx == size || dy == size {
                let x = origin.x + dx, y = origin.y + dy
                guard m.inBounds(x, y) else { return false }
                if m.blocker[m.index(x, y)] != 0 && world.buildings[Int(m.blocker[m.index(x, y)])] != nil { return false }
            }
        }
        return true
    }

    // MARK: Epochen

    private func manageAgeUp(villagers: [Unit], buildings: [Building]) {
        guard !player.researchingAge, player.pendingDoctrineAge == nil else { return }
        guard player.age < min(Ages.count - 1, world.settings.maxAge) else { return }
        guard world.time - lastAgeUpTime >= difficulty.minAgeInterval || player.age == 0 && world.time > difficulty.minAgeInterval * 0.6 else { return }
        guard villagers.count >= min(difficulty.villagerCap - 2, 10 + player.age * 3) else { return }
        guard let tc = townCenter else { return }
        if world.queueAgeUp(tc) == nil {
            lastAgeUpTime = world.time
        }
    }

    // MARK: Militär

    private func manageMilitary(villagerCount: Int, buildings: [Building]) {
        let target = min(difficulty.villagerCap, 14 + player.age * 4)
        let economyReady = villagerCount >= target * 2 / 3 || world.time > 900
        // Ressourcen für den nächsten Epochensprung zurückhalten
        var reserve = ResourceBundle()
        if !player.researchingAge && player.age < world.settings.maxAge && player.age < Ages.count - 1 {
            reserve = Ages.info(player.age + 1).advanceCost * 0.6
        }
        // Held
        if let tc = townCenter, tc.queue.isEmpty,
           let hero = UnitCatalog.trainable(at: .stadtzentrum, age: player.age).first(where: { $0.stats.category == .hero }) {
            let cost = world.unitCost(hero, owner: playerIndex)
            if player.resources.covers(cost + reserve) { world.trainUnit(tc, hero) }
        }
        guard economyReady || world.time > nextAttackTime - 120 else { return }
        for b in buildings where b.isComplete && b.queue.count < 2 {
            guard [.kaserne, .stall, .werkstatt, .fabrik, .flugplatz, .tempel].contains(b.kind) else { continue }
            var options = UnitCatalog.trainable(at: b.kind, age: player.age)
            if b.kind == .tempel {
                let healers = world.units.values.filter { $0.owner == playerIndex && $0.stats.heal > 0 }.count
                if healers >= 3 { continue }
            } else {
                options = options.filter { $0.stats.category != .support }
            }
            guard !options.isEmpty else { continue }
            let kind = options[world.rng.int(0, options.count - 1)]
            let cost = world.unitCost(kind, owner: playerIndex)
            if player.resources.covers(cost + reserve) { world.trainUnit(b, kind) }
        }
        if let silo = buildings.first(where: { $0.kind == .raketensilo && $0.isComplete }), silo.queue.isEmpty, silo.missiles == 0 {
            if player.resources.covers(GameWorld.missileCost + reserve) { world.queueMissile(silo) }
        }
    }

    private func manageArmy(army: [Unit], buildings: [Building]) {
        guard !army.isEmpty else { return }
        // Verteidigung
        var threat: Unit?
        for b in buildings {
            world.grid.forEach(near: b.center, radius: 12) { u in
                if threat == nil && self.world.isEnemy(self.playerIndex, u.owner) { threat = u }
            }
            if threat != nil { break }
        }
        if let t = threat {
            let defenders = army.filter { u in
                switch u.order {
                case .idle, .move: return u.pos.distance(to: t.pos) < 40
                default: return false
                }
            }
            if !defenders.isEmpty { world.commandMove(defenders, to: t.pos, attackMove: true) }
            return
        }
        // Angriff
        let threshold = min(45, 6 + wave * 4 + (difficulty == .easy ? 0 : player.age))
        let idle = army.filter { if case .idle = $0.order { return true }; return false }
        if world.time >= nextAttackTime && army.count >= threshold {
            if let target = pickAttackTarget() {
                wave += 1
                attackTargetID = target.id
                nextAttackTime = world.time + max(90, 210 - Double(difficulty.rawValue) * 35)
                world.commandMove(army.filter { $0.stats.category != .support }, to: target.center, attackMove: true)
                let healers = world.units.values.filter { $0.owner == playerIndex && $0.stats.heal > 0 }
                world.commandMove(Array(healers), to: target.center, attackMove: false)
            }
        } else if let tid = attackTargetID, let target = world.buildings[tid], world.time < nextAttackTime - 30 {
            // Laufenden Angriff mit nachrückenden Einheiten fortsetzen
            let reinforcements = idle.filter { $0.pos.distance(to: basePos) < 20 }
            if reinforcements.count >= 4 { world.commandMove(reinforcements, to: target.center, attackMove: true) }
        } else if !idle.isEmpty {
            // Untätige Truppen an der Basis sammeln
            let rally = basePos + (pickAttackTarget().map { ($0.center - basePos).normalized * 7 } ?? Vec2(4, 4))
            let far = idle.filter { $0.pos.distance(to: rally) > 8 }
            if !far.isEmpty { world.commandMove(far, to: rally, attackMove: true) }
        }
    }

    private func pickAttackTarget() -> Building? {
        var best: Building?
        var bestD = Double.infinity
        for b in world.buildings.values where world.isEnemy(playerIndex, b.owner) && b.kind != .mauer {
            var d = b.center.distance(to: basePos)
            if b.kind == .wunder { d *= 0.3 }
            if d < bestD {
                bestD = d
                best = b
            }
        }
        return best
    }

    private func useSpecialWeapons(buildings: [Building]) {
        for b in buildings where b.isComplete {
            if b.kind == .raketensilo && b.missiles > 0 {
                let targets = world.buildings.values.filter { world.isEnemy(playerIndex, $0.owner) && ($0.kind == .stadtzentrum || $0.kind == .wunder) }
                if let t = targets.randomElement() { world.launchNuke(b, at: t.center) }
            }
            if b.kind == .orbitaluplink && b.abilityCooldown <= 0 {
                // Größte feindliche Ansammlung suchen
                var bestPos: Vec2?
                var bestCount = 4
                for u in world.units.values where world.isEnemy(playerIndex, u.owner) {
                    var c = 0
                    world.grid.forEach(near: u.pos, radius: 3.5) { o in if o.owner == u.owner { c += 1 } }
                    if c > bestCount {
                        bestCount = c
                        bestPos = u.pos
                    }
                }
                if let p = bestPos { world.orbitalStrike(b, at: p) }
            }
        }
    }
}
