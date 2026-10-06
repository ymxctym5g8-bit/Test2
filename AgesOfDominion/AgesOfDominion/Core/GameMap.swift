import Foundation

enum Terrain: UInt8 {
    case grass, dirt, sand, shallow, water, rock

    var isLand: Bool { self == .grass || self == .dirt || self == .sand }
    var isWater: Bool { self == .water || self == .shallow }
}

final class GameMap {
    let width: Int
    let height: Int
    var terrain: [Terrain]
    /// Entity-ID, die eine Kachel für Bewegung blockiert (0 = frei).
    var blocker: [Int32]
    /// Entity-ID, die eine Kachel belegt (auch nicht blockierende wie Bauernhöfe).
    var footprint: [Int32]
    /// Kleine Farbvariation pro Kachel für das Terrain-Rendering.
    var shade: [Float]

    init(width: Int, height: Int) {
        self.width = width
        self.height = height
        terrain = Array(repeating: .grass, count: width * height)
        blocker = Array(repeating: 0, count: width * height)
        footprint = Array(repeating: 0, count: width * height)
        shade = Array(repeating: 0, count: width * height)
    }

    @inline(__always) func inBounds(_ x: Int, _ y: Int) -> Bool { x >= 0 && y >= 0 && x < width && y < height }
    @inline(__always) func index(_ x: Int, _ y: Int) -> Int { y * width + x }
    func terrainAt(_ t: TilePos) -> Terrain { inBounds(t.x, t.y) ? terrain[index(t.x, t.y)] : .rock }

    @inline(__always) func passable(_ x: Int, _ y: Int, _ mode: MovementType) -> Bool {
        guard inBounds(x, y) else { return false }
        let i = y * width + x
        switch mode {
        case .air: return true
        case .land: return terrain[i].isLand && blocker[i] == 0
        case .naval: return terrain[i].isWater && blocker[i] == 0
        case .hover: return terrain[i] != .rock && blocker[i] == 0
        }
    }

    func passable(_ t: TilePos, _ mode: MovementType) -> Bool { passable(t.x, t.y, mode) }

    func lineWalkable(_ a: Vec2, _ b: Vec2, _ mode: MovementType) -> Bool {
        if mode == .air { return true }
        let d = b - a
        let len = d.length
        let steps = max(1, Int(len / 0.25))
        for s in 0...steps {
            let p = a + d * (Double(s) / Double(steps))
            let t = p.tile
            if !passable(t.x, t.y, mode) { return false }
        }
        return true
    }

    /// Nächstgelegene passierbare Kachel (Spiralsuche).
    func nearestPassable(to t: TilePos, _ mode: MovementType, maxRadius: Int = 12) -> TilePos? {
        if passable(t, mode) { return t }
        for r in 1...maxRadius {
            var best: TilePos?
            var bestD = Int.max
            for dx in -r...r {
                for dy in -r...r where abs(dx) == r || abs(dy) == r {
                    let c = TilePos(t.x + dx, t.y + dy)
                    if passable(c, mode) {
                        let d = dx * dx + dy * dy
                        if d < bestD { bestD = d; best = c }
                    }
                }
            }
            if let b = best { return b }
        }
        return nil
    }

    func setBlock(_ tiles: [TilePos], id: Int32, blocks: Bool) {
        for t in tiles where inBounds(t.x, t.y) {
            let i = index(t.x, t.y)
            footprint[i] = id
            if blocks { blocker[i] = id }
        }
    }

    func clearBlock(_ tiles: [TilePos], id: Int32) {
        for t in tiles where inBounds(t.x, t.y) {
            let i = index(t.x, t.y)
            if footprint[i] == id { footprint[i] = 0 }
            if blocker[i] == id { blocker[i] = 0 }
        }
    }
}

// MARK: - Kartengenerator

struct MapGenerator {
    let size: Int
    let playerCount: Int
    var rng: SeededRandom

    init(size: Int, playerCount: Int, seed: UInt64) {
        self.size = size
        self.playerCount = playerCount
        self.rng = SeededRandom(seed: seed)
    }

    func startPositions() -> [TilePos] {
        let inset = max(10, size / 7)
        let lo = inset, hi = size - inset - 1
        let corners = [TilePos(lo, lo), TilePos(hi, hi), TilePos(lo, hi), TilePos(hi, lo)]
        return Array(corners.prefix(playerCount))
    }

