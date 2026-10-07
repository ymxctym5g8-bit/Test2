# Rendert Mockups der Neko-no-Machi-Kapitel (level4–6) mit dem Renderer aus render_mockups.py.
# Aufruf: python3 Tools/render_neko_mockups.py Wolkenpfad/Level Mockups/
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_mockups as rm
from render_mockups import (rgb, mix, mul, add, sub, scl, dot, depth, circle, ball, glow, box_item, State, Cam,
                            text_c, finger, finish, home_indicator, CW, CH, SS, FONT_DIR)

# ---------------- Palette wie Art.swift / NekoProps.swift ----------------
rm.MAT.update({
    "pavement": (rgb(.85, .8, .69), rgb(.93, .89, .82)),
    "garden": (rgb(.47, .69, .38), rgb(.93, .89, .82)),
    "roof": (rgb(.42, .41, .52), rgb(.94, .9, .82)),
    "foundation": (rgb(.64, .62, .57), rgb(.64, .62, .57)),
    "foundationdark": (rgb(.54, .52, .47), rgb(.54, .52, .47)),
    "woodplank": (rgb(.6, .42, .27), rgb(.5, .34, .22)),
    "mech": (rgb(.25, .44, .69), rgb(.25, .44, .69)),
    "mechdark": (rgb(.18, .33, .56), rgb(.18, .33, .56)),
    "mechtop": (rgb(.5, .65, .85), rgb(.25, .44, .69)),
    "satograss": (rgb(.56, .75, .37), rgb(.72, .6, .45)),
    "paddy": (rgb(.55, .76, .68), rgb(.72, .6, .45)),
    "earth": (rgb(.8, .71, .54), rgb(.85, .76, .63)),
    "earthdark": (rgb(.61, .52, .38), rgb(.61, .52, .38)),
    "autumn": (rgb(.69, .68, .38), rgb(.74, .71, .66)),
    "stonegrey": (rgb(.81, .79, .76), rgb(.72, .7, .66)),
    "stonegreydark": (rgb(.58, .56, .53), rgb(.58, .56, .53)),
    "pagoda": (rgb(.66, .42, .24), rgb(.77, .27, .17)),
})
BLUE_SKY = [(0, rgb(.24, .5, .84)), (.3, rgb(.34, .6, .88)), (.6, rgb(.58, .75, .92)), (.82, rgb(.8, .87, .93)), (1, rgb(.9, .92, .92))]
for t in ("town", "satoyama", "fuji"):
    rm.SKIES[t] = BLUE_SKY
    rm.LIGHT[t] = (1.04, 0.0)
    rm.CLOUD[t] = ((255, 255, 255), rgb(.72, .78, .88), rgb(.78, .8, .9))

PLASTER = rgb(.94, .9, .82); ROOF = rgb(.37, .36, .47); WOOD = rgb(.6, .42, .27); WOODDARK = rgb(.42, .29, .21)
RED = rgb(.85, .22, .2); VERMILION = rgb(.77, .27, .17); STRAW = rgb(.8, .68, .43); STONE = rgb(.66, .64, .6)
NAVY = rgb(.16, .3, .52); BRASS = rgb(.95, .78, .42)


def P(cam, w): return cam.p(w)


def poly3(d, cam, pts, fill):
    d.polygon([cam.p(q) for q in pts], fill=fill)


def box(cam, top, off, half, col_top, col_side, seed, T=lambda q: q):
    return box_item(cam, (0, 0, 0), half, lambda q: T(add(add(top, off), q)), "x", seed, colors=(col_top, col_side))


# ---------------- Requisiten ----------------
def house(cam, p, top, s, dd, i, gl, T):
    wall = box(cam, top, (0, .31 * s, 0), (.41 * s, .31 * s, .39 * s), PLASTER, PLASTER, 900 + i)
    def draw(d):
        wall[1](d)
        u = s
        y0, y1 = top[1] + .6 * u, top[1] + .88 * u
        x0, x1 = top[0] - .49 * u, top[0] + .49 * u
        z0, z1 = top[2] - .48 * u, top[2] + .48 * u
        zc = top[2]
        # Giebeldreieck (rechts) und vordere Dachfläche
        poly3(d, cam, [(top[0] + .41 * u, y0, z0 + .09), (top[0] + .41 * u, y1 - .02, zc), (top[0] + .41 * u, y0, z1 - .09)], mul(PLASTER, .92))
        poly3(d, cam, [(x0, y0, z1), (x1, y0, z1), (x1, y1, zc), (x0, y1, zc)], ROOF)
        for k in range(1, 6):
            t = k / 6
            a = (x0 + (x1 - x0) * t, y0, z1); b = (x0 + (x1 - x0) * t, y1, zc)
            d.line([cam.p(a), cam.p(b)], fill=mul(ROOF, .8), width=max(2, int(cam.ppu * .012)))
        d.line([cam.p((x0, y1, zc)), cam.p((x1, y1, zc))], fill=mul(ROOF, .7), width=int(cam.ppu * .03))
        # Tür und Fenster vorn
        fz = top[2] + .395 * u
        poly3(d, cam, [(top[0] + .05, top[1], fz), (top[0] + .31, top[1], fz), (top[0] + .31, top[1] + .3, fz), (top[0] + .05, top[1] + .3, fz)], rgb(.96, .93, .84))
        d.line([cam.p((top[0] + .18, top[1], fz)), cam.p((top[0] + .18, top[1] + .3, fz))], fill=WOODDARK, width=max(2, int(cam.ppu * .015)))
        poly3(d, cam, [(top[0] - .3, top[1] + .37, fz), (top[0] - .1, top[1] + .37, fz), (top[0] - .1, top[1] + .51, fz), (top[0] - .3, top[1] + .51, fz)], rgb(.98, .92, .7))
    return (depth(top) + .45, draw)


