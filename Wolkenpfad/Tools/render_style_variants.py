# Designvorschläge für Kapitel III („Der Turm der Laternen“) in verschiedenen Stilen.
# Gleiche Szene, gleiche Geometrie – nur Palette, Licht, Dekoration, Figur und Typografie ändern sich.
# Aufruf: python3 Tools/render_style_variants.py Wolkenpfad/Level Mockups/
import copy, json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render_mockups as rm
from render_mockups import (rgb, mix, mul, add, sub, scl, depth, circle, ball, State, Cam, text_c, finish,
                            home_indicator, CW, CH, SS, FONT_DIR)
import render_neko_mockups as nm

BASE_MAT = copy.deepcopy(rm.MAT)
DEFAULTS = dict(BACKDROP_HOOK=None, PARTICLE_HOOK=None, SUN_HOOK=None, SHADE_HOOK=None, DABS=1.0, EDGES=True,
                LANTERN_BOOST=None, CLOUD_LAYOUT=True, FG_CLOUDS=True)
STATE = dict(stone=3, tower=0)
HERO = (0, .5, 0)
COMPANION = (.5, 1.3, .6)
STORY = "Ein Turm, der sich dreht,\nhat viele Türen."


def reset():
    for k, v in DEFAULTS.items(): setattr(rm, k, v)
    rm.MAT.clear(); rm.MAT.update(copy.deepcopy(BASE_MAT))


def use_level(level, theme):
    rm.LEVEL = level
    rm.GROUPS = {g["id"]: g for g in level["groups"]}
    rm.THEME = theme


def remap_decor(level, fn):
    out = []
    for d in level["decor"]:
        r = fn(dict(d))
        if r is None: continue
        out += r if isinstance(r, list) else [r]
    level["decor"] = out


def soft(d, c, r, col, a=1.0, steps=12):
    """Weiches Leuchten direkt auf einer RGBA-Zeichenfläche."""
    for k in range(steps, 0, -1):
        t = k / steps
        al = int(255 * a * (1 - t) ** 1.5 * .35)
        if al <= 0: continue
        d.ellipse((c[0] - r * t, c[1] - r * t, c[0] + r * t, c[1] + r * t), fill=col + (al,))


def lantern_strings(cam, pairs, light=(255, 196, 120), bulb=(255, 214, 140), n=7):
    def anchor(p): return add(tuple(p), (.32, .95, -.32))
    items = []
    for a, b in pairs:
        A, B = anchor(a), anchor(b)
        def draw(d, A=A, B=B):
            pts = []
            for k in range(25):
                t = k / 24
                q = add(A, scl(sub(B, A), t))
                pts.append((q[0], q[1] - .45 * 4 * t * (1 - t), q[2]))
            d.line([cam.p(q) for q in pts], fill=(60, 50, 70, 200), width=max(2, int(cam.ppu * .012)))
            for k in range(1, n + 1):
                q = cam.p(pts[int(k / (n + 1) * 24)])
                q = (q[0], q[1] + cam.ppu * .06)
                soft(d, q, cam.ppu * .3, light, .9)
                d.ellipse((q[0] - cam.ppu * .045, q[1] - cam.ppu * .06, q[0] + cam.ppu * .045, q[1] + cam.ppu * .06), fill=bulb)
        items.append((max(depth(A), depth(B)) + 1.2, draw))
    return items


def story(img, txt, f, col, shadow=True):
    text_c(img, (59 + 54 + 60) * SS, txt, f, col, shadow)


# ---------------- 1) Neko-no-Machi-Stil ----------------
def neko(level_dir):
    reset()
    cam = nm.setup(level_dir, 6)
    img = nm.render(State(**STATE), cam, cat=(HERO, "mochi"), sparrow=COMPANION, collected={(6, -2, 3), (3, -1, 3), (1, 0, 3)})
    nm.story(img, "Eine Pagode, die sich dreht,\nhat viele Türen.")
    nm.hud(img, 3, 7); home_indicator(img)
    return finish(img, "21_stil_neko.png")


