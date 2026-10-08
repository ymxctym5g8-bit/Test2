# Chapter 10 · The Town of Bellflowers  (Act II – The Search for the Light)
#
# An evening town built among giant glowing bellflowers. Tiny houses sit on stone terraces at three
# heights; the flowers' stems turn (cranks) and every stem carries TWO petal platforms on opposite sides:
# a low petal for the streets (y=0) and a high one for the rooftops (y=2).
#   * Aha 1: the petals are ferries – stand on one and turn the stem to be carried round the corner.
#   * Aha 2: the two petals of a stem are coupled – the high petal always points the other way, so the
#     rooftop crossing (A high east, B high west) only works once the street petals point away.
#   * Four bell stones (plates) ring through the town; when all four have rung the old bellflower (E)
#     lifts its drooping head – but only while the crown flower (C) bows aside (state trigger).
#     The bell (goal) hangs in E's head.
# Shortest solution: 16 mechanism moves.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

L = Level("Chapter 10 · The Town of Bellflowers", theme="bellflower", chapter=10)


def stem(gid, pivot, petals, ybot, ytop, step, crank_y, locked=False, head=2.2):
    """A giant bellflower stem turning about its own column; its petals are walkable platforms."""
    px, _, pz = pivot
    for y in range(ybot, ytop + 1):
        L.block((px, y, pz), "moss" if y > ybot else "tealdark", g=gid)
    for p in petals:
        L.block(p, "petal", True, g=gid)
    L.rotator(gid, pivot, step=step, locked=locked)
    if not locked: L.decor("crank", (px, crank_y, pz), g=gid, face="+x")
    L.decor("bellflower", (px, ytop, pz), head, g=gid)


def terrace(walk, y, deco=(), m="stone", under="rock", down_to=None):
    """Stone terrace: walkable cells, non-walkable cells (for houses, flowers), one rock layer below
    and a small dark keel under the first cell – or, with down_to, house walls down to that height."""
    cells = list(walk) + list(deco)
    for (x, z) in cells:
        L.block((x, y, z), m, (x, z) in walk)
        if down_to is None:
            L.block((x, y - 1, z), under)
        else:
            for yy in range(down_to, y): L.block((x, yy, z), "wood" if yy == y - 1 else "stone")
    if down_to is None:
        x, z = cells[0]
        L.block((x, y - 2, z), "rockdark")


# ------------------------------------------------------------------ the two street flowers A and B
stem("A", (0, 0, 0), [(1, 0, 0), (-1, 2, 0)], -3, 3, 1, -2)
stem("B", (3, 0, 0), [(4, 0, 0), (2, 2, 0)], -3, 3, 1, -2)

# ------------------------------------------------------------------ lower town (y = 0)
terrace([(-2, 0), (-3, 0), (-2, 1), (-3, 1)], 0, deco=[(-4, 0), (-4, 1), (-3, -1), (-3, 2)], m="grass")  # square
L.start = (-3, 0, 1)
L.decor("house", (-4, 0, 0), 0.9, variant=0, r=1.5708); L.decor("house", (-3, 0, -1), 0.8, variant=1)
L.decor("bellflower", (-3, 0, 2), 1.0); L.decor("lantern", (-2, 0, 1), 0.8)
terrace([(0, 2), (1, 2), (0, 3)], 0, deco=[(1, 3), (-1, 3)], m="grass")                              # bell 4
L.plate("p4", (0, 0, 2))
L.decor("house", (1, 0, 3), 0.8, variant=1); L.decor("bellflower", (-1, 0, 3), 0.9)
terrace([(3, 2), (3, 3), (4, 3)], 0, deco=[(4, 4), (3, 4)], m="grass")                               # bell 1
L.plate("p1", (3, 0, 2))
L.decor("house", (4, 0, 4), 0.85, variant=0); L.decor("flowers", (3, 0, 4), 0.8); L.decor("lantern", (4, 0, 3), 0.7)
terrace([(3, -2), (2, -2)], 0, deco=[(2, -3)], m="grass")                                            # lift yard
L.decor("bellflower", (2, 0, -3), 1.1)

# bell-rope lift between the lower town and the rooftops
L.slider("lift", (0, 1, 0), value=2, min=0, max=2)
for y in range(-3, 1): L.block((4, y, -2), "petal" if y == 0 else "tealdark", y == 0, g="lift")
L.decor("handle", (4, 0, -2), g="lift", axis="y")

