# Chapter 9 · The Lake of Glass  (Act II – The Search for the Light)
#
# A flat mirror lake high in the sky. Seven glass panes drift on rails across the water like ice floes.
# Hana's own pane (the "ferry" in the middle lane) must carry her all the way across – but the other
# panes block its lane and block each other (a quiet sliding-block puzzle on the sky, 12 moves).
# Aha 1: the panes are not stepping stones, they are traffic – clear one lane and ride.
# Beyond the far pier a turning glass vane carries her out over the void until its tip touches the
# reflection island hovering above the lake (impossible connection 1). Glass stairs climb to the summit,
# where a last pane slides into the sky and meets the prism islet (impossible connection 2).
# Aha 2: board the vane where it touches the shore, then ride it round into the reflection.
#
# Shortest solution: 15 mechanism moves (12 on the lake, 2 vane, 1 sky pane).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

ILL = {(-1, 3, 1), (4, 9, -1)}   # fixed ends of the two impossible connections (moving ends flagged below)
L = Level("Chapter 9 · The Lake of Glass", theme="glasslake", chapter=9, ill=ILL)

# ------------------------------------------------------------------ the lake (x 0..5, z 0..5)
for x in range(0, 6):
    for z in range(0, 6):
        L.block((x, -1, z), "water")                     # the mirror water
RIM = [(x, z) for x in range(-1, 7) for z in range(-1, 7)
       if not (0 <= x <= 5 and 0 <= z <= 5) and (x, z) not in [(6, 2), (-1, 2)]]
for (x, z) in RIM:
    L.block((x, -1, z), "cloud")                         # soft cloud bank around the lake
for x in range(1, 5):
    for z in range(1, 5):
        L.block((x, -2, z), "cloud")
for (x, z) in [(2, 2), (2, 3), (3, 2), (3, 3)]: L.block((x, -3, z), "cloud")

# glass panes: abstract lake coordinates (ax, az) map to world (5-ax, 0, 5-az)
PANES = [  # name, at, axis, length, min, max, init
    ("paneA", (0, 5), "x", 2, 0, 4, 1),
    ("paneB", (0, 2), "x", 2, 3, 4, 4),
    ("paneC", (5, 0), "z", 2, 0, 4, 4),
    ("ferry", (0, 3), "x", 2, 0, 4, 4),   # Hana's pane, the middle lane z=2
    ("paneD", (3, 0), "z", 2, 0, 3, 1),
    ("paneE", (3, 0), "z", 2, 3, 4, 3),
    ("paneF", (1, 0), "z", 2, 3, 4, 3),
]
for name, at, ax, ln, mn, mx, ini in PANES:
    L.slider(name, (-1, 0, 0) if ax == "x" else (0, 0, -1), value=ini, min=mn, max=mx)
    cells = [(5 - at[0] - (i if ax == "x" else 0), 0, 5 - at[1] - (i if ax == "z" else 0)) for i in range(ln)]
    for c in cells: L.block(c, "glass", True, g=name)
    L.decor("handle", cells[0], g=name, axis=ax)

# cloud puffs resting on the rim
for (x, z), s in [((6, 6), 1.2), ((-1, 6), 1.0), ((6, -1), 0.9), ((3, 6), 0.8), ((6, 4), 0.7), ((1, -1), 0.8),
                  ((-1, 0), 0.9), ((6, 0), 0.6), ((0, 6), 0.7)]:
    L.decor("cloudpuff", (x, -1, z), s)

# ------------------------------------------------------------------ start island (front right)
L.block((6, 0, 2), "stone", True)                        # the near pier
for x in (7, 8):
    for z in (1, 2, 3, 4):
        L.block((x, 0, z), "grass", (x, z) not in [(8, 1), (8, 4), (7, 4)])
        L.block((x, -1, z), "rock")
for (x, z) in [(7, 2), (8, 2), (7, 3), (8, 3)]: L.block((x, -2, z), "rockdark")
L.block((8, -3, 3), "rockdark")
L.start = (8, 0, 2)
L.decor("tree", (8, 0, 4), 1.1, variant=1)
L.decor("flowers", (7, 0, 3), 0.8); L.decor("grass", (8, 0, 3), 0.8); L.decor("lantern", (6, 0, 2), 0.8)
L.decor("bush", (7, 0, 4), 0.8)

# ------------------------------------------------------------------ far pier and west islet
L.block((-1, 0, 2), "stone", True)
for (x, z) in [(-2, 2), (-3, 2), (-2, 3), (-3, 3)]:
    L.block((x, 0, z), "grass", (x, z) in [(-2, 2), (-3, 2)])
    L.block((x, -1, z), "rock")
L.block((-3, -2, 2), "rockdark"); L.block((-2, -2, 3), "rockdark")
L.decor("flowers", (-3, 0, 3), 0.8)

