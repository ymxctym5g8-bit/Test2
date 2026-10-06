import Foundation

extension GameWorld {

    // MARK: - Gebäude

    func updateBuilding(_ b: Building, dt: Double) {
        if !b.isComplete {
            if b.builderCount > 0 && b.owner >= 0 {
                let p = players[b.owner]
                let rate = dt / b.stats.buildTime * p.mods.buildSpeed * pow(Double(b.builderCount), 0.75)
                let before = b.progress
                b.progress = min(1, b.progress + rate)
                b.hp = min(b.maxHP, b.hp + b.maxHP * 0.9 * (b.progress - before))
                if b.progress >= 1 { finishBuilding(b) }
            }
            b.builderCount = 0
            return
        }
        b.builderCount = 0
        if b.abilityCooldown > 0 { b.abilityCooldown -= dt }
        if let t = b.wonderTimer, b.owner >= 0 {
            b.wonderTimer = t - dt * players[b.owner].mods.wonderSpeed
        }
        processQueue(b, dt: dt)
        if b.stats.attack > 0 { buildingCombat(b, dt: dt) }
    }

    private func processQueue(_ b: Building, dt: Double) {
        guard let item = b.queue.first else {
            b.queueProgress = 0
            return
        }
        let p = players[b.owner]
        let duration: Double
        switch item {
        case .unit(let k): duration = k.stats.trainTime / p.mods.trainSpeedMult(k.stats.category)
        case .ageUp: duration = Ages.info(p.age + 1).researchTime
        case .missile: duration = 60
        }
        if b.queueProgress < 1 { b.queueProgress = min(1, b.queueProgress + dt / max(1, duration)) }
        guard b.queueProgress >= 1 else { return }
        switch item {
        case .unit(let k):
            if popUsed[b.owner] + k.stats.pop > popCap[b.owner] {
                if b.owner == humanIndex { notify("Bevölkerungslimit erreicht – baue mehr Häuser.", player: b.owner) }
                return
            }
            guard let u = spawnFromBuilding(b, kind: k) else { return }
            popUsed[b.owner] += k.stats.pop
            p.stats.unitsTrained += 1
            sendToRally(u, from: b)
        case .ageUp:
            advanceAge(p)
        case .missile:
            b.missiles += 1
            notify("☢️ Atomrakete einsatzbereit.", player: b.owner, important: true)
        }
        b.queue.removeFirst()
        b.queueCost.removeFirst()
        b.queueProgress = 0
    }

    private func spawnFromBuilding(_ b: Building, kind: UnitKind) -> Unit? {
        let mode = kind.stats.movement
        let target = b.rallyPoint ?? (b.center + Vec2(0, -Double(b.size)))
        let s = b.size
        var best: TilePos?
        var bestD = Double.infinity
        for r in 0..<5 {
            for dx in (-1 - r)...(s + r) {
                for dy in (-1 - r)...(s + r) where dx == -1 - r || dy == -1 - r || dx == s + r || dy == s + r {
                    let t = TilePos(b.origin.x + dx, b.origin.y + dy)
                    if mode == .air || map.passable(t, mode) {
                        let d = t.center.distanceSquared(to: target)
                        if d < bestD { bestD = d; best = t }
                    }
                }
            }
            if best != nil { break }
        }
        guard let t = best else {
            notify("Kein Platz zum Ausbilden von \(kind.stats.name).", player: b.owner)
            return nil
        }
        return spawnUnit(kind, owner: b.owner, near: t.center)
    }

    private func sendToRally(_ u: Unit, from b: Building) {
        guard let r = b.rallyPoint else { return }
        if u.isVillager {
            if let n = node(at: r), !n.isDepleted {
                commandGather([u], nodeID: n.id)
                return
            }
            if let tb = building(at: r), tb.owner == u.owner, !tb.isComplete {
                commandBuild([u], buildingID: tb.id)
                return
            }
        }
        commandMove([u], to: r, attackMove: u.stats.isMilitary)
    }

