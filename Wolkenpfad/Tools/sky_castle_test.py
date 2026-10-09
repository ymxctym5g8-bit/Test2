# Prototype: a distant floating sky castle as the chapter backdrop – a homage to the floating
# castle of Studio Ghibli films (round terraced fortress, a giant tree on top, roots hanging
# into the sky, a glowing levitation crystal underneath, a ring of clouds).
# Usage: python3 Tools/sky_castle_test.py 4 out.png
import math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_chapters as rc
import render_mockups as rm
from render_mockups import CW, CH


def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def paint_castle(img, cx, cy, w, haze, sky_light, sun, crystal=(120, 210, 255), fade=0.42, seed=7, glow=True):
    """Floating castle centred at (cx, cy) with total width w, faded towards the haze colour."""
    lay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rnd = random.Random(seed)
    f = lambda c, extra=0.0: mix(c, haze, min(1, fade + extra)) + (255,)
    stone, stone_dark, wall_shadow = (214, 196, 168), (150, 128, 112), (122, 104, 98)
    green, green_dark = (96, 140, 84), (62, 98, 70)
    root_col = (110, 88, 76)

    # rock underside: an inverted, slightly irregular cone
    base_y = cy + w * 0.08
    tip = (cx + w * 0.02, cy + w * 0.62)
    pts = [(cx - w * 0.42, base_y)]
    for k in range(1, 9):
        t = k / 9
        pts.append((cx - w * 0.42 * (1 - t) + rnd.uniform(-1, 1) * w * 0.02, base_y + (tip[1] - base_y) * t ** 1.2))
    pts.append(tip)
    for k in range(8, 0, -1):
        t = k / 9
        pts.append((cx + w * 0.42 * (1 - t) + rnd.uniform(-1, 1) * w * 0.02, base_y + (tip[1] - base_y) * t ** 1.2))
    pts.append((cx + w * 0.42, base_y))
    d.polygon(pts, fill=f(stone_dark, 0.05))
    # light on the left flank
    d.polygon([pts[0]] + pts[1:9] + [tip, (cx - w * 0.05, base_y)], fill=f(stone, 0.12))

    # hanging roots
    for k in range(26):
        x0 = cx + rnd.uniform(-0.36, 0.36) * w
        t0 = abs(x0 - cx) / (w * 0.42)
        y0 = base_y + (tip[1] - base_y) * (1 - t0) ** 0.8 * rnd.uniform(0.4, 0.95)
        length = w * rnd.uniform(0.15, 0.55)
        prev = (x0, y0)
        for s in range(1, 12):
            y = y0 + length * s / 11
            x = x0 + math.sin(s * 0.7 + k) * w * 0.012 + (s / 11) ** 2 * rnd.uniform(-1, 1) * w * 0.03
            d.line([prev, (x, y)], fill=f(root_col, 0.1 + s * 0.02), width=max(1, int(w * 0.006 * (1 - s / 13))))
            prev = (x, y)

    # terraces: stacked elliptical rings, narrower towards the top
    tiers = [(0.88, 0.0, 0.13), (0.72, -0.12, 0.11), (0.56, -0.22, 0.10), (0.40, -0.31, 0.09)]
    for i, (tw, dy, th) in enumerate(tiers):
        half = w * tw / 2
        top = cy + dy * w
        ry = half * 0.22
        # wall (front half of a cylinder)
        d.rectangle((cx - half, top, cx + half, top + th * w), fill=f(stone, 0.02))
        d.ellipse((cx - half, top + th * w - ry, cx + half, top + th * w + ry), fill=f(stone, 0.02))
        # shading on the right
        d.pieslice((cx - half, top + th * w - ry, cx + half, top + th * w + ry), 0, 90, fill=f(wall_shadow, 0.05))
        d.rectangle((cx + half * 0.45, top, cx + half, top + th * w), fill=f(wall_shadow, 0.05))
        # arched windows and arcades
        n = 9 - i
        for k in range(n):
            a = math.pi * (k + 0.5) / n
            x = cx - math.cos(a) * half * 0.92
            if abs(x - cx) > half * 0.9: continue
            wy = top + th * w * 0.35 + math.sin(a) * ry * 0.6
            ww, wh = w * 0.011, th * w * 0.36
            d.rounded_rectangle((x - ww, wy, x + ww, wy + wh), radius=ww, fill=f(wall_shadow, 0.18))
        # green garden on top of the terrace
        d.ellipse((cx - half, top - ry, cx + half, top + ry), fill=f(green, 0.04))
        d.arc((cx - half, top - ry, cx + half, top + ry), 0, 180, fill=f(green_dark, 0.04), width=max(2, int(w * 0.008)))
        # ivy curtains spilling over the wall
        for k in range(7):
            x = cx + rnd.uniform(-0.85, 0.85) * half
            ln = th * w * rnd.uniform(0.3, 0.9)
            d.rectangle((x - w * 0.006, top + ry * 0.4, x + w * 0.006, top + ry * 0.4 + ln), fill=f(green_dark, 0.08))
    # little round towers on the lowest ring
    for sx in (-1, 1):
        for k, (dx, hgt) in enumerate([(0.40, 0.2), (0.30, 0.26)]):
            x = cx + sx * dx * w
            tw_ = w * 0.035
            d.rectangle((x - tw_, cy - hgt * w * 0.5, x + tw_, cy + w * 0.06), fill=f(stone, 0.06))
            d.polygon([(x - tw_ * 1.3, cy - hgt * w * 0.5), (x + tw_ * 1.3, cy - hgt * w * 0.5), (x, cy - hgt * w * 0.5 - tw_ * 2.4)],
                      fill=f((170, 110, 96), 0.1))

    # the great tree crowning the castle
    trunk_top = cy - 0.31 * w - w * 0.1
    d.polygon([(cx - w * 0.05, cy - 0.31 * w), (cx + w * 0.05, cy - 0.31 * w), (cx + w * 0.02, trunk_top), (cx - w * 0.02, trunk_top)],
              fill=f((112, 84, 66), 0.06))
    puffs = []
    for k in range(30):
        a = rnd.uniform(math.pi * 0.95, math.pi * 2.05)
        r = rnd.uniform(0.05, 0.32) * w
        puffs.append((cx + math.cos(a) * r * 1.45, trunk_top - w * 0.1 + math.sin(a) * r * 0.85, w * rnd.uniform(0.09, 0.16)))
    for x, y, r in puffs:
        d.ellipse((x - r, y - r, x + r, y + r), fill=f(green_dark, 0.04))
    for x, y, r in puffs:
        rr = r * 0.78
        d.ellipse((x - rr - r * 0.18, y - rr - r * 0.2, x + rr - r * 0.18, y + rr - r * 0.2), fill=f(green, 0.02))

    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(w * 0.004)))

    # the levitation crystal glowing under the castle
    if glow:
        rm.glow(img, tip, w * 0.22, crystal, 0.55)
        rm.glow(img, tip, w * 0.06, (230, 250, 255), 0.9)
        dd = ImageDraw.Draw(img)
        s = w * 0.022
        dd.polygon([(tip[0], tip[1] - s * 1.6), (tip[0] + s, tip[1]), (tip[0], tip[1] + s * 1.6), (tip[0] - s, tip[1])], fill=(225, 248, 255, 255))

    # a ring of clouds wrapped around the castle's waist (front half)
    cloud = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cloud)
    for k in range(18):
        a = math.pi * k / 17
        x = cx - math.cos(a) * w * 0.62
        y = cy + w * 0.2 + math.sin(a) * w * 0.12
        r = w * rnd.uniform(0.07, 0.11)
        cd.ellipse((x - r, y - r * 0.8, x + r, y + r * 0.8), fill=mix(sky_light, haze, 0.25) + (210,))
    img.alpha_composite(cloud.filter(ImageFilter.GaussianBlur(w * 0.012)))


