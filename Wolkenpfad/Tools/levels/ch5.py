# Chapter 5 · The First Step into the Mist  (Act I, theme "mist")
# Hana leaves her village island over the first abandoned cloud path.
#  * "drift"  – a stray cloud step that has to be pushed into the gap after the pier.
#  * "ferry"  – a cloud ferry on the lower path; "puff" – a lazy cloud lying across the ferry line.
#    Aha: the cloud that blocks the ferry is the one that carries Hana to the mist bell (plate pS)
#    – and back onto the ferry.
#  * "lift"   – a cloud column that has drifted up and must be called down, then ridden up.
#  * "drift2" – a cloud step resting in the upper path; ride it to the second bell (pU) and back.
#  * "gate"   – the mist gate rises when both bells have rung; the shrine beyond is only reachable
#              because, in the mist, near and far look the same (illusion).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

ILL = {(-7, 3, -6), (-9, 1, -9)}
L = Level("Chapter 5 · The First Step into the Mist", theme="mist", chapter=5, ill=ILL)
L.goal_item = "lamp"

# ---------------------------------------------------------------- village island (y = 0)
SPOTS = {(5, 0): "house", (5, 3): "house", (2, 3): "tree", (1, 0): "tree", (4, 0): "lantern"}
for x in range(1, 6):
    for z in range(0, 4):
        L.block((x, 0, z), "grass", (x, z) not in SPOTS)
        L.block((x, -1, z), "rock")
for x in range(1, 6):
    for z in range(0, 4):
        if (x, z) in [(1, 0), (5, 3), (1, 3), (5, 0)]: continue
        L.block((x, -2, z), "rock" if 2 <= x <= 4 and 1 <= z <= 2 else "rockdark")
for x in range(2, 5):
    for z in range(1, 3): L.block((x, -3, z), "rockdark")
for p in [(3, -4, 1), (3, -4, 2), (4, -4, 2), (3, -5, 2)]: L.block(p, "rockdark")
for z in (1, 2):                                                  # back terrace with the well-house
    L.block((5, 1, z), "stone")
L.block((5, 2, 1), "wood")
L.decor("house", (5, 0, 0), 1.0, r=3.1416, variant=0)
L.decor("house", (5, 0, 3), 0.9, r=-1.5708, variant=1)
L.decor("tree", (2, 0, 3), 1.1, variant=2); L.decor("tree", (1, 0, 0), 0.9, variant=1)
L.decor("lantern", (4, 0, 0)); L.decor("lantern", (5, 2, 1), 0.8)
L.decor("pennant", (5, 0, 0), to=(5, 2, 1)); L.decor("pennant", (5, 2, 1), to=(5, 0, 3))
L.decor("flowers", (5, 1, 2), 0.8); L.decor("grass", (3, 0, 3), 0.8); L.decor("flowers", (1, 0, 3), 0.7)
L.start = (3, 0, 2)
# the pier
L.block((0, 0, 1), "wood", True); L.block((0, -1, 1), "rockdark")
L.block((0, 0, 2), "wood"); L.decor("lantern", (0, 0, 2), 0.8)
L.decor("pennant", (0, 0, 2), to=(1, 0, 0))

# ---------------------------------------------------------------- lower cloud path (y = 0)
L.slider("drift", (0, 0, -1), value=0, min=0, max=2)
L.block((-1, 0, 3), "cloud", True, g="drift")
L.decor("handle", (-1, 0, 3), g="drift", axis="z")

for p in [(-2, 0, 1), (-2, 0, 0), (-2, 0, -1)]:                   # first cloud islet
    L.block(p, "cloud", True)
L.block((-2, -1, 0), "cloud"); L.block((-2, -1, 1), "cloud")
L.block((-1, 0, -1), "cloud"); L.decor("cloudpuff", (-1, 0, -1), 0.9)

L.slider("ferry", (-1, 0, 0), value=2, min=0, max=2)
L.block((-3, 0, 0), "cloud", True, g="ferry"); L.block((-3, -1, 0), "cloud", g="ferry")
L.decor("handle", (-3, 0, 0), g="ferry", axis="x")

L.slider("puff", (0, 0, 1), value=0, min=0, max=2)
L.block((-4, 0, 0), "cloud", True, g="puff")
L.decor("handle", (-4, 0, 0), g="puff", axis="z")

L.block((-5, 0, 2), "cloud", True); L.plate("pS", (-5, 0, 2))      # the low mist bell
for p in [(-5, 0, 3), (-6, 0, 2), (-5, -1, 2), (-5, -1, 3), (-6, -1, 2), (-5, -2, 2)]:
    L.block(p, "cloud")
L.decor("lantern", (-5, 0, 3), 0.9); L.decor("cloudpuff", (-6, 0, 2), 1.1)

for p in [(-6, 0, 0), (-6, 0, -1)]:                               # the landing below the lift
    L.block(p, "cloud", True); L.block((p[0], -1, p[2]), "cloud")
L.block((-7, 0, 0), "cloud"); L.block((-6, -2, 0), "cloud"); L.block((-7, -1, 0), "cloud")
L.decor("lantern", (-7, 0, 0), 0.9)

