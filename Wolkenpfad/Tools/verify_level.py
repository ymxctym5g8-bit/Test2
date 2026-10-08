# Verifies a Wolkenpfad level: solvability (state-space search over every mechanism,
# pressure plate and ride), collisions, impossible connections, hints and story data.
#
# Usage:  python3 Tools/verify_level.py Wolkenpfad/Level/level2.json [--essential] [--quiet]
#
# Triggers: {"plates": [...], "states": {"group": value, ...}, "group": "target", "value": v}
# A locked group that is the target of triggers takes the value of the first trigger whose
# conditions all hold, otherwise its initial value. Plates stay pressed once stepped on.
import json, sys, itertools
from collections import deque

args = [a for a in sys.argv[1:] if not a.startswith("--")]
ESSENTIAL = "--essential" in sys.argv
QUIET = "--quiet" in sys.argv
L = json.load(open(args[0]))
groups = {g["id"]: g for g in L["groups"]}
gids = list(groups)
DIRS = {"+x": (1, 0, 0), "-x": (-1, 0, 0), "+z": (0, 0, 1), "-z": (0, 0, -1)}
plates = {p["id"]: tuple(p["at"]) for p in L.get("plates", [])}
triggers = L.get("triggers", [])
derived = sorted({t["group"] for t in triggers})
problems = []
for gname in derived:
    if gname not in groups: problems.append(f"trigger targets unknown group {gname}")
    elif not groups[gname].get("locked"): problems.append(f"trigger target {gname} must be locked")
for t in triggers:
    for pid in t.get("plates", []):
        if pid not in plates: problems.append(f"trigger uses unknown plate {pid}")
    for gname in t.get("states", {}):
        if gname not in groups: problems.append(f"trigger state uses unknown group {gname}")
free = [g for g in gids if g not in derived]
draggable = [g for g in free if not groups[g].get("locked")]

def rot(v, k):
    x, y, z = v
    for _ in range(k % 4): x, y, z = z, y, -x
    return (x, y, z)

def gstates(g):
    if g["kind"] == "rotate":
        return list(range(g.get("minStep", 0), g.get("maxStep", 3) + 1))
    return list(range(g["min"], g["max"] + 1))

def initial(g): return g.get("step", 0) if g["kind"] == "rotate" else g.get("value", 0)

def derive(base, pressed):
    """Full state from the free groups' values and the pressed plates."""
    st = dict(base)
    for gname in derived: st[gname] = initial(groups[gname])
    for _ in range(4):                      # small fixpoint for chained triggers
        changed = False
        for gname in derived:
            v = initial(groups[gname])
            for t in triggers:
                if t["group"] != gname: continue
                if all(p in pressed for p in t.get("plates", [])) and all(st.get(k) == val for k, val in t.get("states", {}).items()):
                    v = t["value"]; break
            if st[gname] != v: st[gname] = v; changed = True
        if not changed: break
    return st

def world(b, st):
    p = tuple(b["p"]); gid = b.get("g"); d = DIRS.get(b.get("stair"))
    if gid:
        g = groups[gid]; s = st[gid]
        if g["kind"] == "rotate":
            pv = tuple(g["pivot"]); o = rot(tuple(p[i] - pv[i] for i in range(3)), s)
            p = tuple(pv[i] + o[i] for i in range(3))
            if d: d = rot(d, s)
        else:
            ax = g["axis"]; p = tuple(p[i] + ax[i] * s for i in range(3))
    return p, d

