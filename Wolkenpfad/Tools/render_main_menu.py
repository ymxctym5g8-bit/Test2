# Mockup of the main menu (UI/MainMenu.swift) in the colours of a chapter theme.
# Usage: python3 Tools/render_main_menu.py [theme ...]   → Mockups/main_menu_<theme>.png
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from render_chapters import load_themes
from render_mockups import FONT_DIR

W, H, S = 1179, 2556, 3          # iPhone 15 Pro pixels, points * 3
OUT = os.path.join(HERE, "..", "Mockups")
INK, PAPER, ACCENT, GOLD = (82, 61, 77), (255, 247, 235), (219, 92, 77), (219, 163, 77)


def font(name, pt): return ImageFont.truetype(FONT_DIR + "liberation/" + name, int(pt * S))


def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def mul(c, f): return tuple(max(0, min(255, int(v * f))) for v in c)


def sky(th):
    img = Image.new("RGBA", (W, H)); d = ImageDraw.Draw(img); st = th["sky"]
    locs = [0, .3, .6, .82, 1]
    for y in range(H):
        t = y / H
        for i in range(4):
            if locs[i] <= t <= locs[i + 1]:
                d.line([(0, y), (W, y)], fill=mix(st[i], st[i + 1], (t - locs[i]) / (locs[i + 1] - locs[i])) + (255,)); break
    if th["night"] or th["stars"]:
        rnd = random.Random(3)
        for _ in range(220):
            x, y, r = rnd.uniform(0, W), rnd.uniform(0, H * .55), rnd.uniform(1, 3)
            d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(200 * (1 - y / (H * .6)))))
    return img


def glow(img, c, r, col, a):
    g = Image.new("RGBA", (int(2 * r), int(2 * r)), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for i in range(30, 0, -1):
        t = i / 30; gd.ellipse((r - r * t, r - r * t, r + r * t, r + r * t), fill=col + (int(255 * a * (1 - t) ** 1.6),))
    img.alpha_composite(g, (int(c[0] - r), int(c[1] - r)))


def clouds(img, th, t=40.0):
    light, shadow, warm = th["clouds"]
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for k, (y, w, speed, off, wm) in enumerate([(.13, .55, 6, 0, False), (.27, .42, 9, 260, True), (.40, .5, 5, 520, False),
                                                  (.86, .9, 4, 120, True), (.95, 1.1, 3, 640, False)]):
        w *= W; span = W + w * 1.2
        x = (off * S + t * speed * S) % span - w * .6; y *= H
        for layer, col, dy in ((0, warm if wm else shadow, .16), (1, light, -.06)):
            rnd = random.Random(k * 31 + 7)
            for i in range(7):
                f = i / 6; mid = 1 - abs(f - .5) * 2
                r = w * (.09 + .07 * mid + .03 * rnd.random()); rr = r if layer == 0 else r * .88
                cx = x + w * (.1 + .8 * f); cy = y - r * .5 - mid * w * .05 + r * dy
                d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=col + (245,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(3)))


def island(img, th, t=0.0):
    d = ImageDraw.Draw(img)
    s = min(W * .07, 30 * S); cx, cy = W * .5, H * .5 + math.sin(t * .55) * 7 * S
    P = lambda x, y, z: (cx + (x - y) * s * .866, cy + (x + y) * s * .5 - z * s)
    pal = th["palette"]; grass, rock, dark, stone = pal["grass"], pal["rock"], pal["rockdark"], pal["stone"]
    cubes = [(i, j, 0, grass) for i in range(-2, 2) for j in range(-2, 2) if not (i in (-2, 1) and j in (-2, 1))]
    cubes += [(-2, -2, 1, stone)]
    cubes += [(i, j, -1, rock) for i, j in [(-1, -1), (0, -1), (-1, 0), (0, 0), (1, 0), (0, 1), (-2, -1)]]
    cubes += [(i, j, -2, rock) for i, j in [(-1, -1), (0, 0), (0, -1)]] + [(0, 0, -3, dark), (0, 0, -4, dark)]
    cubes.sort(key=lambda c: (c[2], c[0] + c[1]))
    top = P(1.5, -.6, .2)
    for k in range(60):     # waterfall
        a = int(220 * (1 - k / 60)); y0 = top[1] + k * s * 4.2 / 60
        d.rectangle((top[0] - s * .12, y0, top[0] + s * .12, y0 + s * 4.2 / 60 + 1), fill=(255, 255, 255, a))
    for i, j, k, (tc, sc) in cubes:
        d.polygon([P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i + 1, j + 1, k), P(i + 1, j, k)], fill=mul(sc, .86))
        d.polygon([P(i, j + 1, k + 1), P(i + 1, j + 1, k + 1), P(i + 1, j + 1, k), P(i, j + 1, k)], fill=mul(sc, .7))
        d.polygon([P(i, j, k + 1), P(i + 1, j, k + 1), P(i + 1, j + 1, k + 1), P(i, j + 1, k + 1)], fill=tc)
    b = P(.5, .5, 1)
    d.rectangle((b[0] - s * .07, b[1] - s * .9, b[0] + s * .07, b[1]), fill=(115, 82, 61))
    leaf = mul(grass[0], 1.08)
    for dx, dy, r in [(-.32, -1.0, .42), (.3, -1.05, .4), (0, -1.38, .5), (.05, -1.0, .36)]:
        c = (b[0] + dx * s, b[1] + dy * s); d.ellipse((c[0] - r * s, c[1] - r * s, c[0] + r * s, c[1] + r * s), fill=leaf)
    g = P(-1.5, -1.5, 2)
    d.rectangle((g[0] - s * .36, g[1] - s * .62, g[0] + s * .36, g[1] - s * .52), fill=ACCENT)
    for dx in (-.25, .21): d.rectangle((g[0] + dx * s, g[1] - s * .55, g[0] + dx * s + s * .06, g[1]), fill=ACCENT)
    k = (cx + s * 2.4, cy - s * 2.2)
    glow(img, k, s * .8, (255, 255, 255), .6)
    d = ImageDraw.Draw(img)
    d.ellipse((k[0] - s * .17, k[1] - s * .15, k[0] + s * .17, k[1] + s * .15), fill=(255, 255, 255))
    for dx in (-.06, .06): d.ellipse((k[0] + dx * s - s * .025, k[1] - s * .04, k[0] + dx * s + s * .025, k[1] + s * .01), fill=(38, 31, 41))


