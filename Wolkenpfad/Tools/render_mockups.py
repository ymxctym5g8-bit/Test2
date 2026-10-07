# Rendert Mockup-Bildschirme von Wolkenpfad direkt aus den Leveldaten.
# Aufruf: python3 Tools/render_mockups.py Wolkenpfad/Level/level1.json Mockups/
import json, math, random, sys, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

LEVEL = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
W, H, SS = 1179, 2556, 2
CW, CH = W * SS, H * SS
SQ2, SQ3, SQ6 = math.sqrt(2), math.sqrt(3), math.sqrt(6)
BACK = (1 / SQ3, 1 / SQ3, 1 / SQ3)
SUN = (14, 30, 6); _l = math.sqrt(sum(c * c for c in SUN)); SUN = tuple(c / _l for c in SUN)
GROUPS = {g["id"]: g for g in LEVEL["groups"]}
FONT_DIR = "/usr/share/fonts/truetype/"
def font(name, size): return ImageFont.truetype(FONT_DIR + name, int(size * SS))

# ---------------- Palette (wie Art.swift) ----------------
def rgb(r, g, b): return (int(r * 255), int(g * 255), int(b * 255))
MAT = {
    "grass": (rgb(.56, .76, .43), rgb(.95, .86, .72)),
    "stone": (rgb(.97, .91, .81), rgb(.91, .80, .69)),
    "stonedark": (rgb(.78, .64, .68), rgb(.78, .64, .68)),
    "rock": (rgb(.72, .60, .62), rgb(.72, .60, .62)),
    "rockdark": (rgb(.52, .44, .55), rgb(.52, .44, .55)),
    "water": (rgb(.45, .74, .86), rgb(.95, .86, .72)),
    "wood": (rgb(.80, .57, .40), rgb(.74, .52, .36)),
    "teal": (rgb(.42, .74, .75), rgb(.42, .74, .75)),
    "tealdark": (rgb(.30, .56, .62), rgb(.30, .56, .62)),
    "tealtop": (rgb(.70, .90, .86), rgb(.42, .74, .75)),
    "altar": (rgb(.92, .88, .84), rgb(.88, .84, .80)),
}
LAV = (150, 128, 190)
VERM = rgb(.86, .33, .27)
BRASS = rgb(.95, .78, .42)
LEAF = [rgb(.42, .66, .38), rgb(.52, .74, .42), rgb(.34, .58, .40)]
LEAF_LIGHT = [rgb(.62, .80, .45), rgb(.52, .74, .42), rgb(.70, .84, .50)]
BLOSSOM = [rgb(.98, .78, .84), rgb(.96, .68, .78), rgb(1, .88, .90)]

def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def mul(c, f): return tuple(max(0, min(255, int(ch * f))) for ch in c)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def scl(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def norm(a):
    l = math.sqrt(dot(a, a)) or 1
    return scl(a, 1 / l)

def shade(base, n):
    lam = max(0.0, dot(n, SUN))
    f = 0.66 + 0.42 * lam
    c = mul(base, f)
    return mix(c, mix(c, LAV, 0.5), (1 - lam) * 0.35)

def roty(p, th):
    x, y, z = p
    c, s = math.cos(th), math.sin(th)
    return (x * c + z * s, y, -x * s + z * c)

# ---------------- Kamera ----------------
class Cam:
    def __init__(self, zoom=1.0):
        us, vs = [], []
        for b in LEVEL["blocks"]:
            x, y, z = b["p"]
            u, v = (x - z) / SQ2, (-x + 2 * y - z) / SQ6
            us += [u]; vs += [v]
        # wie GameCoordinator.levelExtent / layout
        pts = []
        for b in LEVEL["blocks"]:
            x, y, z = b["p"]
            for dx in (-.5, .5):
                for dy in (-.5, .5):
                    for dz in (-.5, .5):
                        X, Y, Z = x + dx, y + dy, z + dz
                        pts.append(((X - Z) / SQ2, (-X + 2 * Y - Z) / SQ6))
        umin = min(p[0] for p in pts); umax = max(p[0] for p in pts)
        vmin = min(p[1] for p in pts); vmax = max(p[1] for p in pts)
        self.uc = (umin + umax) / 2
        self.vc = (vmin + vmax) / 2 + 0.8
        halfW = max(abs(min(us) - .9 - self.uc), abs(max(us) + .9 - self.uc)) + 0.4
        halfH = max(abs(min(vs) - 1 - self.vc), abs(max(vs) + 1 - self.vc)) + 1.6
        scale = max(halfH, halfW / (W / H)) * zoom
        self.ppu = CH / (2 * scale)
        self.scale = scale

    def p(self, w):
        x, y, z = w
        u, v = (x - z) / SQ2, (-x + 2 * y - z) / SQ6
        return (CW / 2 + (u - self.uc) * self.ppu, CH / 2 - (v - self.vc) * self.ppu)

def depth(w): return dot(w, BACK)

# ---------------- Weltzustand ----------------
class State:
    def __init__(self, bridge=0.0, lift=0.0, arm=0.0):
        self.ang = {"bridge": bridge, "arm": arm}
        self.lift = lift

    def T(self, gid):
        if not gid: return lambda p: p
        g = GROUPS[gid]
        if g["kind"] == "rotate":
            pv = tuple(g["pivot"]); th = self.ang[gid]
            return lambda p: add(pv, roty(sub(p, pv), th))
        ax = g["axis"]; v = self.lift
        return lambda p: (p[0] + ax[0] * v, p[1] + ax[1] * v, p[2] + ax[2] * v)

# ---------------- Zeichnen: Würfel ----------------
FACES = [  # (Ecken als Bitmuster, lokale Normale)
    ([(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)], (1, 0, 0)),
    ([(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)], (-1, 0, 0)),
    ([(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)], (0, 1, 0)),
    ([(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)], (0, -1, 0)),
    ([(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)], (0, 0, 1)),
    ([(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)], (0, 0, -1)),
]

def box_item(cam, center, half, T, mat, seed, moss=False, yaw=0.0, colors=None):
    def corner(bits):
        local = tuple((bits[i] * 2 - 1) * half[i] for i in range(3))
        return T(add(center, roty(local, yaw)))
    cworld = T(center)
    top_c, side_c = colors or MAT.get(mat, MAT["stone"])

    def draw(d):
        rnd = random.Random(seed)
        tops = []
        for bits, _ in FACES:
            pts = [corner(b) for b in bits]
            fc = scl(add(add(pts[0], pts[1]), add(pts[2], pts[3])), .25)
            n = norm(sub(fc, cworld))
            if dot(n, BACK) <= 0.02: continue
            is_top = n[1] > 0.7
            base = top_c if is_top else side_c
            col = shade(base, n)
            scr = [cam.p(q) for q in pts]
            if is_top and moss:
                big = [cam.p(add(fc, scl(sub(q, fc), 1.07))) for q in pts]
                d.polygon(big, fill=mul(col, .82))
            d.polygon(scr, fill=col)
            # Pinseltupfer
            for _ in range(4 if is_top else 3):
                s, t = rnd.uniform(.15, .85), rnd.uniform(.15, .85)
                a = add(scl(pts[0], (1 - s) * (1 - t)), add(scl(pts[1], s * (1 - t)), add(scl(pts[2], s * t), scl(pts[3], (1 - s) * t))))
                x, y = cam.p(a)
                r = cam.ppu * rnd.uniform(.1, .18)
                light = rnd.random() > .5
                d.ellipse((x - r, y - r * .6, x + r, y + r * .6),
                          fill=(255, 255, 255, 22) if light else (60, 30, 80, 16))
            d.line(scr + [scr[0]], fill=mul(col, .9) + (110,), width=max(1, int(cam.ppu * .012)))
            if moss and not is_top and abs(n[1]) < 0.2:
                # Moosrand, der über die Kante hängt
                hi = sorted(pts, key=lambda q: -q[1])[:2]
                a0, a1 = hi
                poly = []
                for i in range(9):
                    t = i / 8
                    poly.append(cam.p(add(a0, scl(sub(a1, a0), t))))
                for i in range(8, -1, -1):
                    t = i / 8
                    drop = 0.07 + 0.09 * rnd.random() + (0.12 if rnd.random() > .85 else 0)
                    poly.append(cam.p(add(add(a0, scl(sub(a1, a0), t)), (0, -drop, 0))))
                d.polygon(poly, fill=shade(MAT["grass"][0], n))
        return
    return (depth(cworld), draw)

# ---------------- Requisiten ----------------
def circle(d, c, r, fill, outline=None, w=1):
    d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), fill=fill, outline=outline, width=w)

