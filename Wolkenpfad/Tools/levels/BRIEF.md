# Wolkenpfad – level design brief for chapters 4–18

Wolkenpfad is a calm isometric puzzle game for iPhone (portrait), Monument Valley meets Studio Ghibli.
Chapters 1–3 (free prologue, "The Forest Seeds") already exist: `Wolkenpfad/Level/level1.json` … `level3.json`
(generators: `Tools/generate_level1.py` … `generate_level3.py` – read them, they are the best examples).
Chapters 4–18 are sold as in-app purchases (three acts). **All player-facing text is English.**

## Story

Hana is a young tinkerer from a village on a small floating island. Kiko, a little white forest spirit,
floats beside her and hints the way. After the prologue she finds her grandfather's old wind harp and his
yellowed notebook about the floating paths. The sky's wind is fading: windmills stand still, cloud bridges
crumble. Hana sets out to repair them and to retune the great wind harp at the heart of the clouds.
Tone: warm, gentle melancholy, contemplative, poetic, lonely but hopeful. No enemies, no time pressure.

## Chapters (file = `Wolkenpfad/Level/levelN.json`, generator = `Tools/levels/chN.py`)

| N | Title (use exactly) | theme | Setting & signature visuals | Mechanic focus | Mech. moves on shortest solution |
|---|---|---|---|---|---|
| 4 | The Hum in the Attic | attic | Grandfather's attic on a tiny floating island: wood floors, rafters (`beam`), old `chest`s, the `notebook`, dusty `lightshaft`s; goal = the wind harp | gentle start of Act I: 1 rotator, 1 slider, 1 plate; first **state trigger** (turning a crank opens a hatch) | 9–11 |
| 5 | The First Step into the Mist | mist | Home village (`house`, `lantern`, `pennant`) on its island, then the first abandoned cloud path (`cloud` blocks) into soft mist with glowing spores | sliding cloud-bridge segments, a ride on a moving block | 10–13 |
| 6 | The Valley of Whispering Grass | grassvale | Island of man-high waving grass (`tallgrass` everywhere), curious `kodama` spirits sitting on blocks that bar the way | lullaby stones = plates; each played stone makes a kodama group step aside (plate triggers on locked groups) | 11–14 |
| 7 | The Mill of Forgotten Letters | mill | Old moss-grown `windmill`, `letters` fluttering, autumn ochre, `millwheel`, `moss` blocks | mill-tower rotator with a stair inside; a millstone crank coupled by **state trigger** to a chute/lift | 12–15 |
| 8 | The Storm Is Coming | storm | Melancholic storm sky, giant hollow `oak` rooted in clouds, branches as bridges | rotating branch bridges, 2 impossible connections through the hollow trunk | 13–16 |
| 9 | The Lake of Glass | glasslake | Flat mirroring `glass` tiles high above the ground, barefoot on the sky, `cloudpuff`s | sliding glass panes, 2 impossible connections | 14–17 |
| 10 | The Town of Bellflowers | bellflower | Dreamy village of giant glowing blue `bellflower`s with tiny houses, `petal` platforms, evening | rotating flower stems carrying petal platforms, plates | 15–18 |
| 11 | The Sleeping Giant | giant | A mountain that is a peaceful, moss-grown cloud titan (`giantface`), breath `vent`s drive thermal winds | breath stones (plates) lift platforms; a slider and rotators around the giant's body | 16–19 |
| 12 | The Maze of Sunbeams | sunbeam | Sunset maze; sun `mirror`s on rotators; bridges of `light` | **state triggers**: light bridges (locked groups) appear only while mirrors point the right way (≥ 2 mirrors) | 17–20 |
| 13 | The Old Bridge-Builder | bridgeworks | Workshop bridges, `scaffold`, `rope`, brass `gear`s, `brass` blocks, the `oldwoman` who keeps the bridges | many coupled bridge parts (state triggers between groups), backtracking | 18–22 |
| 14 | The Ascent to the Sky Garden | skygarden | Steep vertical climb (tall level), glowing `butterflies`, intense colours, flowers | lifts + rotators stacked vertically, illusions between levels | 19–23 |
| 15 | The Ruins of the First Storm | ruins | Ancient temple of monolithic `pillar`s, dormant machines (`gear`, `guardian`) | plates wake machines (triggers), heavy combination puzzle | 20–25 |
| 16 | Echoes of the Past | echo | Grandfather's memories as glowing `projection`s; `ghost` blocks appear as memories surface | ghost bridges via plate and state triggers, illusions, the projections show the way | 21–26 |
| 17 | The Heart of the Clouds | heart | The great wind harp of the sky (`windharp` at scale ~3, `harpstring`s), pearlescent pink/turquoise/lavender | **tuning**: 3 harp-peg rotators must form a chord (one trigger with 3 `states`) to open the heart; plus everything learned | 22–28 |
| 18 | A New Horizon | horizon | Golden light, everything blooming, the village waking far below, looking out to the next horizon | grand finale combining all mechanics; still calm | 23–30 |

Difficulty must rise step by step: the mechanism-move count on the verifier's shortest solution must
lie in the given range **and** grow from chapter to chapter. Also grow the number of groups, plates,
triggers, illusions and the size of the level gradually (≈130 blocks in ch4 up to ≈300 in ch18).