    private mutating func noiseField(scale: Int) -> [Double] {
        let gw = size / scale + 2
        var grid = [Double](repeating: 0, count: gw * gw)
        for i in 0..<grid.count { grid[i] = rng.unit() }
        var out = [Double](repeating: 0, count: size * size)
        for y in 0..<size {
            for x in 0..<size {
                let fx = Double(x) / Double(scale), fy = Double(y) / Double(scale)
                let x0 = Int(fx), y0 = Int(fy)
                var tx = fx - Double(x0), ty = fy - Double(y0)
                tx = tx * tx * (3 - 2 * tx)
                ty = ty * ty * (3 - 2 * ty)
                let a = grid[y0 * gw + x0], b = grid[y0 * gw + x0 + 1]
                let c = grid[(y0 + 1) * gw + x0], d = grid[(y0 + 1) * gw + x0 + 1]
                let top = a + (b - a) * tx, bottom = c + (d - c) * tx
                out[y * size + x] = top + (bottom - top) * ty
            }
        }
        return out
    }

    mutating func generateTerrain(into map: GameMap) {
        let n = size
        let e1 = noiseField(scale: max(8, n / 5))
        let e2 = noiseField(scale: max(4, n / 12))
        let e3 = noiseField(scale: 3)
        let moist = noiseField(scale: max(6, n / 8))
        let center = Double(n) / 2
        let starts = startPositions()

        for y in 0..<n {
            for x in 0..<n {
                let i = y * n + x
                var e = e1[i] * 0.6 + e2[i] * 0.3 + e3[i] * 0.1
                // Zentraler See für Seegefechte
                let dc = (Double(x) - center) * (Double(x) - center) + (Double(y) - center) * (Double(y) - center)
                e -= 0.38 * exp(-dc / (0.018 * Double(n * n)))
                // Kartenrand leicht anheben
                let edge = min(min(x, y), min(n - 1 - x, n - 1 - y))
                if edge < 3 { e += 0.08 }
                var t: Terrain = .grass
                if e < 0.26 { t = .water } else if e < 0.31 { t = .shallow } else if e > 0.8 { t = .rock }
                if t == .grass && moist[i] < 0.3 { t = .dirt }
                map.terrain[i] = t
                map.shade[i] = Float(e3[i] * 0.5 + moist[i] * 0.5)
            }
        }
        // Startgebiete freiräumen
        for s in starts {
            for y in (s.y - 9)...(s.y + 9) {
                for x in (s.x - 9)...(s.x + 9) where map.inBounds(x, y) {
                    let d = (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y)
                    if d <= 81 && !map.terrain[y * n + x].isLand { map.terrain[y * n + x] = .grass }
                }
            }
        }
        ensureConnectivity(map: map, starts: starts)
        // Sandstrände
        var sand: [Int] = []
        for y in 0..<n {
            for x in 0..<n where map.terrain[y * n + x].isLand {
                var nearWater = false
                for dy in -1...1 { for dx in -1...1 where map.inBounds(x + dx, y + dy) {
                    if map.terrain[(y + dy) * n + x + dx].isWater { nearWater = true }
                } }
                if nearWater { sand.append(y * n + x) }
            }
        }
        for i in sand { map.terrain[i] = .sand }
    }

    /// Stellt sicher, dass alle Startpositionen über Land verbunden sind.
    private func ensureConnectivity(map: GameMap, starts: [TilePos]) {
        guard let first = starts.first else { return }
        for other in starts.dropFirst() {
            if reachable(map: map, from: first, to: other) { continue }
            // Landbrücke graben
            var p = first.center
            let target = other.center
            let dir = (target - p).normalized
            while p.distance(to: target) > 1 {
                let t = p.tile
                for dy in -1...1 { for dx in -1...1 where map.inBounds(t.x + dx, t.y + dy) {
                    let i = map.index(t.x + dx, t.y + dy)
                    if !map.terrain[i].isLand { map.terrain[i] = .grass }
                } }
                p += dir * 0.5
            }
        }
    }

    private func reachable(map: GameMap, from a: TilePos, to b: TilePos) -> Bool {
        var seen = [Bool](repeating: false, count: map.width * map.height)
        var stack = [a]
        seen[map.index(a.x, a.y)] = true
        while let c = stack.popLast() {
            if c == b { return true }
            for (dx, dy) in [(1, 0), (-1, 0), (0, 1), (0, -1)] {
                let nx = c.x + dx, ny = c.y + dy
                guard map.inBounds(nx, ny) else { continue }
                let i = map.index(nx, ny)
                if !seen[i] && map.terrain[i].isLand {
                    seen[i] = true
                    stack.append(TilePos(nx, ny))
                }
            }
        }
        return false
    }
}