def ball(d, c, r, col):
    circle(d, c, r, mul(col, .86))
    circle(d, (c[0] - r * .12, c[1] - r * .14), r * .86, col)
    circle(d, (c[0] - r * .35, c[1] - r * .38), r * .38, mix(col, (255, 255, 255), .35) + (150,))

def glow(layer, c, r, col, a=1.0):
    g = Image.new("RGBA", (int(r * 2), int(r * 2)), (0, 0, 0, 0))
    gd = ImageDraw.Draw(g)
    steps = 24
    for i in range(steps, 0, -1):
        t = i / steps
        alpha = int(255 * a * (1 - t) ** 1.6)
        gd.ellipse((r - r * t, r - r * t, r + r * t, r + r * t), fill=col + (alpha,))
    layer.alpha_composite(g, (int(c[0] - r), int(c[1] - r)))

def tree_item(cam, anchor, s, variant, seed, glow_layer=None):
    cols = BLOSSOM if variant == 2 else (LEAF_LIGHT if variant == 1 else LEAF)
    def draw(d):
        rnd = random.Random(seed)
        base = cam.p(anchor)
        r = cam.ppu * .36 * s
        d.ellipse((base[0] - r, base[1] - r * .45, base[0] + r, base[1] + r * .45), fill=(70, 50, 90, 45))
        top = cam.p(add(anchor, (0, .62 * s, 0)))
        d.line([base, top], fill=(128, 92, 76), width=int(cam.ppu * .13 * s))
        puffs = [(0, .14, 0, .36), (.24, 0, .06, .26), (-.22, .02, -.08, .27), (.06, 0, .24, .25),
                 (-.06, .34, .03, .25), (.14, .24, -.16, .21), (-.16, .2, .18, .2)]
        puffs.sort(key=lambda q: dot((q[0], q[1], q[2]), BACK))
        for i, (x, y, z, r) in enumerate(puffs):
            c = cam.p(add(anchor, (x * s, .62 * s + y * s, z * s)))
            ball(d, c, r * s * cam.ppu * 0.95, cols[(i + rnd.randint(0, 2)) % 3])
    return (depth(anchor) + .4, draw)

def flowers_item(cam, anchor, s, seed):
    def draw(d):
        rnd = random.Random(seed)
        heads = [(255, 255, 255), BLOSSOM[0], rgb(1, .9, .45), rgb(.75, .7, .95)]
        for i in range(10):
            a = i / 10 * math.tau + rnd.uniform(-.2, .2)
            r = rnd.uniform(.3, .44)
            p = add(anchor, (math.cos(a) * r * s, 0, math.sin(a) * r * s))
            b = cam.p(p); h = cam.p(add(p, (0, rnd.uniform(.05, .12) * s, 0)))
            d.line([b, h], fill=rgb(.36, .6, .36), width=max(2, int(cam.ppu * .012)))
            circle(d, h, cam.ppu * .032 * s, heads[i % 4])
    return (depth(anchor) + .05, draw)

