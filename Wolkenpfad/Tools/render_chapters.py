# Rendert für jedes Kapitel ein Vorschaubild im Look seines Themes (Himmel, Wolken, Materialien,
# Teilchen) – direkt aus den Leveldaten und den Farbwerten in Scene/Themes.swift.
# Aufruf: python3 Tools/render_chapters.py [Kapitel …]   → Mockups/chapters/chNN.jpg + 00_alle_kapitel.jpg
import json, math, os, random, re, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_mockups as rm
from render_mockups import rgb, mix, mul, add, depth, circle, ball, glow, State, Cam, text_c, CW, CH, SS, FONT_DIR

ROOT = os.path.join(HERE, "..")
LEVELS = os.path.join(ROOT, "Wolkenpfad", "Level")
OUT = os.path.join(ROOT, "Mockups", "chapters")


# ---------------- Themes aus Swift lesen ----------------
def hx(s): v = int(s, 16); return ((v >> 16) & 255, (v >> 8) & 255, v & 255)


def palette_from(text):
    return {m: (hx(a), hx(b)) for m, a, b in re.findall(r'"(\w+)": MaterialColors\((0x\w+), (0x\w+)\)', text)}


def load_themes():
    src = open(os.path.join(ROOT, "Wolkenpfad", "Scene", "Themes.swift")).read()
    base_txt = src[src.find("static let basePalette"):]
    base = palette_from(base_txt[:base_txt.find("]\n")])
    themes = {}
    for chunk in src.split('return make("')[1:]:
        chunk = re.split(r'\n\s*(?:case "|default:)', chunk)[0]
        name = chunk[:chunk.find('"')]
        g = lambda pat, d=None: (re.search(pat, chunk) or [None, d])[1]
        clouds = re.search(r'clouds: \((0x\w+), (0x\w+), (0x\w+)\)', chunk)
        pal = dict(base)
        if "palette:" in chunk: pal.update(palette_from(chunk[chunk.find("palette:"):]))
        themes[name] = dict(
            sky=[hx(s.strip()) for s in g(r'sky: \[([^\]]*)\]').split(",")],
            sun=hx(g(r'sun: (0x\w+)')), ambient=hx(g(r'ambient: (0x\w+)')),
            clouds=tuple(hx(c) for c in clouds.groups()) if clouds else ((255, 252, 240), (169, 188, 216), (238, 196, 170)),
            particle=g(r'particle: \.(\w+)'), night="night: true" in chunk, stars="stars: true" in chunk,
            lantern=float(g(r'lantern: ([\d.]+)', 1)), haze=hx(g(r'haze: (0x\w+)')) if "haze:" in chunk else None,
            lightning="lightning: true" in chunk, brush=float(g(r'brush: ([\d.]+)', 1)), palette=pal)
    return themes


# ---------------- Requisiten der neuen Kapitel (vereinfacht) ----------------
def P(cam, w): return cam.p(w)


def simple(fn, dz=0.0):
    def hook(cam, p, top, s, dd, i, gl, T):
        return (depth(top) + dz, lambda d: fn(d, cam, top, s, dd, i, gl, T))
    return hook


def d_bellflower(d, cam, top, s, dd, i, gl, T):
    u = cam.ppu * s
    a = P(cam, top); b = (a[0] + u * .15, a[1] - u * 1.1)
    d.line([a, b], fill=(84, 130, 98), width=int(u * .06))
    glow(gl, (b[0], b[1] + u * .15), u * .5, (150, 180, 255), .7)
    d.pieslice((b[0] - u * .32, b[1] - u * .1, b[0] + u * .32, b[1] + u * .55), 180, 360, fill=(132, 156, 250))
    d.ellipse((b[0] - u * .32, b[1] + u * .12, b[0] + u * .32, b[1] + u * .32), fill=(108, 130, 228))


def d_cloudpuff(d, cam, top, s, dd, i, gl, T):
    c = P(cam, add(top, (0, .2, 0))); u = cam.ppu * s
    for dx, dy, r in ((-.3, .05, .28), (.3, .05, .26), (0, -.1, .36)):
        ball(d, (c[0] + dx * u, c[1] + dy * u), r * u, (252, 250, 246))


