import Foundation

// MARK: - Ganzzahlige Gitterkoordinaten

struct IVec3: Hashable, Codable {
    var x: Int
    var y: Int
    var z: Int

    init(_ x: Int, _ y: Int, _ z: Int) {
        self.x = x
        self.y = y
        self.z = z
    }

    init(from decoder: Decoder) throws {
        var c = try decoder.unkeyedContainer()
        x = try c.decode(Int.self)
        y = try c.decode(Int.self)
        z = try c.decode(Int.self)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.unkeyedContainer()
        try c.encode(x)
        try c.encode(y)
        try c.encode(z)
    }

    static func + (a: IVec3, b: IVec3) -> IVec3 { IVec3(a.x + b.x, a.y + b.y, a.z + b.z) }
    static func - (a: IVec3, b: IVec3) -> IVec3 { IVec3(a.x - b.x, a.y - b.y, a.z - b.z) }
    static func * (a: IVec3, k: Int) -> IVec3 { IVec3(a.x * k, a.y * k, a.z * k) }
    static prefix func - (a: IVec3) -> IVec3 { IVec3(-a.x, -a.y, -a.z) }

    /// Dreht um k·90° um die +Y-Achse – identisch zu SceneKits eulerAngles.y = k·π/2:
    /// (x, y, z) → (z, y, −x)
    func rotatedY(_ k: Int) -> IVec3 {
        var v = self
        for _ in 0..<((k % 4 + 4) % 4) { v = IVec3(v.z, v.y, -v.x) }
        return v
    }

    var float3: SIMD3<Float> { SIMD3(Float(x), Float(y), Float(z)) }
}

// MARK: - Level-Definition (aus level1.json)

struct BlockDef: Codable {
    let p: IVec3
    let m: String
    let walk: Bool
    let stair: String?
    let g: String?
}

struct DecorDef: Codable {
    let t: String
    let p: IVec3
    let s: Double
    let r: Double
    let g: String?
    let variant: Int?
    let face: String?
}

struct GroupDef: Codable {
    let id: String
    let kind: String
    let pivot: IVec3?
    let step: Int?
    let minStep: Int?
    let maxStep: Int?
    let axis: IVec3?
    let value: Int?
    let min: Int?
    let max: Int?
    let handle: IVec3?

    var isRotator: Bool { kind == "rotate" }
    var range: ClosedRange<Int> {
        isRotator ? (minStep ?? -1000)...(maxStep ?? 1000) : (min ?? 0)...(max ?? 0)
    }
    var isBounded: Bool { !isRotator || minStep != nil || maxStep != nil }
}

struct TextDef: Codable {
    let at: IVec3
    let text: String
}

struct LevelDef: Codable {
    let name: String
    let start: IVec3
    let goal: IVec3
    let groups: [GroupDef]
    let blocks: [BlockDef]
    let decor: [DecorDef]
    let texts: [TextDef]

    static func load(_ resource: String) -> LevelDef {
        guard let url = Bundle.main.url(forResource: resource, withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let def = try? JSONDecoder().decode(LevelDef.self, from: data) else {
            fatalError("Level \(resource).json konnte nicht geladen werden")
        }
        return def
    }
}

func stairVector(_ s: String?) -> IVec3? {
    switch s {
    case "+x": return IVec3(1, 0, 0)
    case "-x": return IVec3(-1, 0, 0)
    case "+z": return IVec3(0, 0, 1)
    case "-z": return IVec3(0, 0, -1)
    default: return nil
    }
}

// MARK: - Spiellogik: begehbare Felder und (unmögliche) Verbindungen

struct Tile {
    let block: Int
    let cell: IVec3
    /// Aufstiegsrichtung, falls das Feld eine Treppe ist.
    let stair: IVec3?

    /// Standpunkt der Figur in Weltkoordinaten.
    var center: SIMD3<Float> {
        stair == nil ? cell.float3 + SIMD3(0, 0.5, 0) : cell.float3
    }
}

struct EdgeKey: Hashable {
    let a: Int
    let b: Int
    init(_ a: Int, _ b: Int) {
        self.a = Swift.min(a, b)
        self.b = Swift.max(a, b)
    }
}

/// Zwei Felder sind verbunden, wenn sich zwei ihrer Kantenmittelpunkte („Ports“) in der
/// isometrischen Projektion decken – also entlang der Blickrichtung (1,1,1) liegen – und
/// ihre Austrittsrichtungen entgegengesetzt sind. Genau so entstehen die unmöglichen Wege:
/// Was für die Kamera zusammenhängt, ist begehbar.
final class LevelLogic {
    let def: LevelDef
    private(set) var state: [String: Int] = [:]
    private(set) var tiles: [Int: Tile] = [:]
    private(set) var adjacency: [Int: [Int]] = [:]
    private(set) var edges: Set<EdgeKey> = []
    /// Gerichtete Port-Positionen: (a → b) ergibt (Port auf a, Port auf b).
    private(set) var ports: [Int: [Int: (SIMD3<Float>, SIMD3<Float>)]] = [:]
    let groupsByID: [String: GroupDef]
    let startBlock: Int
    let goalBlock: Int

    init(def: LevelDef) {
        self.def = def
        var g: [String: GroupDef] = [:]
        var st: [String: Int] = [:]
        for gd in def.groups {
            g[gd.id] = gd
            st[gd.id] = gd.isRotator ? (gd.step ?? 0) : (gd.value ?? 0)
        }
        groupsByID = g
        state = st
        startBlock = def.blocks.firstIndex { $0.p == def.start && $0.g == nil } ?? 0
        goalBlock = def.blocks.firstIndex { $0.p == def.goal && $0.g == nil } ?? 0
        rebuild()
    }