def grass_item(cam, anchor, s, seed):
    def draw(d):
        rnd = random.Random(seed)
        for _ in range(16):
            x, z = rnd.uniform(-.47, .47), rnd.uniform(-.47, .47)
            if abs(x) < .3 and abs(z) < .3: continue
            p = add(anchor, (x, 0, z))
            b = cam.p(p); t = cam.p(add(p, (rnd.uniform(-.04, .04), rnd.uniform(.08, .18) * s, 0)))
            d.line([b, t], fill=rnd.choice([rgb(.36, .6, .36), LEAF[1]]), width=max(2, int(cam.ppu * .018)))
    return (depth(anchor) + .05, draw)

def lantern_item(cam, anchor, s, gl):
    a = add(anchor, (.32, 0, -.32))
    def draw(d):
        u = cam.ppu * s
        b = cam.p(a)
        stone = (222, 212, 202)
        d.rectangle((b[0] - .07 * u, b[1] - .05 * u, b[0] + .07 * u, b[1]), fill=mul(stone, .9))
        d.rectangle((b[0] - .03 * u, b[1] - .25 * u, b[0] + .03 * u, b[1] - .05 * u), fill=stone)
        d.rectangle((b[0] - .07 * u, b[1] - .36 * u, b[0] + .07 * u, b[1] - .25 * u), fill=(255, 220, 150))
        d.polygon([(b[0] - .13 * u, b[1] - .36 * u), (b[0] + .13 * u, b[1] - .36 * u), (b[0], b[1] - .46 * u)], fill=(128, 115, 140))
        glow(gl, (b[0], b[1] - .3 * u), .35 * u, (255, 200, 120), .8)
    return (depth(a) + .1, draw)

def torii_item(cam, anchor, s):
    def draw(d):
        u = cam.ppu
        dark = (72, 56, 72)
        for x in (-.42, .42):
            d.line([cam.p(add(anchor, (x, 0, 0))), cam.p(add(anchor, (x, 1.0 * s, 0)))], fill=VERM, width=int(u * .09))
            circle(d, cam.p(add(anchor, (x, .03, 0))), u * .06, dark)
        d.line([cam.p(add(anchor, (-.5, .74, 0))), cam.p(add(anchor, (.5, .74, 0)))], fill=VERM, width=int(u * .06))
        d.line([cam.p(add(anchor, (-.56, .92, 0))), cam.p(add(anchor, (.56, .92, 0)))], fill=VERM, width=int(u * .08))
        d.line([cam.p(add(anchor, (-.64, 1.0, 0))), cam.p(add(anchor, (.64, 1.0, 0)))], fill=dark, width=int(u * .07))
        d.line([cam.p(add(anchor, (0, .74, 0))), cam.p(add(anchor, (0, .92, 0)))], fill=VERM, width=int(u * .05))
    return (depth(anchor) + .05, draw)

def seed_item(cam, pos, gl, r=.075, glow_r=.6):
    def draw(d):
        c = cam.p(pos)
        glow(gl, c, glow_r * cam.ppu, (210, 255, 160), 1)
        ball(d, c, r * cam.ppu, rgb(.85, 1, .6))
        leaf = cam.p(add(pos, (.04, .09, 0)))
        d.ellipse((leaf[0] - .05 * cam.ppu, leaf[1] - .02 * cam.ppu, leaf[0] + .05 * cam.ppu, leaf[1] + .02 * cam.ppu), fill=LEAF[1])
    return (depth(pos) + .2, draw)

def ring_on_face(cam, center, e1, e2, R, T=lambda p: p, n=40):
    return [cam.p(T(add(center, add(scl(e1, R * math.cos(t)), scl(e2, R * math.sin(t)))))) for t in [i / n * math.tau for i in range(n + 1)]]

def crank_item(cam, cell, face, T, spin=0.0, highlight=False, gl=None):
    if face == "+z":
        c = add(cell, (0, 0, .56)); e1, e2, out = (1, 0, 0), (0, 1, 0), (0, 0, 1)
    else:
        c = add(cell, (.56, 0, 0)); e1, e2, out = (0, 0, 1), (0, 1, 0), (1, 0, 0)
    def draw(d):
        u = cam.ppu
        if highlight and gl is not None:
            glow(gl, cam.p(T(c)), .9 * u, (255, 225, 140), .9)
        ring = ring_on_face(cam, c, e1, e2, .3, T)
        d.line(ring, fill=mul(BRASS, .75), width=int(u * .1))
        d.line(ring, fill=BRASS, width=int(u * .065))
        for k in range(4):
            a = spin + k * math.pi / 4
            p1 = T(add(c, add(scl(e1, .3 * math.cos(a)), scl(e2, .3 * math.sin(a)))))
            p2 = T(add(c, add(scl(e1, -.3 * math.cos(a)), scl(e2, -.3 * math.sin(a)))))
            d.line([cam.p(p1), cam.p(p2)], fill=BRASS, width=int(u * .04))
        circle(d, cam.p(T(c)), u * .07, BRASS)
        kp = T(add(add(c, add(scl(e1, .3 * math.cos(spin)), scl(e2, .3 * math.sin(spin)))), scl(out, .12)))
        d.line([cam.p(T(add(c, add(scl(e1, .3 * math.cos(spin)), scl(e2, .3 * math.sin(spin)))))), cam.p(kp)], fill=VERM, width=int(u * .09))
    return (depth(T(c)) + .3, draw)

