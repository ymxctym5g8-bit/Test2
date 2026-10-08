# Chapter 4 · The Hum in the Attic  (Act I, theme "attic")
# Grandfather's workshop and attic on a tiny floating island.  The crank on the old rafter
# (rotator "rafter") swings a beam that bridges the attic - and, through a rope, opens the
# trapdoor "hatch" above the dumbwaiter "lift" (first state trigger).  The aha: the hatch cannot
# close on the lift, so the lift has to be sent away before the beam can bridge the attic.
# A creaky floorboard (plate pA) in the east attic pushes out a drawer below; the plate on the
# drawer (pB) unfolds the loft ladder to the wind harp.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

ILL = {(-8, 6, -3), (-11, 4, -5)}   # loft edge <-> chimney top (the one deliberate illusion)
L = Level("Chapter 4 · The Hum in the Attic", theme="attic", chapter=4, ill=ILL)
L.goal_item = "harp"

# ---------------------------------------------------------------- workshop (y = 0)
for x in (0, 1):
    for z in range(0, 4):
        L.block((x, 0, z), "wood", True)
        L.block((x, -1, z), "rock")
for p in [(0, -2, 1), (0, -2, 2), (1, -2, 1), (1, -2, 2), (1, -3, 2), (0, -2, 3)]:
    L.block(p, "rockdark")
L.block((-1, 0, 2), "wood"); L.block((-1, 0, 3), "wood"); L.block((-1, -1, 2), "rockdark")   # workbench corner
L.decor("chest", (-1, 0, 3), 0.9, r=1.5708); L.decor("notebook", (-1, 0, 2), 0.8)

# start islet (front right) - the trunk plank has to roll over first
for p in [(3, 0, 2), (3, 0, 3), (4, 0, 2), (4, 0, 3)]:
    L.block(p, "wood", p != (4, 0, 2)); L.block((p[0], -1, p[2]), "rock")
L.block((3, -2, 3), "rockdark"); L.block((4, -2, 2), "rockdark")
L.decor("lantern", (4, 0, 2))
L.start = (4, 0, 3)

# trunk on castors (slider along -z): rolls between the start islet and the drawer cupboard
L.slider("trunk", (0, 0, -1), value=3, min=0, max=3)
L.block((2, 0, 3), "raft", True, g="trunk"); L.block((2, -1, 3), "wood", g="trunk")
L.decor("handle", (2, 0, 3), g="trunk", axis="z")

# drawer cupboard islet (front right, behind) with the drawer "drawer" (plate trigger)
for p in [(3, 0, 0), (5, 0, 0)]:
    L.block(p, "wood", True); L.block((p[0], -1, p[2]), "rock")
L.block((4, -1, 0), "rockdark"); L.block((4, -1, -1), "rockdark")
for y in (1, 2): L.block((4, y, -1), "wood")          # the cupboard body above the drawer slot
L.block((5, 0, -1), "wood"); L.block((5, 1, -1), "wood"); L.block((3, 0, -1), "wood")
L.decor("chest", (4, 2, -1), 0.8); L.decor("lightshaft", (5, 1, -1), 1.0)
L.slider("drawer", (0, 0, 1), value=0, min=0, max=1, locked=True)
L.block((4, 0, -1), "tealtop", True, g="drawer")

# ---------------------------------------------------------------- dumbwaiter lift + trapdoor
L.slider("lift", (0, 1, 0), value=0, min=0, max=3)
for y in range(-4, 1):
    L.block((0, y, -1), "tealtop" if y == 0 else ("teal" if y > -3 else "tealdark"), y == 0, g="lift")
L.decor("handle", (0, 0, -1), g="lift", axis="y")
L.slider("hatch", (0, 0, 1), value=0, min=0, max=1, locked=True)
L.block((0, 3, -1), "wood", True, g="hatch")

# ---------------------------------------------------------------- west attic (y = 3)
for x in range(-3, 1):
    for z in range(-4, 0):
        if (x, z) in [(0, -1), (-3, -1)]: continue
        L.block((x, 3, z), "wood", True)
        L.block((x, 2, z), "wood")
for x in range(-3, 1):
    for z in range(-4, 0):
        if x == 0 and z == -1: continue
        if x == -3 or (x, z) in [(0, -4), (0, -1)]: continue
        L.block((x, 1, z), "rock")
for p in [(-2, 0, -2), (-2, 0, -3), (-1, 0, -2), (-1, 0, -3), (-1, 0, -1), (-2, -1, -2), (-1, -1, -3)]:
    L.block(p, "rockdark")

