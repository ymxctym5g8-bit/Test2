# Chapter 18 · A New Horizon  (Act III, theme "horizon")
# Golden light, everything in bloom; far below, the village wakes. The finale brings every mechanism
# together: the dawn turntable ("dawn"), the seesaw lifts ("left" / "right"), the sun mirror ("sun")
# with its bridges of light, the noon turntable ("noon") and an impossible step, the hoist with its
# counterweight ("hoist" / "counter"), the dusk turntable ("dusk") and a last drifting cloud
# ("drift"). The horizon gate opens to the chord of the whole day: the sun set, dawn facing home,
# noon facing east and the seesaw balanced.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 18 · A New Horizon", theme="horizon", chapter=18)
L.goal_item = "seed"
HIDE = 10


def light(gid, cells, cond):
    L.slider(gid, (0, 1, 0), value=0, min=0, max=HIDE, locked=True)
    for c in cells:
        L.block((c[0], c[1] - HIDE, c[2]), "light", True, g=gid)
    L.trigger(gid, HIDE, states=cond)


def through(a, d, t): return (a[0] + d[0] + t, a[1] + d[1] + t, a[2] + d[2] + t)


I1a = (-6, 3, -5); I1b = through(I1a, (-1, 0, 0), 2)
L.ill = {I1a, I1b}

# ---------------------------------------------------------------- dawn: start and the first turntable
island(L, [(6, 3), (6, 4), (7, 4)], 0, top="grass")
L.start = (7, 0, 4)
hub(L, "dawn", (3, 0, 1), step=1, armm="wood", top="tealtop", face="+z", depth=2)
island(L, [(5, 1), (5, 2), (5, 3)], 0, top="grass")                                  # east
island(L, [(3, 3), (3, 4), (2, 4)], 0, top="grass")                                  # south: morning stone
L.plate("d1", (2, 0, 4))
island(L, [(1, 1), (0, 1), (0, 2)], 0, top="grass")                                  # west: morning stone
L.plate("d2", (0, 0, 2))
island(L, [(3, -1), (3, -2)], 0, top="stone", under="stonedark")                     # north

# ---------------------------------------------------------------- the seesaw
lift(L, "left", (4, 0, -2), lo=0, hi=3, top="tealtop", body="brass", bodydark="brass")
lift(L, "right", (2, 0, -2), value=3, lo=0, hi=3, locked=True, top="tealtop", body="brass", bodydark="brass")
for k in range(4):
    L.trigger("right", 3 - k, states={"left": k})
island(L, [(5, -2), (6, -2)], 3, top="grass", under="stone", depth=1)                # morning stone
L.plate("d3", (6, 3, -2))
island(L, [(1, -2), (0, -2)], 3, top="stone", under="stone", depth=1)

# ---------------------------------------------------------------- noon: the sun mirror and its bridges
L.rotator("sun", (-3, 2, 2), step=0, minStep=0, maxStep=1)    # the mirror tilts between two positions
L.block((-3, 2, 2), "brass", g="sun"); L.block((-3, 1, 2), "stone", g="sun")
L.decor("mirror", (-3, 2, 2), 1.1, g="sun")
L.decor("crank", (-3, 1, 2), g="sun", face="+z")
for y in range(-2, 1): L.block((-3, y, 2), "stone" if y > -2 else "stonedark")
light("ray1", [(1, 3, -1), (1, 3, 0)], {"sun": 1})
island(L, [(1, 1), (0, 1)], 3, top="grass", under="stone", depth=1)                  # noon stone
L.plate("d4", (0, 3, 1))
light("ray2", [(0, 3, -3), (0, 3, -4)], {"sun": 0})
island(L, [(0, -5), (-1, -5)], 3, top="stone", under="stone", depth=1)

hub(L, "noon", (-3, 3, -5), step=2, armm="wood", top="tealtop", face="+x", depth=2)
island(L, [(-3, -3)], 3, top="grass", under="stone", depth=1)                        # south: noon stone
L.plate("d5", (-3, 3, -3))
island(L, [(-3, -7), (-4, -7)], 3, top="grass", under="stone", depth=1)              # north: noon stone
L.plate("d6", (-4, 3, -7))
island(L, [(-5, -5), (-6, -5)], 3, top="stone", under="stone", depth=1)              # west: the step to the horizon

# ---------------------------------------------------------------- afternoon: the terrace, the hoist and its counterweight
island(L, [I1b[0::2], (-5, -2), (-4, -2)], 5, top="grass", under="stone", depth=1)
L.slider("counter", (0, 3, 0), value=0, min=0, max=1, locked=True)
L.block((-5, 6, -2), "brass", g="counter")
lift(L, "hoist", (-3, 5, -2), lo=0, hi=1, depth=2, top="tealtop", body="brass", bodydark="brass", axis=(0, 3, 0))   # one long pull
L.trigger("counter", 1, states={"hoist": 1})