def handle_item(cam, cell, T):
    c = add(cell, (.53, -.1, 0))
    def draw(d):
        u = cam.ppu
        ring = ring_on_face(cam, c, (0, 0, 1), (0, 1, 0), .16, T)
        d.line(ring, fill=BRASS, width=int(u * .06))
        for sgn in (1, -1):
            tip = cam.p(T(add(c, (0, .36 * sgn, 0))))
            b1 = cam.p(T(add(c, (0, .24 * sgn, -.07)))); b2 = cam.p(T(add(c, (0, .24 * sgn, .07))))
            d.polygon([tip, b1, b2], fill=BRASS)
    return (depth(T(c)) + .3, draw)

def vine_item(cam, anchor, seed):
    def draw(d):
        rnd = random.Random(seed)
        for i in range(5):
            x = i * .2 - .4 + rnd.uniform(-.04, .04)
            top = add(anchor, (x, 0, .52)); ln = rnd.uniform(.4, 1.1)
            d.line([cam.p(top), cam.p(add(top, (0, -ln, 0)))], fill=rgb(.36, .6, .36), width=max(2, int(cam.ppu * .02)))
            y = -.08
            while y > -ln:
                circle(d, cam.p(add(top, (rnd.uniform(-.03, .03), y, .02))), cam.ppu * .04, rnd.choice(LEAF))
                y -= rnd.uniform(.1, .18)
    return (depth(add(anchor, (0, 0, .5))) + .3, draw)

def pond_item(cam, anchor):
    def draw(d):
        for (x, z, r) in [(-.2, .15, .09), (.18, -.12, .075), (.05, .28, .06)]:
            pts = [cam.p(add(anchor, (x + r * math.cos(t), .01, z + r * math.sin(t)))) for t in [i / 20 * math.tau for i in range(21)]]
            d.polygon(pts, fill=LEAF[0])
        circle(d, cam.p(add(anchor, (-.2, .03, .15))), cam.ppu * .03, BLOSSOM[0])
        for (x, z) in [(.1, .05), (-.15, -.2)]:
            circle(d, cam.p(add(anchor, (x, .01, z))), cam.ppu * .03, (255, 255, 255, 120))
    return (depth(anchor) + .02, draw)

def waterfall_item(cam, anchor, gl):
    def draw(d):
        rnd = random.Random(7)
        for i in range(26):
            z = anchor[2] + rnd.uniform(-.4, .4)
            pts = []
            for k in range(30):
                t = k / 29
                y = anchor[1] - t * 5.2
                x = anchor[0] + .05 + .5 * t * t
                pts.append(cam.p((x, y, z)))
            col = (230, 245, 255, int(rnd.uniform(70, 150)))
            d.line(pts, fill=col, width=int(cam.ppu * rnd.uniform(.03, .07)))
        glow(gl, cam.p((anchor[0] + .6, anchor[1] - 5.0, anchor[2])), cam.ppu * 1.1, (255, 255, 255), .6)
    return (depth(anchor) + .6, draw)

def mushroom_item(cam, anchor):
    def draw(d):
        for off, k in [((.3, 0, -.3), 1), ((.38, 0, -.18), .7)]:
            p = add(anchor, off)
            b = cam.p(p); t = cam.p(add(p, (0, .09 * k, 0)))
            d.line([b, t], fill=(245, 245, 240), width=int(cam.ppu * .05 * k))
            r = cam.ppu * .07 * k
            d.ellipse((t[0] - r, t[1] - r * .7, t[0] + r, t[1] + r * .3), fill=VERM)
            circle(d, (t[0] + r * .2, t[1] - r * .3), r * .2, (255, 255, 255))
    return (depth(anchor) + .05, draw)

def rock_item(cam, anchor, s):
    def draw(d):
        c = cam.p(add(anchor, (0, .08, 0)))
        r = cam.ppu * .3 * s
        d.ellipse((c[0] - r, c[1] - r * .5, c[0] + r, c[1] + r * .45), fill=MAT["rock"][0])
        d.ellipse((c[0] - r * .7, c[1] - r * .45, c[0] + r * .3, c[1]), fill=mul(MAT["rock"][0], 1.12))
    return (depth(anchor) + .05, draw)

def bush_item(cam, anchor, s):
    def draw(d):
        for (x, y, z, r, c) in [(-.18, .07, .1, .16, LEAF[2]), (0, .12, 0, .24, LEAF[0]), (.2, .08, .08, .18, LEAF[1])]:
            ball(d, cam.p(add(anchor, (x * s, y * s, z * s))), r * s * cam.ppu, c)
        for i in range(3):
            circle(d, cam.p(add(anchor, (i * .12 - .1, .27 * s, .12))), cam.ppu * .035, (255, 255, 255))
    return (depth(anchor) + .3, draw)