# ---------------- 2) Mehr Studio Ghibli ----------------
def ghibli(base):
    reset()
    lv = copy.deepcopy(base)
    rm.SKIES["ghibli"] = [(0, rgb(.3, .56, .84)), (.3, rgb(.55, .76, .92)), (.6, rgb(.96, .92, .8)), (.82, rgb(.98, .84, .66)), (1, rgb(.9, .72, .62))]
    rm.LIGHT["ghibli"] = (1.03, .07)
    rm.CLOUD["ghibli"] = ((255, 252, 240), (165, 186, 214), (236, 196, 172))
    rm.MAT.update({
        "grass": (rgb(.44, .68, .3), rgb(.74, .62, .46)), "stone": (rgb(.86, .82, .7), rgb(.8, .74, .62)),
        "stonedark": (rgb(.62, .6, .53), rgb(.62, .6, .53)), "rock": (rgb(.6, .54, .47), rgb(.6, .54, .47)),
        "rockdark": (rgb(.44, .42, .4), rgb(.44, .42, .4)), "teal": (rgb(.45, .62, .52), rgb(.45, .62, .52)),
        "tealdark": (rgb(.34, .5, .44), rgb(.34, .5, .44)), "tealtop": (rgb(.62, .8, .62), rgb(.45, .62, .52)),
        "wood": (rgb(.62, .44, .3), rgb(.55, .38, .26)), "water": (rgb(.42, .68, .8), rgb(.74, .62, .46)),
    })
    rm.DABS = 1.8

    def fn(d):
        if d["t"] == "tree": d["variant"] = 0 if d["p"] != [-1, 0, 5] else 0; d["s"] = 1.7 if d["p"] == [-1, 0, 5] else d["s"] * 1.2
        if d["t"] == "lantern" and d["p"] in ([2, 0, 4], [3, 0, 5]): return [d, {"t": "vine", "p": d["p"], "s": 1, "r": 0}]
        return d
    remap_decor(lv, fn)
    # Überwucherung: Ranken, Gras, Blumen, Pilze, Büsche
    extra = [("vine", [0, 0, 0]), ("vine", [-3, 3, -1]), ("vine", [3, 3, -1]), ("vine", [6, 7, 1]), ("vine", [5, -2, 4]),
             ("vine", [-7, 3, 0]), ("grass", [1, 0, 4]), ("grass", [0, 0, 3]), ("grass", [5, -2, 3]), ("grass", [6, 7, 0]),
             ("flowers", [2, 0, 3]), ("flowers", [-1, 0, 4]), ("flowers", [6, -2, 4]), ("flowers", [-2, 3, -1]),
             ("mushroom", [1, 0, 2]), ("mushroom", [6, 7, -1]), ("bush", [-2, -1, 1]), ("bush", [0, -1, 1]),
             ("tree", [-1, -1, 1]), ("bamboo", [7, -2, 5])]
    for t, p in extra:
        d = {"t": t, "p": p, "s": .8 if t in ("tree", "bush") else 1.0, "r": 0}
        if t == "tree": d["variant"] = 1
        lv["decor"].append(d)
    use_level(lv, "ghibli")

    def backdrop(img, cam):
        # Gewaltiger Kumulusturm (wie das „Drachennest“), ferne Hügel und eine schwebende Insel im Dunst
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        d.polygon([(0, CH * .74)] + [(x, CH * (.7 - .03 * math.sin(x / CW * 6) - .02 * math.sin(x / CW * 13)))
                                      for x in range(0, CW + 20, 20)] + [(CW, CH * .74), (CW, CH), (0, CH)], fill=(150, 184, 176, 200))
        rnd = random.Random(4)
        puffs = []
        for row in range(9):
            y = CH * (.66 - row * .055)
            half = CW * (.3 - row * .025)
            for k in range(6):
                x = CW * .58 + rnd.uniform(-half, half)
                r = CW * rnd.uniform(.07, .12) * (1 - row * .05)
                puffs.append((x, y, r))
        for x, y, r in puffs:          # Schatten (bläulich, unten rechts)
            d.ellipse((x - r + r * .12, y - r + r * .2, x + r + r * .12, y + r + r * .2), fill=(176, 190, 222, 255))
        for x, y, r in puffs:          # Licht (warm, oben links)
            d.ellipse((x - r * .9 - r * .1, y - r * .9 - r * .12, x + r * .9 - r * .1, y + r * .9 - r * .12), fill=(255, 250, 238, 255))
        for x, y, r in puffs[-12:]:
            d.ellipse((x - r * .5 - r * .3, y - r * .5 - r * .35, x + r * .5 - r * .3, y + r * .5 - r * .35), fill=(255, 255, 250, 255))
        # schwebende Insel links
        cx, cy, w = CW * .14, CH * .5, CW * .1
        d.polygon([(cx - w, cy), (cx + w, cy), (cx + w * .2, cy + w * 1.3)], fill=(140, 166, 176, 230))
        for k in range(4):
            bx = cx - w * .7 + k * w * .45
            d.ellipse((bx - w * .25, cy - w * .35, bx + w * .25, cy + w * .05), fill=(118, 158, 140, 230))
        d.line([(cx + w * .5, cy + w * .1), (cx + w * .45, cy + w * 2.2)], fill=(240, 248, 252, 160), width=int(w * .05))
        img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(2 * SS)))

    def particles(d, big):
        rnd = random.Random(12)
        for _ in range(26):   # Pusteblumen-Samen
            x, y = rnd.uniform(0, CW), rnd.uniform(CH * .15, CH * .8)
            r = rnd.uniform(5, 9) * SS
            for k in range(8):
                a = k / 8 * math.tau
                d.line([(x, y), (x + math.cos(a) * r, y + math.sin(a) * r)], fill=(255, 255, 250, 170), width=max(1, SS))
            d.line([(x, y), (x + r * .3, y + r * 1.8)], fill=(255, 255, 250, 150), width=max(1, SS))
        rm.leaves(d, 10, 7)
    rm.BACKDROP_HOOK = backdrop
    rm.PARTICLE_HOOK = particles
    cam = Cam()
    spirits = [rm.kiko_item(cam, p, None, .5) for p in ()]
    gl_dummy = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    kodama = [rm.kiko_item(cam, p, gl_dummy, .55) for p in ((-1.3, .75, 3.6), (2.3, .75, 3.2), (-2.4, 3.75, -.7), (6.3, -1.25, 4.6), (5.6, 7.75, -1.3))]
    img = rm.render(State(**STATE), cam, hana=(HERO, "front"), kiko=COMPANION, extra=kodama + spirits, warm=.05,
                    firefly_area=((-.5, 2.5), (3, 4.5), (-3, -1)))
    img.alpha_composite(gl_dummy)
    story(img, STORY, ImageFont.truetype(FONT_DIR + "freefont/FreeSerifItalic.ttf", 19 * 3 * SS), (92, 66, 52))
    rm.menu_button(img); home_indicator(img)
    return finish(img, "22_stil_ghibli.png")


