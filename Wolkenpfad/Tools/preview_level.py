# Isometrische Vorschau. Aufruf: python3 Tools/preview_level.py level.json out.png '{"bridge":1,"lift":3,"arm":1}'
import json, sys, math
from PIL import Image, ImageDraw
sys.path.insert(0,'')
L=json.load(open(sys.argv[1])); out=sys.argv[2]; state=json.loads(sys.argv[3])
groups={g["id"]:g for g in L["groups"]}
def rot(v,k):
    x,y,z=v
    for _ in range(k%4): x,y,z=z,y,-x
    return (x,y,z)
def world(b):
    p=tuple(b["p"]); gid=b.get("g")
    if gid:
        g=groups[gid]; s=state[gid]
        if g["kind"]=="rotate":
            pv=tuple(g["pivot"]); o=rot(tuple(p[i]-pv[i] for i in range(3)),s); p=tuple(pv[i]+o[i] for i in range(3))
        else: p=tuple(p[i]+g["axis"][i]*s for i in range(3))
    return p
C={"grass":((150,200,120),(236,214,178)),"stone":((246,230,206),(226,204,178)),"stonedark":((200,170,170),(180,150,160)),
   "rock":((190,160,150),(165,135,140)),"rockdark":((140,115,130),(120,100,120)),"water":((120,190,220),(236,214,178)),
   "wood":((210,160,110),(185,130,90)),"teal":((120,200,200),(90,170,175)),"tealdark":((80,150,160),(60,125,140)),"tealtop":((170,225,215),(90,170,175)),"raft":((200,150,100),(170,120,80))}
S=46
def proj(x,y,z):
    u=(x-z)/math.sqrt(2); v=(-x+2*y-z)/math.sqrt(6)
    return u,v
pts=[]
for b in L["blocks"]:
    p=world(b)
    for dx in (-.5,.5):
        for dy in (-.5,.5):
            for dz in (-.5,.5): pts.append(proj(p[0]+dx,p[1]+dy,p[2]+dz))
umin=min(p[0] for p in pts);umax=max(p[0] for p in pts);vmin=min(p[1] for p in pts);vmax=max(p[1] for p in pts)
print("extent u",umin,umax,"v",vmin,vmax,"center",(umin+umax)/2,(vmin+vmax)/2)
W=int((umax-umin)*S)+80; H=int((vmax-vmin)*S)+80
img=Image.new("RGB",(W,H),(250,225,205)); d=ImageDraw.Draw(img)
def sp(x,y,z):
    u,v=proj(x,y,z); return (40+(u-umin)*S, 40+(vmax-v)*S)
def shade(c,f): return tuple(int(min(255,ch*f)) for ch in c)
blocks=sorted(L["blocks"],key=lambda b:sum(world(b)))
for b in blocks:
    x,y,z=world(b); top,side=C.get(b["m"],((200,200,200),(160,160,160)))
    if b.get("stair"):
        top=shade(top,0.9)
    # top
    d.polygon([sp(x-.5,y+.5,z-.5),sp(x+.5,y+.5,z-.5),sp(x+.5,y+.5,z+.5),sp(x-.5,y+.5,z+.5)],fill=top,outline=shade(top,.85))
    # +x face
    d.polygon([sp(x+.5,y+.5,z-.5),sp(x+.5,y+.5,z+.5),sp(x+.5,y-.5,z+.5),sp(x+.5,y-.5,z-.5)],fill=shade(side,1.0),outline=shade(side,.85))
    # +z face
    d.polygon([sp(x-.5,y+.5,z+.5),sp(x+.5,y+.5,z+.5),sp(x+.5,y-.5,z+.5),sp(x-.5,y-.5,z+.5)],fill=shade(side,.8),outline=shade(side,.7))
    if b["p"]==L["start"]: d.ellipse([sp(x,y+.5,z)[0]-6,sp(x,y+.5,z)[1]-6,sp(x,y+.5,z)[0]+6,sp(x,y+.5,z)[1]+6],fill=(220,60,60))
    if b["p"]==L["goal"]: d.ellipse([sp(x,y+.5,z)[0]-6,sp(x,y+.5,z)[1]-6,sp(x,y+.5,z)[0]+6,sp(x,y+.5,z)[1]+6],fill=(255,230,90))
img.save(out)