# ---------------- Figuren ----------------
def hana_item(cam, feet, facing="front", walking=False):
    def draw(d):
        u = cam.ppu * 1.45
        b = cam.p(feet)
        d.ellipse((b[0] - u * .2, b[1] - u * .08, b[0] + u * .2, b[1] + u * .08), fill=(70, 50, 90, 55))
        lift = u * (.03 if walking else 0)
        bx, by = b[0], b[1] - lift
        leg = (88, 70, 76)
        d.line([(bx - u * .05, by), (bx - u * .05, by - u * .09)], fill=leg, width=int(u * .045))
        d.line([(bx + u * .05, by - (u * .02 if walking else 0)), (bx + u * .05, by - u * .09)], fill=leg, width=int(u * .045))
        d.polygon([(bx - u * .16, by - u * .07), (bx + u * .16, by - u * .07), (bx + u * .055, by - u * .36), (bx - u * .055, by - u * .36)], fill=VERM)
        d.polygon([(bx + u * .03, by - u * .07), (bx + u * .16, by - u * .07), (bx + u * .055, by - u * .36)], fill=mul(VERM, .85))
        d.ellipse((bx - u * .07, by - u * .40, bx + u * .07, by - u * .35), fill=(255, 255, 255))
        hc = (bx, by - u * .47)
        circle(d, hc, u * .095, (255, 222, 194))
        if facing == "front":
            d.chord((hc[0] - u * .1, hc[1] - u * .11, hc[0] + u * .1, hc[1] + u * .06), 180, 360, fill=(77, 51, 46))
            for sx in (-1, 1):
                circle(d, (hc[0] + sx * u * .034, hc[1] + u * .005), u * .013, (38, 26, 30))
                circle(d, (hc[0] + sx * u * .052, hc[1] + u * .03), u * .015, (255, 158, 158))
        else:
            circle(d, hc, u * .1, (77, 51, 46))
        hb = (bx, by - u * .555)
        straw = rgb(.97, .86, .56)
        d.ellipse((hb[0] - u * .18, hb[1] - u * .035, hb[0] + u * .18, hb[1] + u * .035), fill=mul(straw, .9))
        d.ellipse((hb[0] - u * .17, hb[1] - u * .04, hb[0] + u * .17, hb[1] + u * .02), fill=straw)
        d.rectangle((hb[0] - u * .083, hb[1] - u * .085, hb[0] + u * .083, hb[1] - u * .005), fill=straw)
        d.ellipse((hb[0] - u * .083, hb[1] - u * .11, hb[0] + u * .083, hb[1] - u * .06), fill=mix(straw, (255, 255, 255), .2))
        d.rectangle((hb[0] - u * .085, hb[1] - u * .03, hb[0] + u * .085, hb[1] - u * .005), fill=VERM)
    return (depth(feet) + .55, draw)

def kiko_item(cam, pos, gl, s=1.0):
    def draw(d):
        u = cam.ppu * s
        c = cam.p(pos)
        glow(gl, (c[0], c[1] - u * .08), u * .45, (235, 255, 245), .7)
        white = (250, 250, 247)
        circle(d, (c[0] - u * .11, c[1] + u * .01), u * .03, white)
        circle(d, (c[0] + u * .11, c[1] + u * .01), u * .03, white)
        d.ellipse((c[0] - u * .1, c[1] - u * .085, c[0] + u * .1, c[1] + u * .085), fill=white)
        hc = (c[0], c[1] - u * .13)
        d.ellipse((hc[0] - u * .14, hc[1] - u * .115, hc[0] + u * .14, hc[1] + u * .115), fill=white)
        for sx in (-1, 1):
            circle(d, (hc[0] + sx * u * .045, hc[1]), u * .021, (31, 26, 36))
        circle(d, (hc[0], hc[1] + u * .045), u * .009, (31, 26, 36))
        for sx, rot in ((-1, 1), (1, -1)):
            lx, ly = hc[0] + sx * u * .03, hc[1] - u * .13
            d.polygon([(lx, ly + u * .03), (lx + sx * u * .07, ly - u * .02), (lx + sx * u * .02, ly - u * .04)], fill=LEAF[1])
    return (depth(pos) + .6, draw)

# ---------------- Himmel & Wolken ----------------
def sky():
    img = Image.new("RGBA", (CW, CH))
    stops = [(0, rgb(.52, .73, .93)), (.3, rgb(.74, .86, .95)), (.6, rgb(.99, .93, .84)), (.82, rgb(.99, .82, .74)), (1, rgb(.93, .72, .74))]
    d = ImageDraw.Draw(img)
    for y in range(CH):
        t = y / CH
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                k = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0])
                d.line([(0, y), (CW, y)], fill=mix(stops[i][1], stops[i + 1][1], k) + (255,))
                break
    return img

def cloud_sprite(w, seed, warm=False, alpha=1.0):
    h = int(w * .5)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rnd = random.Random(seed)
    sh = (238, 190, 200) if warm else (196, 199, 230)
    puffs = []
    for i in range(9):
        t = i / 8
        mid = 1 - abs(t - .5) * 2
        r = w * (.075 + rnd.uniform(0, .04) + mid * .08)
        x = w * .14 + t * w * .72 + rnd.uniform(-.04, .04) * w
        y = h * .74 - r * .75 - mid * h * .08
        puffs.append((x, y, r))
    for layer, col, off in (("s", sh, .18), ("l", (255, 255, 255), -.12)):
        m = Image.new("L", (w, h), 0); md = ImageDraw.Draw(m)
        for x, y, r in puffs:
            cy = y + r * off
            rr = r * (1 if layer == "s" else .86)
            md.ellipse((x - rr, cy - rr, x + rr, cy + rr), fill=int(255 * alpha))
        m = m.filter(ImageFilter.GaussianBlur(w * .012))
        img.paste(Image.new("RGBA", (w, h), col + (255,)), (0, 0), m)
    return img

def paste_cloud(img, cx, cy, w, seed, warm=False, alpha=1.0):
    c = cloud_sprite(int(w), seed, warm, alpha)
    img.alpha_composite(c, (int(cx - w / 2), int(cy - w * .25)))

def petals(d, n, seed, region=(0, 0, CW, CH)):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.uniform(region[0], region[2]), rnd.uniform(region[1], region[3])
        r = rnd.uniform(10, 20) * SS / 2
        a = rnd.uniform(0, math.pi)
        pts = [(x + math.cos(t) * r * math.cos(a) - math.sin(t) * r * .55 * math.sin(a),
                y + math.cos(t) * r * math.sin(a) + math.sin(t) * r * .55 * math.cos(a)) for t in [i / 12 * math.tau for i in range(12)]]
        d.polygon(pts, fill=rnd.choice(BLOSSOM) + (220,))