def d_butterflies(d, cam, top, s, dd, i, gl, T):
    rnd = random.Random(i); c = P(cam, add(top, (0, .6, 0))); u = cam.ppu
    for _ in range(4):
        x, y = c[0] + rnd.uniform(-.6, .6) * u, c[1] + rnd.uniform(-.5, .3) * u
        col = rnd.choice([(255, 210, 120), (190, 220, 255), (255, 180, 210)])
        glow(gl, (x, y), u * .18, col, .6)
        for sx in (-1, 1): d.ellipse((x + sx * u * .06 - u * .05, y - u * .04, x + sx * u * .06 + u * .05, y + u * .04), fill=col)


def d_windmill(d, cam, top, s, dd, i, gl, T):
    u = cam.ppu * s; a = P(cam, top)
    d.polygon([(a[0] - u * .35, a[1]), (a[0] + u * .35, a[1]), (a[0] + u * .2, a[1] - u * 1.6), (a[0] - u * .2, a[1] - u * 1.6)], fill=(226, 212, 186))
    d.polygon([(a[0] - u * .3, a[1] - u * 1.6), (a[0] + u * .3, a[1] - u * 1.6), (a[0], a[1] - u * 2.0)], fill=(176, 92, 70))
    h = (a[0], a[1] - u * 1.4)
    for k in range(4):
        ang = k * math.pi / 2 + .4 + i
        e = (h[0] + math.cos(ang) * u * 1.1, h[1] + math.sin(ang) * u * 1.1)
        d.line([h, e], fill=(120, 90, 66), width=int(u * .05))
        n = (-math.sin(ang) * u * .14, math.cos(ang) * u * .14)
        m = ((h[0] + e[0]) / 2, (h[1] + e[1]) / 2)
        d.polygon([m, e, (e[0] + n[0], e[1] + n[1]), (m[0] + n[0], m[1] + n[1])], fill=(246, 238, 220))


def d_house(d, cam, top, s, dd, i, gl, T):
    u = cam.ppu * s * .8; a = P(cam, top)
    d.rectangle((a[0] - u * .4, a[1] - u * .6, a[0] + u * .4, a[1]), fill=(240, 228, 206))
    d.polygon([(a[0] - u * .55, a[1] - u * .55), (a[0] + u * .55, a[1] - u * .55), (a[0], a[1] - u * 1.05)], fill=(188, 92, 72))
    d.rectangle((a[0] - u * .12, a[1] - u * .38, a[0] + u * .12, a[1] - u * .12), fill=(255, 214, 140))


def d_pillar(d, cam, top, s, dd, i, gl, T):
    u = cam.ppu * s; a = P(cam, top)
    d.rectangle((a[0] - u * .22, a[1] - u * 1.6, a[0] + u * .22, a[1]), fill=(214, 204, 190))
    d.rectangle((a[0] - u * .22, a[1] - u * 1.6, a[0] - u * .05, a[1]), fill=(236, 228, 214))
    d.rectangle((a[0] - u * .3, a[1] - u * 1.7, a[0] + u * .3, a[1] - u * 1.58), fill=(196, 186, 172))


def d_glowball(col, r=.22, lift=.5):
    def f(d, cam, top, s, dd, i, gl, T):
        c = P(cam, add(top, (0, lift, 0))); u = cam.ppu * s
        glow(gl, c, u * r * 3.2, col, .8)
        circle(d, c, u * r, mix(col, (255, 255, 255), .4))
    return f


def d_gear(d, cam, top, s, dd, i, gl, T):
    c = P(cam, add(top, (0, .4, 0))); u = cam.ppu * s
    for k in range(10):
        a = k / 10 * math.tau
        circle(d, (c[0] + math.cos(a) * u * .33, c[1] + math.sin(a) * u * .33), u * .08, (196, 150, 80))
    circle(d, c, u * .32, (217, 168, 90)); circle(d, c, u * .1, (150, 110, 60))


def d_mirror(d, cam, top, s, dd, i, gl, T):
    c = P(cam, add(top, (0, .45, 0))); u = cam.ppu * s
    d.ellipse((c[0] - u * .3, c[1] - u * .42, c[0] + u * .3, c[1] + u * .42), fill=(196, 150, 80))
    d.ellipse((c[0] - u * .24, c[1] - u * .36, c[0] + u * .24, c[1] + u * .36), fill=(232, 244, 255))
    glow(gl, c, u * .7, (255, 236, 190), .5)


def d_lightshaft(d, cam, top, s, dd, i, gl, T):
    a = P(cam, top); u = cam.ppu * s
    lay = Image.new("RGBA", (int(u * 2), int(u * 4)), (0, 0, 0, 0))
    ImageDraw.Draw(lay).polygon([(u * .7, 0), (u * 1.1, 0), (u * 1.6, u * 4), (u * .4, u * 4)], fill=(255, 240, 200, 60))
    gl.alpha_composite(lay.filter(ImageFilter.GaussianBlur(u * .1)), (int(a[0] - u), int(a[1] - u * 4)))