    private func buildingCombat(_ b: Building, dt: Double) {
        b.cooldown -= dt
        guard b.cooldown <= 0, b.owner >= 0 else { return }
        let hitsAir = buildingCanHitAir(b)
        var target: Unit?
        var bestD = Double.infinity
        grid.forEach(near: b.center, radius: b.stats.range + Double(b.size) / 2 + 1) { u in
            guard self.isEnemy(b.owner, u.owner) else { return }
            if u.isAir && !hitsAir { return }
            let d = b.edgeDistance(to: u.pos)
            if d <= b.stats.range && d < bestD {
                bestD = d
                target = u
            }
        }
        guard let t = target else { return }
        b.cooldown = b.stats.cooldown
        let age = players[b.owner].age
        let style: ProjectileStyle = age < 4 ? .arrow : (age >= 9 ? .laser : .bullet)
        events.append(.projectile(from: b.center, to: t.pos, style: style, air: t.isAir))
        var dmg = buildingAttack(b) * (t.isAir ? 1.5 : 1)
        dmg = max(dmg * 0.2, dmg - effectiveArmor(t))
        applyDamage(to: t, amount: dmg, attackerOwner: b.owner, attackerID: b.id)
    }

    // MARK: - Einheiten

    func updateUnit(_ u: Unit, dt: Double) {
        u.cooldown -= dt
        u.isMoving = false
        if u.attackFlash > 0 { u.attackFlash -= dt }
        if u.owner >= 0 && u.hp < u.maxHP && time - u.lastDamagedAt > 2 {
            var regen = players[u.owner].mods.regen
            if templeSpots.contains(where: { $0.owner == u.owner && $0.pos.distanceSquared(to: u.pos) < 49 }) { regen += 2 }
            if regen > 0 { u.hp = min(u.maxHP, u.hp + regen * dt) }
        }

        switch u.order {
        case .idle:
            updateIdle(u, dt: dt)
        case .move:
            if followPath(u, dt) { arrive(u) }
        case .attackMove(let dest):
            if u.stats.attack > 0, scanReady(u, dt), let t = findTarget(u, radius: u.stats.sight) {
                u.resumeAttackMove = dest
                u.order = .attack(t)
                u.autoTarget = true
                u.path = []
                u.repathTimer = 0
                return
            }
            if followPath(u, dt) { arrive(u) }
        case .attack(let tid):
            updateAttack(u, targetID: tid, dt: dt)
        case .gather(let nid):
            updateGather(u, nodeID: nid, dt: dt)
        case .returnCargo:
            updateReturn(u, dt: dt)
        case .build(let bid):
            updateBuild(u, buildingID: bid, dt: dt)
        }

        // Feststecken erkennen
        if u.isMoving {
            u.stuckTimer += dt
            if u.stuckTimer > 1.5 {
                if u.pos.distance(to: u.lastPos) < 0.3 { handleStuck(u) }
                u.stuckTimer = 0
                u.lastPos = u.pos
            }
        } else {
            u.stuckTimer = 0
            u.lastPos = u.pos
        }
    }

    private func handleStuck(_ u: Unit) {
        switch u.order {
        case .move(let d), .attackMove(let d):
            if u.pos.distance(to: d) < 2.2 { arrive(u) } else { computePath(u, to: d) }
        default:
            u.path = []
            u.repathTimer = 0
        }
    }

    private func arrive(_ u: Unit) {
        u.order = .idle
        u.path = []
        u.scanTimer = 0
        u.resumeAttackMove = nil
        if !u.isAnimal { u.homePos = u.pos }
    }

    private func scanReady(_ u: Unit, _ dt: Double) -> Bool {
        u.scanTimer -= dt
        if u.scanTimer <= 0 {
            u.scanTimer = 0.5
            return true
        }
        return false
    }

    private func updateIdle(_ u: Unit, dt: Double) {
        if u.isAnimal {
            updateAnimal(u, dt: dt)
            return
        }
        if u.stats.heal > 0 {
            updateHealer(u, dt: dt)
            return
        }
        guard u.stats.attack > 0, !u.isVillager else { return }
        if scanReady(u, dt), let t = findTarget(u, radius: u.stats.sight) {
            u.order = .attack(t)
            u.autoTarget = true
            u.repathTimer = 0
        }
    }

    private func updateAnimal(_ u: Unit, dt: Double) {
        u.wanderTimer -= dt
        guard u.wanderTimer <= 0 else { return }
        u.wanderTimer = rng.range(4, 10)
        let dest = u.homePos + Vec2(rng.range(-3, 3), rng.range(-3, 3))
        u.order = .move(dest)
        computePath(u, to: dest)
    }

