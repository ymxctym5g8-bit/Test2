# Prüft Lösbarkeit und listet alle unmöglichen Verbindungen. Aufruf: python3 Tools/verify_level.py Wolkenpfad/Level/level1.json
import json, sys, itertools
from collections import deque
L=json.load(open(sys.argv[1]))
groups={g["id"]:g for g in L["groups"]}
DIRS={"+x":(1,0,0),"-x":(-1,0,0),"+z":(0,0,1),"-z":(0,0,-1)}
def rot(v,k):  # k*90deg about +y: (x,y,z)->(z,y,-x)
    x,y,z=v
    for _ in range(k%4): x,y,z=z,y,-x
    return (x,y,z)
def gstates(g):
    if g["kind"]=="rotate":
        lo=g.get("minStep",0); hi=g.get("maxStep",3)
        return list(range(lo,hi+1))
    return list(range(g["min"],g["max"]+1))
def world(b,state):
    p=tuple(b["p"]); gid=b.get("g"); d=DIRS.get(b.get("stair")) if b.get("stair") else None
    if gid:
        g=groups[gid]; s=state[gid]
        if g["kind"]=="rotate":
            pv=tuple(g["pivot"]); o=tuple(p[i]-pv[i] for i in range(3)); o=rot(o,s)
            p=tuple(pv[i]+o[i] for i in range(3))
            if d: d=rot(d,s)
        else:
            ax=g["axis"]; p=tuple(p[i]+ax[i]*s for i in range(3))
    return p,d
def build(state):
    cells={}; tiles=[]
    for i,b in enumerate(L["blocks"]):
        p,d=world(b,state)
        if p in cells: return None  # collision
        cells[p]=i
    for i,b in enumerate(L["blocks"]):
        if not b["walk"]: continue
        p,d=world(b,state)
        above=(p[0],p[1]+1,p[2])
        if above in cells: continue
        tiles.append((i,p,d))
    # ports in doubled coords
    ports={}
    for i,p,d in tiles:
        X,Y,Z=2*p[0],2*p[1],2*p[2]
        if d is None:
            ps=[((X+dx,Y+1,Z+dz),(dx,0,dz)) for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]]
        else:
            dx,_,dz=d
            ps=[((X+dx,Y+1,Z+dz),(dx,0,dz)),((X-dx,Y-1,Z-dz),(-dx,0,-dz))]
        ports[i]=ps
    adj={i:[] for i,_,_ in tiles}
    tl=[t[0] for t in tiles]
    for a,b in itertools.combinations(tl,2):
        for pa,da in ports[a]:
            for pb,db in ports[b]:
                if da!=tuple(-c for c in db): continue
                q=tuple(pb[k]-pa[k] for k in range(3))
                if q[0]==q[1]==q[2]:
                    adj[a].append((b,q[0]//2)); adj[b].append((a,q[0]//2))
    pos={i:p for i,p,_ in tiles}
    return adj,pos
gids=list(groups)
allstates=[dict(zip(gids,c)) for c in itertools.product(*[gstates(groups[g]) for g in gids])]
idx={tuple(b["p"]):i for i,b in enumerate(L["blocks"]) if not b.get("g")}
start=[i for i,b in enumerate(L["blocks"]) if b["p"]==L["start"]][0]
goal=[i for i,b in enumerate(L["blocks"]) if b["p"]==L["goal"]][0]
built={}
for s in allstates:
    r=build(s); key=tuple(s[g] for g in gids)
    if r is None: print("COLLISION in state",s); continue
    built[key]=r
# illusions
seen=set()
for key,(adj,pos) in built.items():
    for a,lst in adj.items():
        for b,t in lst:
            if t!=0 and (min(a,b),max(a,b),t) not in seen:
                seen.add((min(a,b),max(a,b),t))
                print("ILLUSION",L["blocks"][a]["p"],"<->",L["blocks"][b]["p"],"t=",t,"state",dict(zip(gids,key)))
# state-space BFS: (state, tile). mechanisms can change only if hana not on that group? allow riding: tile stays in group
def tileok(key,t): return t in built[key][0]
init=tuple(groups[g].get("step",groups[g].get("value",0)) for g in gids)
q=deque([(init,start)]); prev={(init,start):None}
while q:
    k,t=q.popleft()
    if t==goal: 
        path=[]; cur=(k,t)
        while cur: path.append(cur); cur=prev[cur]
        print("SOLVABLE in",len(path),"moves")
        for k2,t2 in reversed(path): print("  ",dict(zip(gids,k2)),L["blocks"][t2]["p"])
        break
    adj,pos=built[k]
    nxt=[(k,b) for b,_ in adj[t]]
    for gi,g in enumerate(gids):
        for s in gstates(groups[g]):
            k2=list(k); k2[gi]=s; k2=tuple(k2)
            if k2 in built and t in built[k2][0]: nxt.append((k2,t))
    for n in nxt:
        if n not in prev: prev[n]=(k,t); q.append(n)
else: print("NOT SOLVABLE")
# reachable tiles in initial state
adj,pos=built[init]
seenT={start}; dq=deque([start])
while dq:
    a=dq.popleft()
    for b,_ in adj[a]:
        if b not in seenT: seenT.add(b); dq.append(b)
print("reachable initially:",[L["blocks"][i]["p"] for i in seenT])
