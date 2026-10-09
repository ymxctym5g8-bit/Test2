# Chapter 11 · The Sleeping Giant  (Act II, theme "giant")
# A mountain that is a peaceful, moss-grown cloud titan. Hana crosses on a drifting cloud, then turns
# the stone ring at the giant's knee ("knee") to reach two breath stones. The giant's breathing is a
# great bellows crank ("breath"): every breath lifts the thermal columns ("thermal1" at the knee,
# "thermal2" at the shoulder) one storey – but only once the breath stones beneath them have been
# woken (plates). A second stone ring on the shoulder ("shoulder") and a last cloud ("cloud") lead
# to the giant's brow.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 11 · The Sleeping Giant", theme="giant", chapter=11)
L.goal_item = "feather"

# ---------------------------------------------------------------- start and the drifting cloud
island(L, [(6, 4), (6, 5), (7, 5)], 0, top="grass")
L.start = (7, 0, 5)
L.slider("drift", (1, 0, 0), value=3, min=0, max=3)
L.block((2, 0, 4), "cloud", True, g="drift")
L.decor("handle", (2, 0, 4), g="drift", axis="x")

# ---------------------------------------------------------------- the knee ring and its breath stones
hub(L, "knee", (2, 0, 1), step=1, armm="moss", top="tealtop", face="+z", depth=3)
island(L, [(2, 3)], 0, top="moss", depth=3)
island(L, [(4, 1), (5, 1), (5, 0)], 0, top="moss")
L.plate("s1", (5, 0, 0)); L.decor("vent", (5, 0, 1), 0.9)
island(L, [(0, 1), (-1, 1), (-1, 2)], 0, top="moss")
L.plate("s2", (-1, 0, 2)); L.decor("vent", (-1, 0, 1), 0.9)
island(L, [(2, -1), (2, -2)], 0, top="moss")

# ---------------------------------------------------------------- the breath (bellows crank) and the thermals
L.rotator("breath", (6, -2, -3), step=3)
L.block((6, -2, -3), "brass", g="breath"); L.block((7, -2, -3), "moss", g="breath")
L.block((6, -3, -3), "rockdark", g="breath")
L.decor("crank", (6, -3, -3), g="breath", face="+z")
L.decor("vent", (7, -2, -3), 0.8, g="breath")
lift(L, "thermal1", (3, 0, -2), locked=True, depth=3, top="cloud", body="cloud", bodydark="cloud")
for h in (1, 2, 3):
    L.trigger("thermal1", h, plates=["s1", "s2"], states={"breath": h})
island(L, [(4, -2), (5, -2)], 1, top="moss", depth=1)                     # first storey: breath stone
L.plate("s3", (5, 1, -2))
island(L, [(3, -3), (3, -4)], 2, top="moss", depth=1)                     # second storey: breath stone
L.plate("s6", (3, 2, -4)); L.decor("mushroom", (3, 2, -3), 0.7)

# ---------------------------------------------------------------- the shoulder (y = 3)
hub(L, "shoulder", (0, 3, -2), step=3, armm="moss", top="tealtop", face="+x", depth=2)
island(L, [(2, -2)], 3, top="moss", depth=1)                               # east: from the thermal
island(L, [(0, 0), (0, 1)], 3, top="moss", depth=1)                        # south: breath stone
L.plate("s4", (0, 3, 1))
island(L, [(-2, -2), (-3, -2)], 3, top="moss", depth=1)                    # west: breath stone
L.plate("s5", (-3, 3, -2)); L.decor("kodama", (-2, 3, -2), 0.8)
island(L, [(0, -4), (0, -5)], 3, top="moss", depth=1)                      # north: the second thermal
lift(L, "thermal2", (-1, 3, -5), locked=True, depth=2, top="cloud", body="cloud", bodydark="cloud")
for h in (1, 2, 3):
    L.trigger("thermal2", h, plates=["s3", "s4", "s5", "s6"], states={"breath": h})
island(L, [(-1, -4)], 5, top="moss", depth=1)                              # a ledge in the giant's beard
L.plate("s7", (-1, 5, -4))

# ---------------------------------------------------------------- the brow and the last cloud
island(L, [(-2, -5), (-3, -5)], 6, top="moss", depth=2)
L.slider("cloud", (0, 0, -1), value=0, min=0, max=2)
L.block((-3, 6, -6), "cloud", True, g="cloud")
L.decor("handle", (-3, 6, -6), g="cloud", axis="z")
island(L, [(-3, -9), (-4, -9), (-4, -8)], 6, top="grass", depth=2)
L.goal = (-4, 6, -9)
L.decor("altar", L.goal)
L.slider("mist", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-4, 7, -9), "cloud", g="mist")
L.trigger("mist", 2, plates=["s7"])
L.block((-4, 6, -10), "moss"); L.block((-4, 5, -10), "rockdark")         # where the tree grows

# ---------------------------------------------------------------- the sleeping giant himself
for x in range(-8, -5):
    for z in range(-7, -4):
        top = 4 if (x, z) != (-6, -5) else 5
        for y in range(-2, top + 1):
            L.block((x, y, z), "moss" if y == top else ("rock" if y > 0 else "rockdark"))
L.decor("giantface", (-6, 5, -5), 2.2, face="+z")
L.decor("tree", (-8, 4, -7), 1.1, variant=7); L.decor("tree", (-7, 4, -7), 0.9, variant=1)
L.decor("tallgrass", (-8, 4, -5), 0.9); L.decor("flowers", (-7, 4, -5), 0.8)

# ---------------------------------------------------------------- dressing
L.decor("tree", (6, 0, 4), 0.9, variant=1); L.decor("tallgrass", (6, 0, 5), 0.8)
L.decor("flowers", (2, 0, 3), 0.7); L.decor("tallgrass", (2, 0, -1), 0.7)
L.decor("cloudpuff", (-4, 6, -8), 0.7); L.decor("butterflies", (-2, 6, -5), 1.0)
L.decor("rock", (4, 1, -2), 0.6)

# ---------------------------------------------------------------- story
L.text((7, 0, 5), "The mountain breathes. Very slowly, it is asleep.")
L.text((2, 0, 3), "Moss on his knees, clouds in his beard. How long has he slept?")
L.text((5, 0, 0), "The breath stone warms under Hana's feet.")
L.text((5, 1, -2), "Every breath of the giant lifts the warm air a little higher.")
L.text((0, 3, 1), "From his shoulder you can see the whole sky.")
L.text((-2, 6, -5), "Hush. Don't wake him. Not yet.")
L.hint("goal", reach=(-4, 6, -8), pressed=["s7"])
L.hint("cloud", reach=(-2, 6, -5), pressed=["s7"])
L.hint("breath", reach=(-1, 3, -5), pressed=["s3", "s4", "s5", "s6"])
L.hint("shoulder", reach=(2, 3, -2))
L.hint("breath", reach=(3, 0, -2), pressed=["s1", "s2"])
L.hint("knee", reach=(2, 0, 3))
L.hint("drift")
L.end("The giant smiles in his sleep, and a warm wind rises over the islands.",
      (-4, 6, -10), [(7, 0, 5), (2, 0, 3), (5, 0, 0), (5, 1, -2), (0, 3, 1), (-3, 3, -2), (-2, 6, -5)])
L.save()
