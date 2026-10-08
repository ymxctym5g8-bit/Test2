# Erzeugt Kapitel II: Das Lied des Flusses. Aufruf: python3 Tools/generate_level2.py Wolkenpfad/Level/level2.json
import json, sys
B = []; D = []
ILL = {(-1, 3, -4), (0, 5, 1)}   # erlaubte unmögliche Verbindung
def blk(p, m, walk=False, stair=None, g=None):
    b = {"p": list(p), "m": m, "walk": walk}
    if tuple(p) in ILL: b["ill"] = True
    if stair: b["stair"] = stair
    if g: b["g"] = g
    B.append(b)
def col(x, z, top, bottom, m="stone", dark="stonedark"):
    for y in range(bottom, top + 1): blk((x, y, z), m if y > bottom + 1 else dark)
def dec(t, p, s=1.0, g=None, r=0.0, **kw):
    d = {"t": t, "p": list(p), "s": s, "r": r}
    if g: d["g"] = g
    d.update(kw); D.append(d)

# ---------- A: Mühleninsel (Start) ----------
for x in range(-1, 3):
    for z in range(2, 6):
        if (x, z) in [(-1, 2)]: continue
        walk = (x, z) not in [(-1, 5), (2, 5)]
        blk((x, 0, z), "grass", walk)
for x in range(-1, 3):
    for z in range(2, 6):
        if (x, z) in [(-1, 2), (-1, 5)]: continue
        blk((x, -1, z), "rock")
for x in range(0, 2):
    for z in range(3, 5): blk((x, -2, z), "rockdark")
blk((1, -3, 4), "rockdark")
dec("tree", (-1, 0, 5), 1.15, variant=3); dec("bamboo", (2, 0, 5), 1.0)
dec("millwheel", (0, 0, 5), 1.0, face="+z")
dec("flowers", (-1, 0, 3)); dec("grass", (1, 0, 5)); dec("lantern", (0, 0, 2)); dec("mushroom", (1, 0, 3))

# Fluss mit Floß
for x in range(3, 7):
    for z in range(1, 4):
        if (x, z) in [(5, 1), (6, 1)]: continue
        blk((x, -1, z), "water")
        blk((x, -2, z), "rock" if z != 2 else "rockdark")
dec("waterfall", (6, -1, 3), 1.0, face="+z")
blk((3, 0, 2), "raft", True, g="raft")
dec("handle", (3, 0, 2), 1.0, g="raft", axis="x")

# ---------- B: Ostufer ----------
for p in [(7, 0, 2), (7, 0, 1), (7, 0, 3)]:
    blk(p, "grass", p != (7, 0, 3))
    blk((p[0], -1, p[2]), "rock"); blk((p[0], -2, p[2]), "rockdark")
dec("tree", (7, 0, 3), 0.9, variant=3)
blk((6, 1, 1), "stone", True, stair="-x"); blk((6, 0, 1), "stone"); blk((6, -1, 1), "stonedark")
# Treppenabsatz
for p in [(5, 1, 1), (5, 1, 0)]:
    blk(p, "stone", True); blk((5, 0, p[2]), "stone"); blk((5, -1, p[2]), "stonedark")
dec("lantern", (5, 1, 1))
blk((6, 1, 0), "stone"); blk((6, 0, 0), "stone"); blk((6, -1, 0), "stonedark")
dec("bush", (6, 1, 0), 0.8)

# ---------- Drehkreuz ----------
G = "wheel"
blk((3, 1, 0), "tealtop", True, g=G)
blk((2, 1, 0), "wood", True, g=G); blk((4, 1, 0), "wood", True, g=G)
blk((3, 0, 0), "teal", g=G); blk((3, -1, 0), "teal", g=G); blk((3, -2, 0), "tealdark", g=G)
dec("crank", (3, -1, 0), 1.0, g=G, face="+x")

# ---------- C: Plattform mit Druckplatte ----------
blk((1, 1, 0), "stone", True); col(1, 0, 0, -2)
blk((0, 1, 0), "grass"); col(0, 0, 0, -1)
blk((1, 1, -1), "grass"); col(1, -1, 0, -1)
dec("tree", (0, 1, 0), 0.85, variant=3); dec("flowers", (1, 1, -1), 0.8)

# ---------- D: Fels hinter dem Drehkreuz ----------
blk((3, 1, -2), "stone", True); col(3, -2, 0, -3)
blk((4, 1, -2), "stone"); col(4, -2, 0, -2)
dec("lantern", (4, 1, -2))

