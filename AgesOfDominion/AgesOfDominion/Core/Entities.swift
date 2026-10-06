import Foundation

let gaiaOwner = -1

enum UnitOrder: Equatable {
    case idle
    case move(Vec2)
    case attackMove(Vec2)
    case attack(Int)
    case gather(Int)
    case returnCargo
    case build(Int)
}

final class Unit {
    let id: Int
    let kind: UnitKind
    let stats: UnitStats
    var owner: Int
    var pos: Vec2
    var hp: Double
    var maxHP: Double
    var order: UnitOrder = .idle
    var path: [Vec2] = []
    var pathIndex = 0
    var pathGoal: Vec2?
    var cooldown: Double = 0
    var facing: Double = 0
    var carryKind: ResourceKind?
    var carry: Double = 0
    /// Zuletzt bearbeitete Rohstoffquelle (für die Rückkehr nach dem Abliefern).
    var gatherNodeID: Int?
    var gatherKind: ResourceKind?
    var lastTargetPos: Vec2?
    var repathTimer: Double = 0
    var scanTimer: Double
    var stuckTimer: Double = 0
    var lastPos: Vec2
    var isMoving = false
    var auraBoost = false
    var homePos: Vec2
    var attackFlash: Double = 0
    var resumeAttackMove: Vec2?
    var autoTarget = false
    var healTargetID: Int?
    var wanderTimer: Double = 3
    var lastDamagedAt: Double = -100

    init(id: Int, kind: UnitKind, owner: Int, pos: Vec2, hpMult: Double) {
        self.id = id
        let s = kind.stats
        self.kind = kind
        self.stats = s
        self.owner = owner
        self.pos = pos
        self.maxHP = s.hp * hpMult
        self.hp = s.hp * hpMult
        self.scanTimer = Double(id % 10) * 0.06
        self.lastPos = pos
        self.homePos = pos
    }

    var isVillager: Bool { stats.category == .villager }
    var isAlive: Bool { hp > 0 }
    var isAir: Bool { stats.movement == .air }
    var isAnimal: Bool { stats.category == .animal }
}

enum QueueItem: Equatable {
    case unit(UnitKind)
    case ageUp
    case missile

    var title: String {
        switch self {
        case .unit(let k): return k.stats.name
        case .ageUp: return "Epochensprung"
        case .missile: return "Atomrakete"
        }
    }
}

final class Building {
    let id: Int
    let kind: BuildingKind
    let stats: BuildingStats
    var owner: Int
    let origin: TilePos
    var hp: Double
    var maxHP: Double
    var progress: Double = 0
    var isComplete: Bool { progress >= 1 }
    var queue: [QueueItem] = []
    var queueProgress: Double = 0
    var queueCost: [ResourceBundle] = []
    var rallyPoint: Vec2?
    var cooldown: Double = 0
    var targetID: Int?
    var missiles = 0
    var abilityCooldown: Double = 0
    var wonderTimer: Double?
    var linkedNodeID: Int?
    var seenByHuman = false
    var builderCount = 0
    var lastDamagedAt: Double = -100

    init(id: Int, kind: BuildingKind, owner: Int, origin: TilePos, maxHP: Double) {
        self.id = id
        self.kind = kind
        self.stats = kind.stats
        self.owner = owner
        self.origin = origin
        self.maxHP = maxHP
        self.hp = max(1, maxHP * 0.1)
    }

    var size: Int { stats.size }
    var center: Vec2 { Vec2(Double(origin.x) + Double(size) / 2, Double(origin.y) + Double(size) / 2) }
    var radius: Double { Double(size) * 0.5 }
    var isAlive: Bool { hp > 0 }

    func contains(_ p: Vec2) -> Bool {
        p.x >= Double(origin.x) && p.x < Double(origin.x + size) && p.y >= Double(origin.y) && p.y < Double(origin.y + size)
    }

    /// Abstand eines Punktes zum Rand des Gebäudes (0, wenn innen).
    func edgeDistance(to p: Vec2) -> Double {
        let minX = Double(origin.x), maxX = Double(origin.x + size)
        let minY = Double(origin.y), maxY = Double(origin.y + size)
        let dx = max(minX - p.x, 0, p.x - maxX)
        let dy = max(minY - p.y, 0, p.y - maxY)
        return (dx * dx + dy * dy).squareRoot()
    }

