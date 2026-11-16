"""Fase 3: numeración de página (cabecera y pie), siempre como NÚMEROS.
Cabecera (primera línea, arriba): dos grupos de números: a la izquierda la página del libro impreso, a la derecha
la página de la edición braille. Cada número es: signo de número + letras a-j (a=1 ... i=9, j=0).
 - Si un grupo se lee como número válido, se deja tal cual (rojo).
 - Si no (salen letras u otros signos), la página braille se INFIERE por su orden (portada = 1, cada página braille +1,
   con el desfase que dan las páginas bien leídas) y se pinta en naranja; la página impresa solo se infiere si la
   anterior y la siguiente coinciden; si no, no se escribe nada.
Pie (última línea, abajo): solo se escribe si se lee como números; si no, no se escribe.
Uso: python numeracion.py CARPETA_TRABAJO   (res{i}.json + info.json; sobrescribe res{i}.json)
"""
import json,os,sys
from collections import Counter
DIG={'1':'1','12':'2','14':'3','145':'4','15':'5','124':'6','1245':'7','125':'8','24':'9','245':'0'}
def es_signo_num(pat):
    s=set(pat); return len(pat)>=2 and s<=set('3456')          # 3456 (o con puntos perdidos: 45, 36, 345...)
def grupos(cells):
    g=[[]]
    for c in cells:
        if c.get('empty'):
            if g[-1]: g.append([])
        else: g[-1].append(c)
    return [x for x in g if x]
def leer_numero(g):
    """Devuelve la cadena de dígitos si el grupo es signo de número + letras a-j; si no, None."""
    if len(g)<2 or not es_signo_num(g[0].get('pat','')): return None
    d=[DIG.get(c.get('pat','')) for c in g[1:]]
    return None if None in d else ''.join(d)
def poner(g,num,dudoso):
    """Escribe los dígitos de num en las celdas del grupo (la 1ª es el signo de número)."""
    g[0]['ch']=''; g[0]['unsure']=False; g[0]['drop']=True   # el signo de número no se rotula
    for k,c in enumerate(g[1:]):
        if k<len(num): c['ch']=num[k]; c['unsure']=dudoso; c.pop('drop',None)
        else: c['drop']=True
def cabecera(r,w,h):
    if not r['lines']: return None
    l=r['lines'][0]
    if l['y']>0.06*h: return None
    g=grupos(l['cells'])
    if not g or len(g)>2 or any(len(x)>5 for x in g): return None
    if not all(x[0].get('ox',0)>0.5*w for x in g[-1:]) : return None
    return l,g
def main(work):
    info={int(k):v for k,v in json.load(open(os.path.join(work,'info.json'))).items()}
    pags=sorted(info); R={i:json.load(open(os.path.join(work,'res%d.json'%i))) for i in pags}
    H={}
    for rank,i in enumerate(pags):
        c=cabecera(R[i],info[i]['w'],info[i]['h'])
        if c: H[i]=(rank,)+c
    # desfase de la numeración braille a partir de las lecturas válidas
    ofs=Counter()
    for i,(rank,l,g) in H.items():
        n=leer_numero(g[-1])
        if n and n.isdigit() and int(n)>0: ofs[int(n)-rank]+=1
    off=ofs.most_common(1)[0][0] if ofs else None
    # página impresa (grupo izquierdo, solo si hay dos grupos)
    imp={i:(leer_numero(g[0]) if len(g)==2 else None) for i,(rank,l,g) in H.items()}
    orden=[i for i in pags if i in H and len(H[i][2])==2]
    for k,i in enumerate(orden):
        if imp[i] is None:
            a=imp[orden[k-1]] if k>0 else None; b=imp[orden[k+1]] if k+1<len(orden) else None
            if a and a==b: imp[i]=a; H[i][2][0][0]['_inf']=1
    for i,(rank,l,g) in H.items():
        izq=g[0] if len(g)==2 else None; der=g[-1]
        n=leer_numero(der); inferido=False
        if (n is None or not n.isdigit() or (off is not None and int(n)!=rank+off)) and off is not None:
            n=str(rank+off); inferido=True
        if n is None: 
            for c in der: c['drop']=True
        else: poner(der,n,inferido)
        txt=n or ''
        if izq is not None:
            p=imp[i]
            if p: poner(izq,p,izq[0].get('_inf')==1); txt=p+' '+txt
            else:
                for c in izq: c['drop']=True
        for x in g:
            for c in x: c.pop('_inf',None)
        l['text']=txt; l['segs']=[{'ch':ch} for ch in txt]
    # pie de página: solo números
    for i in pags:
        r=R[i]; h=info[i]['h']
        if r['lines'] and r['lines'][-1]['y']>0.9*h and not (i in H and r['lines'][-1] is H[i][1]):
            l=r['lines'][-1]; gs=grupos(l['cells']); out=[]; ok=True
            for g in gs:
                n=leer_numero(g)
                if n is None: ok=False; break
                out.append((g,n))
            if ok and out:
                for g,n in out: poner(g,n,False)
                l['text']=' '.join(n for g,n in out); l['segs']=[{'ch':ch} for ch in l['text']]
            else:
                l['foot']=True; l['text']=''; l['segs']=[]     # no se escribe nada
    for i in pags: json.dump(R[i],open(os.path.join(work,'res%d.json'%i),'w'))
    print('numeración braille: desfase',off,'| páginas con cabecera:',sorted(H))
if __name__=='__main__': main(sys.argv[1])