def d_giantface(d, cam, top, s, dd, i, gl, T):
    c = P(cam, add(top, (0, .2, 0))); u = cam.ppu * s
    ball(d, c, u * .9, (118, 152, 104))
    for sx in (-1, 1): d.arc((c[0] + sx * u * .35 - u * .15, c[1] - u * .2, c[0] + sx * u * .35 + u * .15, c[1]), 0, 180, fill=(52, 70, 50), width=int(u * .05))


def d_windharp(d, cam, top, s, dd, i, gl, T):
    a = P(cam, top); u = cam.ppu * s
    d.arc((a[0] - u * .8, a[1] - u * 2.2, a[0] + u * .8, a[1] - u * .2), 180, 360, fill=(222, 178, 100), width=int(u * .12))
    d.line([(a[0] - u * .8, a[1] - u * 1.2), (a[0] + u * .8, a[1] - u * 1.2)], fill=(222, 178, 100), width=int(u * .1))
    for k in range(6):
        x = a[0] - u * .6 + k * u * .24
        d.line([(x, a[1] - u * 1.2), (x, a[1] - u * 1.9 + abs(k - 2.5) * u * .1)], fill=(255, 244, 210), width=max(1, int(u * .02)))
    glow(gl, (a[0], a[1] - u * 1.4), u * 1.4, (255, 220, 240), .45)


def d_box(col, h=.35, w=.3):
    def f(d, cam, top, s, dd, i, gl, T):
        a = P(cam, top); u = cam.ppu * s
        d.rectangle((a[0] - u * w, a[1] - u * h, a[0] + u * w, a[1]), fill=col)
        d.rectangle((a[0] - u * w, a[1] - u * h, a[0] + u * w, a[1] - u * h * .75), fill=mix(col, (255, 255, 255), .25))
    return f


def d_letters(d, cam, top, s, dd, i, gl, T):
    rnd = random.Random(i); c = P(cam, add(top, (0, .7, 0))); u = cam.ppu
    for _ in range(4):
        x, y = c[0] + rnd.uniform(-.5, .5) * u, c[1] + rnd.uniform(-.5, .3) * u
        d.rectangle((x - u * .09, y - u * .06, x + u * .09, y + u * .06), fill=(250, 244, 226))


def d_figure(robe, hair):
    def f(d, cam, top, s, dd, i, gl, T):
        a = P(cam, top); u = cam.ppu * s
        d.polygon([(a[0] - u * .2, a[1]), (a[0] + u * .2, a[1]), (a[0] + u * .1, a[1] - u * .5), (a[0] - u * .1, a[1] - u * .5)], fill=robe)
        circle(d, (a[0], a[1] - u * .62), u * .14, (246, 222, 200)); circle(d, (a[0], a[1] - u * .7), u * .12, hair)
    return f


def d_guardian(d, cam, top, s, dd, i, gl, T):
    a = P(cam, top); u = cam.ppu * s
    d.rectangle((a[0] - u * .35, a[1] - u * 1.1, a[0] + u * .35, a[1]), fill=(150, 146, 134))
    circle(d, (a[0], a[1] - u * .75), u * .1, (150, 240, 220)); glow(gl, (a[0], a[1] - u * .75), u * .35, (150, 240, 220), .7)


def d_vent(d, cam, top, s, dd, i, gl, T):
    a = P(cam, top); u = cam.ppu * s
    for k in range(3):
        d.arc((a[0] - u * .25, a[1] - u * (.5 + k * .35), a[0] + u * .25, a[1] - u * (.2 + k * .35)), 200, 340, fill=(255, 255, 255, 150), width=max(1, int(u * .03)))