# ---------------- 3) Mehr Monument Valley ----------------
def ida_item(cam, feet):
    def draw(d):
        u = cam.ppu * 1.45
        b = cam.p(feet)
        d.ellipse((b[0] - u * .13, b[1] - u * .05, b[0] + u * .13, b[1] + u * .05), fill=(120, 80, 120, 50))
        d.polygon([(b[0] - u * .1, b[1]), (b[0] + u * .1, b[1]), (b[0] + u * .035, b[1] - u * .3), (b[0] - u * .035, b[1] - u * .3)], fill=(252, 250, 248))
        d.polygon([(b[0] + u * .02, b[1]), (b[0] + u * .1, b[1]), (b[0] + u * .035, b[1] - u * .3)], fill=(222, 214, 230))
        circle(d, (b[0], b[1] - u * .34), u * .055, (252, 250, 248))
        d.polygon([(b[0] - u * .07, b[1] - u * .35), (b[0] + u * .07, b[1] - u * .35), (b[0] + u * .01, b[1] - u * .62)], fill=(252, 250, 248))
        d.polygon([(b[0] + u * .0, b[1] - u * .35), (b[0] + u * .07, b[1] - u * .35), (b[0] + u * .01, b[1] - u * .62)], fill=(222, 214, 230))
    return (depth(feet) + .55, draw)


