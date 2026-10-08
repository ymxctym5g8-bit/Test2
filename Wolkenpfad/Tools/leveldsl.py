# Small building kit for Wolkenpfad levels (used by Tools/levels/chNN.py).
#
#   from leveldsl import Level
#   L = Level("Chapter 4 · The Hum in the Attic", theme="attic", ill={(3, 4, 0), (0, 1, -3)})
#   L.floor(0, 3, 0, 3, y=0, m="wood")             # walkable 4x4 floor at y=0 (x 0..3, z 0..3)
#   L.block((5, 1, 2), "stone", walk=True)
#   L.rotator("bridge", pivot=(4, 0, 0)); L.decor("crank", (4, -1, 0), g="bridge", face="+x")
#   ...
#   L.save()   # writes Wolkenpfad/Level/levelNN.json (path from the chapter number)
#
# Coordinates: x right-forward, z left-forward, y up. The camera looks along -(1,1,1);
# cells whose difference is a multiple of (1,1,1) overlap on screen (that is how the
# impossible connections work). A block "walk=True" is a tile if the cell above is empty.
import json, os

MATERIALS = {
    "grass", "moss", "stone", "stonedark", "rock", "rockdark", "wood", "teal", "tealdark", "tealtop",
    "water", "raft", "gate", "light", "glass", "ghost", "cloud", "petal", "brass",
}
DECOR = {
    # nature
    "tree", "bush", "flowers", "grass", "tallgrass", "mushroom", "rock", "bamboo", "vine", "oak", "bellflower",
    "butterflies", "cloudpuff", "pond", "waterfall",
    # built things
    "lantern", "torii", "millwheel", "windmill", "house", "chest", "beam", "notebook", "letters", "scaffold",
    "rope", "pennant", "pillar", "gear", "mirror", "vent", "lightshaft", "harpstring", "windharp",
    # beings
    "kodama", "oldwoman", "guardian", "projection", "giantface",
    # mechanics & goal
    "crank", "handle", "altar",
}
GOAL_ITEMS = {"seed", "harp", "letter", "feather", "gear", "prism", "lamp", "string", "heart", "bell"}
THEMES = {"meadow", "river", "lanterns", "attic", "mist", "grassvale", "mill", "storm", "glasslake", "bellflower",
          "giant", "sunbeam", "bridgeworks", "skygarden", "ruins", "echo", "heart", "horizon"}
HERE = os.path.dirname(os.path.abspath(__file__))


class Level:
    def __init__(self, name, theme, chapter, ill=()):
        assert theme in THEMES, theme
        self.name, self.theme, self.chapter = name, theme, chapter
        self.ill = {tuple(c) for c in ill}
        self.B, self.D, self.groups, self.plates, self.triggers = [], [], [], [], []
        self.hints, self.texts = [], []
        self.start = self.goal = None
        self.ending = None
        self.goal_item = "seed"

    # ------------------------------------------------------------ blocks
    def block(self, p, m, walk=False, stair=None, g=None):
        assert m in MATERIALS, m
        assert stair in (None, "+x", "-x", "+z", "-z"), stair
        b = {"p": [int(c) for c in p], "m": m, "walk": bool(walk)}
        if tuple(p) in self.ill: b["ill"] = True
        if stair: b["stair"] = stair
        if g: b["g"] = g
        self.B.append(b)
        return b

    def column(self, x, z, top, bottom, top_m, body_m=None, walk=True, g=None):
        """Stack from y=bottom up to y=top; only the top block is walkable."""
        for y in range(bottom, top + 1):
            self.block((x, y, z), top_m if y == top else (body_m or top_m), walk and y == top, g=g)

    def floor(self, x0, x1, z0, z1, y, m, walk=True, under=None, depth=1, skip=(), g=None):
        """Rectangle of blocks at height y (inclusive ranges); optional supporting layers below."""
        for x in range(x0, x1 + 1):
            for z in range(z0, z1 + 1):
                if (x, z) in skip: continue
                self.block((x, y, z), m, walk, g=g)
                for k in range(1, depth + 1):
                    if under: self.block((x, y - k, z), under, g=g)

    def stair(self, p, d, m="stone", support=None, g=None):
        """Stair rising towards direction d ('+x','-x','+z','-z'); occupies cell p."""
        self.block(p, m, True, stair=d, g=g)
        if support: self.block((p[0], p[1] - 1, p[2]), support, g=g)

    # ------------------------------------------------------------ decor
    def decor(self, t, p, s=1.0, g=None, r=0.0, **kw):
        assert t in DECOR, t
        d = {"t": t, "p": [int(c) for c in p], "s": float(s), "r": float(r)}
        if g: d["g"] = g
        for k, v in kw.items():
            d[k] = list(v) if isinstance(v, tuple) else v
        self.D.append(d)
        return d

    # ------------------------------------------------------------ mechanisms
    def rotator(self, gid, pivot, step=0, minStep=None, maxStep=None, locked=False, handle=None):
        g = {"id": gid, "kind": "rotate", "pivot": list(pivot), "step": step}
        if minStep is not None: g["minStep"] = minStep
        if maxStep is not None: g["maxStep"] = maxStep
        if locked: g["locked"] = True
        if handle: g["handle"] = list(handle)
        self.groups.append(g)

    def slider(self, gid, axis, value=0, min=0, max=1, locked=False, handle=None):
        g = {"id": gid, "kind": "slide", "axis": list(axis), "value": value, "min": min, "max": max}
        if locked: g["locked"] = True
        if handle: g["handle"] = list(handle)
        self.groups.append(g)

    def plate(self, pid, at): self.plates.append({"id": pid, "at": list(at)})

    def trigger(self, group, value, plates=(), states=None):
        t = {"group": group, "value": value}
        if plates: t["plates"] = list(plates)
        if states: t["states"] = dict(states)
        self.triggers.append(t)

    # ------------------------------------------------------------ story
    def hint(self, target, reach=None, pressed=None, unpressed=None):
        h = {"target": target}
        if reach: h["reach"] = list(reach)
        if pressed: h["pressed"] = list(pressed)
        if unpressed: h["unpressed"] = list(unpressed)
        self.hints.append(h)

    def text(self, at, s): self.texts.append({"at": list(at), "text": s})

    def end(self, text, tree, spirits):
        self.ending = {"text": text, "tree": list(tree), "spirits": [list(s) for s in spirits]}

    # ------------------------------------------------------------ output
    def data(self):
        assert self.start and self.goal and self.ending, "start, goal and ending are required"
        assert self.goal_item in GOAL_ITEMS, self.goal_item
        lvl = {"name": self.name, "theme": self.theme, "chapter": self.chapter, "start": list(self.start), "goal": list(self.goal),
               "goalItem": self.goal_item, "groups": self.groups, "blocks": self.B, "decor": self.D, "texts": self.texts,
               "plates": self.plates, "triggers": self.triggers, "hints": self.hints, "ending": self.ending}
        return lvl

    def save(self, path=None):
        path = path or os.path.join(HERE, "..", "Wolkenpfad", "Level", f"level{self.chapter}.json")
        json.dump(self.data(), open(path, "w"), indent=1, ensure_ascii=False)
        print(f"{os.path.basename(path)}: {len(self.B)} blocks, {len(self.D)} decor, {len(self.groups)} groups")
        return path