# ---------------- Szene zusammensetzen ----------------
def render(state, cam, *, hana=None, kiko=None, extra=None, crank_hl=None, bridge_spin=0.0,
           bloom=False, big_tree=None, spirits=(), seed_on_altar=True, sparkle=None, warm=0.0):
    img = sky()
    gl = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    # Sonne und Himmelswolken
    glow(img, (CW * .72, CH * .16), CW * .45, (255, 246, 214), .85)
    for (x, y, w, s, wm) in [(.18, .1, .62, 1, False), (.86, .23, .55, 2, True), (.3, .3, .4, 3, True), (.95, .05, .5, 4, False)]:
        paste_cloud(img, CW * x, CH * y, CW * w, s, wm)
    for (x, y, w, s, wm) in [(.2, .9, .9, 11, True), (.75, .92, 1.0, 12, False), (.5, .98, 1.2, 13, False), (.05, 1.0, .8, 14, True), (.95, 1.0, .9, 15, True)]:
        paste_cloud(img, CW * x, CH * y, CW * w, s, wm)

    items = []
    occupied = {tuple(b["p"]) for b in LEVEL["blocks"]}
    for i, b in enumerate(LEVEL["blocks"]):
        T = state.T(b.get("g"))
        p = tuple(b["p"])
        if b.get("stair"):
            yaw = {"-z": 0, "-x": math.pi / 2, "+z": math.pi, "+x": 3 * math.pi / 2}[b["stair"]]
            for k in range(4):
                h = (k + 1) * .25
                local = (0, -.5 + h / 2, .5 - .125 - k * .25)
                c = add(p, roty(local, yaw))
                def Tl(q, c=c, yaw=yaw):
                    return q
                # Stufen als Quader mit gedrehten Halbachsen
                half = (.5, h / 2, .125)
                items.append(box_item(cam, add(p, (0, 0, 0)), half, lambda q, p=p, local=local, yaw=yaw: q, b["m"], i * 10 + k,
                                      yaw=0) if False else box_item(cam, (0, 0, 0), half,
                                      lambda q, p=p, local=local, yaw=yaw: add(p, roty(add(local, q), yaw)), b["m"], i * 10 + k))
            continue
        moss = b["m"] == "grass" and (p[0], p[1] + 1, p[2]) not in occupied
        items.append(box_item(cam, p, (.5, .5, .5), T, b["m"], i, moss=moss))

    for i, dd in enumerate(LEVEL["decor"]):
        T = state.T(dd.get("g"))
        p = tuple(dd["p"]); top = T(add(p, (0, .5, 0))); s = dd["s"]; t = dd["t"]
        if t == "tree":
            if big_tree and tuple(p) == (5, 6, 1): continue
            items.append(tree_item(cam, top, s, dd.get("variant", 0), i))
        elif t == "bush": items.append(bush_item(cam, top, s))
        elif t == "flowers": items.append(flowers_item(cam, top, s, i))
        elif t == "grass": items.append(grass_item(cam, top, s, i))
        elif t == "mushroom": items.append(mushroom_item(cam, top))
        elif t == "rock": items.append(rock_item(cam, top, s))
        elif t == "lantern": items.append(lantern_item(cam, top, s, gl))
        elif t == "vine": items.append(vine_item(cam, top, i))
        elif t == "torii": items.append(torii_item(cam, top, s))
        elif t == "pond": items.append(pond_item(cam, top))
        elif t == "waterfall": items.append(waterfall_item(cam, add(p, (.52, .42, 0)), gl))
        elif t == "altar":
            items.append(box_item(cam, add(p, (0, .59, -.32)), (.25, .09, .12), lambda q: q, "altar", 500 + i, colors=MAT["altar"]))
            items.append(box_item(cam, add(p, (0, .72, -.32)), (.18, .04, .09), lambda q: q, "altar", 600 + i, colors=MAT["altar"]))
            if seed_on_altar:
                items.append(seed_item(cam, add(p, (0, .92, -.32)), gl))
        elif t == "crank":
            items.append(crank_item(cam, p, dd.get("face", "+x"), T, spin=bridge_spin if dd.get("g") == "bridge" else 0,
                                    highlight=(crank_hl == dd.get("g")), gl=gl))
        elif t == "handle":
            items.append(handle_item(cam, p, T))

    if bloom:
        for b in LEVEL["blocks"]:
            if b["m"] == "grass" and b["walk"]:
                items.append(flowers_item(cam, add(tuple(b["p"]), (0, .5, 0)), .9, hash(tuple(b["p"])) % 1000))
    if big_tree:
        items.append(tree_item(cam, big_tree, 2.4, 2, 4242))
    if hana: items.append(hana_item(cam, *hana))
    if kiko: items.append(kiko_item(cam, kiko, gl))
    for sp in spirits: items.append(kiko_item(cam, sp, gl, .7))
    if extra: items += extra

    items.sort(key=lambda it: it[0])
    # Auf RGB zeichnen: nur dort mischt Pillow halbtransparente Farben korrekt
    canvas = img.convert("RGB")
    d = ImageDraw.Draw(canvas, "RGBA")
    for _, fn in items: fn(d)
    img = canvas.convert("RGBA")

    # Glühwürmchen beim Schrein
    rnd = random.Random(3)
    for _ in range(9):
        q = (rnd.uniform(3.5, 6), rnd.uniform(6.6, 7.8), rnd.uniform(-1.5, 1))
        glow(gl, cam.p(q), cam.ppu * .12, (255, 240, 150), .9)
    if sparkle:
        c = cam.p(sparkle)
        glow(gl, c, cam.ppu * 1.1, (255, 236, 160), 1)
        r2 = random.Random(9)
        for _ in range(40):
            a = r2.uniform(0, math.tau); dist = r2.uniform(.2, 1.2) * cam.ppu
            glow(gl, (c[0] + math.cos(a) * dist, c[1] + math.sin(a) * dist * .8), cam.ppu * r2.uniform(.04, .1), (255, 240, 170), 1)
        sd = ImageDraw.Draw(gl)
        for k in range(4):
            a = k * math.pi / 4
            sd.line([(c[0] - math.cos(a) * cam.ppu * .5, c[1] - math.sin(a) * cam.ppu * .5),
                     (c[0] + math.cos(a) * cam.ppu * .5, c[1] + math.sin(a) * cam.ppu * .5)], fill=(255, 255, 230, 200), width=int(cam.ppu * .03))
    img.alpha_composite(gl)

    # Vordergrundwolken über dem Inselfels
    fg = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    paste_cloud(fg, CW * .08, CH * .84, CW * .5, 21, False)
    paste_cloud(fg, CW * .95, CH * .87, CW * .55, 22, True)
    fg.putalpha(fg.getchannel("A").point(lambda a: int(a * .85)))
    img.alpha_composite(fg)

    canvas = img.convert("RGB")
    petals(ImageDraw.Draw(canvas, "RGBA"), 60 if big_tree else 16, 5)
    img = canvas.convert("RGBA")

    # weicher Bloom + warmes Licht
    blur = img.filter(ImageFilter.GaussianBlur(CW * .01))
    img = Image.blend(img, blur, .1)
    if warm > 0:
        img = Image.blend(img, Image.new("RGBA", img.size, (255, 214, 160, 255)), warm)
    # Vignette
    vig = Image.new("L", (CW, CH), 0); vd = ImageDraw.Draw(vig)
    vd.ellipse((-CW * .35, -CH * .2, CW * 1.35, CH * 1.2), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(CW * .12))
    dark = Image.new("RGBA", (CW, CH), (90, 60, 90, 255))
    img = Image.composite(img, Image.blend(img, dark, .22), vig)
    from PIL import ImageEnhance
    rgbimg = ImageEnhance.Contrast(ImageEnhance.Color(img.convert("RGB")).enhance(1.12)).enhance(1.06)
    return rgbimg.convert("RGBA")