def mv(base):
    reset()
    lv = copy.deepcopy(base)
    rm.SKIES["mv"] = [(0, (247, 206, 196)), (.35, (252, 226, 208)), (.65, (246, 208, 212)), (.85, (226, 192, 214)), (1, (204, 178, 212))]
    rm.LIGHT["mv"] = (1.0, 0)
    rm.CLOUD["mv"] = ((255, 244, 240), (238, 212, 222), (244, 206, 210))
    cream = (250, 236, 216)
    rm.MAT.update({
        "grass": ((176, 214, 188), (233, 144, 124)), "stone": (cream, (233, 144, 124)),
        "stonedark": ((214, 116, 116), (214, 116, 116)), "rock": ((198, 108, 124), (198, 108, 124)),
        "rockdark": ((150, 94, 128), (150, 94, 128)), "teal": ((96, 176, 176), (96, 176, 176)),
        "tealdark": ((70, 142, 156), (70, 142, 156)), "tealtop": ((182, 230, 220), (96, 176, 176)),
        "wood": ((244, 196, 128), (226, 170, 110)), "water": ((128, 196, 214), (233, 144, 124)), "gate": ((244, 176, 86), (230, 150, 70)),
    })

    def shade(base_c, n):
        if n[1] > .7: return base_c
        if n[0] > .5: return mix(mul(base_c, .66), (110, 70, 140), .22)      # rechte Seite: tief
        if n[2] > .5: return mix(mul(base_c, .88), (240, 150, 150), .08)     # linke Seite: mittel
        return mul(base_c, .55)
    rm.SHADE_HOOK = shade
    rm.DABS = 0
    rm.EDGES = False
    rm.CLOUD_LAYOUT = False
    rm.FG_CLOUDS = False

    def fn(d):
        if d["t"] in ("grass", "flowers", "mushroom", "bush", "vine", "bamboo"): return None
        if d["t"] == "tree": d["t"] = "mvtree"
        if d["t"] == "lantern": d["t"] = "mvlamp"
        return d
    remap_decor(lv, fn)
    use_level(lv, "mv")

    def mvtree(cam, p, top, s, dd, i, gl, T):
        def draw(d):
            b = cam.p(top); t = cam.p(add(top, (0, .55 * s, 0)))
            d.line([b, t], fill=(160, 100, 110), width=int(cam.ppu * .05))
            r = cam.ppu * .26 * s
            d.ellipse((t[0] - r, t[1] - r, t[0] + r, t[1] + r), fill=(120, 190, 160))
            d.pieslice((t[0] - r, t[1] - r, t[0] + r, t[1] + r), -90, 90, fill=(88, 156, 140))
        return (depth(top) + .4, draw)

    def mvlamp(cam, p, top, s, dd, i, gl, T):
        a = add(top, (.3, 0, -.3))
        def draw(d):
            b = cam.p(a); u = cam.ppu
            d.rectangle((b[0] - u * .05, b[1] - u * .32, b[0] + u * .05, b[1]), fill=(250, 236, 216))
            d.rectangle((b[0], b[1] - u * .32, b[0] + u * .05, b[1]), fill=(214, 160, 170))
            soft(d, (b[0], b[1] - u * .4), u * .35, (255, 230, 200), .6)
            circle(d, (b[0], b[1] - u * .4), u * .07, (255, 248, 236))
        return (depth(a) + .1, draw)
    rm.DECOR_HOOKS["mvtree"] = mvtree
    rm.DECOR_HOOKS["mvlamp"] = mvlamp

    def sun(img):
        d = ImageDraw.Draw(img)
        circle(d, (CW * .7, CH * .2), CW * .09, (255, 244, 230))

    def backdrop(img, cam):
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        # flache, geometrische Wolken
        for (x, y, w) in ((.2, .12, .3), (.82, .3, .22), (.12, .42, .16)):
            cx, cy, ww = CW * x, CH * y, CW * w
            d.rounded_rectangle((cx - ww / 2, cy - ww * .08, cx + ww / 2, cy + ww * .08), radius=ww * .08, fill=(255, 240, 236, 200))
            d.ellipse((cx - ww * .2, cy - ww * .2, cx + ww * .1, cy + ww * .08), fill=(255, 240, 236, 200))
        # ferne Bögen und Kuppeln als Silhouetten
        sil = (232, 196, 210, 255)
        for (x, h) in ((.08, .1), (.92, .14)):
            cx, by = CW * x, CH * .78
            hh = CH * h
            d.rectangle((cx - CW * .05, by - hh, cx + CW * .05, by + CH), fill=sil)
            d.pieslice((cx - CW * .05, by - hh - CW * .05, cx + CW * .05, by - hh + CW * .05), 180, 360, fill=sil)
        # Nebelband unten
        for k in range(40):
            y = CH * .7 + k * CH * .0075
            d.line([(0, y), (CW, y)], fill=(250, 232, 236, int(255 * min(1, k / 30))), width=int(CH * .008))
        img.alpha_composite(lay)
    rm.SUN_HOOK = sun
    rm.BACKDROP_HOOK = backdrop
    rm.PARTICLE_HOOK = lambda d, big: None
    cam = Cam()
    img = rm.render(State(**STATE), cam, extra=[ida_item(cam, HERO)], firefly_area=((99, 99), (99, 99), (99, 99)))
    f = ImageFont.truetype(FONT_DIR + "dejavu/DejaVuSans.ttf", 15 * 3 * SS)
    story(img, "E I N   T U R M ,   D E R   S I C H   D R E H T ,\nH A T   V I E L E   T Ü R E N", f, (130, 92, 116), False)
    rm.menu_button(img); home_indicator(img)
    return finish(img, "23_stil_monument_valley.png")