## Technical rules (the engine)

* Grid of unit blocks. `L.block(p, material, walk, stair, g)`. A walkable block is a tile only if the cell above is empty.
* Neighbouring tiles at the same height connect through their shared edge. **Stairs**: a block with
  `stair="+x"` rises towards +x; it connects to a tile at `(x-1, y-1, z)` (low side) and `(x+1, y, z)` (high side)
  (analogous for -x/+z/-z).
* **Impossible connections**: the camera looks along −(1,1,1). Tile A at `(x,y,z)` connects to tile B at
  `(x+1+t, y+t, z+t)` (or the same with z) for any integer t – but only if t = 0 or **both** cells are listed in
  the level's `ill` set. So every illusion is deliberate. The verifier prints all illusions it finds.
* **Groups** move blocks: `L.rotator(id, pivot)` turns about the vertical axis through `pivot` in 90° steps
  (optional `minStep`/`maxStep`); `L.slider(id, axis, value, min, max)` moves along an axis.
  Draggable groups need a control: `L.decor("crank", p, g=id, face="+x"|"+z")` on a block of the group (side faces
  toward the camera are +x and +z), or `L.decor("handle", p, g=id, axis="x"|"y"|"z")` on a walkable group block.
  Blocks may not overlap in any position the player can drag through (the verifier sweeps intermediate steps).
  The hero rides along on a moving group.
* **Plates** `L.plate(id, at)` sit on fixed walkable blocks and stay pressed once stepped on.
* **Triggers** move *locked* groups (`locked=True`, no crank/handle):
  `L.trigger(group, value, plates=[...], states={"mirror": 1, ...})`. A locked group takes the value of the first
  trigger whose plates are all pressed and whose `states` all match current group values; otherwise its
  initial value. State triggers make coupled mechanisms (mirrors → light bridges, harp pegs → heart gate,
  millstone → chute). Don't make triggered groups depend on each other in cycles.
* `start` and `goal` cells are fixed walkable blocks (goal may be on a group). The goal holds `L.goal_item`
  (one of seed, harp, letter, feather, gear, prism, lamp, string, heart, bell) on an `altar` decor at the goal cell.
* Screen: iPhone portrait. Keep `x - z` within −8…8 (screen width). Height may grow (camera follows), but keep
  `-x + 2y - z` within about −24…+30 except in chapter 14 (tall climb, up to ~+45).
* Materials (recoloured per chapter theme, so think semantically): grass, moss, stone, stonedark, rock, rockdark,
  wood, teal/tealdark/tealtop (mechanism body/top), water, raft, gate, light, glass, ghost, cloud, petal, brass.
  Use dark materials for undersides/supports so floating islands look solid. Mechanism groups usually use
  teal/tealdark with a tealtop walkable top, or a themed material (brass, petal, light, ghost, cloud, wood).
* Decor (`L.decor(type, cell, s=scale, r=rotation, g=group, …)`) sits on top of the block at `cell`:
  tree (variant 0 leafy, 1 light green, 2 blossom, 3 autumn, 4 glowing night, 5 ginkgo, 6 persimmon, 7 pine),
  bush, flowers, grass, tallgrass, mushroom, rock, bamboo, oak, bellflower, butterflies, cloudpuff, pond, waterfall,
  lantern, torii, millwheel(face), windmill(face), house(variant 0/1), chest, beam, notebook, letters, scaffold,
  rope(to=cell), pennant(to=cell), pillar, gear(face), mirror (put on a rotator), vent, lightshaft, harpstring(to=cell),
  windharp, kodama, oldwoman, guardian, projection, giantface(face), crank, handle, altar.
  `vine` and `letters` hang over the block's front (+z) edge. Put decor only on blocks whose top is free, never on a
  tile the hero must walk across unless it is small (flowers, grass, mushroom, kodama on blockers is fine).
  Give each chapter its own look: use its signature decor generously and vary vegetation.
* Story: `L.text(cell, "…")` shows a short line (≤ 70 characters, poetic, English) when Hana first steps on that
  fixed tile; use 5–7 per level, first one on the start tile. `L.end(text, tree_cell, spirit_cells)`: a 1–2 sentence
  ending; `tree_cell` is a non-walkable fixed block with a free top (a great tree grows there); 5–8 spirit cells on
  fixed tiles. Hints for Kiko: `L.hint(target, reach=cell, pressed=[…], unpressed=[…])`, first matching rule wins,
  last rule should be a catch-all; target = group id, plate id or "goal".

## Workflow

1. Write `Tools/levels/chN.py` (import with `sys.path.insert(0, Tools dir)`; `from leveldsl import Level`), run it.
2. `python3 Tools/verify_level.py Wolkenpfad/Level/levelN.json --essential` → must print SOLVABLE, no PROBLEM lines,
   every draggable group "unsolvable (essential)", mechanism moves in range. Exit code 0.
3. `python3 Tools/preview_level.py Wolkenpfad/Level/levelN.json /tmp/…/chN.png '{"group": value}' --plates a,b` and look at
   the picture (initial and solved states) to check that the composition reads well and no illusion is accidental.
4. Iterate until it's a good, beautiful, fair puzzle with a clear "aha".
