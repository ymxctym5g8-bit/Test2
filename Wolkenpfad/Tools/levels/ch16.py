# Chapter 16 · Echoes of the Past  (Act III, theme "echo")
# Grandfather's memories glow in the night as projections. Paths of memory (ghost blocks, locked
# groups) surface when memory stones are pressed (plate triggers) or when the old magic lantern
# ("lantern") shines the right way (state triggers). Three turntables ("first", "second", "third"),
# a lift of memories ("memory") and one impossible step through a remembered doorway.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 16 · Echoes of the Past", theme="echo", chapter=16)
L.goal_item = "heart"
HIDE = 10


def ghost(gid, cells, plates=(), states=None):
    L.slider(gid, (0, 1, 0), value=0, min=0, max=HIDE, locked=True)
    for c in cells:
        L.block((c[0], c[1] - HIDE, c[2]), "ghost", True, g=gid)
    L.trigger(gid, HIDE, plates=plates, states=states)


def through(a, d, t): return (a[0] + d[0] + t, a[1] + d[1] + t, a[2] + d[2] + t)


I1a = (-7, 3, -7); I1b = through(I1a, (-1, 0, 0), 2)          # the remembered doorway
L.ill = {I1a, I1b}

# ---------------------------------------------------------------- start and the first turntable
island(L, [(6, 2), (6, 3), (7, 3), (7, 4)], 0, top="moss", under="rock")
L.start = (7, 0, 4)
hub(L, "first", (3, 0, 2), step=1, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(5, 2)], 0, top="moss", depth=2)                                      # east
island(L, [(3, 4), (3, 5), (2, 5)], 0, top="moss")                               # south: memory stone
L.plate("m1", (2, 0, 5))
island(L, [(1, 2), (0, 2), (0, 3)], 0, top="moss")                               # west: memory stone
L.plate("m2", (0, 0, 3))
island(L, [(3, 0), (3, -1)], 0, top="stone", under="stonedark")                  # north
ghost("path1", [(3, 0, -2), (3, 0, -3)], plates=["m1", "m2"])
island(L, [(3, -4), (2, -4)], 0, top="stone", under="stonedark")

# ---------------------------------------------------------------- the lift of memories
lift(L, "memory", (1, 0, -4), value=3, lo=0, hi=3, depth=2, top="tealtop", body="ghost", bodydark="ghost")
island(L, [(1, -3)], 1, top="moss", under="stone", depth=1)                      # a ledge of small memories
L.plate("m7", (1, 1, -3))
island(L, [(1, -5), (1, -6)], 2, top="stone", under="stone", depth=1)
L.plate("m3", (1, 2, -6))
island(L, [(0, -4), (-1, -4)], 3, top="stone", under="stone", depth=1)          # the gallery of memories

# ---------------------------------------------------------------- the magic lantern
L.rotator("lantern", (4, 3, -7), step=0)
L.block((4, 3, -7), "brass", g="lantern"); L.block((4, 2, -7), "stone", g="lantern")
L.decor("projection", (4, 3, -7), 1.0, g="lantern")
L.decor("crank", (4, 2, -7), g="lantern", face="+z")
for y in range(-1, 2): L.block((4, y, -7), "stone" if y > -1 else "stonedark")
ghost("path2", [(-2, 3, -4)], states={"lantern": 1})
island(L, [(-3, -4)], 3, top="moss", under="stone", depth=1)                     # a memory of the attic
L.plate("m4", (-3, 3, -4))
ghost("path3", [(-1, 3, -5), (-1, 3, -6)], states={"lantern": 3})
island(L, [(-1, -7), (-2, -7)], 3, top="stone", under="stone", depth=1)

# ---------------------------------------------------------------- the second turntable
hub(L, "second", (-4, 3, -7), step=2, armm="stone", top="tealtop", face="+x", depth=2)
island(L, [(-4, -5)], 3, top="moss", under="stone", depth=1)                     # south: memory stone
L.plate("m5", (-4, 3, -5))
island(L, [(-4, -9), (-5, -9)], 3, top="moss", under="stone", depth=1)           # north: memory stone
L.plate("m6", (-5, 3, -9))
island(L, [(-6, -7), (-7, -7)], 3, top="stone", under="stone", depth=1)          # west: the remembered doorway
for y in range(4, 7): L.block((-8, y, -8), "stone")                              # door frame (fixed, decorative)
L.decor("lantern", (-8, 6, -8), 0.8)

