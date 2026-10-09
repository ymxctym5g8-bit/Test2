# Chapter 13 · The Old Bridge-Builder  (Act II, theme "bridgeworks")
# The workshop of the old woman who has kept the sky bridges for sixty years. Everything is coupled:
# the two lifts of the seesaw ("left" is cranked, "right" always does the opposite), the great brass
# gear ("gear") turns the swing bridge ("swing") at the far end of the yard, and the hoist ("hoist")
# lifts a counterweight ("counter") off the walkway only when it stands at the top. Hana has to go
# back and forth to make the machinery carry her.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

L = Level("Chapter 13 · The Old Bridge-Builder", theme="bridgeworks", chapter=13)
L.goal_item = "gear"

# ---------------------------------------------------------------- start and the tool cart
island(L, [(4, 3), (4, 4), (5, 4)], 0, top="wood", under="rock")
L.start = (5, 0, 4)
L.slider("cart", (1, 0, 0), value=1, min=0, max=1)
L.block((2, 0, 3), "raft", True, g="cart"); L.block((2, -1, 3), "brass", g="cart")
L.decor("handle", (2, 0, 3), g="cart", axis="x")

# ---------------------------------------------------------------- workshop turntable
hub(L, "table", (1, 0, 0), step=1, armm="wood", top="tealtop", face="+z")
island(L, [(1, 2), (1, 3)], 0, top="wood")
island(L, [(3, 0), (4, 0), (4, -1)], 0, top="wood")
L.plate("r1", (4, 0, -1))
island(L, [(-1, 0), (-2, 0), (-2, 1)], 0, top="wood")
L.plate("r2", (-2, 0, 1))
island(L, [(1, -2), (1, -3)], 0, top="wood")

# ---------------------------------------------------------------- the seesaw: "right" always does the opposite of "left"
lift(L, "left", (2, 0, -3), lo=0, hi=3, top="tealtop", body="brass", bodydark="brass")
lift(L, "right", (0, 0, -3), value=3, lo=0, hi=3, locked=True, top="tealtop", body="brass", bodydark="brass")
for k in range(4):
    L.trigger("right", 3 - k, states={"left": k})
island(L, [(3, -3), (4, -3)], 3, top="wood", under="wood", depth=1)          # a tool shelf
L.plate("r3", (4, 3, -3))
island(L, [(-1, -3)], 3, top="wood", under="wood", depth=1)                  # landing at the yard

# ---------------------------------------------------------------- the swing bridge, turned by the great gear
L.rotator("gear", (3, 2, -6), step=2)
L.block((3, 2, -6), "brass", g="gear"); L.block((3, 1, -6), "brass", g="gear")
L.decor("gear", (3, 2, -6), 1.3, g="gear", face="+z")
L.decor("crank", (3, 1, -6), g="gear", face="+x")
for y in range(-2, 1): L.block((3, y, -6), "stone" if y > -2 else "stonedark")
L.rotator("swing", (-3, 3, -3), step=2, locked=True)
L.block((-3, 3, -3), "tealtop", True, g="swing"); L.block((-2, 3, -3), "wood", True, g="swing")
L.block((-3, 2, -3), "brass", g="swing"); L.block((-3, 1, -3), "brass", g="swing")
for k in range(4):
    L.trigger("swing", k, states={"gear": k})
island(L, [(-3, -5), (-3, -6)], 3, top="wood", under="wood", depth=1)         # north: rivets
L.plate("r4", (-3, 3, -6))
island(L, [(-3, -1), (-3, 0)], 3, top="wood", under="wood", depth=1)          # south: rope store
L.plate("r5", (-3, 3, 0))
island(L, [(-5, -3), (-6, -3)], 3, top="wood", under="wood", depth=1)         # west: the walkway to the hoist

# ---------------------------------------------------------------- the hoist and its counterweight
lift(L, "hoist", (-7, 3, -3), lo=0, hi=3, top="tealtop", body="brass", bodydark="brass")
L.slider("counter", (0, 1, 0), value=0, min=0, max=3, locked=True)
L.block((-5, 4, -3), "brass", g="counter")
L.trigger("counter", 3, states={"hoist": 3})

# ---------------------------------------------------------------- the crane at the top (y = 6)
hub(L, "crane", (-7, 6, -5), step=0, armm="wood", top="tealtop", face="+x")
island(L, [(-5, -5), (-4, -5)], 6, top="wood", under="wood", depth=1)         # east: the old woman's bench
L.plate("r6", (-4, 6, -5))
island(L, [(-7, -7), (-7, -8), (-8, -8)], 6, top="grass", under="wood", depth=1)
L.goal = (-8, 6, -8)
L.decor("altar", L.goal)
L.slider("shutter", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-8, 7, -8), "gate", g="shutter")
L.trigger("shutter", 2, plates=["r1", "r2", "r3", "r4", "r5", "r6"])
L.block((-8, 6, -7), "wood"); L.block((-8, 5, -7), "wood")                 # where the tree grows

# ---------------------------------------------------------------- dressing
L.decor("oldwoman", (-5, 6, -5), 1.0)
L.block((5, 0, 3), "wood"); L.block((5, -1, 3), "rock"); L.decor("scaffold", (5, 0, 3), 0.9)
L.decor("chest", (4, 0, 0), 0.8); L.decor("gear", (-2, 0, 0), 0.7, face="+z")
L.decor("lantern", (1, 0, -2), 0.8); L.decor("letters", (3, 3, -3), 0.7)
L.decor("rope", (-1, 3, -3), 1.0, to=(-6, 3, -3))
L.decor("pennant", (-4, 6, -5), 1.0, to=(-7, 6, -7))
L.decor("scaffold", (-6, 3, -3), 0.9); L.decor("flowers", (-7, 6, -8), 0.8)

# ---------------------------------------------------------------- story
L.text((5, 0, 4), "Hammers ring somewhere above. Someone is still mending the sky.")
L.text((1, 0, 3), "Every machine here is married to another. None moves alone.")
L.text((4, 3, -3), "A shelf of tools, each one labelled in Grandfather's hand.")
L.text((-1, 3, -3), "The great gear turns the swing bridge, slow as an old song.")
L.text((-6, 3, -3), "The hoist's counterweight only rests when the hoist is high.")
L.text((-4, 6, -5), "'Your grandfather built half of these,' the old woman laughs.")
L.hint("goal", reach=(-7, 6, -7), pressed=["r1", "r2", "r3", "r4", "r5", "r6"])
L.hint("crane", reach=(-7, 3, -3))
L.hint("hoist", reach=(-6, 3, -3))
L.hint("hoist", reach=(-3, 3, -3))
L.hint("gear", reach=(-1, 3, -3))
L.hint("left", reach=(1, 0, -3))
L.hint("table", reach=(1, 0, 2))
L.hint("cart")
L.end("'Now the bridges will remember you too,' says the old bridge-builder, and hands Hana a brass gear.",
      (-8, 6, -7), [(5, 0, 4), (1, 0, 3), (4, 0, -1), (-2, 0, 1), (4, 3, -3), (-3, 3, 0), (-4, 6, -5)])
L.save()