# ---------------- 4) Schickeres Original ----------------
LANTERN_PAIRS = [([2, 0, 4], [3, 0, 5]), ([-1, 0, 2], [2, 0, 4]), ([-3, 3, -1], [2, 2, -3]), ([5, 3, -1], [7, 7, 0])]


def deluxe(base):
    reset()
    lv = copy.deepcopy(base)
    lv["decor"] += [{"t": "lantern", "p": p, "s": .9, "r": 0} for p in ([-7, 3, -1], [6, 7, -1], [6, -2, 2])]
    use_level(lv, "night")
    rm.LANTERN_BOOST = 2.8

    def moon(img):
        d = ImageDraw.Draw(img)
        c = (CW * .74, CH * .13)
        rm.glow(img, c, CW * .42, (170, 190, 255), .5)
        for k, r in enumerate((.16, .12)):
            d.ellipse((c[0] - CW * r, c[1] - CW * r, c[0] + CW * r, c[1] + CW * r), outline=(220, 228, 255, 60 - k * 20), width=int(3 * SS))
        circle(d, c, CW * .055, (252, 248, 232))
        circle(d, (c[0] + CW * .015, c[1] - CW * .01), CW * .012, (236, 230, 214))
        circle(d, (c[0] - CW * .02, c[1] + CW * .018), CW * .008, (236, 230, 214))

    def backdrop(img, cam):
        lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        # Polarlicht
        for k, col in enumerate(((110, 255, 200, 70), (140, 170, 255, 60), (200, 140, 255, 40))):
            pts = [(x, CH * (.2 + .05 * k) + math.sin(x / CW * 5 + k) * CH * .04) for x in range(0, CW + 40, 40)]
            d.line(pts, fill=col, width=int(70 * SS))
        lay = lay.filter(ImageFilter.GaussianBlur(30 * SS))
        img.alpha_composite(lay)
        # Milchstraße
        d = ImageDraw.Draw(img)
        rnd = random.Random(5)
        for _ in range(700):
            t = rnd.uniform(0, 1)
            x = CW * t; y = CH * (.05 + .3 * t) + rnd.gauss(0, CH * .035)
            r = rnd.uniform(.5, 1.6) * SS
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, rnd.randint(60, 200)))

    def particles(d, big):
        rnd = random.Random(21)
        for _ in range(30):
            q = (rnd.uniform(0, CW), rnd.uniform(CH * .2, CH * .85))
            soft(d, q, rnd.uniform(14, 26) * SS, (255, 200, 120), .7)
    rm.SUN_HOOK = moon
    rm.BACKDROP_HOOK = backdrop
    rm.PARTICLE_HOOK = particles
    cam = Cam()
    gl = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    spirits = [rm.kiko_item(cam, p, gl, .55) for p in ((-1.3, .9, 3.6), (6.3, -1.1, 4.6), (5.6, 7.9, -1.3))]
    img = rm.render(State(**STATE), cam, hana=(HERO, "front"), kiko=COMPANION,
                    extra=lantern_strings(cam, LANTERN_PAIRS) + spirits)
    img.alpha_composite(gl)
    rm.story(img, STORY)
    rm.menu_button(img); home_indicator(img)
    return finish(img, "24_stil_original_schick.png")