    private func updateHealer(_ u: Unit, dt: Double) {
        var target: Unit? = u.healTargetID.flatMap { units[$0] }
        if let t = target, !t.isAlive || t.hp >= t.maxHP || t.pos.distance(to: u.pos) > u.stats.sight + 3 {
            target = nil
        }
        if target == nil, scanReady(u, dt) {
            var bestD = Double.infinity
            grid.forEach(near: u.pos, radius: u.stats.sight) { o in
                guard o.owner == u.owner, o.id != u.id, o.hp < o.maxHP else { return }
                let d = o.pos.distance(to: u.pos)
                if d < bestD {
                    bestD = d
                    target = o
                }
            }
        }
        u.healTargetID = target?.id
        guard let t = target else { return }
        if u.pos.distance(to: t.pos) <= u.stats.range {
            u.path = []
            let power = mods(u.owner)?.healPower ?? 1
            t.hp = min(t.maxHP, t.hp + u.stats.heal * power * dt)
            u.attackFlash = 0.1
            if Int(time * 1.5) != Int((time - dt) * 1.5) { events.append(.heal(at: t.pos)) }
        } else {
            u.repathTimer -= dt
            if u.path.isEmpty || u.repathTimer <= 0 {
                u.repathTimer = 1
                computePath(u, to: t.pos, stopWithin: 2)
            }
            followPath(u, dt)
        }
    }

    // MARK: - Kampf

    func canAttack(_ u: Unit, _ o: Unit) -> Bool {
        if u.stats.attack <= 0 || u.stats.buildingOnly { return false }
        if o.isAir { return u.stats.canHitAir }
        if u.stats.airOnly { return false }
        if o.stats.movement == .naval && u.stats.movement == .land && !u.stats.isRanged { return false }
        return true
    }

    func canAttack(_ u: Unit, _ b: Building) -> Bool {
        u.stats.attack > 0 && !u.stats.airOnly && u.stats.category != .support && u.stats.category != .animal
    }

    func findTarget(_ u: Unit, radius: Double) -> Int? {
        var best: Unit?
        var bestScore = Double.infinity
        grid.forEach(near: u.pos, radius: radius + 0.5) { o in
            guard self.isEnemy(u.owner, o.owner), self.canAttack(u, o) else { return }
            var score = o.pos.distance(to: u.pos)
            if o.stats.attack <= 0 { score += 3 }
            if score < bestScore {
                bestScore = score
                best = o
            }
        }
        if let b = best { return b.id }
        if u.stats.airOnly { return nil }
        var bb: Building?
        var bd = Double.infinity
        for b in buildings.values where isEnemy(u.owner, b.owner) {
            let d = b.edgeDistance(to: u.pos)
            if d <= radius && d < bd {
                bd = d
                bb = b
            }
        }
        return bb?.id
    }

    private func updateAttack(_ u: Unit, targetID tid: Int, dt: Double) {
        var targetPos: Vec2
        var dist: Double
        var targetUnit: Unit?
        var targetBuilding: Building?
        if let t = units[tid], t.isAlive {
            targetUnit = t
            targetPos = t.pos
            dist = u.pos.distance(to: t.pos) - t.stats.radius - u.stats.radius
        } else if let b = buildings[tid], b.isAlive {
            targetBuilding = b
            targetPos = b.center
            dist = b.edgeDistance(to: u.pos) - u.stats.radius
        } else {
            targetLost(u)
            return
        }
        u.lastTargetPos = targetPos
        if u.autoTarget {
            let leash = u.stats.sight * 1.6 + 2
            if u.resumeAttackMove == nil && u.pos.distance(to: u.homePos) > leash {
                u.autoTarget = false
                u.order = .move(u.homePos)
                computePath(u, to: u.homePos)
                return
            }
            if dist > u.stats.sight + 2 {
                targetLost(u)
                return
            }
        }
        let range = max(0.25, effectiveRange(u))
        if dist <= range {
            u.path = []
            u.facing = atan2(targetPos.y - u.pos.y, targetPos.x - u.pos.x)
            if u.cooldown <= 0 {
                u.cooldown = u.stats.cooldown
                u.attackFlash = 0.18
                if let t = targetUnit { attackUnit(u, t) } else if let b = targetBuilding { attackBuilding(u, b) }
            }
            return
        }
        u.repathTimer -= dt
        if u.path.isEmpty || u.pathIndex >= u.path.count || u.repathTimer <= 0 {
            u.repathTimer = 0.9 + Double(u.id % 5) * 0.1
            if let b = targetBuilding {
                computePath(u, toFootprint: b.origin, size: b.size, inside: false,
                            extraRange: Int(max(0, (range - 0.3) / 1.42)))
            } else {
                computePath(u, to: targetPos, stopWithin: max(0, range - 0.4))
            }
        }
        if followPath(u, dt) { u.repathTimer = min(u.repathTimer, 0.3) }
    }

