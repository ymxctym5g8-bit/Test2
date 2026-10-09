# Chapter 17 · The Heart of the Clouds  (Act III, theme "heart")
# The great wind harp of the sky, pearlescent pink, turquoise, lavender and ochre. Three harp pegs
# ("peg1", "peg2", "peg3") tune its strings: every string of light (locked group) sounds only for one
# pair of pegs (state triggers). The heart of the clouds opens to a single chord – all three pegs at
# once (one trigger with three states) – and only after Hana has touched every resonance stone.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 17 · The Heart of the Clouds", theme="heart", chapter=17)
L.goal_item = "string"
HIDE = 10


def string(gid, cells, cond):
    L.slider(gid, (0, 1, 0), value=0, min=0, max=HIDE, locked=True)
    for c in cells:
        L.block((c[0], c[1] - HIDE, c[2]), "light", True, g=gid)
    L.trigger(gid, HIDE, states=cond)


def peg(gid, top, face):
    x, y, z = top
    L.rotator(gid, top, step=0, minStep=0, maxStep=1)          # a peg has two positions
    L.block(top, "brass", g=gid); L.block((x + 1, y, z), "brass", g=gid)
    L.block((x, y - 1, z), "stone", g=gid)
    L.decor("crank", (x, y - 1, z), g=gid, face=face)
    for yy in range(y - 4, y - 1):
        L.block((x, yy, z), "stone" if yy > y - 4 else "stonedark")


# ---------------------------------------------------------------- start and the breeze
island(L, [(7, 4), (6, 4), (7, 3)], 0, top="grass", under="rock")
L.start = (7, 0, 4)
L.slider("breeze", (0, 0, 1), value=2, min=0, max=2)
L.block((6, 0, 1), "cloud", True, g="breeze")
L.decor("handle", (6, 0, 1), g="breeze", axis="z")

# ---------------------------------------------------------------- the resonance ring
hub(L, "ring", (3, 0, 1), step=2, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(5, 1)], 0, top="stone", under="stonedark", depth=2)                 # east
island(L, [(3, 3), (3, 4)], 0, top="grass", under="rock")                        # south: resonance stone
L.plate("c1", (3, 0, 4))
island(L, [(3, -1), (4, -1)], 0, top="grass", under="rock")                      # north: resonance stone
L.plate("c2", (4, 0, -1))
island(L, [(1, 1), (0, 1)], 0, top="stone", under="stonedark")                   # west

# ---------------------------------------------------------------- the three pegs and the strings of light
peg("peg1", (1, 2, 3), "+z")
peg("peg2", (-5, 3, 1), "+z")
peg("peg3", (5, 4, -1), "+x")
string("s1", [(-1, 0, 1), (-2, 0, 1)], {"peg1": 1, "peg2": 1})
island(L, [(-3, 1), (-3, 0)], 0, top="stone", under="stonedark")
lift(L, "column", (-3, 0, -1), value=3, lo=0, hi=3, depth=2, top="tealtop", body="stone", bodydark="stonedark")
island(L, [(-4, -1), (-5, -1)], 2, top="stone", under="stone", depth=1)          # resonance stone
L.plate("c3", (-5, 2, -1))
island(L, [(-2, -1), (-1, -1), (0, -1)], 3, top="stone", under="stone", depth=1)
string("s2", [(1, 3, -1), (2, 3, -1)], {"peg2": 0, "peg3": 1})
island(L, [(3, -1), (3, -2)], 3, top="grass", under="stone", depth=1)            # resonance stone
L.plate("c4", (3, 3, -2))
string("s3", [(-2, 3, -2), (-2, 3, -3)], {"peg1": 0, "peg3": 0})
island(L, [(-2, -4), (-1, -4), (0, -4)], 3, top="stone", under="stone", depth=1)
string("s4", [(1, 3, -4), (2, 3, -4)], {"peg1": 1, "peg2": 1, "peg3": 0})
island(L, [(3, -4), (3, -5)], 3, top="grass", under="stone", depth=1)            # resonance stone
L.plate("c5", (3, 3, -5))