# ---------------------------------------------------------------- dusk (y = 8)
hub(L, "dusk", (-3, 8, -4), step=0, armm="wood", top="tealtop", face="+x", depth=2)
island(L, [(-1, -4)], 8, top="grass", under="stone", depth=1)                        # east: evening stone
L.plate("d7", (-1, 8, -4))
island(L, [(-3, -6)], 8, top="grass", under="stone", depth=1)                        # north: evening stone
L.plate("d8", (-3, 8, -6))
island(L, [(-5, -4)], 8, top="stone", under="stone", depth=2)                        # west
L.slider("drift", (-2, 0, 0), value=0, min=0, max=1)
L.block((-6, 8, -4), "cloud", True, g="drift")
L.decor("handle", (-6, 8, -4), g="drift", axis="x")
island(L, [(-9, -4), (-9, -3), (-10, -3)], 8, top="grass", under="stone", depth=2)
L.goal = (-10, 8, -3)
L.decor("altar", L.goal)
L.slider("horizon", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-10, 9, -3), "gate", g="horizon")
L.trigger("horizon", 2, plates=["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"],
          states={"sun": 1, "dawn": 3, "noon": 0, "left": 2})
L.block((-10, 8, -4), "grass"); L.block((-10, 7, -4), "stone")                     # where the last tree grows

# ---------------------------------------------------------------- the waking village far below and the blooming world
for (x, z, kind) in [(5, 6, 0), (2, 7, 1), (-2, 6, 0), (8, 1, 1)]:
    for y in (-5, -6): L.block((x, y, z), "grass" if y == -5 else "rock")
    L.decor("house", (x, -5, z), 0.9, variant=kind)
L.block((0, -5, 7), "grass"); L.block((0, -6, 7), "rock"); L.decor("windmill", (0, -5, 7), 1.2, face="+z")
L.decor("tree", (6, 0, 3), 1.0, variant=2); L.decor("flowers", (5, 0, 2), 0.8); L.decor("butterflies", (3, 0, 3), 1.0)
L.decor("flowers", (1, 0, 1), 0.8); L.decor("tallgrass", (3, 0, -1), 0.7); L.decor("flowers", (5, 3, -2), 0.8)
L.decor("lightshaft", (0, 3, -2), 0.9); L.decor("flowers", (1, 3, 1), 0.8); L.decor("bush", (-1, 3, -5), 0.8)
L.decor("flowers", (-3, 3, -7), 0.8); L.decor("butterflies", (-5, 5, -2), 0.9); L.decor("flowers", (-4, 5, -2), 0.7)
L.decor("pennant", (-1, 8, -4), 1.0, to=(-3, 8, -6)); L.block((-11, 8, -3), "grass"); L.block((-11, 7, -3), "stone"); L.decor("windmill", (-11, 8, -3), 1.0, face="+z")
L.decor("flowers", (-9, 8, -3), 0.8)

# ---------------------------------------------------------------- story
L.text((7, 0, 4), "Morning. Far below, the village opens its shutters to a warm new wind.")
L.text((3, 0, 4), "Every island Hana mended is blooming. Some of them wave.")
L.text((6, 3, -2), "Dawn, noon and dusk – the whole day is a single path.")
L.text((0, 3, 1), "The sun mirror turns, and the light goes where it is needed.")
L.text((-5, 5, -3), "There is always one more step than the eye believes.")
L.text((-1, 8, -4), "Evening. Grandfather's notebook has one empty page left.")
L.text((-9, 8, -4), "Beyond the gate: a horizon no one has drawn yet.")
L.hint("goal", reach=(-9, 8, -4), pressed=["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"])
L.hint("left", reach=(-9, 8, -4))
L.hint("drift", reach=(-5, 8, -4))
L.hint("dusk", reach=(-3, 8, -4))
L.hint("hoist", reach=(-5, 5, -3))
L.hint("noon", reach=(-1, 3, -5))
L.hint("sun", reach=(0, 3, -2))
L.hint("left", reach=(3, 0, -2))
L.hint("dawn", reach=(5, 0, 1))
L.hint("dawn")
L.end("Hana plants the last seed at the edge of the world. Tomorrow, a new path begins.",
      (-10, 8, -4), [(7, 0, 4), (3, 0, 4), (0, 0, 2), (6, 3, -2), (0, 3, 1), (-3, 3, -3), (-4, 5, -2), (-1, 8, -4)])
L.save()