    private func targetLost(_ u: Unit) {
        if u.isVillager, let lp = u.lastTargetPos,
           let carcass = nodes.values.first(where: { $0.style == .carcass && $0.center.distance(to: lp) < 2.0 }) {
            commandGather([u], nodeID: carcass.id)
            return
        }
        u.autoTarget = false
        if let r = u.resumeAttackMove {
            u.resumeAttackMove = nil
            u.order = .attackMove(r)
            computePath(u, to: r)
            return
        }
        u.order = .idle
        u.path = []
        if !u.isAnimal { u.homePos = u.pos }
        u.scanTimer = 0
    }

    func projectileStyle(_ u: Unit) -> ProjectileStyle {
        let age = u.stats.age
        switch u.stats.category {
        case .siege, .naval: return age >= 11 ? .plasma : (age >= 8 ? .rocket : .shell)
        case .air: return age >= 9 ? .laser : (u.stats.splash > 0 ? .shell : .bullet)
        case .armor: return age >= 10 ? .plasma : .shell
        case .hero: return age >= 9 ? .laser : .bullet
        default:
            if u.kind == .panzerabwehrtrupp { return .rocket }
            return age < 4 ? .arrow : (age >= 9 ? .laser : .bullet)
        }
    }

    func computeDamage(_ u: Unit, target: TargetClass, armor: Double, targetAge: Int, special: Bool) -> Double {
        var raw = effectiveAttack(u) * CombatRules.multiplier(u.stats.category, target) * (u.stats.bonus[target] ?? 1)
        if let m = mods(u.owner) {
            if targetAge > u.stats.age { raw *= 1 + m.higherAgeBonus }
            if special { raw *= 1 + m.bonusVsArmorAir }
        }
        return max(raw * 0.18, raw - armor)
    }

    private func attackUnit(_ u: Unit, _ t: Unit) {
        if u.stats.isRanged {
            events.append(.projectile(from: u.pos, to: t.pos, style: projectileStyle(u), air: t.isAir || u.isAir))
        }
        let special = t.isAir || t.stats.category == .armor
        let dmg = computeDamage(u, target: .unit(t.stats.category), armor: effectiveArmor(t), targetAge: unitAge(t), special: special)
        applyDamage(to: t, amount: dmg, attackerOwner: u.owner, attackerID: u.id)
        if u.stats.splash > 0 && !t.isAir { splash(u, at: t.pos, exclude: t.id) }
    }

    private func attackBuilding(_ u: Unit, _ b: Building) {
        if u.stats.isRanged {
            events.append(.projectile(from: u.pos, to: b.center, style: projectileStyle(u), air: u.isAir))
        }
        let age = b.owner >= 0 ? players[b.owner].age : 0
        let armor = b.stats.armor * (1 + 0.1 * Double(age))
        let dmg = computeDamage(u, target: .building, armor: armor, targetAge: age, special: false)
        applyDamage(to: b, amount: dmg, attackerOwner: u.owner, attackerID: u.id)
        if u.stats.splash > 0 { splash(u, at: b.center, exclude: b.id) }
    }

    private func splash(_ u: Unit, at p: Vec2, exclude: Int) {
        let r = u.stats.splash
        events.append(.explosion(at: p, radius: r))
        var victims: [Unit] = []
        grid.forEach(near: p, radius: r + 0.5) { o in
            if o.id != exclude && !o.isAir && self.isEnemy(u.owner, o.owner) { victims.append(o) }
        }
        for o in victims {
            let d = computeDamage(u, target: .unit(o.stats.category), armor: effectiveArmor(o), targetAge: unitAge(o),
                                  special: o.stats.category == .armor) * 0.6
            applyDamage(to: o, amount: d, attackerOwner: u.owner, attackerID: u.id)
        }
        for b in buildings.values where b.id != exclude && isEnemy(u.owner, b.owner) && b.edgeDistance(to: p) < r {
            let d = computeDamage(u, target: .building, armor: b.stats.armor, targetAge: 0, special: false) * 0.5
            applyDamage(to: b, amount: d, attackerOwner: u.owner, attackerID: u.id)
        }
    }

    func isShielded(owner: Int, at p: Vec2) -> Bool {
        shieldGens.contains { $0.owner == owner && $0.pos.distanceSquared(to: p) <= 49 }
    }

