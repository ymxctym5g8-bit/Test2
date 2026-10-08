# Chapter 14 · The Ascent to the Sky Garden  (Act III, theme "skygarden")
#
# A tall garden stem rises from a small meadow. Four great leaves (A, B, C, D) turn around
# the stem at heights 4, 8, 12 and 16; they are bridges *and* levers:
#   * the green lift stems on the outside rise when the leaves point the right way
#     (l1 when A faces east, l2 when A and B both face you),
#   * a closed bud on each west ledge opens when its own leaf faces the sunrise (east)
#     while the leaf below bows west,
#   * seen from the right angle, a leaf pointing at you touches the opened bud one storey
#     below (illusions W8 <-> C and W12 <-> D),
#   * the summit stem rises only when all four flower plates are pressed and the whole
#     tower opens toward the viewer like a blossom (all leaves face south).
# Run: python3 Tools/levels/ch14.py
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

ILL = {(2, 12, 0), (-6, 8, -2), (2, 16, 0), (-6, 12, -2)}
L = Level("Chapter 14 · The Ascent to the Sky Garden", theme="skygarden", chapter=14, ill=ILL)
LEAVES = (4, 8, 12, 16)


def leaf(gid, h, step):
    """A leaf bridge turning around the stem: W (2), S (3) or E (4)."""
    L.block((0, h, 0), "tealdark", g=gid)
    L.block((1, h, 0), "petal", True, g=gid)
    L.block((2, h, 0), "petal", True, g=gid)
    L.rotator(gid, (0, h, 0), step=step, minStep=2, maxStep=4)
    L.decor("crank", (0, h, 0), g=gid, face="+z")
    L.decor("flowers", (2, h, 0), 0.55, g=gid)


def lift(gid, x, z, base, rise, n=3):
    L.block((x, base, z), "tealtop", True, g=gid)
    for k in range(1, n):
        L.block((x, base - k, z), "teal" if k < n - 1 else "tealdark", g=gid)
    L.slider(gid, (0, 1, 0), value=0, min=0, max=rise, locked=True)


def ledge(cells, m="grass", depth=2):
    """Small floating garden ledge: walkable top, rock below, tapering."""
    for i, p in enumerate(cells):
        L.block(p, m, True)
        if depth > 0: L.block((p[0], p[1] - 1, p[2]), "rock")
        if depth > 1 and i == 0:
            L.block((p[0], p[1] - 2, p[2]), "rockdark")


def islet(p, tree=None, variant=2, s=0.8, extra=None):
    """Purely decorative floating islet (not walkable)."""
    L.block(p, "grass")
    L.block((p[0], p[1] - 1, p[2]), "rockdark")
    if tree: L.decor(tree, p, s, variant=variant)
    if extra: L.decor(extra, p, 0.8)


# ------------------------------------------------------------------ the stem
for y in range(-3, 20):
    if y in LEAVES: continue
    L.block((0, y, 0), "moss" if y > 0 else "rockdark")
for y in (-1, -2):                            # roots under the meadow
    for x, z in [(-1, 1), (1, -1)]: L.block((x, y, z), "rockdark")

# ------------------------------------------------------------------ meadow (start)
MEADOW_DECOR = {(1, 4), (5, 4), (4, 4)}
for x in range(1, 6):
    for z in range(1, 5):
        L.block((x, 0, z), "water" if (x, z) == (4, 4) else "grass", (x, z) not in MEADOW_DECOR)
        L.block((x, -1, z), "rock")
for x in range(2, 5):
    for z in range(2, 4): L.block((x, -2, z), "rockdark")
L.block((3, -3, 3), "rockdark"); L.block((3, -3, 2), "rockdark"); L.block((3, -4, 3), "rockdark")
L.start = (3, 0, 3)
L.decor("tree", (1, 0, 4), 1.2, variant=2); L.decor("tree", (5, 0, 4), 0.9, variant=1)
L.decor("pond", (4, 0, 4)); L.decor("butterflies", (2, 0, 3)); L.decor("flowers", (2, 0, 1))
L.decor("flowers", (4, 0, 2), 0.8); L.decor("tallgrass", (1, 0, 2), 0.7); L.decor("mushroom", (5, 0, 2))
L.decor("grass", (3, 0, 4)); L.decor("flowers", (1, 0, 3), 0.7)

