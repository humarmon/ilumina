"""Fase 3: reglas de contexto que no dependen de correcciones manuales.
Regla 1 (suma): la celda 2-3-5 se lee '¡' (tabla literaria). Entre dos números o casillas
y dentro de una línea con '=', es el signo MÁS: se escribe '+'.
Regla 1b: en una línea que es solo una operación (números, casillas □, =, y ¡/! de la celda 2-3-5; con etiqueta
inicial tipo 'a)' o '2.'), toda ¡/! entre dos operandos es '+' aunque no haya '='. (¡ y ! son la misma celda 2-3-5.)
Uso: python reglas.py CARPETA_ENTRADA [CARPETA_SALIDA]   (res{i}.json; sin salida = sobrescribe)
"""
import json,os,re,sys
ETIQ=re.compile(r'^\s*(?:[a-z]\)|\d+\.)\s*')
OPER='¡'
def _num(ch): return ch.isdigit() or ch=='□'
def aplicar(r):
    n=0
    for l in r['lines']:
        resto=ETIQ.sub('',l['text']); oper=bool(re.fullmatch(r'[\d□¡!=+ ]+',resto)) and len(re.findall(r'[\d□]+',resto))>=2
        if '=' not in l['text'] and not oper: continue
        segs=l.get('segs',[]); m=0
        cs=[c for c in l['cells'] if c.get('ch','')!='']
        ok=len(cs)==len(segs)
        def vec(k,d):
            k+=d
            while 0<=k<len(segs) and segs[k].get('ch')==' ': k+=d
            return segs[k].get('ch','') if 0<=k<len(segs) else ''
        for k,s in enumerate(segs):
            if s.get('ch') not in (OPER,'!') or k==0 or k+1>=len(segs): continue
            if _num(vec(k,-1)) and _num(vec(k,1)):
                s['ch']='+'; n+=1; m+=1
                if ok and cs[k].get('pat')=='235': cs[k]['ch']='+'
        l['text']=''.join(s.get('ch','') for s in segs) if segs and m else l['text']
    return n
def main(entrada,salida=None):
    salida=salida or entrada; os.makedirs(salida,exist_ok=True); tot=0
    for fn in sorted(os.listdir(entrada)):
        if not re.match(r'res\d+\.json$',fn): continue
        r=json.load(open(os.path.join(entrada,fn))); tot+=aplicar(r)
        json.dump(r,open(os.path.join(salida,fn),'w'))
    print('signos + corregidos:',tot)
if __name__=='__main__': main(*sys.argv[1:3])
