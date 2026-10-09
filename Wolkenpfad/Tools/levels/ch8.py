# Chapter 8 · The Storm Is Coming  (Act I, theme "storm")
# A giant hollow oak rooted in the clouds. Three of its branches are turntable bridges ("low", "mid",
# "high") that carry Hana around the trunk. Two impossible connections lead through the hollow:
# the low branch's north end opens straight onto the middle branch, and from the high branch the
# crown seems only one step away. The crown's hollow opens only when the four storm bells have rung
# (plates) and every branch bows toward the trunk (state trigger on all three branches).
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import Level, island, hub, lift

def through(a, d, t):  # tile that appears right next to a in direction d, shifted t along the view axis
    return (a[0] + d[0] + t, a[1] + d[1] + t, a[2] + d[2] + t)

L = Level("Chapter 8 · The Storm Is Coming", theme="storm", chapter=8)
L.goal_item = "feather"

# ---------------------------------------------------------------- the trunk of the old oak
for x in (-1, 0):
    for z in (-1, 0):
        for y in range(-4, 8):
            L.block((x, y, z), "wood" if y > -3 else "rockdark")

# ---------------------------------------------------------------- low branch (y = 0)
hub(L, "low", (3, 0, 0), step=1, armm="wood", top="moss", body="wood", bodydark="rockdark", face="+z")
island(L, [(3, 2), (3, 3), (4, 3)], 0, top="grass")                               # south: start
L.start = (4, 0, 3)
island(L, [(5, 0), (6, 0), (6, -1)], 0, top="moss")                               # east: storm bell
L.plate("pA", (6, 0, -1))
island(L, [(1, 0)], 0, top="moss", depth=3)                                       # west: knot hole in the trunk
L.plate("pB", (1, 0, 0))
island(L, [(3, -2)], 0, top="moss", depth=3)                                        # north: into the hollow

# ---------------------------------------------------------------- middle branch (y = 3)
hub(L, "mid", (4, 3, 0), step=3, armm="wood", top="moss", body="wood", bodydark="rockdark", face="+x", depth=1)
I1a = (3, 0, -2); I1b = through(I1a, (0, 0, -1), 3)           # through the hollow: north end of the low branch -> east of the middle one
island(L, [(6, 0)], 3, top="moss", depth=1)                                       # east: out of the hollow
island(L, [(4, 2)], 3, top="moss", depth=1)                                       # south: storm bell
L.plate("pC", (4, 3, 2))
island(L, [(2, 0), (1, 0), (1, 1)], 3, top="moss", depth=1)                           # west: storm bell
L.plate("pE", (1, 3, 1))
island(L, [(4, -2), (4, -3)], 3, top="moss", depth=1)                             # north: the climbing vine
lift(L, "vine", (3, 3, -3), lo=0, hi=3, top="moss", body="wood", bodydark="wood", depth=2)
L.decor("vine", (4, 3, -3), 1.0)

# ---------------------------------------------------------------- high branch (y = 6)
hub(L, "high", (1, 6, -3), step=1, armm="wood", top="moss", body="wood", bodydark="rockdark", face="+z")
island(L, [(1, -5), (2, -5)], 6, top="moss", depth=1)                             # north: storm bell
L.plate("pD", (2, 6, -5))
island(L, [(1, -1)], 6, top="moss", depth=1)                                      # south: a nest
L.decor("bush", (1, 6, -1), 0.7)
island(L, [(-1, -3), (-2, -3)], 6, top="moss", depth=1)                           # west: towards the crown

# ---------------------------------------------------------------- the crown (y = 8), seen from the high branch
I2a = (-2, 6, -3); I2b = through(I2a, (0, 0, 1), 2)
for c, w in [((0, 8, 0), True), ((-1, 8, 0), True), ((0, 8, -1), True), ((-1, 8, -1), False)]:
    L.block(c, "moss", w)
L.goal = (0, 8, -1)
L.decor("altar", L.goal)
L.decor("oak", (-1, 8, -1), 2.2)
L.slider("hollow", (0, 1, 0), value=0, min=0, max=2, locked=True)
L.block((0, 9, -1), "rockdark", g="hollow")
L.trigger("hollow", 2, plates=["pA", "pB", "pC", "pD", "pE"], states={"low": 2, "mid": 2, "high": 2})

for a, b in [(I1a, I1b), (I2a, I2b)]:
    for blk in L.B:
        if tuple(blk["p"]) in (a, b) and not blk.get("g"): blk["ill"] = True

# ---------------------------------------------------------------- dressing
L.decor("lantern", (3, 0, 2), 0.8); L.decor("tallgrass", (3, 0, 3), 0.8)
L.decor("mushroom", (5, 0, 0), 0.8)
L.decor("vine", (-1, 6, -3), 1.0); L.decor("lantern", (2, 3, 0), 0.7)
L.decor("flowers", (4, 3, -2), 0.6)

# ---------------------------------------------------------------- story
L.text((4, 0, 3), "The sky darkens. The old oak creaks like a ship at sea.")
L.text((6, 0, -1), "A storm bell rings. The branches tremble in answer.")
L.text((3, 0, -2), "The trunk is hollow. Inside, the path goes somewhere else entirely.")
L.text((4, 3, 2), "Grandfather's notes: 'When the branches bow, the oak opens its heart.'")
L.text((1, 6, -1), "A nest of feathers, warm and dry despite the rain.")
L.text((-2, 6, -3), "From here the crown looks close enough to touch.")
L.hint("goal", reach=(-1, 6, -3), pressed=["pA", "pB", "pC", "pD", "pE"])
L.hint("low", reach=(-1, 6, -3), pressed=["pA", "pB", "pC", "pD", "pE"])
L.hint("high", reach=(1, 6, -3))
L.hint("vine", reach=(4, 3, -3))
L.hint("mid", reach=(6, 3, 0))
L.hint("low", reach=(3, 0, 2))
L.hint("low")
L.end("The storm passes over the oak. In the hollow, a white feather glows like a lantern.",
      (-1, 8, -1), [(4, 0, 3), (6, 0, 0), (1, 0, 0), (4, 3, 2), (1, 6, -1), (-2, 6, -3)])
L.save()