# ---------------------------------------------------------------- the heart (y = 4)
L.stair((-3, 4, -4), "-x", m="stone", support="stone")
hub(L, "crown", (-7, 4, -4), step=2, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(-4, -4), (-5, -4)], 4, top="stone", under="stone", depth=1)
L.slider("heart", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-5, 5, -4), "petal", g="heart")
L.trigger("heart", 2, plates=["c1", "c2", "c3", "c4", "c5"], states={"peg1": 0, "peg2": 0, "peg3": 1})
island(L, [(-7, -6), (-7, -7)], 4, top="grass", under="stone", depth=1)          # north: resonance stone
L.plate("c6", (-7, 4, -7))
island(L, [(-7, -2), (-7, -1)], 4, top="grass", under="stone", depth=1)          # south: resonance stone
L.plate("c7", (-7, 4, -1))
island(L, [(-9, -4)], 4, top="stone", under="stone", depth=2)                    # west
L.slider("drift", (0, 0, -1), value=0, min=0, max=2)
L.block((-10, 4, -4), "cloud", True, g="drift")
L.decor("handle", (-10, 4, -4), g="drift", axis="z")
island(L, [(-10, -7), (-11, -7)], 4, top="grass", under="stone", depth=2)
L.goal = (-11, 4, -7)
L.decor("altar", L.goal)
L.slider("veil", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-11, 5, -7), "cloud", g="veil")
L.trigger("veil", 2, plates=["c6", "c7"])
L.block((-11, 4, -8), "grass"); L.block((-11, 3, -8), "stone")                 # where the tree grows

# ---------------------------------------------------------------- the great harp
for y in range(-2, 4): L.block((-1, y, -8), "stone" if y > -2 else "stonedark")
L.decor("windharp", (-1, 3, -8), 3.0)
L.decor("harpstring", (-2, 3, -1), 1.0, to=(0, 3, -1))
L.decor("harpstring", (-2, 3, -4), 1.0, to=(0, 3, -4))
L.decor("cloudpuff", (5, 0, 1), 0.7); L.decor("flowers", (3, 0, 3), 0.8)
L.decor("butterflies", (-7, 4, -6), 0.9); L.decor("cloudpuff", (-9, 4, -4), 0.7)
L.decor("flowers", (0, 0, 1), 0.7)

# ---------------------------------------------------------------- story
L.text((7, 0, 4), "Here, at the heart of the clouds, every wind of the sky is born.")
L.text((3, 0, 4), "A resonance stone hums a single, patient note.")
L.text((-3, 0, 1), "Each string sounds only when two pegs agree.")
L.text((-1, 3, -1), "Grandfather's notebook, last page: a chord, written three times.")
L.text((-1, 3, -4), "Low, low, high. Hana hums the chord under her breath.")
L.text((-9, 4, -4), "The harp is tuned. Now the heart only needs to remember how to beat.")
L.hint("goal", reach=(-9, 4, -4), pressed=["c6", "c7"])
L.hint("crown", reach=(-5, 4, -4))
L.hint("peg1", reach=(-4, 4, -4))
L.hint("peg1", reach=(3, 3, -4))
L.hint("peg2", reach=(-2, 3, -4))
L.hint("peg3", reach=(-2, 3, -1))
L.hint("column", reach=(-3, 0, 0))
L.hint("peg1", reach=(0, 0, 1))
L.hint("ring", reach=(5, 0, 1))
L.hint("breeze")
L.end("The great harp sings again, and a new wind sweeps out across every island of the sky.",
      (-11, 4, -8), [(7, 0, 4), (3, 0, 4), (4, 0, -1), (-5, 2, -1), (3, 3, -2), (3, 3, -5), (-7, 4, -7), (-7, 4, -1)])
L.save()