# ---------------- 5) Eigener Vorschlag: Blaue Stunde – Laternenfest ----------------
def dusk(base):
    reset()
    lv = copy.deepcopy(base)
    rm.SKIES["dusk"] = [(0, (26, 36, 88)), (.3, (58, 70, 138)), (.58, (148, 108, 168)), (.8, (240, 156, 128)), (1, (252, 196, 152))]
    rm.LIGHT["dusk"] = (.9, .16)
    rm.CLOUD["dusk"] = ((255, 206, 182), (104, 96, 156), (224, 132, 134))
    rm.MAT.update({
        "grass": ((126, 178, 140), (150, 160, 206)), "stone": ((244, 230, 210), (150, 160, 206)),
        "stonedark": ((112, 120, 172), (112, 120, 172)), "rock": ((96, 100, 152), (96, 100, 152)),
        "rockdark": ((68, 68, 120), (68, 68, 120)), "teal": ((86, 170, 182), (64, 140, 162)),
        "tealdark": ((46, 108, 140), (46, 108, 140)), "tealtop": ((150, 216, 214), (64, 140, 162)),
        "wood": ((212, 150, 100), (186, 128, 86)), "water": ((92, 150, 204), (150, 160, 206)), "gate": ((232, 92, 72), (210, 76, 60)),
    })
    rm.DABS = .5
    rm.LANTERN_BOOST = 2.6

    def fn(d):
        if d["t"] == "tree": d["variant"] = 2
        return d
    remap_decor(lv, fn)
    lv["decor"] += [{"t": "lantern", "p": p, "s": .9, "r": 0} for p in ([-7, 3, -1], [6, 7, -1])]
    use_level(lv, "dusk")

    def sky_extra(img):
        d = ImageDraw.Draw(img)
        rm.glow(img, (CW * .35, CH * .62), CW * .7, (255, 170, 120), .55)
        rnd = random.Random(3)
        for _ in range(120):
            x, y = rnd.uniform(0, CW), rnd.uniform(0, CH * .35)
            r = rnd.uniform(.6, 1.8) * SS
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(220 * (1 - y / (CH * .4)))))
        # schmale Mondsichel
        c = (CW * .2, CH * .1)
        circle(d, c, CW * .04, (255, 246, 222))
        circle(d, (c[0] + CW * .016, c[1] - CW * .01), CW * .037, (34, 44, 98))

    def particles(d, big):
        # Himmelslaternen steigen vom Turm auf
        rnd = random.Random(8)
        for _ in range(34):
            x = rnd.uniform(CW * .05, CW * .95); y = rnd.uniform(CH * .05, CH * .6)
            s = rnd.uniform(.5, 1.4) * (1.2 - y / CH) * SS
            soft(d, (x, y), 46 * s, (255, 170, 90), .9)
            w, h = 11 * s, 15 * s
            d.polygon([(x - w, y - h), (x + w, y - h), (x + w * .75, y + h), (x - w * .75, y + h)], fill=(255, 196, 120))
            d.polygon([(x - w * .4, y - h * .6), (x + w * .4, y - h * .6), (x + w * .3, y + h * .8), (x - w * .3, y + h * .8)], fill=(255, 236, 190))
    rm.SUN_HOOK = sky_extra
    rm.PARTICLE_HOOK = particles
    cam = Cam()
    img = rm.render(State(**STATE), cam, hana=(HERO, "front"), kiko=COMPANION,
                    extra=lantern_strings(cam, LANTERN_PAIRS, light=(255, 170, 100), bulb=(255, 206, 130)), warm=.03,
                    firefly_area=((-.5, 2.5), (3, 4.5), (-3, -1)))
    f = ImageFont.truetype(FONT_DIR + "freefont/FreeSerifItalic.ttf", 19 * 3 * SS)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    text_c(sh, (59 + 54 + 60) * SS, STORY, f, (30, 30, 70), False)
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6 * SS)))
    story(img, STORY, f, (255, 240, 222), False)
    rm.menu_button(img); home_indicator(img)
    return finish(img, "25_stil_blaue_stunde.png")


def original(base):
    reset()
    use_level(copy.deepcopy(base), "night")
    cam = Cam()
    img = rm.render(State(**STATE), cam, hana=(HERO, "front"), kiko=COMPANION)
    rm.story(img, STORY)
    rm.menu_button(img); home_indicator(img)
    return finish(img, "20_stil_original.png")


if __name__ == "__main__":
    level_dir, rm.OUT = sys.argv[1], sys.argv[2]
    os.makedirs(rm.OUT, exist_ok=True)
    base = json.load(open(os.path.join(level_dir, "level3.json")))
    shots = [original(base), neko(level_dir), ghibli(base), mv(base), deluxe(base), dusk(base)]
    rm.sheet(shots, ["Heute", "Neko no Machi", "Mehr Ghibli", "Mehr Monument Valley", "Original, schicker", "Mein Vorschlag"],
             "00_stilvorschlaege_kapitel3.png")
    print("fertig")