HOOKS = {
    "tallgrass": lambda cam, p, top, s, dd, i, gl, T: rm.grass_item(cam, top, s * 1.5, i),
    "oak": lambda cam, p, top, s, dd, i, gl, T: rm.tree_item(cam, top, s * 1.5, 0, i, gl),
    "kodama": lambda cam, p, top, s, dd, i, gl, T: rm.kiko_item(cam, add(top, (0, .25, 0)), gl, .55 * s),
    "bellflower": simple(d_bellflower), "cloudpuff": simple(d_cloudpuff), "butterflies": simple(d_butterflies, .5),
    "windmill": simple(d_windmill), "house": simple(d_house), "pillar": simple(d_pillar),
    "projection": simple(d_glowball((150, 200, 255), .25, .7)), "gear": simple(d_gear), "mirror": simple(d_mirror),
    "lightshaft": simple(d_lightshaft), "giantface": simple(d_giantface), "windharp": simple(d_windharp),
    "chest": simple(d_box((150, 104, 66))), "notebook": simple(d_box((170, 120, 90), .08, .2)),
    "beam": simple(d_box((128, 92, 62), .12, .5)), "scaffold": simple(d_box((168, 128, 88), .9, .08)),
    "letters": simple(d_letters, .4), "oldwoman": simple(d_figure((120, 110, 150), (230, 230, 236))),
    "guardian": simple(d_guardian), "vent": simple(d_vent),
}
SPAN_COL = {"rope": (150, 112, 74), "pennant": (220, 110, 90), "harpstring": (255, 240, 200)}


# ---------------- Ein Kapitel rendern ----------------
def particles_for(kind, rnd_seed):
    def hook(d, big):
        rnd = random.Random(rnd_seed)
        if kind == "petals": rm.petals(d, 22, 5)
        elif kind == "leaves": rm.leaves(d, 22, 5)
        elif kind == "rain":
            for _ in range(220):
                x, y = rnd.uniform(0, CW), rnd.uniform(0, CH)
                d.line([(x, y), (x - 8 * SS, y + 40 * SS)], fill=(210, 220, 240, 90), width=SS)
        elif kind == "letters":
            for _ in range(14):
                x, y = rnd.uniform(0, CW), rnd.uniform(CH * .1, CH * .8)
                d.rectangle((x, y, x + 26 * SS, y + 18 * SS), fill=(250, 244, 226, 220))
        else:  # Staub, Sporen, Samen, Lichtpunkte, Libellen, Schmetterlinge
            col = {"dust": (255, 226, 170), "spores": (170, 255, 210), "goldmotes": (255, 220, 140), "seeds": (255, 255, 250),
                   "motes": (255, 250, 230), "butterflies": (255, 200, 230), "dragonflies": (200, 240, 255)}.get(kind, (255, 255, 240))
            for _ in range(60):
                x, y = rnd.uniform(0, CW), rnd.uniform(CH * .1, CH * .9)
                r = rnd.uniform(2, 5) * SS
                d.ellipse((x - r, y - r, x + r, y + r), fill=col + (int(rnd.uniform(90, 200)),))
    return hook