    func value(of group: String) -> Int { state[group] ?? 0 }

    func groupOf(block: Int) -> String? { def.blocks[block].g }

    /// Weltposition und Treppenrichtung eines Blocks bei gegebenem Mechanismus-Zustand.
    func worldCell(_ index: Int, in st: [String: Int]? = nil) -> (IVec3, IVec3?) {
        let b = def.blocks[index]
        var p = b.p
        var dir = stairVector(b.stair)
        if let gid = b.g, let g = groupsByID[gid] {
            let v = (st ?? state)[gid] ?? 0
            if g.isRotator, let pivot = g.pivot {
                p = pivot + (p - pivot).rotatedY(v)
                dir = dir?.rotatedY(v)
            } else if let axis = g.axis {
                p = p + axis * v
            }
        }
        return (p, dir)
    }

    /// Prüft, ob ein Mechanismus-Zustand Blöcke überlappen lassen würde.
    func isFree(group: String, value: Int) -> Bool {
        var st = state
        st[group] = value
        var cells = Set<IVec3>()
        for i in def.blocks.indices {
            let c = worldCell(i, in: st).0
            if cells.contains(c) { return false }
            cells.insert(c)
        }
        return true
    }

    func setState(_ group: String, _ v: Int) {
        state[group] = v
        rebuild()
    }

    private struct Port {
        let pos: IVec3   // doppelte Koordinaten (Halbschritte sind ganzzahlig)
        let dir: IVec3
    }

    func rebuild() {
        var cells: [IVec3: Int] = [:]
        for i in def.blocks.indices { cells[worldCell(i).0] = i }
        var newTiles: [Int: Tile] = [:]
        for (i, b) in def.blocks.enumerated() where b.walk {
            let (c, dir) = worldCell(i)
            if cells[c + IVec3(0, 1, 0)] != nil { continue }   // keine Kopffreiheit
            newTiles[i] = Tile(block: i, cell: c, stair: dir)
        }
        tiles = newTiles

        var portMap: [Int: [Port]] = [:]
        for (i, t) in tiles {
            let X = 2 * t.cell.x, Y = 2 * t.cell.y, Z = 2 * t.cell.z
            if let d = t.stair {
                portMap[i] = [Port(pos: IVec3(X + d.x, Y + 1, Z + d.z), dir: d),
                              Port(pos: IVec3(X - d.x, Y - 1, Z - d.z), dir: -d)]
            } else {
                portMap[i] = [IVec3(1, 0, 0), IVec3(-1, 0, 0), IVec3(0, 0, 1), IVec3(0, 0, -1)].map {
                    Port(pos: IVec3(X + $0.x, Y + 1, Z + $0.z), dir: $0)
                }
            }
        }

        var adj: [Int: [Int]] = [:]
        var newEdges = Set<EdgeKey>()
        var newPorts: [Int: [Int: (SIMD3<Float>, SIMD3<Float>)]] = [:]
        let keys = tiles.keys.sorted()
        for (ai, a) in keys.enumerated() {
            for b in keys[(ai + 1)...] {
                guard let pa = portMap[a], let pb = portMap[b] else { continue }
                outer: for p in pa {
                    for q in pb where p.dir == -q.dir {
                        let d = q.pos - p.pos
                        if d.x == d.y && d.y == d.z {
                            adj[a, default: []].append(b)
                            adj[b, default: []].append(a)
                            newEdges.insert(EdgeKey(a, b))
                            let fp = p.pos.float3 * 0.5, fq = q.pos.float3 * 0.5
                            newPorts[a, default: [:]][b] = (fp, fq)
                            newPorts[b, default: [:]][a] = (fq, fp)
                            break outer
                        }
                    }
                }
            }
        }
        adjacency = adj
        edges = newEdges
        ports = newPorts
    }

    func neighbors(_ t: Int) -> [Int] { adjacency[t] ?? [] }

    /// Breitensuche – liefert die Felder bis zum Ziel (ohne Startfeld).
    func path(from start: Int, to goal: Int) -> [Int]? {
        guard tiles[start] != nil, tiles[goal] != nil else { return nil }
        if start == goal { return [] }
        var prev: [Int: Int] = [start: start]
        var queue = [start]
        var head = 0
        while head < queue.count {
            let c = queue[head]
            head += 1
            if c == goal { break }
            for n in neighbors(c) where prev[n] == nil {
                prev[n] = c
                queue.append(n)
            }
        }
        guard prev[goal] != nil else { return nil }
        var result: [Int] = []
        var c = goal
        while c != start {
            result.append(c)
            c = prev[c]!
        }
        return result.reversed()
    }

    func reachable(from start: Int) -> Set<Int> {
        var seen: Set<Int> = [start]
        var queue = [start]
        while let c = queue.popLast() {
            for n in neighbors(c) where !seen.contains(n) {
                seen.insert(n)
                queue.append(n)
            }
        }
        return seen
    }

    func block(at cell: IVec3) -> Int? {
        def.blocks.firstIndex { $0.p == cell && $0.g == nil }
    }

    /// Ist das Feld eine „unmögliche“ Verbindung (Ports nicht identisch)?
    func isIllusion(_ a: Int, _ b: Int) -> Bool {
        guard let p = ports[a]?[b] else { return false }
        return distSq(p.0, p.1) > 0.01
    }
}

@inline(__always) func distSq(_ a: SIMD3<Float>, _ b: SIMD3<Float>) -> Float {
    let d = a - b
    return d.x * d.x + d.y * d.y + d.z * d.z
}