# ---------- Aufsteigende Treppe (Druckplatte) ----------
G = "steps"
blk((3, -1, -3), "stone", True, stair="-z", g=G)
blk((3, -2, -3), "stone", g=G); blk((3, -3, -3), "stonedark", g=G)
blk((3, -1, -4), "stone", True, g=G)
blk((3, -2, -4), "stone", g=G); blk((3, -3, -4), "stonedark", g=G)

# ---------- E: obere Brüstung ----------
blk((2, 3, -4), "stone", True, stair="-x")
for y in range(-2, 3): blk((2, y, -4), "stone" if y > -1 else "stonedark")
for x in (1, 0):
    blk((x, 3, -4), "stone", True)
    for y in range(-2, 3): blk((x, y, -4), "stone" if y > -1 else "stonedark")
dec("vine", (1, 3, -4)); dec("lantern", (0, 3, -4))
# Schiene und Schieber
for z in range(-4, 0): blk((-1, 2, z), "stone")
for z in range(-4, 0): blk((-1, 1, z), "stonedark")
blk((-1, 3, -4), "tealtop", True, g="slab")
dec("handle", (-1, 3, -4), 1.0, g="slab", axis="z")

# ---------- F & G: Schrein über den Wolken ----------
for p in [(0, 5, 1), (-1, 5, 1), (0, 5, 2)]:
    blk(p, "grass", p != (0, 5, 2)); blk((p[0], 4, p[2]), "rock")
blk((0, 3, 1), "rockdark")
dec("tree", (0, 5, 2), 0.8, variant=1)
blk((-2, 6, 1), "stone", True, stair="-x"); blk((-2, 5, 1), "stone"); blk((-2, 4, 1), "rock")
for p in [(-3, 6, 1), (-3, 6, 2), (-4, 6, 2), (-4, 6, 1)]:
    blk(p, "grass", True); blk((p[0], 5, p[2]), "rock")
blk((-3, 4, 1), "rockdark"); blk((-4, 4, 2), "rockdark")
blk((-3, 6, 3), "grass"); blk((-3, 5, 3), "rock")
dec("torii", (-3, 6, 1), 1.0, r=1.5708)
dec("altar", (-4, 6, 2), 1.0)
dec("tree", (-3, 6, 3), 1.0, variant=2)
dec("flowers", (-4, 6, 1), 0.8)

level = {
    "name": "Chapter 2 · The Song of the River",
    "theme": "river", "chapter": 2, "goalItem": "seed",
    "start": [0, 0, 4], "goal": [-4, 6, 2],
    "groups": [
        {"id": "raft", "kind": "slide", "axis": [1, 0, 0], "value": 0, "min": 0, "max": 3, "handle": [3, 0, 2]},
        {"id": "wheel", "kind": "rotate", "pivot": [3, 1, 0], "step": 1, "handle": [3, -1, 0]},
        {"id": "steps", "kind": "slide", "axis": [0, 1, 0], "value": 0, "min": 0, "max": 3, "locked": True},
        {"id": "slab", "kind": "slide", "axis": [0, 0, 1], "value": 3, "min": 0, "max": 3, "handle": [-1, 3, -4]},
    ],
    "plates": [{"id": "p1", "at": [1, 1, 0]}],
    "triggers": [{"plates": ["p1"], "group": "steps", "value": 3}],
    "hints": [
        {"reach": [-4, 6, 2], "target": "goal"},
        {"reach": [0, 3, -4], "target": "slab"},
        {"reach": [1, 1, 0], "unpressed": ["p1"], "target": "p1"},
        {"reach": [5, 1, 0], "target": "wheel"},
        {"target": "raft"},
    ],
    "ending": {"text": "The river sings again. Somewhere above, a tower glows.",
               "tree": [-3, 6, 3],
               "spirits": [[1, 0, 3], [7, 0, 2], [5, 1, 1], [1, 1, 0], [3, 1, -2], [0, 3, -4], [0, 5, 1], [-3, 6, 2]]},
    "blocks": B, "decor": D,
    "texts": [
        {"at": [0, 0, 4], "text": "In the evening, the river tells of a second seed."},
        {"at": [7, 0, 2], "text": "What drifts can carry."},
        {"at": [1, 1, 0], "text": "A soft chime – far below, the stone awakens."},
        {"at": [0, 3, -4], "text": "Sometimes you have to step back to move on."},
        {"at": [-3, 6, 1], "text": "The second shrine has waited a long time."},
    ],
}
json.dump(level, open(sys.argv[1], "w"), indent=1, ensure_ascii=False)
print(len(B), "blocks,", len(D), "decor")
