# Chapter 6 · The Valley of Whispering Grass  (Act I, theme "grassvale")
# A valley of man-high grass.  Two giant grass stalks ("stalkA", "stalkB") rise and sink like
# breathing; a hollow log ("log") lies between them at height 3 and can roll along x - but only
# through stalk B's shaft while that stalk has ducked below the log.  Three lullaby stones
# (plates s1..s3) each make one kodama step aside (plate triggers on locked groups):
#   s1 on the east outcrop (log ride)     -> kA leaves the high back terrace
#   s2 on the high back terrace (stalk A) -> kB leaves the stone beside the start meadow
#   s3 beside the start meadow (stalk B)  -> kC gets up from the bell
# Aha: the stalk has to duck so the log can roll past - and seen from the far end of the log,
# the bell shrine far behind the valley is only one step away (illusion).
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level

ILL = {(1, 3, 0), (0, 0, -4)}
L = Level("Chapter 6 · The Valley of Whispering Grass", theme="grassvale", chapter=6, ill=ILL)
L.goal_item = "bell"
USED = set()

def put(p, m, walk=False, g=None):
    if g is None:
        if tuple(p) in USED: return
        USED.add(tuple(p))
    L.block(p, m, walk, g=g)

def kodama(gid, cell, axis, plate):
    L.slider(gid, axis, value=0, min=0, max=1, locked=True)
    L.block(cell, "moss", g=gid); L.decor("kodama", cell, g=gid)
    L.trigger(gid, 1, plates=[plate])

SHAFTS = {(0, 0), (2, 0)}
TG = 0
def tallgrass(p, s=1.0):
    global TG
    TG += 1
    L.decor("tallgrass", p, s, r=(TG * 0.7) % 3.14)

# ---------------------------------------------------------------- twin grass stalks + log
L.slider("stalkA", (0, 1, 0), value=5, min=0, max=5)
L.slider("stalkB", (0, 1, 0), value=4, min=0, max=4)
for y in range(-5, 1):
    L.block((0, y, 0), "grass" if y == 0 else "moss", y == 0, g="stalkA")
for y in range(-4, 1):
    L.block((2, y, 0), "grass" if y == 0 else "moss", y == 0, g="stalkB")
L.decor("handle", (0, 0, 0), g="stalkA", axis="y"); L.decor("handle", (2, 0, 0), g="stalkB", axis="y")
L.slider("log", (1, 0, 0), value=0, min=0, max=2)
L.block((1, 3, 0), "wood", True, g="log")
L.decor("handle", (1, 3, 0), g="log", axis="x")

# ---------------------------------------------------------------- start meadow (y = 0) and stone 3
for p in [(2, 0, 1), (3, 0, 1), (2, 0, 2), (3, 0, 2), (3, 0, 3), (4, 0, 1)]:
    put(p, "grass", True)
L.start = (3, 0, 3)
L.plate("s3", (4, 0, 1))
kodama("kB", (4, 1, 1), (1, 0, 0), "s2")
for p in [(5, 0, 1), (4, 0, 2), (4, 0, 3), (2, 0, 3), (1, 0, 2), (5, 0, 2)]:
    put(p, "grass")
L.decor("flowers", (4, 0, 3), 0.8); tallgrass((4, 0, 2)); tallgrass((5, 0, 2), 1.1); L.decor("mushroom", (2, 0, 3), 0.7)
L.decor("tree", (1, 0, 2), 1.0, variant=1)

# ---------------------------------------------------------------- east outcrop with stone 1 (y = 3)
put((4, 3, 0), "grass", True); L.plate("s1", (4, 3, 0))
for y in range(-1, 3): put((4, y, 0), "rock" if y > 0 else "grass")
put((5, 2, 0), "grass"); put((5, 1, 0), "rock"); put((5, 0, 0), "grass"); put((4, 2, -1), "grass")
tallgrass((5, 2, 0), 1.0); tallgrass((4, 2, -1), 0.9); tallgrass((5, 0, 0))

# ---------------------------------------------------------------- the high back terrace (y = 5), stone 2
for p in [(0, 5, -1), (0, 5, -2), (-1, 5, -2)]:
    put(p, "grass", True)