def text_c(img, y, s, f, col, shadow):
    d = ImageDraw.Draw(img); bb = d.textbbox((0, 0), s, font=f); x = (W - bb[2] + bb[0]) / 2
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((x, y), s, font=f, fill=shadow)
        sh = sh.filter(ImageFilter.GaussianBlur(14)); img.alpha_composite(sh); img.alpha_composite(sh)
    ImageDraw.Draw(img).text((x, y), s, font=f, fill=col)


def capsule(img, cx, cy, w, h, fill=None, outline=None, width=3):
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), radius=h / 2, fill=fill, outline=outline, width=width)
    img.alpha_composite(lay)


def menu(theme_name, chapter=("Chapter VII", "The Mill of Forgotten Letters"), done=6):
    th = load_themes()[theme_name]
    night = th["night"]; ink = PAPER if night else INK
    img = sky(th)
    glow(img, (W * .78, H * .16), W * .7, th["sun"], .35 if night else .7)
    clouds(img, th)
    island(img, th)
    shadow = (0, 0, 0, 120) if night else (255, 255, 255, 230)
    top = 59 * S + 36 * S
    text_c(img, top, "Echoes", font("LiberationSerif-Regular.ttf", 58), ink, shadow)
    text_c(img, top + 66 * S, "of the Sky", font("LiberationSerif-Italic.ttf", 30), ink, shadow)
    ImageDraw.Draw(img).rectangle((W / 2 - 26 * S, top + 114 * S, W / 2 + 26 * S, top + 115.5 * S), fill=ACCENT)
    text_c(img, top + 124 * S, "A journey above the clouds", font("LiberationSerif-Italic.ttf", 14), mix(ink, th["sky"][2], .25), None)
    y = H - 34 * S - 30 * S - 18 * S          # bottom stack
    text_c(img, y - 8 * S, f"{done} of 18 chapters", font("LiberationSerif-Regular.ttf", 13), mix(ink, th["sky"][3], .3), None)
    y -= 14 * S + 23 * S
    capsule(img, W / 2, y, 292 * S, 46 * S, fill=((0, 0, 0, 90) if night else PAPER + (90,)), outline=GOLD + (220,))
    text_c(img, y - 10 * S, "✦ Unlock the Full Journey · $2.00", font("LiberationSerif-Bold.ttf", 15), GOLD if night else (158, 107, 41), None)
    y -= 14 * S + 46 * S
    for dx, label in ((-76, "Chapters"), (76, "Settings")):
        capsule(img, W / 2 + dx * S, y, 140 * S, 46 * S, fill=((0, 0, 0, 77) if night else PAPER + (153,)), outline=ink + (64,))
        f = font("LiberationSerif-Regular.ttf", 15); d = ImageDraw.Draw(img); bb = d.textbbox((0, 0), label, font=f)
        d.text((W / 2 + dx * S - (bb[2] - bb[0]) / 2, y - 10 * S), label, font=f, fill=ink)
    y -= 14 * S + 55 * S
    capsule(img, W / 2, y, 292 * S, 64 * S, fill=ACCENT + (235,))
    text_c(img, y - 22 * S, "Continue", font("LiberationSerif-Bold.ttf", 19), PAPER, None)
    text_c(img, y + 3 * S, f"{chapter[0]} · {chapter[1]}", font("LiberationSerif-Italic.ttf", 13), PAPER, None)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((W / 2 - 70 * S, H - 13 * S, W / 2 + 70 * S, H - 8 * S), radius=3 * S, fill=ink + (200,))
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"main_menu_{theme_name}.png")
    img.convert("RGB").save(path); print("wrote", path)


if __name__ == "__main__":
    picks = {"meadow": (("Chapter I", "The Seed of the Forest"), 0), "mill": (("Chapter VII", "The Mill of Forgotten Letters"), 6),
             "bellflower": (("Chapter X", "The Town of Bellflowers"), 9)}
    for name in sys.argv[1:] or picks:
        ch, done = picks.get(name, (("Chapter I", "The Seed of the Forest"), 0))
        menu(name, ch, done)