    private func raiseAlert(at p: Vec2) {
        alertPos = p
        if time - alertTime > 20 {
            alertTime = time
            notify("⚠️ Wir werden angegriffen!", player: humanIndex, important: true)
        }
    }

    func applyDamage(to t: Unit, amount: Double, attackerOwner: Int, attackerID: Int) {
        guard t.isAlive else { return }
        var a = amount
        if let m = mods(t.owner) { a *= m.damageTaken }
        if t.owner >= 0 && isShielded(owner: t.owner, at: t.pos) { a *= 0.5 }
        t.hp -= a
        t.lastDamagedAt = time
        if t.hp <= 0 {
            t.hp = 0
            if attackerOwner >= 0 && t.owner >= 0 {
                players[attackerOwner].stats.unitsKilled += 1
                players[t.owner].stats.unitsLost += 1
            }
            return
        }
        if t.owner == humanIndex && attackerOwner >= 0 && attackerOwner != humanIndex { raiseAlert(at: t.pos) }
        guard let attacker = units[attackerID], attacker.isAlive else { return }
        if t.isAnimal {
            if t.kind == .mammut {
                if case .attack = t.order {} else {
                    t.order = .attack(attackerID)
                    t.autoTarget = true
                    t.repathTimer = 0
                }
            } else {
                let away = (t.pos - attacker.pos).normalized
                let dest = t.pos + away * 3
                t.order = .move(dest)
                computePath(t, to: dest)
            }
            return
        }
        if case .idle = t.order, !t.isVillager, t.stats.attack > 0, canAttack(t, attacker), isEnemy(t.owner, attacker.owner) {
            t.order = .attack(attackerID)
            t.autoTarget = true
            t.repathTimer = 0
        }
    }

    func applyDamage(to b: Building, amount: Double, attackerOwner: Int, attackerID: Int) {
        guard b.isAlive else { return }
        var a = amount
        if b.owner >= 0 { a *= players[b.owner].mods.damageTaken }
        if b.owner >= 0 && isShielded(owner: b.owner, at: b.center) { a *= 0.5 }
        b.hp -= a
        b.lastDamagedAt = time
        if b.hp <= 0 {
            b.hp = 0
            if attackerOwner >= 0 && attackerOwner != b.owner { players[attackerOwner].stats.buildingsDestroyed += 1 }
        } else if b.owner == humanIndex && attackerOwner >= 0 && attackerOwner != humanIndex {
            raiseAlert(at: b.center)
        }
    }

    // MARK: - Wirtschaft

    func farmOccupied(_ nodeID: Int, except uid: Int) -> Bool {
        units.values.contains { v in
            guard v.id != uid, v.isVillager else { return false }
            if case .gather(let n) = v.order, n == nodeID { return true }
            if case .returnCargo = v.order, v.gatherNodeID == nodeID { return true }
            return false
        }
    }

    /// Ein Rohstoff ist erreichbar, wenn mindestens eine Nachbarkachel begehbar ist
    /// (Bäume tief im Wald werden so übersprungen).
    func nodeAccessible(_ n: ResourceNode) -> Bool {
        if !n.blocks { return true }
        for dx in -1...n.size {
            for dy in -1...n.size where dx == -1 || dy == -1 || dx == n.size || dy == n.size {
                if map.passable(n.origin.x + dx, n.origin.y + dy, .land) { return true }
            }
        }
        return false
    }

    func findNode(kind: ResourceKind?, near p: Vec2, owner: Int, radius: Double, except uid: Int = -1) -> ResourceNode? {
        guard let kind = kind else { return nil }
        if kind == .strategic && players[owner].age < ResourceKind.strategicUnlockAge { return nil }
        var best: ResourceNode?
        var bestD = radius
        for n in nodes.values where n.kind == kind && !n.isDepleted {
            if owner == humanIndex && !n.exploredByHuman { continue }
            if n.blocks && !nodeAccessible(n) { continue }
            if n.style == .farm {
                guard let bid = n.linkedBuildingID, let b = buildings[bid], b.owner == owner, b.isComplete else { continue }
                if farmOccupied(n.id, except: uid) { continue }
            }
            let d = n.center.distance(to: p)
            if d < bestD {
                bestD = d
                best = n
            }
        }
        return best
    }

    func nearestDropSite(owner: Int, to p: Vec2) -> Building? {
        var best: Building?
        var bestD = Double.infinity
        for b in buildings.values where b.owner == owner && b.isComplete && b.stats.dropSite {
            let d = b.edgeDistance(to: p)
            if d < bestD {
                bestD = d
                best = b
            }
        }
        return best
    }