def pole_top(p, s): return add(p, (0, .5 + 1.55 * s, 0))


def pole(cam, p, top, s, dd, i, gl, T):
    grey = rgb(.52, .46, .4)
    def draw(d):
        a = cam.p(top); b = cam.p(add(top, (0, 1.7 * s, 0)))
        d.line([a, b], fill=grey, width=int(cam.ppu * .07))
        for y, w in ((1.55, .21), (1.42, .15)):
            d.line([cam.p(add(top, (-w, y * s, 0))), cam.p(add(top, (w, y * s, 0)))], fill=grey, width=int(cam.ppu * .045))
    items = [(depth(top) + .3, draw)]
    if dd.get("to"):
        A, B = pole_top(p, s), pole_top(tuple(dd["to"]), s)
        n = dd.get("variant", 0)
        def wire(d):
            pts = []
            for k in range(13):
                t = k / 12
                q = add(A, scl(sub(B, A), t)); q = (q[0], q[1] - .25 * 4 * t * (1 - t), q[2])
                pts.append(q)
            d.line([cam.p(q) for q in pts], fill=(50, 45, 52), width=max(2, int(cam.ppu * .014)))
            for k in range(n):
                q = pts[int((k + 1) / (n + 1) * 12)]
                sparrow_draw(d, cam, add(q, (0, .05, 0)), .55)
        items.append((max(depth(A), depth(B)) + 1, wire))
    return items


def laundry(cam, p, top, s, dd, i, gl, T):
    a = add(top, (-.42, 0, .5)); b = add(top, (.42, 0, .5))
    cols = [rgb(.95, .6, .62), rgb(.98, .88, .5), rgb(.6, .78, .92), (255, 255, 255)]
    def draw(d):
        for x in (-.42, .42):
            d.line([cam.p(add(top, (x, 0, .5))), cam.p(add(top, (x, .5, .5)))], fill=WOODDARK, width=int(cam.ppu * .025))
        d.line([cam.p(add(a, (0, .46, 0))), cam.p(add(b, (0, .46, 0)))], fill=(90, 80, 80), width=max(2, int(cam.ppu * .01)))
        rnd = random.Random(i)
        for k in range(4):
            x = -.32 + k * .21
            h = rnd.uniform(.14, .22)
            poly3(d, cam, [add(top, (x - .07, .46, .5)), add(top, (x + .07, .46, .5)), add(top, (x + .07, .46 - h, .5)), add(top, (x - .07, .46 - h, .5))], cols[k % 4])
    return (depth(add(top, (0, 0, .5))) + .2, draw)