# ------------------------------------------------------------------ storey 4
lift("l1", 5, 0, 0, 4)
ledge([(4, 4, 0), (3, 4, 0)])
L.block((4, 4, -1), "grass"); L.block((4, 3, -1), "rock")
L.decor("bush", (4, 4, -1), 0.8); L.decor("butterflies", (4, 4, -1), 0.8)
leaf("A", 4, 3)
ledge([(-1, 4, 3), (-1, 4, 4)])
L.decor("vine", (-1, 4, 4))
ledge([(-3, 4, 1), (-3, 4, 0), (-4, 4, 1)])
L.block((-4, 4, 2), "grass"); L.block((-4, 3, 2), "rock")
L.decor("tree", (-4, 4, 2), 0.75, variant=2); L.decor("vine", (-3, 4, 1))
lift("l2", 0, 3, 4, 4)

# ------------------------------------------------------------------ storey 8
leaf("B", 8, 2)
ledge([(-4, 8, 0), (-3, 8, 0), (-5, 8, 0), (-5, 8, -1)])
L.block((-4, 8, 1), "grass"); L.block((-4, 7, 1), "rock")
L.decor("bush", (-4, 8, 1), 0.7); L.decor("butterflies", (-4, 8, 1), 0.7)
L.block((-6, 8, -2), "petal", True, g="bud8"); L.slider("bud8", (1, 0, 0), 0, 0, 1, locked=True)
L.decor("flowers", (-6, 8, -2), 0.5, g="bud8")
ledge([(4, 8, 0), (3, 8, 0)])
L.block((4, 8, 1), "grass"); L.block((4, 7, 1), "rock")
L.decor("tree", (4, 8, 1), 0.7, variant=1); L.decor("vine", (3, 8, 0))

# ------------------------------------------------------------------ storey 12
leaf("C", 12, 4)
ledge([(4, 12, 0), (3, 12, 0), (4, 12, 1)])
L.block((3, 12, 1), "grass"); L.block((3, 11, 1), "rock")
L.decor("flowers", (3, 12, 1)); L.decor("butterflies", (3, 12, 1), 0.9)
ledge([(-4, 12, 0), (-3, 12, 0), (-5, 12, 0), (-5, 12, -1)], "cloud", depth=0)   # garden cloud
L.block((-4, 12, 1), "cloud")
L.decor("tree", (-4, 12, 1), 0.7, variant=2)
L.block((-6, 12, -2), "petal", True, g="bud12"); L.slider("bud12", (1, 0, 0), 0, 0, 1, locked=True)
L.decor("flowers", (-6, 12, -2), 0.5, g="bud12")

# ------------------------------------------------------------------ storey 16
leaf("D", 16, 4)
ledge([(4, 16, 0), (3, 16, 0), (4, 16, 1)])
L.decor("vine", (4, 16, 1))
ledge([(-3, 16, 0), (-4, 16, 0)], "cloud", depth=0)
L.block((-4, 16, 1), "cloud")
L.decor("bush", (-4, 16, 1), 0.7); L.decor("butterflies", (-3, 16, 0), 0.8)
lift("l3", 5, 0, 16, 4)

# ------------------------------------------------------------------ summit garden (y 20)
for x in (-2, -1, 0, 1):
    for z in (-2, -1, 0, 1):
        if (x, z) != (-2, -2): L.block((x, 20, z), "grass")
for p in [(4, 20, 0), (4, 20, -1), (3, 20, -1), (2, 20, -1)]:
    L.block(p, "grass", True); L.block((p[0], 19, p[2]), "rock")
L.block((3, 18, -1), "rockdark")
L.block((3, 20, 0), "grass"); L.block((3, 19, 0), "rock")
L.goal = (2, 20, -1)
L.goal_item = "feather"
L.decor("altar", L.goal)
L.decor("tree", (0, 20, 0), 0.6, variant=2)
L.decor("flowers", (-1, 20, 1), 0.8); L.decor("bush", (-1, 20, -1), 0.8)
L.decor("butterflies", (1, 20, -1)); L.decor("butterflies", (3, 20, 0)); L.decor("lantern", (1, 20, 0), 0.8)
L.decor("tallgrass", (-1, 20, 0), 0.6); L.decor("flowers", (4, 20, -1), 0.6)