    private func updateGather(_ u: Unit, nodeID nid: Int, dt: Double) {
        guard let n = nodes[nid], !n.isDepleted else {
            if let next = findNode(kind: u.gatherKind, near: u.lastTargetPos ?? u.pos, owner: u.owner, radius: 10, except: u.id) {
                commandGather([u], nodeID: next.id)
            } else if u.carry > 0 {
                u.order = .returnCargo
                u.path = []
            } else {
                u.order = .idle
                u.homePos = u.pos
            }
            return
        }
        if u.carryKind != n.kind {
            u.carry = 0
            u.carryKind = n.kind
        }
        let capacity = 10 + (mods(u.owner)?.carryBonus ?? 0)
        if u.carry >= capacity {
            u.order = .returnCargo
            u.path = []
            return
        }
        let dist = n.edgeDistance(to: u.pos) - u.stats.radius
        let reach = n.blocks ? 0.5 : 0.15
        if dist <= reach {
            u.path = []
            u.facing = atan2(n.center.y - u.pos.y, n.center.x - u.pos.x)
            u.attackFlash = 0.1
            let p = players[u.owner]
            var rate = n.kind.baseGatherRate * p.mods.gatherMult(n.kind) * p.handicap
            rate *= 1 + 0.1 * Double(bahnhofCount[u.owner])
            if n.style == .farm { rate *= 0.85 }
            var amt = rate * dt
            if !n.infinite {
                amt = min(amt, n.amount)
                n.amount -= amt
            }
            u.carry += amt
            if u.carry >= capacity {
                u.order = .returnCargo
                u.path = []
            }
        } else {
            u.repathTimer -= dt
            if u.path.isEmpty || u.pathIndex >= u.path.count || u.repathTimer <= 0 {
                u.repathTimer = 3
                computePath(u, toFootprint: n.origin, size: n.size, inside: !n.blocks)
            }
            if followPath(u, dt) {
                if dist > reach + 0.8 && !nodeAccessible(n),
                   let alt = findNode(kind: n.kind, near: n.center, owner: u.owner, radius: 8, except: u.id) {
                    commandGather([u], nodeID: alt.id)
                } else {
                    u.repathTimer = min(u.repathTimer, 0.4)
                }
            }
        }
    }

    private func updateReturn(_ u: Unit, dt: Double) {
        guard u.carry > 0, let kind = u.carryKind else {
            resumeGather(u)
            return
        }
        guard let drop = nearestDropSite(owner: u.owner, to: u.pos) else {
            u.order = .idle
            return
        }
        let dist = drop.edgeDistance(to: u.pos) - u.stats.radius
        if dist <= 0.55 {
            let p = players[u.owner]
            p.resources[kind] += u.carry
            p.stats.resourcesGathered += u.carry
            u.carry = 0
            resumeGather(u)
        } else {
            u.repathTimer -= dt
            if u.path.isEmpty || u.pathIndex >= u.path.count || u.repathTimer <= 0 {
                u.repathTimer = 4
                computePath(u, toFootprint: drop.origin, size: drop.size, inside: false)
            }
            if followPath(u, dt) { u.repathTimer = min(u.repathTimer, 0.4) }
        }
    }

    private func resumeGather(_ u: Unit) {
        if let nid = u.gatherNodeID, let n = nodes[nid], !n.isDepleted {
            u.order = .gather(nid)
            u.path = []
            return
        }
        if let next = findNode(kind: u.gatherKind, near: u.lastTargetPos ?? u.pos, owner: u.owner, radius: 12, except: u.id) {
            commandGather([u], nodeID: next.id)
            return
        }
        u.order = .idle
        u.homePos = u.pos
    }

    private func updateBuild(_ u: Unit, buildingID bid: Int, dt: Double) {
        guard let b = buildings[bid], b.isAlive, isAlly(b.owner, u.owner) else {
            findNextConstruction(u)
            return
        }
        if b.isComplete && b.hp >= b.maxHP - 0.01 {
            if b.kind == .bauernhof, let nid = b.linkedNodeID, !farmOccupied(nid, except: u.id) {
                commandGather([u], nodeID: nid)
                return
            }
            findNextConstruction(u)
            return
        }
        let dist = b.edgeDistance(to: u.pos) - u.stats.radius
        if dist <= 0.55 {
            u.path = []
            u.attackFlash = 0.1
            u.facing = atan2(b.center.y - u.pos.y, b.center.x - u.pos.x)
            if !b.isComplete {
                b.builderCount += 1
            } else {
                b.hp = min(b.maxHP, b.hp + (b.maxHP * 0.012 + 4) * dt)
            }
        } else {
            u.repathTimer -= dt
            if u.path.isEmpty || u.pathIndex >= u.path.count || u.repathTimer <= 0 {
                u.repathTimer = 3
                computePath(u, toFootprint: b.origin, size: b.size, inside: false)
            }
            if followPath(u, dt) { u.repathTimer = min(u.repathTimer, 0.4) }
        }
    }