# ------------------------------------------------------------------ rooftops (y = 2)
terrace([(5, -2), (5, -1), (5, 0)], 2, deco=[(6, -1), (6, 0)], down_to=0)
L.decor("house", (6, 2, 0), 0.8, variant=1, r=1.5708); L.decor("bellflower", (6, 2, -1), 0.9)
terrace([(0, -2), (1, -2), (-1, -2)], 2, deco=[(1, -3), (-1, -3), (-2, -2)], down_to=0)                      # bell 2
L.plate("p2", (-1, 2, -2))
L.decor("house", (1, 2, -3), 0.8, variant=0); L.decor("house", (-2, 2, -2), 0.75, variant=1, r=1.5708)
L.decor("lantern", (-1, 2, -3), 0.8)

# ------------------------------------------------------------------ the island under the town: canals of
# evening water between the terraces (the petals float over them like lily pads), rock below
taken = {tuple(b["p"]) for b in L.B}
keep_free = {(0, 0), (3, 0), (4, -2)}          # stem pivots and the lift shaft
def inside(x, z, r):
    return abs(x - 0.5) + abs(z - 0.5) <= r and -4 <= x <= 5 and -3 <= z <= 4
for (y, r, m) in [(-1, 6, "water"), (-2, 3, "rock"), (-3, 1, "rockdark")]:
    for x in range(-4, 6):
        for z in range(-3, 5):
            if not inside(x, z, r) or (x, z) in keep_free or (x, y, z) in taken: continue
            if y == -1 and (x, 0, z) in taken:
                L.block((x, y, z), "rock"); continue
            L.block((x, y, z), m)

# stairs to the crown
L.stair((0, 3, -3), "-z", "stone", support="rock")
L.block((0, 3, -4), "stone", True); L.block((0, 2, -4), "rock")
L.stair((0, 4, -5), "-z", "stone", support="rock")

# ------------------------------------------------------------------ the crown (y = 4)
terrace([(0, -6), (-1, -6)], 4, deco=[(1, -6)])
L.decor("lantern", (1, 4, -6), 0.8)
stem("C", (-3, 4, -6), [(-2, 4, -6), (-4, 4, -6)], 1, 6, 1, 2, head=2.0)
terrace([(-3, -8), (-4, -8)], 4, deco=[(-4, -9), (-3, -9)])                                        # bell 3 islet
L.plate("p3", (-3, 4, -8))
L.decor("house", (-4, 4, -9), 0.7, variant=0); L.decor("bellflower", (-3, 4, -9), 1.0)
# the old bellflower E: its drooping head holds the bell; it lifts the head towards the crown terrace
# once all four bells have rung and the crown flower C bows aside (C pointing along z)
stem("E", (0, 4, -7), [(1, 4, -7)], 1, 6, 0, 2, locked=True, head=2.6)
for c in (1, 3):
    L.trigger("E", 2, plates=["p1", "p2", "p3", "p4"], states={"C": c})
L.goal = (1, 4, -7)
L.goal_item = "bell"
L.decor("altar", L.goal, g="E")

# a few floating flower islets for depth
for (x, y, z, v) in [(-6, 1, -3, 1.4), (7, -2, 3, 1.2), (-5, 5, -9, 1.0)]:
    L.block((x, y, z), "grass"); L.block((x, y - 1, z), "rockdark")
    L.decor("bellflower", (x, y, z), v)

# ------------------------------------------------------------------ story
L.text(L.start, "Evening in the town of bellflowers. Every lamp here is a blossom.")
L.text((0, 0, 2), "A bell rings beneath my feet. Somewhere an old flower stirs.")
L.text((3, 0, 2), "Each stem holds two petals: one for the street, one for the roofs.")
L.text((5, 2, 0), "From the rooftops the turning stems look like a slow blue clock.")
L.text((-3, 4, -8), "Grandfather wrote: the town still sings, if someone listens.")
L.text((0, 4, -6), "The old bellflower waits for every bell, and for the crown to bow.")
L.end("The old bellflower lifts its head and the whole town rings softly. "
      "The light moves on, toward the mountain that breathes.",
      (-4, 0, 1), [(-2, 0, 0), (0, 0, 3), (3, 0, 3), (2, 0, -2), (5, 2, -1), (0, 2, -2), (-1, 4, -6), (-4, 4, -8)])

# Kiko's hints – first matching rule wins
L.hint("goal", reach=L.goal)
L.hint("C", reach=(0, 4, -6), pressed=["p1", "p2", "p3", "p4"])
L.hint("p3", reach=(-3, 4, -8), unpressed=["p3"])
L.hint("C", reach=(0, 4, -6), unpressed=["p3"])
L.hint("p2", reach=(-1, 2, -2), unpressed=["p2"])
L.hint("B", reach=(5, 2, 0))
L.hint("lift", reach=(3, 0, -2))
L.hint("p1", reach=(3, 0, 2), unpressed=["p1"])
L.hint("B", reach=(0, 0, 2), pressed=["p4"])
L.hint("p4", reach=(0, 0, 2), unpressed=["p4"])
L.hint("A")

L.save()
