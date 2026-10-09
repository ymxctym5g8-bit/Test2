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
    /// Darf an einer „unmöglichen“ Verbindung teilnehmen (vom Leveldesign freigegeben).
    let ill: Bool?
}

struct DecorDef: Codable {
    let t: String
    let p: IVec3
    let s: Double
    let r: Double
    let g: String?
    let variant: Int?
    let face: String?
    let axis: String?
    /// Zweiter Endpunkt, z. B. für Stromleitungen zwischen zwei Masten.
    let to: IVec3?
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
    /// Nur über Druckplatten beweglich, nicht per Finger.
    let locked: Bool?

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

struct PlateDef: Codable {
    let id: String
    let at: IVec3
}

/// Steuert eine gesperrte Gruppe: Sind alle genannten Platten gedrückt und stehen alle genannten
/// Gruppen in der verlangten Stellung, fährt die Gruppe in die Zielstellung – sonst in ihre Ausgangsstellung.
/// Der erste zutreffende Auslöser einer Gruppe gilt. (Platten bleiben gedrückt, Zustände können sich ändern.)
struct TriggerDef: Codable {
    let plates: [String]?
    let states: [String: Int]?
    let group: String
    let value: Int
}

/// Hinweisregel für Kiko: Die erste passende Regel bestimmt das Ziel.
struct HintDef: Codable {
    let reach: IVec3?
    let pressed: [String]?
    let unpressed: [String]?
    let target: String
}

struct EndingDef: Codable {
    let text: String
    let tree: IVec3
    let spirits: [IVec3]
}

struct LevelDef: Codable {
    let name: String
    /// Kapitelnummer (1 … 18).
    let chapter: Int?
    let theme: String?
    let start: IVec3
    let goal: IVec3
    let groups: [GroupDef]
    let blocks: [BlockDef]
    let decor: [DecorDef]
    let texts: [TextDef]
    let plates: [PlateDef]?
    let triggers: [TriggerDef]?
    let hints: [HintDef]?
    let ending: EndingDef?
    /// Welt: "wolkenpfad" (Standard) oder "neko" (Katzenstadt-Kapitel).
    let world: String?
    /// Spielfigur: "hana" (Standard) oder "cat".
    let hero: String?
    /// Begleiter: "kiko" (Standard) oder "sparrow".
    let companion: String?
    /// Kulisse hinter dem Level: "town", "satoyama", "fuji".
    let backdrop: String?
    /// Sammel-Sushi auf festen Feldern.
    let sushi: [IVec3]?
    /// Gegenstand auf dem Zielaltar: seed (Standard), harp, letter, feather, gear, prism, lamp, string, heart, bell.
    let goalItem: String?

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
    /// Gedrückte Platten (bleiben gedrückt).
    private(set) var pressed = Set<String>()
    /// Gruppen, die nur von Auslösern bewegt werden.
    let derivedGroups: [String]
    private let initialState: [String: Int]

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
        initialState = st
        var d: [String] = []
        for t in def.triggers ?? [] where !d.contains(t.group) { d.append(t.group) }
        derivedGroups = d
        startBlock = def.blocks.firstIndex { $0.p == def.start && $0.g == nil } ?? 0
        goalBlock = def.blocks.firstIndex { $0.p == def.goal && $0.g == nil }
            ?? def.blocks.firstIndex { $0.p == def.goal } ?? 0
        state = derived(state, pressed: [])   // gekoppelte Teile stehen von Anfang an richtig
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

    /// Prüft, ob ein Mechanismus-Zustand Blöcke überlappen lassen würde (Durchgangsstellung beim Ziehen:
    /// die übrigen Gruppen behalten ihre jetzige Stellung).
    func isFree(group: String, value: Int) -> Bool {
        var st = state
        st[group] = value
        return cellsFree(st)
    }

    /// Endstellung: Auch die von Auslösern gesteuerten Gruppen fahren mit – darf nichts überlappen?
    func isSettleFree(group: String, value: Int) -> Bool {
        var st = state
        st[group] = value
        return cellsFree(derived(st, pressed: pressed))
    }

    /// Bleibt Hanas Block ein begehbares Feld, wenn `group` auf `value` steht? Gekoppelte Teile
    /// (etwa Lichtbrücken an Spiegeln) dürfen ihr nicht den Boden wegziehen oder sie zudecken.
    func keepsTile(_ block: Int, group: String, value: Int) -> Bool {
        guard def.blocks.indices.contains(block), def.blocks[block].walk else { return false }
        var st = state
        st[group] = value
        let full = derived(st, pressed: pressed)
        let cell = worldCell(block, in: full).0
        let above = IVec3(cell.x, cell.y + 1, cell.z)
        return !def.blocks.indices.contains { worldCell($0, in: full).0 == above }
    }

    private func cellsFree(_ st: [String: Int]) -> Bool {
        var cells = Set<IVec3>()
        for i in def.blocks.indices {
            let c = worldCell(i, in: st).0
            if cells.contains(c) { return false }
            cells.insert(c)
        }
        return true
    }

    /// Stellungen der gesteuerten Gruppen für einen Zustand und die gedrückten Platten.
    func derived(_ base: [String: Int], pressed: Set<String>) -> [String: Int] {
        var st = base
        for g in derivedGroups { st[g] = initialState[g] ?? 0 }
        for _ in 0..<4 {
            var changed = false
            for g in derivedGroups {
                var v = initialState[g] ?? 0
                for t in def.triggers ?? [] where t.group == g {
                    let platesOK = (t.plates ?? []).allSatisfy { pressed.contains($0) }
                    let statesOK = (t.states ?? [:]).allSatisfy { stateMatches($0.key, st[$0.key], $0.value) }
                    if platesOK && statesOK { v = t.value; break }
                }
                if st[g] != v { st[g] = v; changed = true }
            }
            if !changed { break }
        }
        return st
    }

    /// Steht eine Gruppe in der verlangten Stellung? Frei drehbare Teile zählen ihre Vierteldrehungen
    /// beim Ziehen weiter (−1, 4, 5 …) – für Auslöser zählt nur die Richtung, also modulo 4.
    private func stateMatches(_ group: String, _ value: Int?, _ wanted: Int) -> Bool {
        guard let value else { return false }
        if let g = groupsByID[group], g.isRotator, !g.isBounded {
            return ((value % 4) + 4) % 4 == ((wanted % 4) + 4) % 4
        }
        return value == wanted
    }

    /// Gesteuerte Gruppen, die gerade woanders stehen sollten (Gruppe → Zielstellung).
    func pendingTriggers() -> [String: Int] {
        let want = derived(state, pressed: pressed)
        var out: [String: Int] = [:]
        for g in derivedGroups where want[g] != state[g] { out[g] = want[g] }
        return out
    }

    func press(_ plate: String) { pressed.insert(plate) }

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
                        let illusionOK = d.x == 0 || (def.blocks[a].ill == true && def.blocks[b].ill == true)
                        if d.x == d.y && d.y == d.z && illusionOK {
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