def vending(cam, p, top, s, dd, i, gl, T):
    body = box(cam, top, (.12, .3, -.15), (.16, .3, .14), RED, RED, 950 + i)
    def draw(d):
        body[1](d)
        fx = top[0] + .28
        poly3(d, cam, [(fx, top[1] + .35, top[2] - .25), (fx, top[1] + .35, top[2] - .05), (fx, top[1] + .55, top[2] - .05), (fx, top[1] + .55, top[2] - .25)], (235, 245, 250))
        rnd = random.Random(i)
        for k in range(6):
            c = cam.p((fx, top[1] + .4 + (k // 3) * .09, top[2] - .22 + (k % 3) * .07))
            circle(d, c, cam.ppu * .018, rnd.choice([(80, 150, 220), (240, 180, 60), (90, 190, 120), (230, 90, 80)]))
        glow(gl, cam.p((fx, top[1] + .45, top[2] - .15)), cam.ppu * .4, (220, 240, 255), .5)
    return (body[0], draw)


def postbox(cam, p, top, s, dd, i, gl, T):
    b = box(cam, top, (-.3, .2, -.3), (.08, .2, .08), RED, RED, 960 + i)
    def draw(d):
        b[1](d)
        c = cam.p(add(top, (-.3, .42, -.3)))
        d.ellipse((c[0] - cam.ppu * .1, c[1] - cam.ppu * .05, c[0] + cam.ppu * .1, c[1] + cam.ppu * .05), fill=mul(RED, .85))
    return (b[0] + .05, draw)


def bench(cam, p, top, s, dd, i, gl, T):
    return box(cam, top, (0, .14, -.28), (.32, .03, .1), WOOD, WOODDARK, 970 + i)


def planter(cam, p, top, s, dd, i, gl, T):
    b = box(cam, top, (.28, .07, -.28), (.12, .07, .12), rgb(.6, .4, .3), rgb(.55, .36, .28), 980 + i)
    def draw(d):
        b[1](d)
        ball(d, cam.p(add(top, (.28, .2, -.28))), cam.ppu * .12, rgb(.47, .69, .38))
        for k in range(3):
            circle(d, cam.p(add(top, (.22 + k * .06, .27, -.24))), cam.ppu * .025, rgb(.98, .6, .7))
    return (b[0] + .1, draw)


def chochin(cam, p, top, s, dd, i, gl, T):
    a = add(top, (.32, 0, -.32))
    def draw(d):
        d.line([cam.p(a), cam.p(add(a, (0, .5, 0)))], fill=WOODDARK, width=int(cam.ppu * .03))
        c = cam.p(add(a, (0, .38, .04)))
        r = cam.ppu * .1
        glow(gl, c, r * 4, (255, 170, 120), .55)
        d.ellipse((c[0] - r, c[1] - r * 1.2, c[0] + r, c[1] + r * 1.2), fill=RED)
        for k in (-1, 0, 1):
            d.line([(c[0] - r, c[1] + k * r * .45), (c[0] + r, c[1] + k * r * .45)], fill=mul(RED, .75), width=max(1, int(cam.ppu * .01)))
        d.rectangle((c[0] - r * .55, c[1] - r * 1.35, c[0] + r * .55, c[1] - r * 1.1), fill=(40, 30, 30))
    return (depth(a) + .2, draw)


def minka(cam, p, top, s, dd, i, gl, T):
    wall = box(cam, top, (0, .21 * s, 0), (.4 * s, .21 * s, .36 * s), rgb(.55, .38, .24), rgb(.55, .38, .24), 990 + i)
    def draw(d):
        wall[1](d)
        apex = add(top, (0, 1.02 * s, 0))
        base = [add(top, (x * .54 * s, .4 * s, z * .5 * s)) for x, z in ((-1, 1), (1, 1), (1, -1))]
        poly3(d, cam, [base[0], base[1], apex], STRAW)
        poly3(d, cam, [base[1], base[2], apex], mul(STRAW, .85))
        d.line([cam.p(add(apex, (-.25 * s, -.02, 0))), cam.p(add(apex, (.25 * s, -.02, 0)))], fill=(76, 60, 50), width=int(cam.ppu * .06))
        fz = top[2] + .365 * s
        poly3(d, cam, [(top[0] - .26, top[1], fz), (top[0] - .04, top[1], fz), (top[0] - .04, top[1] + .26, fz), (top[0] - .26, top[1] + .26, fz)], rgb(.96, .92, .82))
    return (depth(top) + .45, draw)


def jizo(cam, p, top, s, dd, i, gl, T):
    def draw(d):
        for x in (-.16, 0, .16):
            b = add(top, (x, 0, -.3))
            c = cam.p(add(b, (0, .1, 0)))
            d.ellipse((c[0] - cam.ppu * .06, c[1] - cam.ppu * .1, c[0] + cam.ppu * .06, c[1] + cam.ppu * .1), fill=STONE)
            ball(d, cam.p(add(b, (0, .25, 0))), cam.ppu * .055, STONE)
            hc = cam.p(add(b, (0, .16, .02)))
            d.polygon([(hc[0] - cam.ppu * .06, hc[1] - cam.ppu * .02), (hc[0] + cam.ppu * .06, hc[1] - cam.ppu * .02), (hc[0], hc[1] + cam.ppu * .07)], fill=RED)
    return (depth(top) + .1, draw)


def kakashi(cam, p, top, s, dd, i, gl, T):
    b = add(top, (.3, 0, -.3))
    def draw(d):
        d.line([cam.p(b), cam.p(add(b, (0, .55, 0)))], fill=WOODDARK, width=int(cam.ppu * .03))
        d.line([cam.p(add(b, (-.2, .42, 0))), cam.p(add(b, (.2, .42, 0)))], fill=WOODDARK, width=int(cam.ppu * .025))
        c = cam.p(add(b, (0, .38, 0)))
        d.rectangle((c[0] - cam.ppu * .08, c[1] - cam.ppu * .08, c[0] + cam.ppu * .08, c[1] + cam.ppu * .08), fill=rgb(.25, .44, .69))
        ball(d, cam.p(add(b, (0, .52, 0))), cam.ppu * .06, rgb(.95, .92, .85))
        h = cam.p(add(b, (0, .6, 0)))
        d.polygon([(h[0] - cam.ppu * .13, h[1] + cam.ppu * .03), (h[0] + cam.ppu * .13, h[1] + cam.ppu * .03), (h[0], h[1] - cam.ppu * .06)], fill=STRAW)
    return (depth(b) + .2, draw)


def haystack(cam, p, top, s, dd, i, gl, T):
    def draw(d):
        b = cam.p(top); t = cam.p(add(top, (0, .45, 0)))
        r = cam.ppu * .24
        d.polygon([(b[0] - r, b[1]), (b[0] + r, b[1]), (t[0], t[1])], fill=STRAW)
        d.polygon([(b[0], b[1]), (b[0] + r, b[1]), (t[0], t[1])], fill=mul(STRAW, .88))
        m = cam.p(add(top, (0, .25, 0)))
        d.line([(m[0] - r * .45, m[1]), (m[0] + r * .45, m[1])], fill=rgb(.55, .4, .25), width=int(cam.ppu * .03))
    return (depth(top) + .15, draw)


def pagoda(cam, p, top, s, dd, i, gl, T):
    parts = []
    y = 0
    for lv in range(5):
        w = (.72 - lv * .08) * s
        h = .32 * s
        parts.append(box(cam, top, (0, y + h / 2, 0), (w / 2, h / 2, w / 2), rgb(.66, .42, .24), VERMILION, 1000 + lv))
        parts.append(box(cam, top, (0, y + h + .03 * s, 0), (w / 2 + .16 * s, .03 * s, w / 2 + .16 * s), rgb(.3, .28, .32), rgb(.22, .2, .24), 1010 + lv))
        y += h + .09 * s
    def draw(d):
        for _, f in parts: f(d)
        d.line([cam.p(add(top, (0, y, 0))), cam.p(add(top, (0, y + .55 * s, 0)))], fill=BRASS, width=int(cam.ppu * .04))
    return (depth(top) + .5, draw)


def lookout(cam, p, top, s, dd, i, gl, T):
    plat = box(cam, top, (0, .9, 0), (.37, .025, .37), WOOD, mul(WOOD, .85), 1100 + i)
    def draw(d):
        for x, z in ((-.3, -.3), (.3, -.3), (-.3, .3), (.3, .3)):
            if (x, z) == (.3, .3): continue
            d.line([cam.p(add(top, (x, 0, z))), cam.p(add(top, (x, .9, z)))], fill=WOODDARK, width=int(cam.ppu * .05))
        plat[1](d)
        for x, z in ((.3, .3),):
            d.line([cam.p(add(top, (x, 0, z))), cam.p(add(top, (x, 1.1, z)))], fill=WOODDARK, width=int(cam.ppu * .05))
        d.line([cam.p(add(top, (-.37, 1.08, .36))), cam.p(add(top, (.37, 1.08, .36)))], fill=WOOD, width=int(cam.ppu * .035))
        d.line([cam.p(add(top, (.36, 1.08, -.37))), cam.p(add(top, (.36, 1.08, .37)))], fill=WOOD, width=int(cam.ppu * .035))
    return (depth(top) + .5, draw)


def dango(cam, p, top, s, dd, i, gl, T):
    counter = box(cam, top, (.18, .16, 0), (.2, .16, .36), WOOD, mul(WOOD, .9), 1200 + i)
    roof = box(cam, top, (.12, .66, 0), (.28, .025, .42), rgb(.3, .24, .2), rgb(.26, .2, .17), 1210 + i)
    def draw(d):
        counter[1](d)
        for z in (-.36, .36):
            d.line([cam.p(add(top, (-.1, .3, z))), cam.p(add(top, (-.1, .66, z)))], fill=WOODDARK, width=int(cam.ppu * .03))
        roof[1](d)
        for k in range(4):
            z = -.27 + k * .18
            poly3(d, cam, [add(top, (-.14, .63, z - .08)), add(top, (-.14, .63, z + .08)), add(top, (-.14, .49, z + .08)), add(top, (-.14, .49, z - .08))],
                  NAVY if k % 2 == 0 else (255, 255, 255))
        for k in range(3):
            base = add(top, (-.02, .32, -.15 + k * .15))
            d.line([cam.p(base), cam.p(add(base, (0, .22, 0)))], fill=WOOD, width=max(2, int(cam.ppu * .012)))
            for j, c in enumerate([rgb(.98, .78, .84), (255, 255, 255), rgb(.6, .8, .5)]):
                circle(d, cam.p(add(base, (0, .08 + j * .055, 0))), cam.ppu * .03, c)
    return (depth(top) + .4, draw)


def pinerock(cam, p, top, s, dd, i, gl, T):
    def draw(d):
        c = cam.p(add(top, (0, .12, 0)))
        d.ellipse((c[0] - cam.ppu * .3, c[1] - cam.ppu * .18, c[0] + cam.ppu * .3, c[1] + cam.ppu * .16), fill=STONE)
        trunk0 = cam.p(add(top, (0, .2, 0))); trunk1 = cam.p(add(top, (.1, .65, 0)))
        d.line([trunk0, trunk1], fill=rgb(.45, .32, .26), width=int(cam.ppu * .05))
        for k, (x, y, w) in enumerate(((-.15, .55, .26), (.18, .7, .24), (0, .85, .2))):
            q = cam.p(add(top, (x, y, 0)))
            d.ellipse((q[0] - cam.ppu * w, q[1] - cam.ppu * w * .35, q[0] + cam.ppu * w, q[1] + cam.ppu * w * .35),
                      fill=[rgb(.2, .4, .3), rgb(.16, .34, .27), rgb(.25, .46, .33)][k])
    return (depth(top) + .3, draw)


rm.DECOR_HOOKS.update({
    "house": house, "pole": pole, "laundry": laundry, "vending": vending, "postbox": postbox, "bench": bench,
    "planter": planter, "chochin": chochin, "minka": minka, "jizo": jizo, "kakashi": kakashi, "haystack": haystack,
    "pagoda": pagoda, "lookout": lookout, "dango": dango, "pinerock": pinerock,
})
# Masten liefern Mast + Leitung: render() erwartet ein Element, die Leitungen kommen über `extra`
rm.DECOR_HOOKS["pole"] = lambda *a: pole(*a)[0]


def wires(cam):
    out = []
    for i, dd in enumerate(rm.LEVEL["decor"]):
        if dd["t"] == "pole" and dd.get("to"):
            p = tuple(dd["p"])
            out += pole(cam, p, add(p, (0, .5, 0)), dd["s"], dd, i, None, None)[1:]
    return out

# ---------------- Figuren & Sammelobjekte ----------------
def sparrow_draw(d, cam, pos, s=1.0):
    u = cam.ppu * s
    c = cam.p(pos)
    d.ellipse((c[0] - u * .08, c[1] - u * .07, c[0] + u * .08, c[1] + u * .06), fill=rgb(.55, .4, .28))
    d.ellipse((c[0] - u * .05, c[1] - u * .02, c[0] + u * .05, c[1] + u * .06), fill=rgb(.93, .88, .78))
    h = (c[0] + u * .05, c[1] - u * .08)
    circle(d, h, u * .05, rgb(.45, .3, .22))
    circle(d, (h[0] + u * .018, h[1] - u * .005), u * .012, (25, 20, 20))
    d.polygon([(h[0] + u * .045, h[1]), (h[0] + u * .085, h[1] + u * .012), (h[0] + u * .045, h[1] + u * .02)], fill=(50, 45, 45))
    d.polygon([(c[0] - u * .07, c[1] - u * .02), (c[0] - u * .15, c[1] - u * .06), (c[0] - u * .13, c[1] + u * .01)], fill=rgb(.4, .28, .2))


def sparrow_item(cam, pos, s=1.3):
    return (depth(pos) + .6, lambda d: sparrow_draw(d, cam, pos, s))


CAT_COLORS = {
    "mochi": (rgb(.93, .58, .27), rgb(.78, .4, .16), None),
    "calico": ((248, 247, 245), (248, 247, 245), rgb(.9, .55, .25)),
    "black": ((45, 42, 46), (30, 28, 32), None),
    "grey": (rgb(.6, .6, .64), rgb(.42, .42, .46), None),
}


def cat_item(cam, feet, colors="mochi", s=1.0, facing="front"):
    fur, stripe, patch = CAT_COLORS[colors]
    def draw(d):
        u = cam.ppu * 1.25 * s
        b = cam.p(feet)
        d.ellipse((b[0] - u * .2, b[1] - u * .06, b[0] + u * .2, b[1] + u * .06), fill=(60, 50, 80, 55))
        # Schwanz
        tail = [(b[0] - u * .16, b[1] - u * .12), (b[0] - u * .27, b[1] - u * .25), (b[0] - u * .25, b[1] - u * .38), (b[0] - u * .18, b[1] - u * .44)]
        d.line(tail, fill=fur, width=int(u * .05), joint="curve")
        # Körper (sitzend)
        d.ellipse((b[0] - u * .15, b[1] - u * .3, b[0] + u * .15, b[1] + u * .01), fill=fur)
        if patch: d.ellipse((b[0] - u * .02, b[1] - u * .26, b[0] + u * .13, b[1] - u * .12), fill=patch)
        d.ellipse((b[0] - u * .07, b[1] - u * .22, b[0] + u * .07, b[1] - u * .02), fill=(255, 255, 255) if colors != "black" else (215, 215, 215))
        for sx in (-1, 1):
            circle(d, (b[0] + sx * u * .06, b[1] - u * .01), u * .035, (255, 255, 255) if colors != "black" else (215, 215, 215))
        if colors in ("mochi", "grey"):
            for k in range(3):
                y = b[1] - u * (.24 - k * .06)
                d.line([(b[0] + u * .09, y), (b[0] + u * .145, y + u * .01)], fill=stripe, width=max(2, int(u * .022)))
        # Kopf
        hc = (b[0], b[1] - u * .38)
        for sx in (-1, 1):
            d.polygon([(hc[0] + sx * u * .05, hc[1] - u * .07), (hc[0] + sx * u * .13, hc[1] - u * .16), (hc[0] + sx * u * .13, hc[1] - u * .03)], fill=fur)
            d.polygon([(hc[0] + sx * u * .075, hc[1] - u * .07), (hc[0] + sx * u * .115, hc[1] - u * .125), (hc[0] + sx * u * .115, hc[1] - u * .05)], fill=rgb(.98, .7, .7))
        d.ellipse((hc[0] - u * .13, hc[1] - u * .11, hc[0] + u * .13, hc[1] + u * .1), fill=fur)
        if patch: d.ellipse((hc[0] + u * .01, hc[1] - u * .11, hc[0] + u * .13, hc[1] + u * .01), fill=patch)
        if facing == "front":
            d.ellipse((hc[0] - u * .06, hc[1] + u * .0, hc[0] + u * .06, hc[1] + u * .08), fill=(255, 255, 255) if colors != "black" else (200, 200, 200))
            for sx in (-1, 1):
                circle(d, (hc[0] + sx * u * .048, hc[1] - u * .015), u * .018, (35, 45, 30) if colors != "black" else (220, 200, 90))
            circle(d, (hc[0], hc[1] + u * .022), u * .012, rgb(.95, .55, .6))
            if colors in ("mochi", "grey"):
                for k in (-1, 0, 1):
                    d.line([(hc[0] + k * u * .035, hc[1] - u * .1), (hc[0] + k * u * .035, hc[1] - u * .06)], fill=stripe, width=max(2, int(u * .015)))
    return (depth(feet) + .55, draw)


def sushi_item(cam, pos, kind, gl):
    def draw(d):
        c = cam.p(pos)
        u = cam.ppu
        glow(gl, c, u * .4, (255, 240, 200), .6)
        if kind % 3 == 0:
            d.rounded_rectangle((c[0] - u * .09, c[1] - u * .02, c[0] + u * .09, c[1] + u * .05), radius=u * .03, fill=(250, 250, 248))
            d.rounded_rectangle((c[0] - u * .1, c[1] - u * .05, c[0] + u * .1, c[1] + u * .0), radius=u * .02, fill=rgb(.98, .55, .38))
            for k in (-1, 0, 1):
                d.line([(c[0] + k * u * .04 - u * .01, c[1] - u * .045), (c[0] + k * u * .04 + u * .01, c[1] - u * .005)], fill=(255, 200, 180), width=max(1, int(u * .01)))
        elif kind % 3 == 1:
            d.ellipse((c[0] - u * .075, c[1] - u * .07, c[0] + u * .075, c[1] + u * .07), fill=(40, 56, 40))
            d.ellipse((c[0] - u * .06, c[1] - u * .055, c[0] + u * .06, c[1] + u * .055), fill=(250, 250, 248))
            circle(d, c, u * .024, rgb(.95, .45, .4))
        else:
            d.rounded_rectangle((c[0] - u * .08, c[1] - u * .045, c[0] + u * .08, c[1] + u * .045), radius=u * .04, fill=rgb(.78, .52, .24))
    return (depth(pos) + .3, draw)


def bell_item(cam, pos, gl):
    def draw(d):
        c = cam.p(pos)
        u = cam.ppu
        glow(gl, c, u * .55, (255, 225, 140), .9)
        d.line([(c[0], c[1] - u * .1), (c[0], c[1] - u * .06)], fill=BRASS, width=int(u * .02))
        ball(d, c, u * .08, BRASS)
        d.line([(c[0] - u * .08, c[1] - u * .005), (c[0] + u * .08, c[1] - u * .005)], fill=RED, width=int(u * .02))
        d.line([(c[0] - u * .03, c[1] + u * .035), (c[0] + u * .03, c[1] + u * .035)], fill=(40, 30, 30), width=int(u * .012))
    return (depth(pos) + .2, draw)


# ---------------- Kulissen & Teilchen ----------------
def backdrop_image(name):
    w, h = 1024, 512
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rnd = random.Random({"fuji": 31, "town": 11}.get(name, 21))

    def hill(base, amp, col, phase, freq):
        pts = [(0, h)]
        for i in range(65):
            x = i * 16
            y = base - amp * (.6 * math.sin(x / w * math.pi * freq + phase) + .4 * math.sin(x / w * math.pi * freq * 2.3 + phase * 1.7))
            pts.append((x, y))
        pts.append((w, h))
        d.polygon(pts, fill=col)

    if name == "fuji":
        def mountain_pts(flip=False):
            pts = []
            def bez(p0, p1, p2, p3, n=20):
                for k in range(n + 1):
                    t = k / n
                    pts.append(tuple((1 - t) ** 3 * p0[j] + 3 * (1 - t) ** 2 * t * p1[j] + 3 * (1 - t) * t * t * p2[j] + t ** 3 * p3[j] for j in range(2)))
            bez((120, 330), (300, 270), (400, 140), (450, 92))
            bez((574, 92), (624, 140), (724, 270), (904, 330))
            if flip: pts = [(x, 2 * 340 + 4 - y) for x, y in pts]
            return pts
        d.polygon(mountain_pts(), fill=rgb(.45, .55, .75))
        snow = [(362, 170), (400, 135), (450, 92), (574, 92), (624, 135), (662, 170)]
        for k in range(6):
            x = 662 - (k + 1) * 300 / 7
            snow += [(x + 22, 150 + (k % 2) * 34), (x, 170)]
        d.polygon(snow, fill=(247, 250, 255))
        hill(338, 14, rgb(.5, .6, .62), .6, 3)
        d.rectangle((0, 340, w, h), fill=rgb(.5, .68, .86))
        refl = Image.new("RGBA", (w, h), (0, 0, 0, 0)); rd = ImageDraw.Draw(refl)
        rd.polygon(mountain_pts(True), fill=rgb(.35, .45, .7) + (72,))
        rd.polygon([(x, 2 * 340 + 4 - y) for x, y in snow], fill=(255, 255, 255, 72))
        img.alpha_composite(refl)
        for _ in range(26):
            x, y = rnd.uniform(40, 980), rnd.uniform(360, 500)
            d.rectangle((x, y, x + rnd.uniform(20, 70), y + 2), fill=(255, 255, 255, 128))
        for _ in range(14):
            x, r = rnd.uniform(0, w), rnd.uniform(16, 30)
            d.ellipse((x - r, 334 - r, x + r, 334 + r * .4), fill=(int(255 * (.84 + rnd.uniform(0, .1))), int(255 * rnd.uniform(.3, .55)), 51))
    elif name == "satoyama":
        hill(250, 40, rgb(.55, .7, .62), .3, 2.2)
        hill(300, 34, rgb(.47, .66, .42), 1.4, 3)
        for k in range(7):
            y = 330 + k * 24
            d.rectangle((0, y, w, y + 24), fill=rgb(.62 + (k % 2) * .06, .78, .48))
            d.rectangle((0, y, w, y + 3), fill=rgb(.4, .55, .32))
        for _ in range(4):
            x, y = rnd.uniform(80, 940), rnd.uniform(290, 320)
            d.polygon([(x - 34, y), (x, y - 28), (x + 34, y)], fill=rgb(.72, .6, .4))
            d.rectangle((x - 24, y, x + 24, y + 16), fill=rgb(.95, .9, .8))
    else:
        hill(260, 36, rgb(.56, .68, .72), .9, 2.4)
        hill(310, 26, rgb(.5, .66, .5), 2.1, 3.4)
        for k in range(16):
            x, y = k * 66 + rnd.uniform(-10, 10), rnd.uniform(318, 352)
            bw = rnd.uniform(46, 62)
            d.rectangle((x - bw / 2 + 4, y, x + bw / 2 - 4, y + 30), fill=rgb(.95, .9, .82))
            d.polygon([(x - bw / 2, y + 2), (x - bw / 4, y - 16), (x + bw / 4, y - 16), (x + bw / 2, y + 2)], fill=rgb(.37 + rnd.uniform(0, .08), .36, .47))
        d.rectangle((0, 380, w, h), fill=rgb(.62, .74, .56))
    # nach unten ausblenden
    a = img.getchannel("A")
    fade = Image.new("L", (w, h), 255); fd = ImageDraw.Draw(fade)
    for y in range(400, h):
        fd.line([(0, y), (w, y)], fill=int(255 * (1 - (y - 400) / (h - 400))))
    from PIL import ImageChops
    img.putalpha(ImageChops.multiply(a, fade))
    return img


def make_backdrop_hook(name):
    def hook(img, cam):
        wpx = int(2.3 * cam.scale * cam.ppu)
        hpx = wpx // 2
        bd = backdrop_image(name).resize((wpx, hpx), Image.LANCZOS)
        cx = CW / 2
        cy = CH / 2 + (2.2 * cam.scale / 11) * cam.ppu
        img.alpha_composite(bd, (int(cx - wpx / 2), int(cy - hpx / 2)))
    return hook


def petals(d, n, seed):
    rm.petals(d, n, seed)


def autumn_leaves(d, n, seed):
    rm.leaves(d, n, seed)


def dragonflies(d, n, seed):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.uniform(0, CW), rnd.uniform(CH * .2, CH * .8)
        u = rnd.uniform(26, 36) * SS / 2
        for sx in (-1, 1):
            for dy in (0, .5):
                d.ellipse((x + sx * u * .2, y - u * .15 + dy * u, x + sx * u * 1.1, y + u * .12 + dy * u) if sx > 0 else
                          (x - u * 1.1, y - u * .15 + dy * u, x - u * .2, y + u * .12 + dy * u), fill=(220, 236, 255, 170))
        d.line([(x, y - u * .4), (x, y + u * 1.3)], fill=(215, 80, 55, 255), width=int(u * .16))
        circle(d, (x, y - u * .45), u * .18, (215, 80, 55))


def particle_hook(theme):
    def hook(d, big_tree):
        if theme == "town": petals(d, 60 if big_tree else 18, 5)
        elif theme == "fuji": autumn_leaves(d, 40 if big_tree else 20, 5)
        else:
            dragonflies(d, 5, 8)
            if big_tree: petals(d, 30, 5)
    return hook


# ---------------- Szenen ----------------
def setup(level_dir, n):
    rm.load(os.path.join(level_dir, f"level{n}.json"))
    rm.BACKDROP_HOOK = make_backdrop_hook(rm.LEVEL["backdrop"])
    rm.PARTICLE_HOOK = particle_hook(rm.THEME)
    return Cam()


def scene_items(cam, state, gl_holder, collected=(), altar_bell=True):
    items = []
    for k, c in enumerate(rm.LEVEL.get("sushi", [])):
        if tuple(c) in collected: continue
        items.append(sushi_item(cam, add(tuple(c), (0, .78, 0)), k, gl_holder))
    if altar_bell:
        for dd in rm.LEVEL["decor"]:
            if dd["t"] == "altar":
                T = state.T(dd.get("g"))
                yaw = dd.get("r", 0)
                items.append(bell_item(cam, T(add(tuple(dd["p"]), rm.roty((0, .92, -.32), yaw))), gl_holder))
    return items


def render(state, cam, *, cat=None, sparrow=None, collected=(), bell=True, spirits=(), **kw):
    # Glühschicht: render() legt eine eigene an – Sushi/Glöckchen zeichnen ihr Leuchten in eine Zusatzschicht
    glow_layer = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    extra = scene_items(cam, state, glow_layer, collected, bell) + wires(cam)
    if cat: extra.append(cat_item(cam, *cat))
    if sparrow: extra.append(sparrow_item(cam, sparrow))
    for k, sp in enumerate(spirits):
        extra.append(cat_item(cam, sp, ["calico", "black", "grey", "mochi"][k % 4], .85))
    img = rm.render(state, cam, seed_on_altar=False, extra=extra, **kw)
    img.alpha_composite(glow_layer)
    return img


INKN = (41, 77, 133)
REDN = (217, 61, 51)


def story(img, txt):
    y = (59 + 54 + 90) * SS
    text_c(img, y, txt, ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans.ttf", 17 * 3 * SS), INKN, True)


def hud(img, count, total):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    x0, y0 = 54 * SS, (59 + 8) * SS
    d.rounded_rectangle((x0, y0, x0 + 230 * SS, y0 + 100 * SS), radius=50 * SS, fill=(255, 247, 235, 185))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    # Nigiri-Symbol
    cx, cy, u = x0 + 60 * SS, y0 + 52 * SS, 90 * SS
    d.rounded_rectangle((cx - u * .3, cy - u * .05, cx + u * .3, cy + u * .18), radius=u * .1, fill=(255, 255, 255))
    d.rounded_rectangle((cx - u * .34, cy - u * .17, cx + u * .34, cy + u * .02), radius=u * .08, fill=rgb(.98, .55, .38))
    f = ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 46 * SS)
    d.text((x0 + 112 * SS, y0 + 22 * SS), f"{count}/{total}", font=f, fill=INKN)
    rm.menu_button(img)


def main(level_dir, out):
    rm.OUT = out
    os.makedirs(out, exist_ok=True)
    shots = []

    # 1) Titel – Die Kleinstadt
    cam = setup(level_dir, 4)
    img = render(State(), cam, cat=((0, .5, 4), "mochi"), sparrow=(-.42, 1.18, 4.34))
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
    for y in range(int(CH * .38)):
        od.line([(0, y), (CW, y)], fill=(255, 247, 235, int(205 * (1 - y / (CH * .38)) ** 1.4)))
    img.alpha_composite(ov)
    text_c(img, 200 * SS, "Neko no Machi", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 120 * SS), INKN)
    text_c(img, 370 * SS, "猫の町", ImageFont.truetype(FONT_DIR + "fonts-japanese-gothic.ttf", 52 * SS), REDN, False)
    d = ImageDraw.Draw(img)
    d.line([(CW / 2 - 70 * SS, 470 * SS), (CW / 2 + 70 * SS, 470 * SS)], fill=REDN, width=int(4 * SS))
    text_c(img, 500 * SS, "Kapitel I", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans.ttf", 40 * SS), (90, 110, 150), False)
    text_c(img, 565 * SS, "Die Kleinstadt", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 56 * SS), INKN, False)
    # Weltenauswahl
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    top = CH - 560 * SS
    ld.rounded_rectangle((90 * SS, top, CW - 90 * SS, top + 300 * SS), radius=60 * SS, fill=(255, 247, 235, 200))
    img.alpha_composite(lay)
    d = ImageDraw.Draw(img)
    rows = [("Wolkenpfad", (82, 61, 77), (219, 92, 77), "FreeSerif", 1), ("Neko no Machi", INKN, REDN, "DejaVu", 4)]
    for r, (name, ink, acc, fam, first) in enumerate(rows):
        y = top + 80 * SS + r * 140 * SS
        f = ImageFont.truetype(FONT_DIR + ("freefont/FreeSerifBold.ttf" if fam == "FreeSerif" else "dejavu/DejaVuSans-Bold.ttf"), 40 * SS)
        d.text((140 * SS, y - 24 * SS), name, font=f, fill=ink)
        for k in range(3):
            cx = CW - 470 * SS + k * 140 * SS
            cur = first + k == 4
            d.ellipse((cx - 55 * SS, y - 55 * SS, cx + 55 * SS, y + 55 * SS), outline=acc if cur else ink + (90,), width=int((5 if cur else 3) * SS))
            fr = ImageFont.truetype(FONT_DIR + ("freefont/FreeSerif.ttf" if fam == "FreeSerif" else "dejavu/DejaVuSans.ttf"), 40 * SS)
            lab = ["I", "II", "III"][k]
            bb = d.textbbox((0, 0), lab, font=fr)
            d.text((cx - (bb[2] - bb[0]) / 2, y - 30 * SS), lab, font=fr, fill=ink if (r == 0 or k == 0) else mix(ink, (255, 247, 235), .6))
    text_c(img, CH - 200 * SS, "Tippe, um zu beginnen", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans.ttf", 42 * SS), INKN)
    home_indicator(img)
    shots.append(finish(img, "10_neko_titel.png"))

    # 2) Kleinstadt – über die Dächer, Leitung mit Spatzen
    th = math.radians(55)
    img = render(State(bridge=th), cam, cat=((0, 1.5, 0), "mochi"), sparrow=(-0.9, 2.3, 0.9), collected={(1, 0, 4), (2, 0, 3)},
                 crank_hl="bridge", bridge_spin=th * 2.5)
    cpt = cam.p(add((-2, 1, 0), rm.roty((0.56, -2, 0), th)))
    finger(img, (cpt[0] + 30 * SS, cpt[1] + 40 * SS))
    rm.arc_arrow(img, cam.p((-2, 1.6, 0)), cam.ppu * 1.7, math.radians(200), math.radians(320))
    story(img, "Nicht jede Gasse liegt offen.\nManche wollen bewegt werden.")
    hud(img, 2, 6); home_indicator(img)
    shots.append(finish(img, "11_neko_kleinstadt.png"))

    # 3) Landschaft – Floßfahrt zwischen Reisfeldern
    cam = setup(level_dir, 5)
    img = render(State(raft=1.6, wheel=math.pi / 2), cam, cat=((4.6, .5, 2), "mochi"), sparrow=(4.1, 1.3, 2.6),
                 collected={(2, 0, 3)})
    finger(img, cam.p((4.6, .3, 2.6)))
    story(img, "Was treibt, kann tragen –\nsogar eine Katze.")
    hud(img, 1, 7); home_indicator(img)
    shots.append(finish(img, "12_neko_landschaft.png"))

    # 4) Berg Fuji – die drehende Pagode
    cam = setup(level_dir, 6)
    img = render(State(stone=3, tower=math.radians(58)), cam, cat=((0, .5, 0), "mochi"), sparrow=(.5, 1.3, .6),
                 crank_hl="tower", collected={(6, -2, 3), (3, -1, 3), (1, 0, 3)})
    story(img, "Eine Pagode, die sich dreht,\nhat viele Türen.")
    hud(img, 3, 7); home_indicator(img)
    shots.append(finish(img, "13_neko_fuji.png"))

    # 5) Finale am Fuji – Glöckchen und Nachbarskatzen
    cam_end = Cam(zoom=1.12)
    spirits = [(0, .5, 4), (1, .5, 3), (-2, 3.5, -1), (-7, 3.5, 0), (3, 3.5, -1), (5, 7.5, -1)]
    img = render(State(stone=3, tower=0, rb=math.pi / 2, gate=2, lift=4), cam_end, cat=((6, 7.5, 1), "mochi", 1.0, "back"),
                 sparrow=(6.4, 8.3, 1.6), bell=False, spirits=spirits, big_tree=(5, 7.5, -2), bloom=False, warm=.05,
                 pressed=("pA", "pB"), collected={tuple(c) for c in rm.LEVEL["sushi"]})
    # Glöckchen schwebt über dem Baum
    gl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(img)
    bell_item(cam_end, (5, 9.6, -2), gl)[1](bd)
    img.alpha_composite(gl)
    card = Image.new("RGBA", img.size, (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    top = CH - 700 * SS
    cd.rounded_rectangle((70 * SS, top, CW - 70 * SS, CH - 140 * SS), radius=70 * SS, fill=(255, 247, 235, 228))
    img.alpha_composite(card)
    text_c(img, top + 60 * SS, "Kapitel III abgeschlossen", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 66 * SS), INKN, False)
    text_c(img, top + 170 * SS, "Alle Glöckchen läuten über dem See.\nMochi ist angekommen.", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans.ttf", 40 * SS), (90, 110, 150), False)
    text_c(img, top + 310 * SS, "Alles Sushi gefunden – 7 / 7", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 40 * SS), INKN, False)
    bd = ImageDraw.Draw(img)
    bw = 300 * SS
    bd.rounded_rectangle((CW / 2 - bw, top + 400 * SS, CW / 2 + bw, top + 510 * SS), radius=55 * SS, fill=REDN)
    text_c(img, top + 425 * SS, "Zu Wolkenpfad  →", ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans-Bold.ttf", 44 * SS), (255, 247, 235), False)
    home_indicator(img)
    shots.append(finish(img, "14_neko_finale.png"))

    rm.sheet(shots, ["Titel · zwei Welten", "I · Die Kleinstadt", "II · Landschaft", "III · Berg Fuji", "Finale"], "00_neko_no_machi.png")
    print("fertig")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
