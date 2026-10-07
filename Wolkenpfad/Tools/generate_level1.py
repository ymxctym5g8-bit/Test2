# Erzeugt Wolkenpfad/Level/level1.json. Aufruf: python3 Tools/generate_level1.py Wolkenpfad/Level/level1.json
import json, sys
B=[]; D=[]
def blk(p,m,walk=False,stair=None,g=None):
    b={"p":list(p),"m":m,"walk":walk}
    if stair: b["stair"]=stair
    if g: b["g"]=g
    B.append(b)
def dec(t,p,s=1.0,g=None,r=0.0,**kw):
    d={"t":t,"p":list(p),"s":s,"r":r}
    if g: d["g"]=g
    d.update(kw); D.append(d)

# ---------- Garten-Insel (Start) ----------
for x in range(-1,4):
    for z in range(2,6):
        if (x,z) in [(-1,2),(3,5)]: continue
        walk = True
        m="grass"
        if (x,z) in [(2,2)]: walk=False; m="stone"      # Treppenfundament
        if (x,z) in [(3,4)]: walk=False; m="water"
        if (x,z) in [(-1,5),(3,2)]: walk=False         # Baumplaetze
        blk((x,0,z),m,walk)
# Unterseite (schwebender Fels)
for x in range(-1,4):
    for z in range(2,6):
        if (x,z) in [(-1,2),(3,5),(-1,5),(3,2)]: continue
        blk((x,-1,z),"rock")
for x in range(0,3):
    for z in range(3,5): blk((x,-2,z),"rock")
blk((1,-3,4),"rock"); blk((1,-3,3),"rockdark")
blk((1,-4,4),"rockdark")
dec("tree",(-1,0,5),1.25); dec("tree",(3,0,2),1.0,variant=1)
dec("pond",(3,0,4)); dec("waterfall",(3,0,4))
dec("flowers",(-1,0,3)); dec("flowers",(1,0,5)); dec("grass",(0,0,2)); dec("grass",(2,0,5))
dec("grass",(-1,0,4)); dec("mushroom",(0,0,5)); dec("lantern",(1,0,2))
dec("rock",(3,0,3),0.6)

# Treppe hinauf zur Terrasse
blk((2,1,2),"stone",True,stair="-z")
# Terrasse B (y=1) auf Steinsockel
for p in [(2,1,1),(2,1,0),(1,1,0),(0,1,0)]:
    blk(p,"stone",True)
    blk((p[0],0,p[2]),"stone")
    blk((p[0],-1,p[2]),"stonedark")
blk((1,1,1),"stone"); blk((1,0,1),"stone"); blk((1,-1,1),"stonedark")
dec("bush",(1,1,1),0.9); dec("lantern",(2,1,0))
dec("vine",(0,1,0),1.0,r=0.0)

# ---------- Drehbruecke (Kurbel 1) ----------
G="bridge"
for p in [(-2,1,-1),(-2,1,0),(-2,1,1)]: blk(p,"wood",True,g=G)
blk((-2,0,0),"teal",g=G); blk((-2,-1,0),"teal",g=G); blk((-2,-2,0),"tealdark",g=G)
dec("crank",(-2,-1,0),1.0,g=G,face="+x")

# ---------- Turm C ----------
blk((-4,1,0),"stone",True)
for y in range(-3,1): blk((-4,y,0),"stone" if y>-2 else "stonedark")
blk((-5,1,0),"stone"); blk((-5,0,0),"stone"); blk((-5,-1,0),"stonedark")
dec("tree",(-5,1,0),0.8,variant=2)
dec("flowers",(-4,1,0),0.8)

# ---------- Aufzugssaeule ----------
G="lift"
for y in range(-3,2): blk((-4,y,-1),"teal" if y<1 else "tealtop",walk=(y==1),g=G)
dec("handle",(-4,1,-1),1.0,g=G)

# ---------- Obere Galerie D (y=4) ----------
for x in range(-4,0): blk((x,4,-2),"stone",True)
for y in range(-2,4): blk((-4,y,-2),"stonedark" if y<0 else "stone")
for y in range(1,4): blk((-1,y,-2),"stone")
blk((-1,0,-2),"stonedark")
dec("lantern",(-3,4,-2)); dec("vine",(-2,4,-2),1.0)

# ---------- Kurbel 2: Bogenarm ----------
G="arm"
blk((0,4,-2),"tealtop",True,g=G)
blk((0,4,-1),"wood",True,g=G)
blk((0,3,-2),"teal",g=G); blk((0,2,-2),"tealdark",g=G)
dec("crank",(0,2,-2),1.0,g=G,face="+z")

# ---------- Schrein-Insel E (y=6) ----------
for p in [(4,6,0),(4,6,-1),(5,6,-1),(5,6,0)]:
    blk(p,"grass",True)
    blk((p[0],5,p[2]),"rock")
blk((4,4,-1),"rock"); blk((5,4,-1),"rockdark"); blk((4,3,-1),"rockdark")
blk((5,6,1),"grass"); blk((5,5,1),"rock")
dec("torii",(4,6,-1),1.0,r=0)
dec("altar",(5,6,-1),1.0)
dec("tree",(5,6,1),0.9,variant=1)
dec("flowers",(4,6,0),0.8)

level={
 "name":"Kapitel I · Der Samen des Waldes",
 "start":[0,0,4],"goal":[5,6,-1],
 "groups":[
  {"id":"bridge","kind":"rotate","pivot":[-2,1,0],"step":0,"handle":[-2,-1,0]},
  {"id":"lift","kind":"slide","axis":[0,1,0],"value":0,"min":0,"max":3,"handle":[-4,1,-1]},
  {"id":"arm","kind":"rotate","pivot":[0,4,-2],"step":0,"minStep":0,"maxStep":2,"handle":[0,2,-2]}
 ],
 "blocks":B,"decor":D,
 "texts":[
  {"at":[0,0,4],"text":"Ein Samen, so alt wie der Wind, ruht über den Wolken."},
  {"at":[0,1,0],"text":"Nicht jeder Weg liegt offen. Manche wollen bewegt werden."},
  {"at":[-4,4,-2],"text":"Manche Wege sieht man erst, wenn man die Welt anders betrachtet."},
  {"at":[4,6,0],"text":"Der Schrein erinnert sich an den Wald."}
 ]
}
json.dump(level,open(sys.argv[1],'w'),indent=1,ensure_ascii=False)
print(len(B),"blocks",len(D),"decor")
