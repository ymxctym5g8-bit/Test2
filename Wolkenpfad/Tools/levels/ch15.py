# Chapter 15 · The Ruins of the First Storm  (Act III, theme "ruins")
# An ancient temple of monolithic pillars, wrecked by the first great storm. Its machines only sleep:
# pressure stones wake them. A stone guardian ("guardian") steps aside once both courtyard stones are
# pressed; the obelisk lift ("obelisk") climbs to the upper hall, where two stone rings are geared
# together – turn the east ring ("ring") and the west ring ("twin") always turns the opposite way.
# A last column ("column") lifts Hana to the storm altar ("altar").
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 15 · The Ruins of the First Storm", theme="ruins", chapter=15)
L.goal_item = "lamp"

# ---------------------------------------------------------------- start and the stone sled
island(L, [(6, 4), (6, 5), (7, 5)], 0, top="stone", under="stonedark")
L.start = (7, 0, 5)
L.slider("sled", (0, 0, 1), value=3, min=0, max=3)
L.block((5, 0, 1), "stone", True, g="sled"); L.block((5, -1, 1), "stonedark", g="sled")
L.decor("handle", (5, 0, 1), g="sled", axis="z")

# ---------------------------------------------------------------- courtyard ring
hub(L, "court", (2, 0, 1), step=3, armm="stone", top="tealtop", face="+z", depth=3)
island(L, [(4, 1), (4, 0)], 0, top="stone", under="stonedark")                    # east
island(L, [(2, 3), (2, 4), (1, 4)], 0, top="moss", under="stonedark")              # south: waking stone
L.plate("w1", (1, 0, 4))
island(L, [(0, 1), (-1, 1), (-1, 0)], 0, top="moss", under="stonedark")            # west: waking stone
L.plate("w2", (-1, 0, 0))
island(L, [(2, -1), (2, -2)], 0, top="stone", under="stonedark")                   # north

# ---------------------------------------------------------------- the obelisk lift and the guardian
lift(L, "obelisk", (3, 0, -2), value=3, lo=0, hi=3, depth=3, top="tealtop", body="stone", bodydark="stonedark")
island(L, [(4, -2), (5, -2)], 2, top="stone", under="stone", depth=1)             # a broken balcony: waking stone
L.plate("w3", (5, 2, -2))
island(L, [(3, -3)], 3, top="stone", under="stone", depth=1)                       # the upper hall door
L.slider("guardian", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((3, 4, -3), "stonedark", g="guardian")
L.decor("guardian", (3, 4, -3), 0.9, g="guardian")
L.trigger("guardian", 2, plates=["w1", "w2"])

# ---------------------------------------------------------------- the geared rings of the upper hall (y = 3)
hub(L, "ring", (3, 3, -5), step=1, armm="stone", top="tealtop", face="+x", depth=2)
L.rotator("twin", (-1, 3, -5), step=3, locked=True)
L.block((-1, 3, -5), "tealtop", True, g="twin"); L.block((0, 3, -5), "stone", True, g="twin")
L.block((-1, 2, -5), "teal", g="twin"); L.block((-1, 1, -5), "tealdark", g="twin")
for k in range(4):
    L.trigger("twin", (k + 2) % 4, states={"ring": k})
island(L, [(5, -5), (6, -5)], 3, top="stone", under="stone", depth=1)             # east of the ring: waking stone
L.plate("w4", (6, 3, -5))
island(L, [(1, -5)], 3, top="stone", under="stone", depth=1)                       # between the rings
island(L, [(-1, -7), (-1, -8)], 3, top="moss", under="stone", depth=1)             # north of the twin: waking stone
L.plate("w5", (-1, 3, -8))
island(L, [(-1, -3), (-2, -3)], 3, top="moss", under="stone", depth=1)             # south of the twin: waking stone
L.plate("w6", (-2, 3, -3))
island(L, [(-3, -5), (-4, -5)], 3, top="stone", under="stone", depth=1)            # west of the twin

# ---------------------------------------------------------------- the column to the storm altar
lift(L, "column", (-5, 3, -5), lo=0, hi=3, depth=2, top="tealtop", body="stone", bodydark="stonedark")
island(L, [(-5, -6)], 5, top="stone", under="stone", depth=1)                      # a ledge on the way: waking stone
L.plate("w7", (-5, 5, -6))
hub(L, "altar", (-7, 6, -5), step=1, armm="stone", top="tealtop", face="+z", depth=2)
island(L, [(-7, -3)], 6, top="moss", under="stone", depth=1)
L.plate("w8", (-7, 6, -3))
island(L, [(-9, -5), (-10, -5), (-10, -4)], 6, top="grass", under="stone", depth=2)
L.goal = (-10, 6, -5)
L.decor("altar", L.goal)
L.slider("seal", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-10, 7, -5), "stonedark", g="seal")
L.trigger("seal", 2, plates=["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8"], states={"court": 3, "ring": 2})

# ---------------------------------------------------------------- pillars, broken arches and sleeping machines
for (x, z, h) in [(7, 2, 3), (0, 3, 4), (-2, 2, 2), (6, -3, 5), (0, -1, 5), (-3, -7, 6), (-8, -7, 8), (-11, -3, 7)]:
    for y in range(-1, h): L.block((x, y, z), "stone" if y > 0 else "stonedark")
    L.decor("pillar", (x, h - 1, z), 1.0)
L.decor("gear", (4, 0, 0), 0.9, face="+z"); L.decor("gear", (5, 3, -5), 0.8, face="+z")
L.decor("guardian", (-10, 6, -4), 0.8)
L.decor("tallgrass", (6, 0, 4), 0.8); L.decor("flowers", (2, 0, 4), 0.7); L.decor("mushroom", (0, 0, 1), 0.7)
L.decor("vine", (-1, 3, -7), 1.0); L.block((-10, 6, -6), "moss"); L.block((-10, 5, -6), "stonedark")

# ---------------------------------------------------------------- story
L.text((7, 0, 5), "The first storm passed here long ago. The stones still remember it.")
L.text((2, 0, 4), "A pressure stone sinks, and somewhere a machine yawns.")
L.text((5, 2, -2), "Moss grows over the old gears like a warm blanket.")
L.text((3, 3, -3), "The guardian bows its head and lets Hana pass.")
L.text((1, 3, -5), "Two rings, one heart: when one turns east, the other turns west.")
L.text((-9, 6, -5), "The seal sleeps until the courtyard ring faces home and the twin rings rest.")
L.text((-7, 6, -3), "On the storm altar, a lamp that never went out.")
L.hint("goal", reach=(-9, 6, -5))
L.hint("altar", reach=(-5, 3, -5))
L.hint("column", reach=(-4, 3, -5))
L.hint("ring", reach=(1, 3, -5))
L.hint("ring", reach=(3, 3, -3))
L.hint("obelisk", reach=(2, 0, -2))
L.hint("court", reach=(4, 0, 1))
L.hint("sled")
L.end("The lamp of the first storm burns again, and the ruins hum like a beehive in spring.",
      (-10, 6, -6), [(7, 0, 5), (2, 0, 4), (-1, 0, 1), (5, 2, -2), (6, 3, -5), (-2, 3, -3), (-7, 6, -3)])
L.save()
