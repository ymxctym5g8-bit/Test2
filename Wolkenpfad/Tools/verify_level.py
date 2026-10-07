# Prüft ein Wolkenpfad-Level: Lösbarkeit (Zustandsraum-Suche über alle Mechanismen,
# Druckplatten und Fahrten), Kollisionen, unmögliche Verbindungen und Hinweis-Regeln.
# Aufruf: python3 Tools/verify_level.py Wolkenpfad/Level/level2.json
import json, sys, itertools
from collections import deque

L = json.load(open(sys.argv[1]))
groups = {g["id"]: g for g in L["groups"]}
gids = list(groups)
DIRS = {"+x": (1, 0, 0), "-x": (-1, 0, 0), "+z": (0, 0, 1), "-z": (0, 0, -1)}
plates = {p["id"]: tuple(p["at"]) for p in L.get("plates", [])}
triggers = L.get("triggers", [])

def rot(v, k):
    x, y, z = v
    for _ in range(k % 4): x, y, z = z, y, -x
    return (x, y, z)

def gstates(g):
    if g["kind"] == "rotate":
        return list(range(g.get("minStep", 0), g.get("maxStep", 3) + 1))
    return list(range(g["min"], g["max"] + 1))

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

cache = {}
def build(key):
    if key in cache: return cache[key]
    st = dict(zip(gids, key))
    cells = {}
    for i, b in enumerate(L["blocks"]):
        p, _ = world(b, st)
        if p in cells: cache[key] = None; return None
        cells[p] = i
    tiles = {}
    for i, b in enumerate(L["blocks"]):
        if not b["walk"]: continue
        p, d = world(b, st)
        if (p[0], p[1] + 1, p[2]) in cells: continue
        tiles[i] = (p, d)
    ports = {}
    for i, (p, d) in tiles.items():
        X, Y, Z = 2 * p[0], 2 * p[1], 2 * p[2]
        if d is None:
            ports[i] = [((X + dx, Y + 1, Z + dz), (dx, 0, dz)) for dx, dz in [(1, 0), (-1, 0), (0, 1), (0, -1)]]
        else:
            dx, _, dz = d
            ports[i] = [((X + dx, Y + 1, Z + dz), (dx, 0, dz)), ((X - dx, Y - 1, Z - dz), (-dx, 0, -dz))]
    adj = {i: [] for i in tiles}
    for a, b in itertools.combinations(sorted(tiles), 2):
        done = False
        for pa, da in ports[a]:
            for pb, db in ports[b]:
                if da != tuple(-c for c in db): continue
                q = tuple(pb[k] - pa[k] for k in range(3))
                if q[0] == q[1] == q[2] and (q[0] == 0 or (L["blocks"][a].get("ill") and L["blocks"][b].get("ill"))):
                    adj[a].append((b, q[0] // 2)); adj[b].append((a, q[0] // 2)); done = True; break
            if done: break
    cache[key] = (adj, tiles)
    return cache[key]

def fixed_index(cell):
    for i, b in enumerate(L["blocks"]):
        if tuple(b["p"]) == tuple(cell) and not b.get("g"): return i
    raise SystemExit(f"kein fester Block bei {cell}")

def any_index(cell):
    try: return fixed_index(cell)
    except SystemExit:
        return next(i for i, b in enumerate(L["blocks"]) if tuple(b["p"]) == tuple(cell))
start = fixed_index(L["start"]); goal = any_index(L["goal"])
plate_tiles = {fixed_index(c): pid for pid, c in plates.items()}
init = tuple(groups[g].get("step", groups[g].get("value", 0)) for g in gids)
draggable = [g for g in gids if not groups[g].get("locked")]

def apply_plate(key, pressed, tile):
    if tile in plate_tiles and plate_tiles[tile] not in pressed:
        pressed = pressed | {plate_tiles[tile]}
        k = list(key)
        for t in triggers:
            if all(p in pressed for p in t["plates"]):
                k[gids.index(t["group"])] = t["value"]
        key = tuple(k)
    return key, pressed

problems = []
for h in L.get("hints", []):
    t = h["target"]
    if t != "goal" and t not in groups and t not in plates: problems.append(f"Hinweisziel unbekannt: {t}")
    for pid in h.get("pressed", []) + h.get("unpressed", []):
        if pid not in plates: problems.append(f"Hinweis nennt unbekannte Platte {pid}")
    if "reach" in h and not any(tuple(b["p"]) == tuple(h["reach"]) for b in L["blocks"]):
        problems.append(f"Hinweis-Feld existiert nicht: {h['reach']}")
if "ending" in L and not any(tuple(b["p"]) == tuple(L["ending"]["tree"]) for b in L["blocks"]):
    problems.append("Finale-Baum steht auf keinem Block")
for c in L.get("sushi", []):
    if not any(tuple(b["p"]) == tuple(c) and b["walk"] and not b.get("g") and not b.get("stair") for b in L["blocks"]):
        problems.append(f"Sushi liegt auf keinem festen, begehbaren Feld: {c}")
for d in L.get("decor", []):
    if d.get("to") and not any(tuple(b["p"]) == tuple(d["to"]) for b in L["blocks"]):
        problems.append(f"Leitung endet auf keinem Block: {d['to']}")
for t in L.get("texts", []):
    if not any(tuple(b["p"]) == tuple(t["at"]) and not b.get("g") for b in L["blocks"]):
        problems.append(f"Erzähltext auf unbekanntem Feld {t['at']}")
for key in itertools.product(*[gstates(groups[g]) for g in gids]):
    if build(key) is None: pass

# Illusionen über alle erreichbaren Zustände sammeln
q = deque([(init, frozenset(), start)]); prev = {(init, frozenset(), start): None}; found = None
while q:
    k, pr, t = q.popleft()
    if t == goal:
        if found is None: found = (k, pr, t)
        continue
    r = build(k)
    nxt = []
    for b, _ in r[0][t]:
        k2, pr2 = apply_plate(k, pr, b)
        if build(k2) is None: problems.append(f"Kollision nach Platte in Zustand {k2}"); continue
        if b not in build(k2)[1]: continue
        nxt.append(((k2, pr2, b), ("gehe", L["blocks"][b]["p"])))
    for g in draggable:
        gi = gids.index(g)
        for s in gstates(groups[g]):
            if s == k[gi]: continue
            k2 = list(k); k2[gi] = s; k2 = tuple(k2)
            r2 = build(k2)
            if r2 is None or t not in r2[1]: continue
            # Bewegung nur, wenn alle Zwischenstellungen kollisionsfrei sind
            lo, hi = sorted((k[gi], s))
            ok = all(build(tuple(v if j != gi else m for j, v in enumerate(k))) is not None for m in range(lo, hi + 1))
            if ok: nxt.append(((k2, pr, t), (g, s)))
    for n, act in nxt:
        if n not in prev: prev[n] = ((k, pr, t), act); q.append(n)

reached = {tuple(L["blocks"][t]["p"]) for (_, _, t) in prev}
for c in L.get("sushi", []):
    if tuple(c) not in reached: problems.append(f"Sushi unerreichbar: {c}")
seen_ill = set()
for (k, pr, t) in prev:
    adj, tiles = build(k)
    for a, lst in adj.items():
        for b, tt in lst:
            if tt and (min(a, b), max(a, b), tt) not in seen_ill:
                seen_ill.add((min(a, b), max(a, b), tt))
                print("ILLUSION", L["blocks"][a]["p"], "<->", L["blocks"][b]["p"], "t=", tt, "bei", dict(zip(gids, k)))
for p in sorted(set(problems)): print("PROBLEM", p)
if not found:
    print("NICHT LÖSBAR"); sys.exit(1)
steps = []; cur = found
while prev[cur]: cur, act = prev[cur][0], prev[cur][1]; steps.append(act)
steps.reverse()
mech = [s for s in steps if s[0] != "gehe"]
print(f"LÖSBAR: {len(steps)} Aktionen, davon {len(mech)} Mechanik-Bedienungen")
last = None
for a in steps:
    if a[0] == "gehe":
        print("   gehe", a[1], "⬤ PLATTE" if tuple(a[1]) in plates.values() else "")
    else:
        print(f" ⚙ {a[0]} → {a[1]}")
