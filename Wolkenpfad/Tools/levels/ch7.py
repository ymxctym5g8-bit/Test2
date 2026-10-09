# Chapter 7 · The Mill of Forgotten Letters  (Act I, theme "mill")
# An old moss-grown windmill island in autumn ochre. The mill floor is a turntable (rotator "mill")
# that links four little islands. The millstone crank ("stone") is coupled by state trigger to the
# grain chute ("chute"): each turn of the stone lifts the chute one storey – but only once the two
# sail brakes (plates on the east and west islands) are released. Up in the loft a second turntable
# ("loft") leads to the last letter, behind a shutter that opens when every forgotten letter is read.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 7 · The Mill of Forgotten Letters", theme="mill", chapter=7)
L.goal_item = "letter"

# ---------------------------------------------------------------- start and the letter cart
island(L, [(4, 4), (4, 5), (5, 5), (5, 4)], 0, top="moss")
L.start = (5, 0, 5)
L.decor("letters", (5, 0, 4), 1.0); L.decor("tree", (4, 0, 5), 0.9, variant=3)
L.slider("cart", (1, 0, 0), value=2, min=0, max=2)
L.block((1, 0, 4), "raft", True, g="cart"); L.block((1, -1, 4), "wood", g="cart")
L.decor("handle", (1, 0, 4), g="cart", axis="x")

# ---------------------------------------------------------------- the mill floor (turntable) and its four islands
hub(L, "mill", (0, 0, 0), step=1, armm="wood", face="+z", depth=3)
island(L, [(0, 2), (0, 3), (0, 4), (-1, 3)], 0, top="moss")                     # south: the old gate
island(L, [(2, 0), (3, 0), (3, 1), (3, -1)], 0, top="grass")                     # east: sail brake
L.plate("pE", (3, 0, 1))
island(L, [(-2, 0), (-3, 0), (-3, -1), (-3, 1)], 0, top="grass")                 # west: sail brake
L.plate("pW", (-3, 0, 1))
island(L, [(0, -2), (0, -3), (0, -4)], 0, top="stone", under="stonedark")       # north: mill yard
# the great windmill stands behind the yard
for y in range(0, 6): L.block((-1, y, -5), "stone" if y < 5 else "wood")
L.block((-1, -1, -5), "stonedark")
L.decor("windmill", (-1, 5, -5), 1.6, face="+z")
L.block((-1, 0, -4), "stone"); L.decor("millwheel", (-1, 0, -4), 1.0, face="+x")

# ---------------------------------------------------------------- millstone (crank) drives the grain chute
L.rotator("stone", (4, -1, -3), step=2)
L.block((4, -1, -3), "brass", g="stone"); L.block((5, -1, -3), "stone", g="stone")
L.block((4, -2, -3), "stonedark", g="stone")
L.decor("crank", (4, -2, -3), g="stone", face="+z")
L.decor("gear", (5, -1, -3), 0.8, g="stone", face="+z")
lift(L, "chute", (1, 0, -4), locked=True, depth=3, top="tealtop")
for h in (1, 2, 3):
    L.trigger("chute", h, plates=["pE", "pW"], states={"stone": h})

# storeys of the mill
island(L, [(2, -4), (3, -4)], 1, top="wood", under="wood", depth=1)              # first storey: letters
L.plate("p1", (3, 1, -4)); L.decor("letters", (2, 1, -4), 0.9)
island(L, [(1, -5), (1, -6), (2, -6)], 2, top="wood", under="wood", depth=1)     # second storey: letters
L.plate("p2", (2, 2, -6)); L.decor("chest", (1, 2, -6), 0.8)
island(L, [(0, -4)], 3, top="wood", under="wood", depth=1, walk=True)           # loft landing

# ---------------------------------------------------------------- the loft turntable
hub(L, "loft", (-2, 3, -4), step=3, armm="wood", face="+x", depth=2)
island(L, [(-2, -2), (-3, -2)], 3, top="wood", under="wood", deep="rockdark")    # south: the last bundle of letters
L.plate("p3", (-3, 3, -2)); L.decor("letters", (-2, 3, -2), 1.0)
island(L, [(-4, -4), (-5, -4), (-5, -5)], 3, top="moss", under="rock")          # west: dove cote
L.plate("p4", (-5, 3, -5))
L.block((-6, 3, -4), "moss"); L.block((-6, 2, -4), "rockdark"); L.decor("house", (-6, 3, -4), 0.8)
island(L, [(-2, -6), (-2, -7), (-3, -7)], 3, top="stone", under="stonedark")      # north: the writing desk
L.goal = (-3, 3, -7)
L.decor("altar", L.goal)
L.slider("shutter", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-2, 4, -7), "gate", g="shutter")
L.trigger("shutter", 2, plates=["p1", "p2", "p3", "p4"])
L.block((-1, 3, -7), "moss"); L.block((-1, 2, -7), "rockdark")                  # where the tree grows

# ---------------------------------------------------------------- dressing
for c in [(4, 0, 4), (0, 0, 3), (3, 0, 0), (-3, 0, 0), (0, 0, -3)]:
    L.decor("tallgrass", c, 0.7)
L.decor("tree", (-3, 0, -1), 0.9, variant=3); L.decor("tree", (3, 0, -1), 0.8, variant=6)
L.decor("lantern", (-1, 0, 3), 0.8); L.decor("letters", (0, 0, -4), 0.8)
L.decor("flowers", (-4, 3, -4), 0.8); L.decor("bush", (-5, 3, -4), 0.8)
L.decor("lantern", (-2, 3, -6), 0.8)
L.decor("pennant", (0, 0, 4), 1.0, to=(-1, 0, 3))

# ---------------------------------------------------------------- story
L.text((5, 0, 5), "The mill has not turned since Grandfather left. Letters drift on the wind.")
L.text((0, 0, 3), "The mill floor still turns, slow and heavy, like an old music box.")
L.text((3, 0, 1), "One sail brake lets go with a sigh.")
L.text((0, 0, -3), "The millstone and the grain chute share one old rope.")
L.text((3, 1, -4), "A letter addressed to Hana – written years before she was born.")
L.text((-3, 3, -2), "'The winds forget,' he wrote, 'unless someone remembers for them.'")
L.hint("goal", reach=(-2, 3, -6))
L.hint("loft", reach=(0, 3, -4))
L.hint("stone", reach=(1, 0, -4), pressed=["pE", "pW"])
L.hint("pE", reach=(0, 0, 0), unpressed=["pE"])
L.hint("pW", reach=(0, 0, 0), unpressed=["pW"])
L.hint("mill", reach=(0, 0, 2))
L.hint("cart")
L.end("The sails turn again, and the forgotten letters fly home on the wind.",
      (-1, 3, -7), [(4, 0, 5), (0, 0, 3), (3, 0, 0), (-3, 0, 0), (0, 0, -3), (2, 1, -4), (-2, 3, -2)])
L.save()