L.plate("s2", (-1, 5, -2))
kodama("kA", (0, 6, -2), (1, 0, 0), "s1")
put((1, 5, -2), "grass"); put((-1, 5, -1), "grass"); put((-1, 5, -3), "grass"); put((0, 5, -3), "grass")
tallgrass((1, 5, -2)); L.decor("tree", (-1, 5, -3), 1.1, variant=0); tallgrass((0, 5, -3), 0.9)
L.decor("butterflies", (-1, 5, -1), 0.9)
for (x, z) in [(0, -1), (0, -2), (-1, -2), (1, -2), (-1, -1), (-1, -3), (0, -3)]:
    put((x, 4, z), "rock")
for p in [(0, 3, -2), (-1, 3, -2), (-1, 3, -3), (0, 3, -3), (-1, 2, -3), (-1, 2, -2), (-1, 1, -3), (-1, 0, -3), (-1, -1, -3),
          (-2, 0, -3), (-2, -1, -3), (0, 2, -3)]:
    put(p, "rock" if p[1] > 0 else "rockdark")
L.decor("vine", (0, 5, -1), 1.0)

# ---------------------------------------------------------------- the valley floor of whispering grass
for x in range(-3, 6):
    for z in range(-2, 5):
        if (x, z) in SHAFTS: continue
        if (x, -1, z) in USED or (x, 0, z) in USED: continue
        if x + z > 7 or x - z < -6 or (x, z) in [(5, -2), (5, -1), (-3, -2), (-3, 4), (-2, -2)]: continue
        put((x, -1, z), "grass")
        if (x + 2 * z) % 3 == 0: tallgrass((x, -1, z), 1.0 + ((x * z) % 3) * 0.1)
for x in range(-2, 5):
    for z in range(-1, 4):
        if (x, z) in SHAFTS: continue
        if x + z > 6 or x - z < -5: continue
        put((x, -2, z), "rock")
for x in range(-1, 4):
    for z in range(0, 3):
        if (x, z) in SHAFTS: continue
        put((x, -3, z), "rockdark")
for p in [(1, -4, 1), (1, -4, 2), (1, -5, 1)]: put(p, "rockdark")
# the west hill
for p in [(-2, 0, 1), (-2, 0, 2), (-3, 0, 2), (-2, 1, 2), (-1, 0, 3), (-2, 0, 3), (-3, 0, 1)]:
    put(p, "grass")
tallgrass((-2, 1, 2), 1.2); tallgrass((-3, 0, 1)); tallgrass((-1, 0, 3), 0.9); L.decor("tree", (-2, 0, 3), 1.0, variant=0)
L.decor("tree", (-3, 0, 2), 0.8, variant=1); tallgrass((-2, 0, 1), 1.1)

# ---------------------------------------------------------------- the bell shrine behind the valley
put((0, 0, -4), "grass", True)
kodama("kC", (0, 1, -4), (-1, 0, 0), "s3")
for p in [(-1, 0, -4), (0, -1, -4), (-1, -1, -4), (0, -2, -4), (0, 0, -5), (0, -1, -5), (-1, 0, -5)]:
    put(p, "grass" if p[1] == 0 else "rockdark")
tallgrass((-1, 0, -5), 0.9); L.decor("flowers", (0, 0, -5), 0.8)
L.goal = (0, 0, -4)
L.decor("altar", L.goal)

# ---------------------------------------------------------------- story
L.text((3, 0, 3), "The grass here is taller than Hana. It whispers as she passes.")
L.text((2, 0, 1), "Two stalks breathe in and out, slow as sleeping giants.")
L.text((4, 3, 0), "Hana hums the lullaby carved in the stone. Somewhere, a kodama yawns.")
L.text((0, 5, -1), "Grandfather's notes: 'Let the tall one bow, and the log will roll.'")
L.text((-1, 5, -2), "A second song. Far below, a little spirit shuffles aside.")
L.text((4, 0, 1), "The last kodama gets up from the bell and tilts its head.")
L.hint("goal", reach=(4, 0, 1), pressed=["s3"])
L.hint("log", reach=(2, 0, 1), pressed=["s3"])
L.hint("s3", reach=(2, 0, 1), pressed=["s2"])
L.hint("stalkB", reach=(0, 5, -1), pressed=["s2"])
L.hint("stalkA", reach=(4, 3, 0), pressed=["s1"])
L.hint("log", reach=(2, 0, 1), unpressed=["s1"])
L.hint("stalkB")
L.end("The bell rings, and the whole valley sways to its lullaby. The kodama hum along.",
      (-2, 0, 2), [(3, 0, 2), (2, 0, 1), (4, 3, 0), (0, 5, -1), (-1, 5, -2), (4, 0, 1), (0, 0, -4)])
L.save()