    private func findNextConstruction(_ u: Unit) {
        var best: Building?
        var bestD = 10.0
        for b in buildings.values where b.owner == u.owner && !b.isComplete {
            let d = b.edgeDistance(to: u.pos)
            if d < bestD {
                bestD = d
                best = b
            }
        }
        if let b = best {
            commandBuild([u], buildingID: b.id)
        } else if u.gatherNodeID != nil || u.gatherKind != nil {
            resumeGather(u)
        } else {
            u.order = .idle
            u.homePos = u.pos
        }
    }

    // MARK: - Bewegung & Wegfindung

    func computePath(_ u: Unit, to dest: Vec2, stopWithin: Double = 0) {
        var tt = dest.tile
        var finalPoint: Vec2? = dest
        if !u.isAir && !map.passable(tt, u.stats.movement),
           let alt = map.nearestPassable(to: tt, u.stats.movement, maxRadius: 6) {
            // Ziel blockiert (Gebäude, Wasser …): nächstgelegene erreichbare Kachel ansteuern
            tt = alt
            finalPoint = alt.center
        }
        if stopWithin >= 1 {
            let r2 = stopWithin * stopWithin
            computePath(u, target: tt, finalPoint: nil) { t in
                let dx = Double(t.x - tt.x), dy = Double(t.y - tt.y)
                return dx * dx + dy * dy <= r2
            }
        } else {
            computePath(u, target: tt, finalPoint: finalPoint) { $0 == tt }
        }
    }

    func computePath(_ u: Unit, toFootprint origin: TilePos, size: Int, inside: Bool, extraRange: Int = 0) {
        let target = TilePos(origin.x + size / 2, origin.y + size / 2)
        let lo = inside ? 0 : -1 - extraRange
        let hi = inside ? size - 1 : size + extraRange
        computePath(u, target: target, finalPoint: nil) { t in
            let dx = t.x - origin.x, dy = t.y - origin.y
            return dx >= lo && dx <= hi && dy >= lo && dy <= hi
        }
    }

    func computePath(_ u: Unit, target: TilePos, finalPoint: Vec2?, goal: (TilePos) -> Bool) {
        u.pathIndex = 0
        if u.isAir {
            u.path = [finalPoint ?? target.center]
            return
        }
        let mode = u.stats.movement
        let actual = u.pos.tile
        var start = actual
        if !map.passable(start, mode), let s = map.nearestPassable(to: start, mode, maxRadius: 4) { start = s }
        if goal(start) {
            if let fp = finalPoint, map.passable(fp.tile, mode) {
                u.path = [fp]
            } else {
                u.path = start == actual ? [] : [start.center]
            }
            return
        }
        let tiles = pathfinder.find(from: start, target: target, mode: mode, goal: goal)
        var pts = tiles.map { $0.center }
        if let fp = finalPoint, let last = tiles.last, last == fp.tile, !pts.isEmpty {
            pts[pts.count - 1] = fp
        }
        if start != actual { pts.insert(start.center, at: 0) }
        u.path = smooth(from: u.pos, pts, mode)
    }

    private func smooth(from origin: Vec2, _ pts: [Vec2], _ mode: MovementType) -> [Vec2] {
        guard pts.count > 1 else { return pts }
        var out: [Vec2] = []
        var anchor = origin
        var i = 0
        while i < pts.count {
            var j = min(pts.count - 1, i + 10)
            while j > i && !map.lineWalkable(anchor, pts[j], mode) { j -= 1 }
            out.append(pts[j])
            anchor = pts[j]
            i = j + 1
        }
        return out
    }

    @discardableResult
    func followPath(_ u: Unit, _ dt: Double) -> Bool {
        guard u.pathIndex < u.path.count else { return true }
        var remaining = effectiveSpeed(u) * dt
        while remaining > 0 && u.pathIndex < u.path.count {
            let wp = u.path[u.pathIndex]
            let d = wp - u.pos
            let l = d.length
            if l > 0.001 { u.facing = atan2(d.y, d.x) }
            if l <= remaining {
                u.pos = wp
                remaining -= l
                u.pathIndex += 1
            } else {
                u.pos += d * (remaining / l)
                remaining = 0
            }
        }
        u.isMoving = true
        return u.pathIndex >= u.path.count
    }