# turning glass vane: pivot column at (-4, 0, 1), an arm of two walkable glass tiles.
# Steps 0 and 3 touch the islet (boarding), step 1 points the tip at the reflection, step 2 points away.
L.rotator("vane", (-4, 0, 1), step=2)
L.block((-4, 0, 1), "tealtop", g="vane"); L.block((-4, -1, 1), "teal", g="vane"); L.block((-4, -2, 1), "tealdark", g="vane")
L.block((-3, 0, 1), "glass", True, g="vane")
L.block((-2, 0, 1), "glass", True, g="vane")["ill"] = True   # at step 1 its tip meets the reflection island
L.decor("crank", (-4, -1, 1), g="vane", face="+x")

# ------------------------------------------------------------------ the reflection island above the far shore
# (its +z side stays open: that is where the vane's tip appears to touch it)
for (x, z) in [(-1, 1), (-1, 0), (-2, 0), (0, 0), (0, 1)]:
    L.block((x, 3, z), "stone", (x, z) not in [(0, 0), (0, 1)]); L.block((x, 2, z), "rock")
L.block((-1, 1, 0), "rockdark"); L.block((0, 1, 0), "rockdark")
L.decor("tree", (0, 3, 0), 0.9, variant=2); L.decor("flowers", (0, 3, 1), 0.7)
# floating glass stairs up to the summit
L.stair((-3, 4, 0), "-x", "glass", support="cloud")
L.block((-4, 4, 0), "glass", True); L.block((-4, 3, 0), "cloud")
L.stair((-4, 5, -1), "-z", "glass", support="cloud")
L.block((-4, 5, -2), "glass", True); L.block((-4, 4, -2), "cloud")
L.stair((-4, 6, -3), "-z", "glass", support="cloud")
# summit
for (x, z) in [(-4, -4), (-3, -4), (-5, -4), (-4, -5), (-3, -5), (-5, -5)]:
    L.block((x, 6, z), "stone", (x, z) in [(-4, -4), (-3, -4), (-4, -5)]); L.block((x, 5, z), "rock")
for (x, z) in [(-4, -4), (-3, -4), (-4, -5)]: L.block((x, 4, z), "rockdark")
L.block((-4, 3, -5), "rockdark")
L.decor("lightshaft", (-5, 6, -5), 1.2); L.decor("pillar", (-3, 6, -5), 0.8); L.decor("pillar", (-5, 6, -4), 0.8)

# the last pane slides out into the sky along x
L.slider("skypane", (1, 0, 0), value=0, min=0, max=2)
L.block((-2, 6, -4), "glass", True, g="skypane")
L.block((-1, 6, -4), "glass", True, g="skypane")["ill"] = True   # at value 1 it meets the prism islet
L.decor("handle", (-2, 6, -4), g="skypane", axis="x")

# the prism islet hovering high above the lake
for (x, z) in [(4, -1), (5, -1), (4, 0), (5, 0)]:
    L.block((x, 9, z), "cloud", (x, z) != (5, 0)); L.block((x, 8, z), "cloud")
L.block((4, 7, -1), "cloud"); L.block((5, 7, 0), "cloud"); L.block((5, 6, 0), "cloud")
L.goal = (5, 9, -1)
L.goal_item = "prism"
L.decor("altar", L.goal)
L.decor("cloudpuff", (5, 9, 0), 1.0); L.decor("cloudpuff", (4, 9, 0), 0.6)

# a few drifting cloud islets for depth (never walkable)
for (x, y, z) in [(0, -4, 7), (-1, -4, 7), (7, 4, 0), (7, 5, 0), (8, 4, 0)]:
    L.block((x, y, z), "cloud")
L.decor("cloudpuff", (0, -4, 7), 1.3); L.decor("cloudpuff", (7, 5, 0), 1.1)

# ------------------------------------------------------------------ story
L.text(L.start, "The lake lies so still that the sky forgets which way is up.")
L.text((6, 0, 2), "Glass panes drift on the water. Only one of them is mine.")
L.text((-1, 0, 2), "Barefoot on the sky, I can hear the glass humming.")
L.text((-1, 3, 1), "I stepped into the reflection, and it held me.")
L.text((-4, 4, 0), "Grandfather wrote: light hides where the water looks up.")
L.text((-3, 6, -4), "Up here the lake is a mirror, and the mirror is a door.")
L.end("The prism drinks the stillness of the lake and begins to glow. "
      "Somewhere ahead, a sunbeam remembers its way.",
      (8, 0, 1), [(7, 0, 2), (7, 0, 1), (6, 0, 2), (-2, 0, 2), (-1, 0, 2), (-1, 3, 1), (-4, 6, -4), (4, 9, -1)])

# Kiko's hints – first matching rule wins
L.hint("goal", reach=L.goal)
L.hint("skypane", reach=(-3, 6, -4))
L.hint("vane", reach=(-3, 0, 2))
L.hint("ferry", reach=(5, 0, 2))
L.hint("paneE")

L.save()
