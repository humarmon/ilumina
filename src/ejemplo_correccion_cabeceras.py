import json
from PIL import Image
D={'0':'0','1':'1'}
def fix(src,dst,i,left,right):
    r=json.load(open('%s/res%d.json'%(src,i)));W=Image.open('%s/n%d.png'%(src,i)).size
    H=W[1];W=W[0]
    for l in r['lines']:
        l['foot']= l['y']>0.9*H or l.get('foot')
        if l['y']>0.07*H or l['y']>0.9*H: continue
        if l['text'].startswith('~') : pass
        groups=[];cur=[]
        for c in l['cells']:
            if c.get('empty'):
                if cur: groups.append(cur);cur=[]
            elif 'pat' in c: cur.append(c)
        if cur: groups.append(cur)
        for g in groups:
            if len(g)>6: continue
            xs=g[0]['ox']; side='R' if xs>W*0.85 else 'L'
            want=right if side=='R' else left
            if not want: continue
            val,det=want  # string, read-directly flag
            n=len(val)
            if side=='R' and len(g)<n+1 and g[0]['ox']>W*0.85:
                sp=W*0.0245
                for t in range(len(g),n+1):
                    nc=dict(g[0]);nc.pop('pts',None);nc['pts']=[];nc['ox']=g[0]['ox']+t*sp;nc['pat']='x';g.append(nc);l['cells'].append(nc)
                g[0]['pat']='3456'
            if len(g)==n+1: d=g[1:]; g[0]['ch']='';g[0]['pat']='3456'
            elif len(g)==n: d=g
            else: continue
            for c,ch in zip(d,val): c['ch']=ch; c['unsure']=not det
    json.dump(r,open('%s/res%d.json'%(dst,i),'w'))
# (valor, leido_directo)
Lm={3:('21',1),4:('21',1),5:('21',0),6:('22',1)}
for i in range(7):
    fix('/tmp/mates','/tmp/mfix/a',i,Lm.get(i),(str(i+1),i>=3 or i==1))
Lb={0:('21',1),1:('22',1),2:('22',0),3:('23',1),4:('24',1),5:('24',1),6:('24',1),7:('24',1),8:('25',1),9:('25',1),10:('25',0),11:('26',1),12:('27',1),13:('27',1),14:('28',1)}
for k in range(16):
    fix('/tmp/m2','/tmp/mfix/b',k,Lb.get(k),(str(6+k),k not in (10,)))