// MARK: - A*-Wegfindung

final class Pathfinder {
    private let map: GameMap
    private var g: [Float]
    private var parent: [Int32]
    private var openStamp: [UInt32]
    private var closedStamp: [UInt32]
    private var stamp: UInt32 = 0
    private var heap: [(f: Float, i: Int32)] = []

    init(map: GameMap) {
        self.map = map
        let n = map.width * map.height
        g = Array(repeating: 0, count: n)
        parent = Array(repeating: -1, count: n)
        openStamp = Array(repeating: 0, count: n)
        closedStamp = Array(repeating: 0, count: n)
        heap.reserveCapacity(1024)
    }

    private func push(_ f: Float, _ i: Int32) {
        heap.append((f, i))
        var c = heap.count - 1
        while c > 0 {
            let p = (c - 1) / 2
            if heap[p].f <= heap[c].f { break }
            heap.swapAt(p, c)
            c = p
        }
    }

    private func pop() -> Int32? {
        guard !heap.isEmpty else { return nil }
        let top = heap[0].i
        let last = heap.removeLast()
        if !heap.isEmpty {
            heap[0] = last
            var c = 0
            while true {
                let l = 2 * c + 1, r = l + 1
                var m = c
                if l < heap.count && heap[l].f < heap[m].f { m = l }
                if r < heap.count && heap[r].f < heap[m].f { m = r }
                if m == c { break }
                heap.swapAt(m, c)
                c = m
            }
        }
        return top
    }

    /// Sucht einen Weg. `goal` entscheidet, ob eine Kachel das Ziel ist.
    /// Wird das Ziel nicht erreicht, endet der Weg an der nächstgelegenen Kachel.
    func find(from start: TilePos, target: TilePos, mode: MovementType, maxNodes: Int = 9000,
              goal: (TilePos) -> Bool) -> [TilePos] {
        let w = map.width
        guard map.inBounds(start.x, start.y) else { return [] }
        stamp &+= 1
        if stamp == 0 {
            for i in 0..<openStamp.count { openStamp[i] = 0; closedStamp[i] = 0 }
            stamp = 1
        }
        heap.removeAll(keepingCapacity: true)
        let si = Int32(start.y * w + start.x)
        g[Int(si)] = 0
        parent[Int(si)] = -1
        openStamp[Int(si)] = stamp
        func h(_ x: Int, _ y: Int) -> Float {
            let dx = Float(abs(x - target.x)), dy = Float(abs(y - target.y))
            return max(dx, dy) + 0.414 * min(dx, dy)
        }
        push(h(start.x, start.y), si)
        var bestI = si
        var bestH = h(start.x, start.y)
        var expanded = 0
        var found: Int32 = -1
        let dirs: [(Int, Int, Float)] = [(1, 0, 1), (-1, 0, 1), (0, 1, 1), (0, -1, 1),
                                         (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]
        while let ci = pop() {
            let c = Int(ci)
            if closedStamp[c] == stamp { continue }
            closedStamp[c] = stamp
            let cx = c % w, cy = c / w
            if goal(TilePos(cx, cy)) { found = ci; break }
            let hc = h(cx, cy)
            if hc < bestH { bestH = hc; bestI = ci }
            expanded += 1
            if expanded > maxNodes { break }
            for (dx, dy, cost) in dirs {
                let nx = cx + dx, ny = cy + dy
                guard map.passable(nx, ny, mode) else { continue }
                if dx != 0 && dy != 0 {
                    if !map.passable(cx + dx, cy, mode) || !map.passable(cx, cy + dy, mode) { continue }
                }
                let ni = ny * w + nx
                if closedStamp[ni] == stamp { continue }
                let ng = g[c] + cost
                if openStamp[ni] != stamp || ng < g[ni] {
                    openStamp[ni] = stamp
                    g[ni] = ng
                    parent[ni] = ci
                    push(ng + h(nx, ny) * 1.05, Int32(ni))
                }
            }
        }
        var end = found >= 0 ? found : bestI
        var tiles: [TilePos] = []
        while end != si && end >= 0 {
            tiles.append(TilePos(Int(end) % w, Int(end) / w))
            end = parent[Int(end)]
        }
        return tiles.reversed()
    }
}