def chapter(n, themes, title_font, story_font, label_font):
    lv = json.load(open(os.path.join(LEVELS, f"level{n}.json")))
    th = themes.get(lv.get("theme"), themes["meadow"])
    name = "t%d" % n
    rm.LEVEL, rm.GROUPS, rm.THEME = lv, {g["id"]: g for g in lv["groups"]}, name
    stops = th["sky"]
    rm.SKIES[name] = [(k / (len(stops) - 1), c) for k, c in enumerate(stops)]
    rm.CLOUD[name] = th["clouds"]
    rm.LIGHT[name] = (0.74, 0.0) if th["night"] else (1.0, 0.05)
    rm.MAT.clear(); rm.MAT.update(th["palette"]); rm.MAT["altar"] = ((235, 224, 214), (224, 214, 204))
    rm.MAT.setdefault("moss", rm.MAT["grass"])
    rm.DABS = 1.2 * th["brush"]
    rm.LANTERN_BOOST = th["lantern"] * (1.6 if th["night"] else 1)
    amb = th["ambient"]

    def shade(base, nrm):
        c = rm.shade(base, nrm)
        return mix(c, mul(amb, .55), .3) if th["night"] else c
    rm.SHADE_HOOK = shade

    def sun(img):
        if th["night"] or th["stars"]:
            d = ImageDraw.Draw(img); rnd = random.Random(n)
            for _ in range(200):
                x, y = rnd.uniform(0, CW), rnd.uniform(0, CH * .55)
                r = rnd.uniform(1, 3) * SS
                d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(200 * (1 - y / (CH * .6)))))
            if not th["lightning"]:
                glow(img, (CW * .72, CH * .14), CW * .28, th["sun"], .5)
                circle(d, (CW * .72, CH * .14), CW * .04, (252, 248, 230))
        else:
            glow(img, (CW * .72, CH * .16), CW * .45, th["sun"], .85)
        if th["lightning"]:
            d = ImageDraw.Draw(img)
            x, y = CW * .2, 0
            pts = [(x, y)]
            rnd = random.Random(3)
            while y < CH * .35:
                x += rnd.uniform(-40, 40) * SS; y += rnd.uniform(30, 60) * SS; pts.append((x, y))
            glow(img, (CW * .2, CH * .15), CW * .3, (220, 230, 255), .4)
            d.line(pts, fill=(250, 250, 255), width=3 * SS)
    rm.SUN_HOOK = sun
    rm.BACKDROP_HOOK = None
    rm.FG_CLOUDS = False
    rm.PARTICLE_HOOK = particles_for(th["particle"], n)
    rm.DECOR_HOOKS.clear(); rm.DECOR_HOOKS.update(HOOKS)

    cam = Cam()
    spans = []
    for k, dd in enumerate(lv["decor"]):
        if dd["t"] in SPAN_COL and dd.get("to"):
            hgt = 1.2 if dd["t"] == "harpstring" else .9
            a = add(tuple(dd["p"]), (0, .5 + hgt, 0)); b = add(tuple(dd["to"]), (0, .5 + hgt, 0))
            col = SPAN_COL[dd["t"]]
            spans.append((max(depth(a), depth(b)) + .3, lambda d, a=a, b=b, col=col: d.line([cam.p(a), cam.p(b)], fill=col, width=int(cam.ppu * .03))))
    start = tuple(lv["start"])
    feet = add(start, (0, .5, 0))
    img = rm.render(State(), cam, hana=(feet, "front"), kiko=add(feet, (.6, .9, .6)), extra=spans, warm=.03)
    if th["haze"]:
        haze = Image.new("RGBA", img.size, th["haze"] + (255,))
        mask = Image.linear_gradient("L").resize(img.size).point(lambda v: int(v * .28))
        img = Image.composite(haze, img, mask)
    # Wolkenmeer unten weich auslaufen lassen
    sea = Image.new("RGBA", img.size, th["clouds"][0] + (255,))
    ramp = Image.linear_gradient("L").resize(img.size).point(lambda v: max(0, min(255, int((v - 205) * 6))))
    img = Image.composite(sea, img, ramp)
    night = th["night"]
    ink = (255, 247, 235) if night else rm.INK
    act = "Prologue" if n <= 3 else "Act " + ["I", "II", "III"][(n - 4) // 5]
    text_c(img, 210 * SS, act.upper(), label_font, ink, not night)
    title = lv["name"].split("·")[-1].strip()
    tf, size = title_font, 100
    while ImageDraw.Draw(img).textbbox((0, 0), title, font=tf)[2] > CW * .88 and size > 50:
        size -= 6; tf = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Regular.ttf", size * SS)
    text_c(img, 300 * SS, title, tf, ink, not night)
    first = next((t["text"] for t in lv.get("texts", []) if t["at"] == lv["start"]), None)
    if first:
        words, lines, cur = first.split(), [], ""
        for w in words:
            if len(cur) + len(w) > 30: lines.append(cur); cur = w
            else: cur = (cur + " " + w).strip()
        lines.append(cur)
        text_c(img, CH * .8, "\n".join(lines), story_font, ink, not night, spacing=26)
    out = img.resize((rm.W // 2, rm.H // 2), Image.LANCZOS).convert("RGB")
    path = os.path.join(OUT, f"ch{n:02d}.jpg")
    out.save(path, quality=88)
    print("wrote", path)
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    themes = load_themes()
    title_font = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Regular.ttf", 100 * SS)
    story_font = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Italic.ttf", 56 * SS)
    label_font = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Regular.ttf", 44 * SS)
    nums = [int(a) for a in sys.argv[1:]] or [n for n in range(1, 19) if os.path.exists(os.path.join(LEVELS, f"level{n}.json"))]
    shots = [(n, chapter(n, themes, title_font, story_font, label_font)) for n in nums]
    if len(shots) > 1:
        cols = 6
        tw, th_ = 300, int(300 * rm.H / rm.W)
        rows = (len(shots) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw + (cols + 1) * 16, rows * th_ + (rows + 1) * 16), (250, 242, 230))
        for k, (n, im) in enumerate(shots):
            sheet.paste(im.resize((tw, th_), Image.LANCZOS), (16 + (k % cols) * (tw + 16), 16 + (k // cols) * (th_ + 16)))
        sheet.save(os.path.join(OUT, "00_alle_kapitel.jpg"), quality=88)
        print("wrote overview")


if __name__ == "__main__":
    main()
