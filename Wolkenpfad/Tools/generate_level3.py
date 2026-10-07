# Erzeugt Kapitel III: Der Turm der Laternen. Aufruf: python3 Tools/generate_level3.py Wolkenpfad/Level/level3.json
import json, sys
B = []; D = []
ILL = {(6, 7, 2), (1, 3, -2)}   # erlaubte unmögliche Verbindung
def blk(p, m, walk=False, stair=None, g=None):
    b = {"p": list(p), "m": m, "walk": walk}
    if tuple(p) in ILL: b["ill"] = True
    if stair: b["stair"] = stair
    if g: b["g"] = g
    B.append(b)
def dec(t, p, s=1.0, g=None, r=0.0, **kw):
    d = {"t": t, "p": list(p), "s": s, "r": r}
    if g: d["g"] = g
    d.update(kw); D.append(d)

# ---------- Laternenhof (Start) ----------
for x in range(-1, 3):
    for z in range(2, 6):
        walk = (x, z) not in [(-1, 5), (2, 2)]
        blk((x, 0, z), "grass", walk)
        blk((x, -1, z), "rock")
for x in range(0, 2):
    for z in range(3, 5): blk((x, -2, z), "rockdark")
blk((1, -3, 4), "rockdark")
dec("tree", (-1, 0, 5), 1.1, variant=4); dec("tree", (2, 0, 2), 0.8, variant=4)
dec("lantern", (2, 0, 4)); dec("lantern", (-1, 0, 2)); dec("flowers", (1, 0, 5)); dec("grass", (-1, 0, 3))
dec("mushroom", (0, 0, 5))
# Eingang zum Turm (Lücke bei (0,0,1) – der Trittstein muss hineingeschoben werden)
blk((0, 0, 0), "stone", True); blk((0, -1, 0), "stonedark")
for x in range(-3, 1): blk((x, -1, 1), "stonedark")
blk((-3, 0, 1), "tealtop", True, g="stone")
dec("handle", (-3, 0, 1), 1.0, g="stone", axis="x")

# ---------- Der drehbare Turm (Wendeltreppe) ----------
P = (0, 0, -2)
def tb(o, m, walk=False, stair=None):
    blk((P[0] + o[0], P[1] + o[1], P[2] + o[2]), m, walk, stair, g="tower")
for y in range(-2, 3): tb((0, y, 0), "tealdark" if y < 0 else "teal")
for o in [(0, 0, 1)]:
    tb(o, "stone", True); tb((0, -1, 1), "stone"); tb((0, -2, 1), "stonedark")
tb((1, 1, 1), "stone", True, stair="+x"); tb((1, 0, 1), "stone"); tb((1, -1, 1), "stonedark")
tb((2, 1, 1), "stone", True); tb((2, 0, 1), "stone"); tb((2, -1, 1), "stonedark")
tb((2, 2, 0), "stone", True, stair="-z")
for y in (1, 0, -1): tb((2, y, 0), "stone" if y >= 0 else "stonedark")
tb((2, 2, -1), "stone", True)
for y in (1, 0, -1): tb((2, y, -1), "stone" if y >= 0 else "stonedark")
tb((1, 2, -1), "stone", True)
for y in (1, 0, -1): tb((1, y, -1), "stone" if y >= 0 else "stonedark")
tb((0, 3, -1), "stone", True, stair="-x")
for y in (2, 1, 0, -1): tb((0, y, -1), "stone" if y >= 0 else "stonedark")
tb((-1, 3, -1), "stone", True)
for y in (2, 1, 0, -1): tb((-1, y, -1), "stone" if y >= 0 else "stonedark")
# Turmspitze mit Schrein – nur über die Illusion erreichbar
tb((1, 3, 0), "grass", True); tb((1, 2, 0), "stone")
dec("crank", (0, -2, -2), 1.0, g="tower", face="+x")
dec("altar", (1, 3, -2), 1.0, g="tower", r=1.5708)
dec("lantern", (2, 2, -3), 1.0, g="tower")
dec("vine", (1, 3, -2), 0.9, g="tower")

# ---------- Westflügel: schwebender Weg, Drehbrücke, Platte A ----------
for p in [(-2, 3, -1), (-3, 3, -1)]: blk(p, "stone", True)
dec("lantern", (-3, 3, -1))
blk((-5, 3, -1), "tealtop", True, g="rb")
blk((-5, 3, 0), "wood", True, g="rb"); blk((-5, 3, -2), "wood", True, g="rb")
blk((-5, 2, -1), "teal", g="rb"); blk((-5, 1, -1), "tealdark", g="rb")
dec("crank", (-5, 1, -1), 1.0, g="rb", face="+x")
for p in [(-7, 3, -1), (-7, 3, 0), (-8, 3, 0)]:
    blk(p, "grass", p != (-8, 3, 0)); blk((p[0], 2, p[2]), "rock")
blk((-7, 1, 0), "rockdark")
dec("tree", (-8, 3, 0), 0.8, variant=4)

# ---------- Ostflügel: Platte B, Tor und Aufzug ----------
for p in [(2, 3, -1), (3, 3, -1)]: blk(p, "stone", True)
blk((3, 3, 0), "grass"); dec("bush", (3, 3, 0), 0.8)
for y in range(-1, 4): blk((4, y, -1), "tealtop" if y == 3 else "teal", walk=(y == 3), g="lift")
dec("handle", (4, 3, -1), 1.0, g="lift", axis="y")
blk((4, 4, -1), "gate", g="gate")
for y in range(-3, 3): blk((5, y, -1), "stone" if y > -2 else "stonedark")
blk((5, 3, -1), "stone"); dec("lantern", (5, 3, -1))