    var tiles: [TilePos] {
        var r: [TilePos] = []
        for dx in 0..<size { for dy in 0..<size { r.append(TilePos(origin.x + dx, origin.y + dy)) } }
        return r
    }
}

enum NodeStyle {
    case tree, berries, ironMine, goldMine, deposit, carcass, farm
}

final class ResourceNode {
    let id: Int
    let kind: ResourceKind
    let style: NodeStyle
    let origin: TilePos
    let size: Int
    var amount: Double
    let initialAmount: Double
    let infinite: Bool
    let blocks: Bool
    var linkedBuildingID: Int?
    let variant: Int
    var exploredByHuman = false

    init(id: Int, kind: ResourceKind, style: NodeStyle, origin: TilePos, size: Int, amount: Double,
         infinite: Bool = false, blocks: Bool = true, variant: Int = 0) {
        self.id = id
        self.kind = kind
        self.style = style
        self.origin = origin
        self.size = size
        self.amount = amount
        self.initialAmount = amount
        self.infinite = infinite
        self.blocks = blocks
        self.variant = variant
    }

    var center: Vec2 { Vec2(Double(origin.x) + Double(size) / 2, Double(origin.y) + Double(size) / 2) }
    var isDepleted: Bool { !infinite && amount <= 0 }

    func edgeDistance(to p: Vec2) -> Double {
        let minX = Double(origin.x), maxX = Double(origin.x + size)
        let minY = Double(origin.y), maxY = Double(origin.y + size)
        let dx = max(minX - p.x, 0, p.x - maxX)
        let dy = max(minY - p.y, 0, p.y - maxY)
        return (dx * dx + dy * dy).squareRoot()
    }

    var tiles: [TilePos] {
        var r: [TilePos] = []
        for dx in 0..<size { for dy in 0..<size { r.append(TilePos(origin.x + dx, origin.y + dy)) } }
        return r
    }
}

final class Player {
    let index: Int
    let name: String
    let colorIndex: Int
    let team: Int
    let isHuman: Bool
    var resources: ResourceBundle
    var age: Int
    var mods = Modifiers()
    var perks: [DoctrinePerk] = []
    var pendingDoctrineAge: Int?
    var isDefeated = false
    var researchingAge = false
    /// Sammelraten-Multiplikator für KI-Schwierigkeitsgrade.
    var handicap: Double = 1
    var stats = PlayerStats()

    init(index: Int, name: String, colorIndex: Int, team: Int, isHuman: Bool, resources: ResourceBundle, age: Int) {
        self.index = index
        self.name = name
        self.colorIndex = colorIndex
        self.team = team
        self.isHuman = isHuman
        self.resources = resources
        self.age = age
    }

    func focusCount(_ f: DoctrineFocus) -> Int { perks.filter { $0.focus == f }.count }
}

struct PlayerStats {
    var unitsTrained = 0
    var unitsKilled = 0
    var unitsLost = 0
    var buildingsBuilt = 0
    var buildingsDestroyed = 0
    var resourcesGathered: Double = 0
}

/// Kurzlebige Ereignisse, die der Renderer als Effekte darstellt.
enum WorldEvent {
    case projectile(from: Vec2, to: Vec2, style: ProjectileStyle, air: Bool)
    case explosion(at: Vec2, radius: Double)
    case nukeLaunch(from: Vec2, to: Vec2, delay: Double)
    case nuke(at: Vec2, radius: Double)
    case orbital(at: Vec2, radius: Double)
    case death(at: Vec2, emoji: String)
    case heal(at: Vec2)
    case buildingDestroyed(at: Vec2, size: Int)
}

enum ProjectileStyle {
    case arrow, bullet, shell, rocket, laser, plasma, flame
}

struct GameNotification: Identifiable, Equatable {
    let id: Int
    let text: String
    let time: Double
    let important: Bool
}

struct PendingStrike {
    var pos: Vec2
    var timer: Double
    let radius: Double
    let damage: Double
    let owner: Int
    let isNuke: Bool
}
