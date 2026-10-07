#!/usr/bin/env python3
"""Erzeugt die Neko-no-Machi-Kapitel (level4–6) aus den geprüften Rätselgeometrien
von level1–3: gleiche Wege, Mechanismen und Illusionen – neue Materialien,
Kulisse, Texte, Sushi und ein goldenes Glöckchen als Ziel.

Aufruf: python3 Tools/generate_neko_levels.py
"""
import copy
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
LEVEL_DIR = os.path.join(HERE, "..", "Wolkenpfad", "Level")

MECH = {"teal": "mech", "tealdark": "mechdark", "tealtop": "mechtop"}

CHAPTERS = [
    {
        "source": 1, "target": 4, "theme": "town", "backdrop": "town",
        "name": "Kapitel I · Die Kleinstadt",
        # (Material, begehbar) → neues Material; None = egal
        "materials": lambda m, walk, g: {
            "grass": "pavement" if walk else "garden", "stone": "roof", "stonedark": "foundation",
            "rock": "foundation", "rockdark": "foundationdark", "wood": "woodplank", **MECH,
        }.get(m, m),
        "decor": {
            (-1, 0, 5): {"t": "tree", "variant": 2, "s": 1.2},
            (3, 0, 2): {"t": "house", "variant": 0, "s": 0.95, "r": 0},
            (-1, 0, 3): {"t": "planter"},
            (2, 0, 5): {"t": "postbox"},
            (0, 0, 5): {"t": "bench"},
            (1, 0, 2): {"t": "chochin"},
            (3, 0, 3): {"t": "vending", "r": 1.5708},
            (1, 1, 1): {"t": "pole", "to": [-5, 1, 0], "variant": 3},
            (-5, 1, 0): {"t": "pole", "s": 1.0},
            (2, 1, 0): {"t": "chochin"},
            (0, 1, 0): {"t": "laundry"},
            (-3, 4, -2): {"t": "chochin"},
            (-2, 4, -2): {"t": "laundry"},
            (5, 6, 1): {"t": "tree", "variant": 2},
            (-1, 0, 4): {"t": "flowers"},
        },
        "sushi": [[1, 0, 4], [1, 1, 0], [-4, 1, 0], [-1, 4, -2], [5, 6, 0], [2, 0, 3]],
        "texts": {
            (0, 0, 4): "Mochi blinzelt in die Sonne. Irgendwo oben in der Stadt klingt ein Glöckchen.",
            (0, 1, 0): "Nicht jede Gasse liegt offen. Manche wollen bewegt werden.",
            (-4, 4, -2): "Katzen wissen: Wer die Stadt anders ansieht, findet neue Wege.",
            (4, 6, 0): "Der kleine Schrein über den Dächern. Das Glöckchen wartet.",
        },
        "ending": "Das Glöckchen klingt über den Ziegeldächern – und alle Katzen der Stadt kommen heraus.",
        "spirits": 5,
    },
    {
        "source": 2, "target": 5, "theme": "satoyama", "backdrop": "satoyama",
        "name": "Kapitel II · Landschaft",
        "materials": lambda m, walk, g: {
            "grass": "satograss" if walk else "paddy", "stone": "earth", "stonedark": "earthdark",
            "rock": "earthdark", "rockdark": "foundationdark", "wood": "woodplank", **MECH,
        }.get(m, m),
        "decor": {
            (-1, 0, 5): {"t": "tree", "variant": 6, "s": 1.15},
            (0, 0, 2): {"t": "jizo"},
            (1, 0, 3): {"t": "haystack"},
            (7, 0, 3): {"t": "minka", "s": 0.9, "r": 0},
            (5, 1, 1): {"t": "jizo"},
            (6, 1, 0): {"t": "kakashi"},
            (0, 1, 0): {"t": "tree", "variant": 6, "s": 0.85},
            (1, 1, -1): {"t": "haystack"},
            (0, 5, 2): {"t": "bamboo", "s": 1.0},
            (-3, 6, 3): {"t": "tree", "variant": 6, "s": 1.0},
        },
        "sushi": [[2, 0, 3], [7, 0, 1], [5, 1, 0], [3, 1, -2], [1, 3, -4], [-1, 5, 1], [-4, 6, 1]],
        "texts": {
            (0, 0, 4): "Hinter der Stadt beginnen die Reisfelder. Der Wind riecht nach Wasser.",
            (7, 0, 2): "Was treibt, kann tragen – sogar eine Katze.",
            (1, 1, 0): "Ein leises Klacken. Tief unten bewegt sich etwas.",
            (0, 3, -4): "Manchmal muss man ein Stück zurückgehen, um weiterzukommen.",
            (-3, 6, 1): "Am Bergschrein schläft das zweite Glöckchen.",
        },
        "ending": "Die Reisfelder glänzen. Am Horizont erhebt sich ein weißer Gipfel.",
        "spirits": 6,
    },
    {
        "source": 3, "target": 6, "theme": "fuji", "backdrop": "fuji",
        "name": "Kapitel III · Berg Fuji",
        "materials": lambda m, walk, g: (
            "pagoda" if g == "tower" and m in ("stone", "stonedark") else {
                "grass": "autumn", "stone": "stonegrey", "stonedark": "stonegreydark",
                "rock": "stonegreydark", "rockdark": "foundationdark", "wood": "woodplank", **MECH,
            }.get(m, m)),
        "decor": {
            (-1, 0, 5): {"t": "tree", "variant": 3, "s": 1.1},
            (2, 0, 2): {"t": "pagoda", "s": 0.6, "r": 0},
            (1, 0, 5): {"t": "grass"},
            (-8, 3, 0): {"t": "tree", "variant": 5, "s": 0.85},
            (3, 3, 0): {"t": "dango", "r": 1.5708},
            (7, -2, 5): {"t": "pinerock"},
            (5, -2, 5): {"t": "tree", "variant": 3, "s": 0.8},
            (5, 7, -2): {"t": "tree", "variant": 3, "s": 0.8},
            (7, 7, 1): {"t": "tree", "variant": 5, "s": 0.85},
            (7, 7, 2): {"t": "lookout"},
        },
        "sushi": [[6, -2, 3], [3, -1, 3], [1, 0, 3], [-2, 3, -1], [-7, 3, 0], [2, 3, -1], [6, 7, 0]],
        "texts": {
            (6, -2, 4): "Rote Ahornblätter treiben über den See. Dahinter wartet der Fuji.",
            (0, 0, 3): "Der Hof der Pagode ist still. Nur ein Trittstein fehlt.",
            (0, 0, 0): "Eine Pagode, die sich dreht, hat viele Türen.",
            (-7, 3, -1): "Eine Pfote auf der Platte. Eine zweite fehlt noch.",
            (3, 3, -1): "Zwei Platten öffnen jedes Tor.",
            (6, 7, 2): "Vom Aussichtspunkt sieht die Pagode ganz anders aus.",
        },
        "ending": "Das letzte Glöckchen klingt. Über dem See leuchtet der Fuji – Mochi ist angekommen.",
        "spirits": 6,
    },
]