    func separateUnits(_ all: [Unit], dt: Double) {
        let k = min(1, dt * 8)
        for u in all where u.isAlive && !u.isAir {
            let r = u.stats.radius
            grid.forEach(near: u.pos, radius: r + 0.9) { o in
                guard o.id > u.id, !o.isAir, o.isAlive else { return }
                let minD = (r + o.stats.radius) * 0.85
                let d = u.pos - o.pos
                let l2 = d.lengthSquared
                guard l2 < minD * minD else { return }
                let l = l2.squareRoot()
                let dir = l > 0.01 ? d / l : Vec2(Double(u.id % 7) - 3, Double(o.id % 5) - 2.1).normalized
                let push = (minD - l) * k
                let wu = u.isMoving ? 0.35 : 1.0
                let wo = o.isMoving ? 0.35 : 1.0
                let total = wu + wo
                self.tryNudge(u, dir * (push * wu / total))
                self.tryNudge(o, dir * (-push * wo / total))
            }
        }
    }

    private func tryNudge(_ u: Unit, _ delta: Vec2) {
        let np = u.pos + delta
        if map.passable(np.tile, u.stats.movement) { u.pos = np }
    }

    // MARK: - Spezialangriffe & Aufräumen

    func updateStrikes(dt: Double) {
        guard !strikes.isEmpty else { return }
        var remaining: [PendingStrike] = []
        for var s in strikes {
            s.timer -= dt
            if s.timer > 0 {
                remaining.append(s)
                continue
            }
            events.append(s.isNuke ? .nuke(at: s.pos, radius: s.radius) : .orbital(at: s.pos, radius: s.radius))
            for u in units.values where u.isAlive {
                let d = u.pos.distance(to: s.pos)
                guard d <= s.radius else { continue }
                if !s.isNuke && !isEnemy(s.owner, u.owner) && u.owner != gaiaOwner { continue }
                applyDamage(to: u, amount: s.damage * (1 - 0.6 * d / s.radius), attackerOwner: s.owner, attackerID: -1)
            }
            for b in buildings.values where b.isAlive {
                let d = b.edgeDistance(to: s.pos)
                guard d <= s.radius else { continue }
                if !s.isNuke && !isEnemy(s.owner, b.owner) { continue }
                applyDamage(to: b, amount: s.damage * 2.4 * (1 - 0.5 * d / s.radius), attackerOwner: s.owner, attackerID: -1)
            }
        }
        strikes = remaining
    }

    func removeDead() {
        var changed = false
        for (id, u) in units where !u.isAlive {
            units.removeValue(forKey: id)
            events.append(.death(at: u.pos, emoji: u.stats.emoji))
            if u.isAnimal {
                let amount = u.kind == .mammut ? 500.0 : 150.0
                var tile = u.pos.tile
                if let t = map.nearestPassable(to: tile, .land, maxRadius: 3) { tile = t }
                let n = ResourceNode(id: newID(), kind: .food, style: .carcass, origin: tile, size: 1,
                                     amount: amount, blocks: false)
                n.exploredByHuman = isExploredByHuman(u.pos)
                nodes[n.id] = n
                changed = true
                for h in units.values where h.isVillager {
                    if case .attack(let tid) = h.order, tid == id { commandGather([h], nodeID: n.id) }
                }
            }
        }
        for (id, b) in buildings where !b.isAlive {
            buildings.removeValue(forKey: id)
            map.clearBlock(b.tiles, id: Int32(id))
            if let nid = b.linkedNodeID { nodes.removeValue(forKey: nid) }
            if b.queue.contains(.ageUp) && b.owner >= 0 { players[b.owner].researchingAge = false }
            events.append(.buildingDestroyed(at: b.center, size: b.size))
            if b.owner == humanIndex {
                notify("\(BuildingCatalog.name(b.kind, age: players[b.owner].age)) wurde zerstört!", player: b.owner, important: true)
            }
            changed = true
        }
        for (id, n) in nodes where n.isDepleted {
            nodes.removeValue(forKey: id)
            if n.blocks { map.clearBlock(n.tiles, id: Int32(id)) }
            changed = true
        }
        if changed { structureVersion += 1 }
    }
}
