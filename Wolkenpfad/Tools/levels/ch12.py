# Chapter 12 · The Maze of Sunbeams  (Act II, theme "sunbeam")
# A sunset maze of floating terraces. Three sun mirrors on tall pillars ("m1", "m2", "m3") catch the
# last light. Bridges of light (locked groups) appear only while two mirrors point the right way
# (state triggers) – and every bridge wants a different pair. A sundial turntable ("dial") in the
# middle of the maze hides two sun stones that open the last gate.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 12 · The Maze of Sunbeams", theme="sunbeam", chapter=12)
L.goal_item = "prism"
HIDE = 10   # light bridges wait this far below until the mirrors call them


def light_bridge(gid, cells, cond):
    L.slider(gid, (0, 1, 0), value=0, min=0, max=HIDE, locked=True)
    for c in cells:
        L.block((c[0], c[1] - HIDE, c[2]), "light", True, g=gid)
    L.trigger(gid, HIDE, states=cond)


def mirror(gid, top, face):
    x, y, z = top
    L.rotator(gid, top, step=0)
    L.block(top, "brass", g=gid)
    L.block((x, y - 1, z), "stone", g=gid)
    L.decor("mirror", top, 1.0, g=gid)
    L.decor("crank", (x, y - 1, z), g=gid, face=face)
    for yy in range(y - 4, y - 1):
        L.block((x, yy, z), "stone" if yy > y - 4 else "stonedark")


# ---------------------------------------------------------------- start and the ferry of sunlight
island(L, [(8, 6), (8, 5)], 0, top="stone", under="stonedark")
L.start = (8, 0, 5)
L.slider("ferry", (1, 0, 0), value=1, min=0, max=1)
L.block((6, 0, 6), "raft", True, g="ferry"); L.block((6, -1, 6), "wood", g="ferry")
L.decor("handle", (6, 0, 6), g="ferry", axis="x")
island(L, [(5, 6), (5, 5)], 0, top="stone", under="stonedark")                 # P0

# ---------------------------------------------------------------- the maze of terraces and light bridges
mirror("m1", (3, 1, 4), "+z")
mirror("m2", (-1, 1, 1), "+z")
mirror("m3", (-3, 4, -9), "+x")
light_bridge("lb1", [(5, 0, 4), (5, 0, 3)], {"m1": 1, "m2": 1})
island(L, [(5, 2), (4, 2)], 0, top="stone", under="stonedark")                 # P1
light_bridge("lb2", [(3, 0, 2), (2, 0, 2)], {"m2": 2, "m3": 1})
island(L, [(1, 2), (1, 1)], 0, top="stone", under="stonedark")                 # P2: south of the sundial

hub(L, "dial", (1, 0, -1), step=0, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(3, -1), (4, -1)], 0, top="stone", under="stonedark")               # east: sun stone
L.plate("h1", (4, 0, -1))
island(L, [(-1, -1), (-2, -1)], 0, top="stone", under="stonedark")             # west: sun stone
L.plate("h2", (-2, 0, -1))
island(L, [(1, -3), (1, -4)], 0, top="stone", under="stonedark")               # north

light_bridge("lb3", [(0, 0, -4), (-1, 0, -4)], {"m1": 3, "m3": 3})
island(L, [(-2, -4), (-2, -5)], 0, top="stone", under="stonedark")             # P3
lift(L, "lift", (-3, 0, -5), lo=0, hi=3, depth=2)
island(L, [(-4, -5), (-5, -5)], 3, top="stone", under="stonedark")             # P4 (upper terrace)
light_bridge("lb4", [(-5, 3, -6), (-5, 3, -7)], {"m1": 0, "m2": 3})
island(L, [(-5, -8), (-4, -8)], 3, top="stone", under="stonedark")             # P5
light_bridge("lb5", [(-5, 3, -9), (-5, 3, -10)], {"m2": 0, "m3": 2})
island(L, [(-5, -11), (-6, -11)], 3, top="stone", under="stonedark")           # P6
light_bridge("lb6", [(-7, 3, -11), (-8, 3, -11)], {"m1": 2, "m3": 0})
island(L, [(-9, -11), (-9, -12), (-10, -11)], 3, top="grass", under="stonedark")
L.goal = (-9, 3, -12)
L.decor("altar", L.goal)
L.slider("veil", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-9, 4, -12), "light", g="veil")
L.trigger("veil", 2, plates=["h1", "h2"])

# ---------------------------------------------------------------- dressing
for c in [(8, 0, 6), (5, 0, 6), (4, 0, 2), (1, 0, 2), (3, 0, -1), (-2, 0, -4), (-4, 3, -8), (-6, 3, -11)]:
    L.decor("lightshaft", c, 0.9)
L.decor("tree", (-10, 3, -11), 1.0, variant=2)
L.decor("flowers", (-9, 3, -11), 0.8); L.decor("lantern", (1, 0, -4), 0.8)
L.decor("butterflies", (-5, 3, -5), 0.9)
for p in [(7, 0, 3), (-3, 0, 1)]:
    for y in range(-2, 3): L.block((p[0], y, p[2]), "stone" if y > -2 else "stonedark")
    L.decor("pillar", (p[0], 2, p[2]), 0.8)

# ---------------------------------------------------------------- story
L.text((8, 0, 5), "The sun hangs low and will not set until the maze is solved.")
L.text((5, 0, 2), "Light that is caught twice can carry a girl across the sky.")
L.text((1, 0, 1), "An old sundial. Its shadow points at two forgotten stones.")
L.text((-2, 0, -4), "Each bridge remembers only the mirrors that made it.")
L.text((-5, 3, -8), "The light bends, and bends again, like a river looking for the sea.")
L.text((-6, 3, -11), "Beyond the last bridge, something glitters like a drop of dawn.")
L.hint("goal", reach=(-6, 3, -11), pressed=["h1", "h2"])
L.hint("m1", reach=(-5, 3, -11))
L.hint("m2", reach=(-5, 3, -8))
L.hint("m1", reach=(-5, 3, -5))
L.hint("lift", reach=(-2, 0, -5))
L.hint("m3", reach=(1, 0, -4), pressed=["h1", "h2"])
L.hint("dial", reach=(1, 0, 1))
L.hint("m2", reach=(4, 0, 2))
L.hint("m1", reach=(5, 0, 5))
L.hint("ferry")
L.end("The sun finally sets, and the maze keeps a little of its light for the night.",
      (-10, 3, -11), [(8, 0, 5), (5, 0, 2), (1, 0, 1), (4, 0, -1), (-2, 0, -4), (-5, 3, -8), (-6, 3, -11)])
L.save()