# ---------------- UI-Overlays ----------------
INK = (82, 61, 77)
def text_c(img, y, txt, f, col=INK, shadow=True, spacing=8):
    d = ImageDraw.Draw(img)
    lines = txt.split("\n")
    for k, line in enumerate(lines):
        bb = d.textbbox((0, 0), line, font=f)
        x = (CW - (bb[2] - bb[0])) / 2
        yy = y + k * (bb[3] - bb[1] + spacing * SS)
        if shadow:
            sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
            ImageDraw.Draw(sh).text((x, yy), line, font=f, fill=(255, 255, 255, 230))
            sh = sh.filter(ImageFilter.GaussianBlur(6 * SS))
            img.alpha_composite(sh); img.alpha_composite(sh)
        ImageDraw.Draw(img).text((x, yy), line, font=f, fill=col)

def status_bar_safe(): return 59 * 3 * SS / 3 * 1  # Dynamic-Island-Bereich (pt * 3 px)

def menu_button(img):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    cx, cy, r = CW - 62 * 3 * SS / 3, (59 + 28) * 3 * SS / 3, 22 * 3 * SS / 3
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 247, 235, 140))
    for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
        rr = 3.2 * SS
        d.ellipse((cx + dx * 7 * SS - rr, cy + dy * 7 * SS - rr, cx + dx * 7 * SS + rr, cy + dy * 7 * SS + rr), outline=INK, width=int(1.5 * SS))
    img.alpha_composite(lay)

def story(img, txt):
    text_c(img, (59 + 54 + 10) * 3 * SS / 3, txt, font("liberation/LiberationSerif-Italic.ttf", 19 * 3), INK, True)

def home_indicator(img):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    w = 134 * 3 * SS / 3
    d.rounded_rectangle((CW / 2 - w / 2, CH - 26 * SS, CW / 2 + w / 2, CH - 11 * SS), radius=8 * SS, fill=(40, 30, 40, 150))
    img.alpha_composite(lay)

def finger(img, c, gl_r=60):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    r = 40 * SS
    d.ellipse((c[0] - r, c[1] - r, c[0] + r, c[1] + r), fill=(255, 255, 255, 110), outline=(255, 255, 255, 230), width=int(4 * SS))
    img.alpha_composite(layer)

def arc_arrow(img, c, r, a0, a1, ry=.55):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    pts = [(c[0] + math.cos(a) * r, c[1] + math.sin(a) * r * ry) for a in [a0 + (a1 - a0) * i / 30 for i in range(31)]]
    d.line(pts, fill=(255, 250, 235, 230), width=int(6 * SS))
    a = a1; tip = pts[-1]
    tx, ty = -math.sin(a), math.cos(a) * ry
    l = math.hypot(tx, ty); tx, ty = tx / l, ty / l
    nx, ny = -ty, tx
    s = 22 * SS
    d.polygon([(tip[0] + tx * s, tip[1] + ty * s), (tip[0] + nx * s * .6, tip[1] + ny * s * .6), (tip[0] - nx * s * .6, tip[1] - ny * s * .6)], fill=(255, 250, 235, 240))
    img.alpha_composite(lay)

def finish(img, name):
    out = img.resize((W, H), Image.LANCZOS).convert("RGB")
    out.save(os.path.join(OUT, name))
    return out

# ---------------- Die vier Bildschirme ----------------
os.makedirs(OUT, exist_ok=True)
cam = Cam()
shots = []