# ---------------------------------------------------------------- remembered terrace (y = 5)
island(L, [I1b[0::2], (-6, -4), (-6, -3)], 5, top="stone", under="stone", depth=1)
ghost("path4", [(-5, 5, -3), (-4, 5, -3)], states={"lantern": 2})
island(L, [(-2, -3)], 5, top="moss", under="stone", depth=1)
L.slider("drift", (0, 0, -1), value=0, min=0, max=2)                             # a drifting fragment of memory
L.block((-3, 5, -1), "ghost", True, g="drift"); L.decor("handle", (-3, 5, -1), g="drift", axis="z")

# ---------------------------------------------------------------- the third turntable and the heart
hub(L, "third", (0, 5, -3), step=0, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(0, -5), (0, -6)], 5, top="moss", under="stone", depth=1)             # north: memory stone
L.plate("m8", (0, 5, -6))
island(L, [(0, -1), (0, 0)], 5, top="moss", under="stone", depth=1)              # south: memory stone
L.plate("m9", (0, 5, 0))
island(L, [(2, -3)], 5, top="stone", under="stone", depth=1)                     # east
ghost("path5", [(2, 5, -2), (2, 5, -1)], plates=["m3", "m4", "m5", "m6", "m7", "m8", "m9"], states={"lantern": 1, "second": 0})
island(L, [(2, 0), (3, 0), (3, 1)], 5, top="grass", under="stone", depth=2)
L.goal = (3, 5, 0)
L.decor("altar", L.goal)
L.block((3, 5, -1), "moss"); L.block((3, 4, -1), "stone")                       # where the tree grows

# ---------------------------------------------------------------- memories and dressing
L.decor("projection", (6, 0, 3), 0.9); L.decor("projection", (-6, 5, -4), 0.8)
L.decor("projection", (-6, 5, -3), 0.9); L.decor("projection", (0, 5, -5), 0.8)
L.decor("kodama", (3, 0, 5), 0.8); L.decor("tree", (7, 0, 3), 0.9, variant=4)
L.decor("flowers", (1, 0, 2), 0.7); L.decor("notebook", (-1, 3, -4), 0.7)
L.decor("lantern", (2, 0, -4), 0.8)
L.decor("tree", (2, 5, 0), 0.8, variant=4)

# ---------------------------------------------------------------- story
L.text((7, 0, 4), "At night the islands remember. Grandfather walks here as a gentle light.")
L.text((3, 0, 5), "A memory stone: his laugh, as warm as bread from the oven.")
L.text((3, 0, -4), "The path appears the way a name comes back – all at once.")
L.text((-3, 3, -4), "The attic, years ago. A small girl asleep among the maps.")
L.text((-7, 3, -7), "This door led somewhere once. It still remembers where.")
L.text((-6, 5, -4), "The lantern shows what was. Hana walks where it shines.")
L.text((0, 5, 0), "'Every wind I mended,' he says, 'I mended for you.'")
L.hint("goal", reach=(2, 5, -3))
L.hint("second", reach=(2, 5, -3), pressed=["m8", "m9"])
L.hint("lantern", reach=(2, 5, -3), pressed=["m8", "m9"])
L.hint("third", reach=(-2, 5, -3))
L.hint("drift", reach=(-6, 5, -3))
L.hint("lantern", reach=(-6, 5, -3))
L.hint("second", reach=(-2, 3, -7))
L.hint("lantern", reach=(0, 3, -4))
L.hint("memory", reach=(2, 0, -4))
L.hint("first")
L.end("The memories settle like snow. Hana is not alone – she never was.",
      (3, 5, -1), [(7, 0, 4), (3, 0, 5), (0, 0, 3), (1, 2, -6), (-3, 3, -3), (-4, 3, -5), (-6, 5, -4), (0, 5, 0)])
L.save()