# Kleinkram, der einem Sushi weichen darf
SMALL = {"flowers", "grass", "mushroom", "bush", "rock"}


def build(ch):
    src = json.load(open(os.path.join(LEVEL_DIR, f"level{ch['source']}.json")))
    lvl = copy.deepcopy(src)
    lvl["name"] = ch["name"]
    lvl["theme"] = ch["theme"]
    lvl["world"] = "neko"
    lvl["hero"] = "cat"
    lvl["companion"] = "sparrow"
    lvl["backdrop"] = ch["backdrop"]
    lvl["goalItem"] = "bell"
    lvl["sushi"] = ch["sushi"]

    for b in lvl["blocks"]:
        b["m"] = ch["materials"](b["m"], b["walk"], b.get("g"))

    sushi = {tuple(c) for c in ch["sushi"]}
    decor = []
    for d in src["decor"]:
        p = tuple(d["p"])
        if d["t"] in ("crank", "handle", "altar", "torii", "pond", "waterfall", "millwheel"):
            decor.append(d)          # Mechanik und Ziel bleiben unverändert
            continue
        new = ch["decor"].get(p)
        if new is None:
            if d["t"] == "vine" and ch["theme"] == "town":
                new = {"t": "laundry"}
            elif d["t"] in SMALL and p in sushi:
                continue
            else:
                decor.append(d)
                continue
        nd = {"t": new["t"], "p": list(p), "s": new.get("s", 1.0), "r": new.get("r", d.get("r", 0.0))}
        for k in ("variant", "to"):
            if k in new: nd[k] = new[k]
        if d.get("g"): nd["g"] = d["g"]
        decor.append(nd)
    lvl["decor"] = decor

    texts = []
    for t in src["texts"]:
        texts.append({"at": t["at"], "text": ch["texts"].get(tuple(t["at"]), t["text"])})
    lvl["texts"] = texts

    ending = lvl["ending"]
    ending["text"] = ch["ending"]
    ending["spirits"] = ending["spirits"][: ch["spirits"]]
    return lvl


def dump(lvl, path):
    # kompaktes, aber lesbares Format wie bei den anderen Leveln
    with open(path, "w") as f:
        json.dump(lvl, f, ensure_ascii=False, indent=1)
        f.write("\n")


if __name__ == "__main__":
    for ch in CHAPTERS:
        lvl = build(ch)
        path = os.path.join(LEVEL_DIR, f"level{ch['target']}.json")
        dump(lvl, path)
        print(f"level{ch['target']}.json: {len(lvl['blocks'])} Blöcke, {len(lvl['decor'])} Deko, {len(lvl['sushi'])} Sushi")
