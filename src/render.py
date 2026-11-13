import json,glob,sys
from PIL import Image,ImageDraw,ImageFont
d0,i,out=sys.argv[1],sys.argv[2],sys.argv[3]
im=Image.open('%s/n%s.png'%(d0,i)).convert('RGB'); d=ImageDraw.Draw(im)
r=json.load(open('%s/res%s.json'%(d0,i))); p=r['p']
fp=glob.glob('/usr/share/fonts/**/DejaVuSans-Bold.ttf',recursive=True)[0]
L=r['lines']
def pts(c): return [q['y'] for q in c.get('pts',[])]
prevBottom=None
for L1 in L:
    cells=L1['cells']
    # runs of >=4 identical cells = lines/drawings: no labels
    skip=set()
    k=0
    while k<len(cells):
        c=cells[k]; j=k
        if not c.get('empty') and 'pat' in c:
            while j+1<len(cells) and not cells[j+1].get('empty') and cells[j+1].get('pat')==c['pat']: j+=1
            if j-k+1>=4: skip.update(range(k,j+1))
        k=j+1
    ys=[y for c in cells for y in pts(c)]
    for c in cells:
        for q in c.get('pts',[]):
            x,y=q['x'],q['y'];rr=p*0.33;d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=(0,0,0))
        if c.get('blankStart') and not L1.get('unk'):
            x1=c['ox']-p*0.9; x2=c['bx2']+p*0.9; y=c['oy']-p*0.9
            d.rectangle((x1,y-p*0.28,x2,y+p*0.28),fill=(30,90,200))
    for k,c in enumerate(cells):
        if c.get('empty') or 'pat' not in c or 'ox' not in c: continue
        if L1.get("foot") or k in skip or c.get('blank') or c.get('blankStart') or c.get('sep') or c['pat'] in ('46','3456','123456') or c.get('drop'): continue
        ch=c.get('ch','') or '#'
        if ch=='�': ch='?'
        row0=c['oy']+p
        gap=(row0-prevBottom) if prevBottom else 4*p
        avail=gap-0.33*p*2-0.05*p
        em=max(1.25*p,min(2.0*p,avail/0.9)); f=ImageFont.truetype(fp,int(em))
        base=row0-0.33*p-0.05*p-0.24*em
        w=d.textlength(ch,font=f)
        L1['lt']=min(L1.get('lt',1e9),base-0.8*em)
        if c.get('hl'): col=(255,214,0); tc=(215,20,40)
        elif c.get('unsure'): col=(255,255,255); tc=(230,120,0)
        else: col=(255,255,255); tc=(215,20,40)
        x=c['ox']+0.0
        if c.get('hl'): d.rectangle((x-w/2-2,base-0.8*em,x+w/2+2,base+0.26*em),fill=col)
        d.text((x,base),ch,fill=tc,font=f,anchor='ms',stroke_width=0 if c.get('hl') else 3,stroke_fill=(255,255,255))
    if ys: prevBottom=max(ys)


im.save(out,quality=92)
