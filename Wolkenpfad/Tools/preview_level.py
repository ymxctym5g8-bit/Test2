# Quick isometric preview of a level (blocks only, plus markers).
# Usage: python3 Tools/preview_level.py level.json out.png ['{"bridge":1,"lift":3}'] [--plates pA,pB]
# Groups not named keep their initial value; triggered groups follow their triggers.
# Markers: red = start, yellow = goal, blue ring = plate, small dots = decor, orange = crank/handle.
import json, sys, math
from PIL import Image, ImageDraw

L = json.load(open(sys.argv[1])); out = sys.argv[2]
state = json.loads(sys.argv[3]) if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else {}
pressed = set()
if "--plates" in sys.argv: pressed = set(sys.argv[sys.argv.index("--plates") + 1].split(","))
groups = {g["id"]: g for g in L["groups"]}
init = lambda g: g.get("step", 0) if g["kind"] == "rotate" else g.get("value", 0)
st = {gid: state.get(gid, init(g)) for gid, g in groups.items()}
derived = {t["group"] for t in L.get("triggers", [])}
for gname in derived:
    v = init(groups[gname])
    for t in L["triggers"]:
        if t["group"] == gname and all(p in pressed for p in t.get("plates", [])) and all(st.get(k) == x for k, x in t.get("states", {}).items()):
            v = t["value"]; break
    if gname not in state: st[gname] = v

def rot(v, k):
    x, y, z = v
    for _ in range(k % 4): x, y, z = z, y, -x
    return (x, y, z)
def world(p, gid):
    p = tuple(p)
    if gid:
        g = groups[gid]; s = st[gid]
        if g["kind"] == "rotate":
            pv = tuple(g["pivot"]); o = rot(tuple(p[i] - pv[i] for i in range(3)), s); p = tuple(pv[i] + o[i] for i in range(3))
        else: p = tuple(p[i] + g["axis"][i] * s for i in range(3))
    return p
C = {"grass": ((150, 200, 120), (236, 214, 178)), "moss": ((120, 170, 110), (170, 165, 140)), "stone": ((246, 230, 206), (226, 204, 178)),
     "stonedark": ((200, 170, 170), (180, 150, 160)), "rock": ((190, 160, 150), (165, 135, 140)), "rockdark": ((140, 115, 130), (120, 100, 120)),
     "water": ((120, 190, 220), (236, 214, 178)), "wood": ((210, 160, 110), (185, 130, 90)), "teal": ((120, 200, 200), (90, 170, 175)),
     "tealdark": ((80, 150, 160), (60, 125, 140)), "tealtop": ((170, 225, 215), (90, 170, 175)), "raft": ((200, 150, 100), (170, 120, 80)),
     "gate": ((220, 90, 70), (200, 70, 60)), "light": ((255, 240, 170), (250, 220, 140)), "glass": ((200, 235, 245), (170, 210, 230)),
     "ghost": ((190, 210, 255), (160, 180, 240)), "cloud": ((250, 250, 255), (225, 228, 240)), "petal": ((150, 170, 240), (120, 140, 220)),
     "brass": ((230, 190, 110), (200, 160, 90))}
S = 40
def proj(x, y, z): return (x - z) / math.sqrt(2), (-x + 2 * y - z) / math.sqrt(6)
cells = [(world(b["p"], b.get("g")), b) for b in L["blocks"]]
pts = [proj(p[0] + dx, p[1] + dy, p[2] + dz) for p, _ in cells for dx in (-.5, .5) for dy in (-.5, .5) for dz in (-.5, .5)]
umin = min(p[0] for p in pts); umax = max(p[0] for p in pts); vmin = min(p[1] for p in pts); vmax = max(p[1] for p in pts)
W = int((umax - umin) * S) + 80; H = int((vmax - vmin) * S) + 80
img = Image.new("RGB", (W, H), (250, 225, 205)); d = ImageDraw.Draw(img)
def sp(x, y, z): u, v = proj(x, y, z); return (40 + (u - umin) * S, 40 + (vmax - v) * S)
def shade(c, f): return tuple(int(min(255, ch * f)) for ch in c)
occupied = {p for p, _ in cells}
for p, b in sorted(cells, key=lambda q: sum(q[0])):
    x, y, z = p; top, side = C.get(b["m"], ((200, 200, 200), (160, 160, 160)))
    if b.get("stair"): top = shade(top, 0.88)
    if b.get("g"): top = shade(top, 1.06); side = shade(side, 0.95)
    d.polygon([sp(x - .5, y + .5, z - .5), sp(x + .5, y + .5, z - .5), sp(x + .5, y + .5, z + .5), sp(x - .5, y + .5, z + .5)], fill=top, outline=shade(top, .8))
    d.polygon([sp(x + .5, y + .5, z - .5), sp(x + .5, y + .5, z + .5), sp(x + .5, y - .5, z + .5), sp(x + .5, y - .5, z - .5)], fill=side, outline=shade(side, .8))
    d.polygon([sp(x - .5, y + .5, z + .5), sp(x + .5, y + .5, z + .5), sp(x + .5, y - .5, z + .5), sp(x - .5, y - .5, z + .5)], fill=shade(side, .8), outline=shade(side, .7))
    if b.get("stair"):
        dd = {"+x": (1, 0), "-x": (-1, 0), "+z": (0, 1), "-z": (0, -1)}[b["stair"]]
        c0 = sp(x, y + .5, z); c1 = sp(x + dd[0] * .4, y + .5, z + dd[1] * .4); d.line([c0, c1], fill=(90, 60, 60), width=3)
    if b["walk"] and (x, y + 1, z) not in occupied:
        c = sp(x, y + .5, z); d.ellipse([c[0] - 2, c[1] - 2, c[0] + 2, c[1] + 2], fill=(110, 140, 90))
def mark(cell, col, r=6, ring=False, gid=None):
    x, y, z = world(cell, gid); c = sp(x, y + .5, z)
    if ring: d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline=col, width=3)
    else: d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=col)
for dd in L.get("decor", []):
    col = (230, 120, 40) if dd["t"] in ("crank", "handle") else (90, 120, 80)
    mark(dd["p"], col, 4 if col[0] == 230 else 2, gid=dd.get("g"))
for pl in L.get("plates", []): mark(pl["at"], (60, 110, 200), 8, ring=True)
mark(L["start"], (220, 60, 60))
gb = next((b for b in L["blocks"] if b["p"] == L["goal"]), None)
mark(L["goal"], (255, 210, 60), 7, gid=gb.get("g") if gb else None)
img.save(out)
print("saved", out, "state", st)