L.slider("lift", (0, 1, 0), value=3, min=0, max=3)
for y in range(-3, 1):
    L.block((-7, y, -1), "cloud", y == 0, g="lift")
L.decor("handle", (-7, 0, -1), g="lift", axis="y")

# soft cloud banks drifting under the lower path (never walkable)
for p in [(-2, -2, 0), (-2, -2, 1), (-1, -1, 0), (-1, -1, -1), (-3, -1, 1), (-3, -1, 2), (-3, -2, 1), (-4, -1, 3),
          (-4, -2, 2), (-4, -2, 1), (-5, -2, 1), (-6, -1, 1), (-6, -2, 1), (-7, -1, 1), (-5, -3, 2), (-4, -3, 1),
          (0, -2, 1), (0, -2, 2), (-1, -1, 2), (-8, 0, 0), (-8, -1, 0)]:
    L.block(p, "cloud")
L.decor("cloudpuff", (-8, 0, 0), 1.2); L.decor("cloudpuff", (-3, -1, 2), 0.9)

# ---------------------------------------------------------------- upper cloud path (y = 3)
for p in [(-7, 3, -2), (-7, 3, -3), (-7, 3, -5), (-7, 3, -6)]:
    L.block(p, "cloud", True)
for p in [(-7, 2, -2), (-7, 2, -3), (-7, 2, -5), (-7, 2, -6), (-7, 1, -3), (-7, 1, -5), (-8, 3, -3), (-8, 3, -5),
          (-8, 2, -5), (-8, 2, -3), (-8, 2, -2), (-7, 1, -2), (-7, 1, -6), (-8, 2, -6), (-7, 0, -5), (-6, 2, -6),
          (-6, 2, -5), (-6, 3, -6)]:
    L.block(p, "cloud")
L.decor("lantern", (-6, 3, -6), 0.8)
L.decor("lantern", (-8, 3, -3), 0.8); L.decor("cloudpuff", (-8, 3, -5), 1.0)
L.slider("drift2", (-1, 0, 0), value=2, min=0, max=2)
L.block((-5, 3, -4), "cloud", True, g="drift2")
L.decor("handle", (-5, 3, -4), g="drift2", axis="x")
L.block((-4, 3, -4), "cloud", True); L.plate("pU", (-4, 3, -4))    # the high mist bell
for p in [(-4, 3, -5), (-3, 3, -4), (-4, 2, -4), (-4, 2, -5), (-3, 2, -4), (-4, 1, -4), (-3, 2, -5), (-3, 1, -4),
          (-4, 0, -4), (-3, 3, -5)]:
    L.block(p, "cloud")
L.decor("lantern", (-4, 3, -5), 0.9); L.decor("cloudpuff", (-3, 3, -4), 0.8); L.decor("pennant", (-4, 3, -5), to=(-6, 3, -6))

L.slider("gate", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((-7, 4, -6), "gate", g="gate"); L.block((-7, 5, -6), "gate", g="gate")
L.trigger("gate", 2, plates=["pS", "pU"])

# the shrine in the mist: it only looks like the next step
for p in [(-9, 0, -9), (-9, -1, -9), (-10, 1, -9), (-10, 0, -9), (-9, 1, -10), (-10, 1, -10), (-10, 2, -10)]:
    L.block(p, "cloud" if p[1] < 2 else "stone")
L.block((-9, 1, -9), "cloud", True)
L.goal = (-9, 1, -9)
L.decor("altar", L.goal)
L.decor("lantern", (-10, 1, -9), 0.9); L.decor("cloudpuff", (-9, 1, -10), 1.0); L.decor("lantern", (-10, 2, -10), 1.0)

# ---------------------------------------------------------------- story
L.text((3, 0, 2), "The village sleeps. Beyond the pier, the old cloud path begins.")
L.text((0, 0, 1), "Grandfather wrote: 'Clouds forget their places. Remind them.'")
L.text((-2, 0, 0), "One lazy cloud dreams right across the ferry's way.")
L.text((-5, 0, 2), "A bell of mist rings softly, somewhere high above.")
L.text((-6, 0, -1), "The path climbs on, into white silence.")
L.text((-7, 3, -3), "Wind once carried travellers here. Now only the clouds remain.")
L.text((-7, 3, -5), "In the mist, near and far are the same thing.")
L.hint("goal", reach=(-7, 3, -5), pressed=["pS", "pU"])
L.hint("lift", reach=(-7, 3, -3), unpressed=["pS"])
L.hint("drift2", reach=(-7, 3, -3), unpressed=["pU"])
L.hint("puff", reach=(-6, 0, 0), unpressed=["pS"])
L.hint("lift", reach=(-6, 0, 0))
L.hint("ferry", reach=(-3, 0, 0))
L.hint("puff", reach=(-2, 0, 0))
L.hint("drift")
L.end("The old lamp wakes in Hana's hands. For the first time in years, the mist steps aside.",
      (2, 0, 3), [(3, 0, 1), (4, 0, 3), (-2, 0, 1), (-6, 0, 0), (-5, 0, 2), (-7, 3, -2), (-4, 3, -4)])
L.save()