# ---------------------------------------------------------------- the rafter beam (crank)
L.rotator("rafter", (1, 3, -5))
L.block((1, 3, -5), "tealtop", True, g="rafter")
L.block((1, 3, -4), "wood", True, g="rafter"); L.block((1, 3, -3), "wood", True, g="rafter")
L.block((1, 2, -5), "teal", g="rafter"); L.block((1, 1, -5), "tealdark", g="rafter")
L.decor("crank", (1, 1, -5), g="rafter", face="+x")
L.trigger("hatch", 1, states={"rafter": 1})

# ---------------------------------------------------------------- east attic (y = 3) with the creaky board
for x in (2, 3):
    for z in (-4, -3, -2):
        L.block((x, 3, z), "wood", True)
        L.block((x, 2, z), "wood")
for p in [(2, 1, -4), (3, 1, -4), (2, 1, -3), (3, 1, -3), (2, 0, -3), (3, 1, -2)]:
    L.block(p, "rock" if p[1] == 1 else "rockdark")
L.plate("pA", (3, 3, -2))
L.trigger("drawer", 1, plates=["pA"])

# ---------------------------------------------------------------- loft ladder (plate trigger) and loft
L.plate("pB", (5, 0, 0))
L.slider("ladder", (0, 1, 0), value=2, min=0, max=2, locked=True)
for i, x in enumerate((-4, -5, -6)):
    L.stair((x, 4 + i, -2), "-x", m="wood", g="ladder")
L.trigger("ladder", 0, plates=["pB"])
for p in [(-7, 6, -2), (-7, 6, -3), (-8, 6, -3), (-8, 6, -2)]:
    L.block(p, "wood", True); L.block((p[0], 5, p[2]), "wood")
for p in [(-7, 4, -3), (-8, 4, -3), (-8, 3, -3)]:
    L.block(p, "rockdark")
L.block((-8, 6, -4), "wood"); L.block((-8, 5, -4), "rockdark")          # where the great tree will grow
L.decor("beam", (-7, 6, -3), 0.9); L.decor("notebook", (-7, 6, -2), 0.6)

# the old chimney - seen from the loft it is only one step away
for y in range(-1, 5):
    L.block((-11, y, -5), "stone" if y > 0 else "stonedark", y == 4)
L.goal = (-11, 4, -5)
L.decor("altar", L.goal)

# ---------------------------------------------------------------- walls, rafters and dust
for x in (-3, -2):
    for y in range(2, 6): L.block((x, y, -5), "wood")
for y in range(2, 6): L.block((-4, y, -4), "wood")
L.decor("beam", (-3, 5, -5), 1.0); L.decor("beam", (-4, 5, -4), 1.0, r=1.5708)
L.decor("lightshaft", (-2, 3, -3), 1.1); L.decor("lightshaft", (2, 3, -4), 0.9)
L.block((-3, 3, -1), "wood"); L.decor("chest", (-3, 3, -1), 1.0)
for y in (4, 5): L.block((3, y, -4), "wood")
L.decor("beam", (3, 5, -4), 0.9, r=1.5708)
L.decor("lantern", (-1, 3, -4), 0.8)
L.decor("lightshaft", (1, 0, 2), 0.9); L.decor("lantern", (3, 0, -1), 0.7)

# ---------------------------------------------------------------- story
L.text((4, 0, 3), "Grandfather's workshop still smells of pine shavings and rain.")
L.text((1, 0, 0), "Above the ceiling something hums, like wind in an empty bottle.")
L.text((0, 3, -3), "One old rope ties the rafter to the trapdoor. Nothing is wasted.")
L.text((3, 3, -2), "A floorboard sighs, and far below a drawer slides open.")
L.text((5, 0, 0), "In his hand: 'The loft ladder listens to the drawer.'")
L.text((-7, 6, -2), "From up here, the chimney looks only one step away.")
L.hint("goal", reach=(-7, 6, -2))
L.hint("ladder", reach=(-2, 3, -2), pressed=["pB"])
L.hint("pB", reach=(5, 0, 0), unpressed=["pB"])
L.hint("trunk", reach=(1, 0, 0), pressed=["pA"], unpressed=["pB"])
L.hint("rafter", reach=(-2, 3, -2), pressed=["pA"], unpressed=["pB"])
L.hint("pA", reach=(2, 3, -3), unpressed=["pA"])
L.hint("lift", reach=(-2, 3, -2), unpressed=["pA"])
L.hint("rafter", reach=(1, 0, 0), unpressed=["pA"])
L.hint("trunk")
L.end("The harp hums beneath Hana's fingers. Far away, a windmill begins to turn.",
      (-8, 6, -4), [(0, 0, 1), (1, 0, 3), (-2, 3, -2), (3, 3, -3), (5, 0, 0), (-7, 6, -2), (3, 0, 3)])
L.save()