# decorative islets around the tower (silhouette)
islet((6, 3, -2), "tree", 1, 0.7)
islet((-5, 10, 2), "tree", 2, 0.75)
islet((4, 14, -3), "tree", 2, 0.7)
islet((-6, 2, 1), None, extra="butterflies")
L.decor("flowers", (-6, 2, 1), 0.7)
islet((-3, 18, 3), None, extra="butterflies")
islet((6, 17, 2), "tree", 1, 0.6)
islet((-7, 13, -2), None, extra="butterflies")
islet((7, 10, 0), "tree", 2, 0.6)
islet((-7, 17, -3), None, extra="butterflies")
islet((-6, 18, 1), None, extra="butterflies")
for x, z in [(2, 1), (4, 1), (2, 4), (5, 2)]: L.block((x, -2, z), "rockdark")
for x, z in [(2, 2), (4, 2), (3, 4)]: L.block((x, -3, z), "rockdark")
for x in (-2, -1, 0, 1):                      # the summit garden's underside
    for z in (-2, -1, 0, 1):
        if (x, z) not in ((0, 0), (-2, -2), (1, 1)): L.block((x, 19, z), "rock")
for x, z in [(-1, -1), (1, -1)]: L.block((x, 18, z), "rockdark")
L.decor("waterfall", (1, 20, 1)); L.decor("tree", (-2, 20, 0), 0.8, variant=1); L.decor("flowers", (-1, 20, -2))
L.decor("cloudpuff", (5, -2, 0), 1.4); L.decor("cloudpuff", (-4, 6, 4), 1.2); L.decor("cloudpuff", (-2, 14, 5), 1.0)

# ------------------------------------------------------------------ plates & triggers
L.plate("pW", (-4, 4, 1)); L.plate("pE", (4, 8, 0)); L.plate("pX", (4, 12, 1)); L.plate("p16", (-4, 16, 0))
L.trigger("l1", 4, states={"A": 4})
L.trigger("l2", 4, states={"A": 3, "B": 3})
L.trigger("bud8", 1, states={"B": 4, "A": 2})
L.trigger("bud12", 1, states={"C": 4, "B": 2})
L.trigger("l3", 4, plates=["pW", "pE", "pX", "p16"], states={"A": 3, "B": 3, "C": 3, "D": 3})

# ------------------------------------------------------------------ story
L.text(L.start, "Grandfather wrote: the sky garden grows where the wind first woke.")
L.text((3, 4, 0), "The great leaves turn, and the green stems remember how to rise.")
L.text((-1, 4, 3), "Two leaves must agree before a stem will carry you.")
L.text((-3, 8, 0), "A bud opens when its leaf greets the dawn and the one below bows west.")
L.text((-3, 12, 0), "Seen from the right place, the leaf above is only one step away.")
L.text((3, 16, 0), "Four flowers sing. Now the whole tower wants to bloom toward you.")
L.text((4, 20, 0), "Up here the wind smells of petals and grandfather's old songs.")
L.end("The sky garden opens its leaves to the wind. Far away, a harp string hums.",
      (0, 20, 0), [(2, 0, 2), (4, 4, 0), (-1, 4, 4), (-4, 12, 0), (4, 16, 1), (-3, 16, 0), (4, 20, 0)])

# ------------------------------------------------------------------ Kiko's hints
L.hint("goal", reach=L.goal)
L.hint("D", reach=(4, 16, 0), pressed=["pW", "pE", "pX", "p16"])
L.hint("p16", reach=(-4, 16, 0), unpressed=["p16"])
L.hint("D", reach=(-4, 12, 0), pressed=["pX"])
L.hint("pX", reach=(4, 12, 1), unpressed=["pX"])
L.hint("C", reach=(-4, 8, 0))
L.hint("pE", reach=(4, 8, 0), unpressed=["pE"])
L.hint("B", reach=(-1, 4, 3), pressed=["pW"])
L.hint("pW", reach=(-4, 4, 1), unpressed=["pW"])
L.hint("A", reach=(3, 4, 0))
L.hint("A")
L.save(os.environ.get("LEVEL_OUT"))