BL = L["blocks"]
cache = {}
def build(st):
    key = tuple(st[g] for g in gids)
    if key in cache: return cache[key]
    cells = {}
    for i, b in enumerate(BL):
        p, _ = world(b, st)
        if p in cells: cache[key] = None; return None
        cells[p] = i
    tiles = {}
    for i, b in enumerate(BL):
        if not b["walk"]: continue
        p, d = world(b, st)
        if (p[0], p[1] + 1, p[2]) in cells: continue
        tiles[i] = (p, d)
    # ports on the same view line (direction (1,1,1)) can connect
    lines = {}
    for i, (p, d) in tiles.items():
        X, Y, Z = 2 * p[0], 2 * p[1], 2 * p[2]
        if d is None:
            ps = [((X + dx, Y + 1, Z + dz), (dx, 0, dz)) for dx, dz in [(1, 0), (-1, 0), (0, 1), (0, -1)]]
        else:
            dx, _, dz = d
            ps = [((X + dx, Y + 1, Z + dz), (dx, 0, dz)), ((X - dx, Y - 1, Z - dz), (-dx, 0, -dz))]
        for pos, dr in ps:
            lines.setdefault((pos[0] - pos[1], pos[2] - pos[1]), []).append((i, pos, dr))
    adj = {i: [] for i in tiles}
    seen = set()
    for lst in lines.values():
        if len(lst) < 2: continue
        for (a, pa, da), (b, pb, db) in itertools.combinations(lst, 2):
            if a == b or da != tuple(-c for c in db): continue
            t = pb[1] - pa[1]
            if t != 0 and not (BL[a].get("ill") and BL[b].get("ill")): continue
            k = (min(a, b), max(a, b))
            if k in seen: continue
            seen.add(k)
            adj[a].append((b, t // 2)); adj[b].append((a, t // 2))
    cache[key] = (adj, tiles)
    return cache[key]

def fixed_index(cell):
    for i, b in enumerate(BL):
        if tuple(b["p"]) == tuple(cell) and not b.get("g"): return i
    return None

def any_index(cell):
    i = fixed_index(cell)
    if i is not None: return i
    return next((i for i, b in enumerate(BL) if tuple(b["p"]) == tuple(cell)), None)

start = fixed_index(L["start"]); goal = any_index(L["goal"])
if start is None: sys.exit("start is not on a fixed block")
if goal is None: sys.exit("goal is not on a block")
plate_tiles = {}
for pid, c in plates.items():
    i = fixed_index(c)
    if i is None: problems.append(f"plate {pid} not on a fixed block")
    elif not BL[i]["walk"]: problems.append(f"plate {pid} on a non-walkable block")
    else: plate_tiles[i] = pid
init_free = tuple(initial(groups[g]) for g in free)

# ---------------- static checks
seen_cells = {}
for i, b in enumerate(BL):
    if not b.get("g"):
        k = tuple(b["p"])
        if k in seen_cells: problems.append(f"duplicate fixed block at {list(k)}")
        seen_cells[k] = i
for h in L.get("hints", []):
    t = h["target"]
    if t != "goal" and t not in groups and t not in plates: problems.append(f"hint target unknown: {t}")
    for pid in h.get("pressed", []) + h.get("unpressed", []):
        if pid not in plates: problems.append(f"hint names unknown plate {pid}")
    if "reach" in h and any_index(h["reach"]) is None: problems.append(f"hint cell does not exist: {h['reach']}")
if "ending" in L and any_index(L["ending"]["tree"]) is None: problems.append("ending tree is not on a block")
for t in L.get("texts", []):
    if fixed_index(t["at"]) is None: problems.append(f"story text on unknown cell {t['at']}")
for c in L.get("sushi", []) + L.get("collectibles", []):
    i = fixed_index(c)
    if i is None or not BL[i]["walk"]: problems.append(f"collectible not on a fixed walkable block: {c}")
for d in L.get("decor", []):
    if d.get("to") and any_index(d["to"]) is None: problems.append(f"decor link ends on no block: {d['to']}")
    if d.get("g") and d["g"] not in groups: problems.append(f"decor on unknown group {d['g']}")
for g in L["groups"]:
    if g.get("handle") and not g.get("locked") and not any(d.get("g") == g["id"] and d["t"] in ("crank", "handle") for d in L.get("decor", [])):
        problems.append(f"group {g['id']} has no crank/handle decor")
init_state = derive(dict(zip(free, init_free)), frozenset())
if build(init_state) is None: problems.append("initial state has overlapping blocks")
elif start not in build(init_state)[1]: problems.append("start block is covered")

# ---------------- search
def apply_plate(free_key, pressed, tile):
    if tile in plate_tiles and plate_tiles[tile] not in pressed:
        return pressed | {plate_tiles[tile]}
    return pressed

def full(free_key, pressed): return derive(dict(zip(free, free_key)), pressed)

def solve(frozen=None):
    """BFS; frozen = group that may not be moved (essential-mechanism check)."""
    s0 = (init_free, frozenset(), start)
    q = deque([s0]); prev = {s0: None}; found = None
    while q:
        k, pr, t = q.popleft()
        if t == goal and found is None:
            found = (k, pr, t)
            if frozen is not None: return found, prev
            continue
        st = full(k, pr)
        r = build(st)
        nxt = []
        for b, _ in r[0][t]:
            pr2 = apply_plate(k, pr, b)
            st2 = full(k, pr2)
            r2 = build(st2)
            if r2 is None: problems.append(f"collision after plate in state {st2}"); continue
            if b not in r2[1]: continue
            nxt.append(((k, pr2, b), ("walk", BL[b]["p"])))
        for g in draggable:
            if g == frozen: continue
            gi = free.index(g)
            for s in gstates(groups[g]):
                if s == k[gi]: continue
                k2 = list(k); k2[gi] = s; k2 = tuple(k2)
                st2 = full(k2, pr); r2 = build(st2)
                if r2 is None or t not in r2[1]: continue
                lo, hi = sorted((k[gi], s)); ok = True
                for m in range(lo, hi + 1):   # sweep: other groups keep their old values while dragging
                    mid = dict(st); mid[g] = m
                    if build(mid) is None: ok = False; break
                if ok: nxt.append(((k2, pr, t), (g, s)))
        for n, act in nxt:
            if n not in prev: prev[n] = ((k, pr, t), act); q.append(n)
    return found, prev

found, prev = solve()
ill = set()
for (k, pr, t) in prev:
    adj, tiles = build(full(k, pr))
    for a, lst in adj.items():
        for b, tt in lst:
            if tt: ill.add((min(a, b), max(a, b), tt))
if not QUIET:
    for a, b, tt in sorted(ill): print("ILLUSION", BL[a]["p"], "<->", BL[b]["p"], "t=", tt)
for p in sorted(set(problems)): print("PROBLEM", p)
if not found:
    print("NOT SOLVABLE"); sys.exit(1)
steps = []; cur = found
while prev[cur]: cur, act = prev[cur][0], prev[cur][1]; steps.append(act)
steps.reverse()
mech = [s for s in steps if s[0] != "walk"]
print(f"SOLVABLE: {len(steps)} actions, {len(mech)} mechanism moves, {len(prev)} states, "
      f"{len(gids)} groups ({len(draggable)} draggable, {len(derived)} triggered), {len(plates)} plates, {len(ill)} illusions")
if ESSENTIAL:
    for g in draggable:
        f2, _ = solve(frozen=g)
        print(f"  without {g}: {'still solvable' if f2 else 'unsolvable (essential)'}")
if not QUIET:
    for a in steps:
        if a[0] == "walk": print("   walk", a[1], "* PLATE" if tuple(a[1]) in plates.values() else "")
        else: print(f" > {a[0]} -> {a[1]}")
sys.exit(2 if problems else 0)