# ---------- Bambusgarten unten (neuer Start) ----------
for x in range(5, 8):
    for z in range(2, 6):
        if (x, z) in [(7, 2)]: continue
        walk = (x, z) not in [(7, 5), (5, 5)]
        m = "water" if (x, z) in [(7, 3), (7, 4)] else "grass"
        blk((x, -2, z), m, walk and m == "grass")
        blk((x, -3, z), "rock")
for x in range(5, 7):
    for z in range(3, 5): blk((x, -4, z), "rockdark")
blk((6, -5, 4), "rockdark")
dec("bamboo", (7, -2, 5), 1.1); dec("bamboo", (5, -2, 5), 0.9); dec("pond", (7, -2, 3)); dec("waterfall", (7, -2, 4))
dec("lantern", (5, -2, 2)); dec("flowers", (6, -2, 5)); dec("grass", (6, -2, 2))
blk((4, -1, 3), "stone", True, stair="-x"); blk((4, -2, 3), "stone"); blk((4, -3, 3), "stonedark")
blk((3, -1, 3), "stone", True); blk((3, -2, 3), "stonedark")
blk((3, 0, 4), "stone", True, stair="+z"); blk((3, -1, 4), "stone"); blk((3, -2, 4), "stonedark")
blk((3, 0, 5), "stone", True); blk((3, -1, 5), "stone"); blk((3, -2, 5), "stonedark")
dec("lantern", (3, 0, 5))

# ---------- Gipfel ----------
for p in [(4, 7, -2), (5, 7, -1), (6, 7, -1), (6, 7, 0), (6, 7, 1), (6, 7, 2)]:
    blk(p, "stone", True)
for p in [(5, 6, -1), (6, 6, -1), (6, 6, 2), (6, 5, 2)]: blk(p, "stonedark")
blk((5, 7, -2), "grass"); dec("tree", (5, 7, -2), 0.8, variant=2)
blk((7, 7, 0), "stone"); dec("lantern", (7, 7, 0))
dec("vine", (6, 7, 2), 1.0)
blk((4, 6, -2), "stonedark")
for p in [(7, 7, 1), (7, 7, 2)]:
    blk(p, "grass"); blk((p[0], 6, p[2]), "rock")
dec("tree", (7, 7, 1), 0.9, variant=4); dec("flowers", (7, 7, 2), 0.8)
blk((6, 4, 2), "rockdark"); blk((6, 6, 1), "rock"); blk((6, 6, 0), "rock")

level = {
    "name": "Kapitel III · Der Turm der Laternen",
    "theme": "night",
    "start": [6, -2, 4], "goal": [1, 3, -2],
    "groups": [
        {"id": "stone", "kind": "slide", "axis": [1, 0, 0], "value": 0, "min": 0, "max": 3, "handle": [-3, 0, 1]},
        {"id": "tower", "kind": "rotate", "pivot": [0, 0, -2], "step": 0, "handle": [0, 0, -2]},
        {"id": "rb", "kind": "rotate", "pivot": [-5, 3, -1], "step": 0, "handle": [-5, 1, -1]},
        {"id": "gate", "kind": "slide", "axis": [0, 0, 1], "value": 0, "min": 0, "max": 2, "locked": True},
        {"id": "lift", "kind": "slide", "axis": [0, 1, 0], "value": 0, "min": 0, "max": 4, "handle": [4, 3, -1]},
    ],
    "plates": [{"id": "pA", "at": [-7, 3, -1]}, {"id": "pB", "at": [3, 3, -1]}],
    "triggers": [{"plates": ["pA", "pB"], "group": "gate", "value": 2}],
    "hints": [
        {"reach": [1, 3, -2], "target": "goal"},
        {"reach": [6, 7, 2], "target": "tower"},
        {"reach": [3, 3, -1], "pressed": ["pA", "pB"], "target": "lift"},
        {"reach": [-3, 3, -1], "unpressed": ["pA"], "target": "rb"},
        {"reach": [0, 0, 0], "target": "tower"},
        {"target": "stone"},
    ],
    "ending": {"text": "Alle Laternen brennen. Der Wald hat seinen Weg nach Hause gefunden.",
               "tree": [5, 7, -2],
               "spirits": [[0, 0, 4], [1, 0, 3], [-2, 3, -1], [-7, 3, 0], [3, 3, -1], [5, 7, -1], [6, 7, 1], [-1, 0, 3]]},
    "blocks": B, "decor": D,
    "texts": [
        {"at": [6, -2, 4], "text": "In der Nacht leuchten die Laternen nur für die, die suchen."},
        {"at": [0, 0, 3], "text": "Der Hof ist still. Nur ein Trittstein fehlt."},
        {"at": [0, 0, 0], "text": "Ein Turm, der sich dreht, hat viele Türen."},
        {"at": [-7, 3, -1], "text": "Eine Laterne entzündet. Eine zweite fehlt noch."},
        {"at": [3, 3, -1], "text": "Zwei Lichter öffnen jedes Tor."},
        {"at": [6, 7, 2], "text": "Von hier oben sieht der Turm ganz anders aus."},
    ],
}
json.dump(level, open(sys.argv[1], "w"), indent=1, ensure_ascii=False)
print(len(B), "Blöcke,", len(D), "Deko")