# 1) Titel
st = State()
img = render(st, cam, hana=((0, .5, 4), "front"), kiko=(-.42, 1.18, 4.34))
ov = Image.new("RGBA", img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
for y in range(int(CH * .4)):
    od.line([(0, y), (CW, y)], fill=(255, 247, 235, int(200 * (1 - y / (CH * .4)) ** 1.4)))
img.alpha_composite(ov)
text_c(img, 210 * SS, "Wolkenpfad", font("freefont/FreeSerif.ttf", 150), INK)
d = ImageDraw.Draw(img)
d.line([(CW / 2 - 70 * SS, 420 * SS), (CW / 2 + 70 * SS, 420 * SS)], fill=(219, 92, 77), width=int(4 * SS))
text_c(img, 460 * SS, "Kapitel I · Der Samen des Waldes", font("freefont/FreeSerifItalic.ttf", 48), (120, 100, 112), False)
text_c(img, CH - 270 * SS, "Tippe, um zu beginnen", font("freefont/FreeSerif.ttf", 44), INK)
home_indicator(img)
shots.append(finish(img, "01_titel.png"))

# 2) Kurbel drehen – die Brücke schwenkt
th = math.radians(52)
st = State(bridge=th)
img = render(st, cam, hana=((0, 1.5, 0), "front"), kiko=(-0.9, 2.3, 0.9), crank_hl="bridge", bridge_spin=th * 2.5)
crank_world = add((-2, 1, 0), roty((0.56, -2, 0), th))
cpt = cam.p(crank_world)
finger(img, (cpt[0] + 30 * SS, cpt[1] + 40 * SS))
arc_arrow(img, cam.p((-2, 1.6, 0)), cam.ppu * 1.7, math.radians(200), math.radians(320))
story(img, "Nicht jeder Weg liegt offen.\nManche wollen bewegt werden.")
menu_button(img); home_indicator(img)
shots.append(finish(img, "02_kurbel_drehen.png"))

# 3) Die unmögliche Verbindung
st = State(bridge=math.pi / 2, lift=3, arm=math.pi / 2)
img = render(st, cam, hana=((0, 4.5, -2), "front", True), kiko=(-0.6, 5.3, -1.4), sparkle=(1.5, 4.5, -2))
story(img, "Manche Wege sieht man erst,\nwenn man die Welt anders betrachtet.")
menu_button(img); home_indicator(img)
shots.append(finish(img, "03_unmoegliche_verbindung.png"))

# 4) Finale
cam_end = Cam(zoom=1.12)
st = State(bridge=math.pi / 2, lift=3, arm=math.pi / 2)
spirits = [(-1, .62, 3), (1, .62, 5), (2, 1.62, 0), (-4, 1.62, 0), (-2, 4.62, -2), (4, 6.62, 0), (3, .62, 3)]
img = render(st, cam_end, hana=((5, 6.5, -1), "back"), kiko=(4.4, 7.4, -0.3), bloom=True, big_tree=(5, 6.5, 1),
             spirits=spirits, seed_on_altar=False, warm=.08)
# Endkarte
card = Image.new("RGBA", img.size, (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
top = CH - 640 * SS
cd.rounded_rectangle((70 * SS, top, CW - 70 * SS, CH - 140 * SS), radius=70 * SS, fill=(255, 247, 235, 228))
img.alpha_composite(card)
text_c(img, top + 70 * SS, "Kapitel I abgeschlossen", font("freefont/FreeSerif.ttf", 80), INK, False)
text_c(img, top + 200 * SS, "Der Wald erwacht. Doch hinter den Wolken\nwarten noch viele stille Türme.", font("freefont/FreeSerifItalic.ttf", 44), (120, 100, 112), False)
bd = ImageDraw.Draw(img)
bw = 300 * SS
bd.rounded_rectangle((CW / 2 - bw, top + 370 * SS, CW / 2 + bw, top + 490 * SS), radius=60 * SS, outline=(150, 130, 140), width=int(3 * SS))
text_c(img, top + 395 * SS, "↻  Noch einmal", font("freefont/FreeSerif.ttf", 48), INK, False)
home_indicator(img)
shots.append(finish(img, "04_finale.png"))

# Übersicht: vier iPhones nebeneinander
fw, fh = 560, 1214
pad = 70
sheet = Image.new("RGB", (pad + 4 * (fw + pad), fh + 2 * pad + 150), (250, 238, 226))
sd = ImageDraw.Draw(sheet)
labels = ["Titel", "Kurbel drehen", "Unmögliche Verbindung", "Finale"]
lf = ImageFont.truetype(FONT_DIR + "freefont/FreeSerif.ttf", 42)
for k, shot in enumerate(shots):
    x = pad + k * (fw + pad); y = pad
    frame = Image.new("RGBA", (fw + 24, fh + 24), (0, 0, 0, 0))
    ImageDraw.Draw(frame).rounded_rectangle((0, 0, fw + 23, fh + 23), radius=78, fill=(34, 30, 38))
    sheet.paste(frame, (x - 12, y - 12), frame)
    s = shot.resize((fw, fh), Image.LANCZOS)
    m = Image.new("L", (fw, fh), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, fw - 1, fh - 1), radius=66, fill=255)
    sheet.paste(s, (x, y), m)
    di = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    ImageDraw.Draw(di).rounded_rectangle((fw / 2 - 62, 18, fw / 2 + 62, 54), radius=18, fill=(10, 10, 12))
    sheet.paste(di, (x, y), di)
    bb = sd.textbbox((0, 0), labels[k], font=lf)
    sd.text((x + (fw - (bb[2] - bb[0])) / 2, y + fh + 50), labels[k], font=lf, fill=INK)
sheet.save(os.path.join(OUT, "00_uebersicht.png"))
print("fertig")