def birds(img, x, y, w, n=5, col=(120, 100, 110), seed=3):
    d = ImageDraw.Draw(img); rnd = random.Random(seed)
    for k in range(n):
        bx, by = x + rnd.uniform(0, w), y + rnd.uniform(0, w * 0.3)
        s = w * rnd.uniform(0.02, 0.035)
        d.line([(bx - s, by), (bx - s * 0.3, by - s * 0.45), (bx, by)], fill=col + (180,), width=3)
        d.line([(bx, by), (bx + s * 0.3, by - s * 0.45), (bx + s, by)], fill=col + (180,), width=3)


def glider(img, x, y, s, col=(90, 70, 80)):
    """A tiny ornithopter-like glider with a lone pilot – far away."""
    d = ImageDraw.Draw(img)
    for sx in (-1, 1):
        d.polygon([(x, y), (x + sx * s * 2.2, y - s * 0.5), (x + sx * s * 2.0, y - s * 0.2), (x + sx * s * 0.3, y + s * 0.15)], fill=col + (200,))
    d.ellipse((x - s * 0.35, y - s * 0.2, x + s * 0.35, y + s * 0.3), fill=col + (220,))


def backdrop_ch4(img, cam):
    th = THEME
    haze, light = th["haze"], th["clouds"][0]
    paint_castle(img, CW * 0.71, CH * 0.315, CW * 0.33, haze, light, th["sun"], fade=0.38)
    birds(img, CW * 0.40, CH * 0.255, CW * 0.2)
    glider(img, CW * 0.50, CH * 0.34, CW * 0.012)


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "Mockups", f"sky_castle_test_ch{n:02d}.png")
    themes = rc.load_themes()
    import json
    THEME = themes[json.load(open(os.path.join(rc.LEVELS, f"level{n}.json")))["theme"]]
    rc.EXTRA_BACKDROP = backdrop_ch4
    rc.OUT = os.path.dirname(os.path.abspath(out))
    from PIL import ImageFont
    from render_mockups import FONT_DIR, SS
    tf = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Regular.ttf", 100 * SS)
    sf = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Italic.ttf", 56 * SS)
    lf = ImageFont.truetype(FONT_DIR + "liberation/LiberationSerif-Regular.ttf", 44 * SS)
    im = rc.chapter(n, themes, tf, sf, lf)
    im.save(out)
    print("wrote", out)
