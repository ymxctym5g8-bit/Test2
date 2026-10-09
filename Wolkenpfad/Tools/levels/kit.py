# Small building blocks for chapter generators on top of leveldsl.Level.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from leveldsl import Level  # noqa: F401  (re-exported)

ARM = {0: (1, 0, 0), 1: (0, 0, -1), 2: (-1, 0, 0), 3: (0, 0, 1)}   # arm direction of a rotator at each step


def island(L, cells, y, top="grass", under="rock", deep="rockdark", depth=2, walk=True, taper=True):
    """Floating island: walkable tops at height y with a tapering rock body below."""
    cells = [tuple(c) for c in cells]
    for k, (x, z) in enumerate(cells):
        L.block((x, y, z), top, walk)
        d = depth if not taper else max(1, depth - (k % 2))
        for i in range(1, d + 1):
            L.block((x, y - i, z), under if i < d else deep)


def hub(L, gid, pivot, step=0, arm=1, top="tealtop", armm="wood", body="teal", bodydark="tealdark",
        face="+z", depth=2, minStep=None, maxStep=None, extra=()):
    """Turntable bridge: walkable pivot tile plus an arm of length `arm` in +x (at step 0);
    a support column below the pivot carries the crank."""
    x, y, z = pivot
    L.rotator(gid, pivot, step=step, minStep=minStep, maxStep=maxStep)
    L.block(pivot, top, True, g=gid)
    for k in range(1, arm + 1):
        L.block((x + k, y, z), armm, True, g=gid)
    for i in range(1, depth + 1):
        L.block((x, y - i, z), body if i < depth else bodydark, g=gid)
    for (p, m, w) in extra:
        L.block(p, m, w, g=gid)
    L.decor("crank", (x, y - depth, z), g=gid, face=face)


def lift(L, gid, top_cell, value=0, lo=0, hi=3, top="tealtop", body="teal", bodydark="tealdark", depth=2,
         locked=False, handle=True, axis=(0, 1, 0)):
    """Lift column (slides along axis); the top block is walkable."""
    x, y, z = top_cell
    L.slider(gid, axis, value=value, min=lo, max=hi, locked=locked)
    L.block(top_cell, top, True, g=gid)
    for i in range(1, depth + 1):
        L.block((x, y - i, z), body if i < depth else bodydark, g=gid)
    if handle and not locked:
        ax = "y" if axis[1] else ("x" if axis[0] else "z")
        L.decor("handle", top_cell, g=gid, axis=ax)
