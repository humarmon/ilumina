"""Fase 3: corrección por contexto.
Uso: python corregir.py CARPETA_ENTRADA CARPETA_SALIDA correcciones.json
Lee res{i}.json (fase 2), aplica el texto corregido alineándolo celda a celda y
escribe res{i}.json corregidos. Marcas: ver correcciones.json.
"""
import json,difflib,os,re,sys
Q='\ufffd'
D='drop';F='foot';U='unk'
def vis(l): return [c for c in l['cells'] if not c.get('empty') and c.get('ch','')!='' and not c.get('drop') and not c.get('blank') and not c.get('sep')]
def apply(l,new):
    forced=new.startswith('!'); 
    if forced:
        new=new[1:]
        for c in l['cells']:
            for k in ('blank','blankStart','sep','sepStart','drop'): c.pop(k,None)
    lead='______ ' if l['text'].startswith('______') and '______' not in new else ''
    cs=vis(l); A=''.join(c['ch'] for c in cs); B=new.replace(' ','')
    if forced:
        for k,c in enumerate(cs):
            if k<len(B): c['ch']=B[k]; c['unsure']=False
            else: c['drop']=True
    else:
        sm=difflib.SequenceMatcher(None,A,B,autojunk=False)
        for tag,i1,i2,j1,j2 in sm.get_opcodes():
            if tag=='equal':
                for k in range(i1,i2): cs[k]['unsure']=False
            elif tag=='replace':
                n=min(i2-i1,j2-j1)
                for k in range(n): cs[i1+k]['ch']=B[j1+k]; cs[i1+k]['unsure']=False
                for k in range(n,i2-i1): cs[i1+k]['drop']=True
            elif tag=='delete':
                for k in range(i1,i2): cs[k]['drop']=True
    for c in cs:
        if c['ch']=='(' : c['pat']='126'
        if c['ch']==')' : c['pat']='345'
    for c in cs:
        if c['ch']=='·': c['ch']=Q; c['unsure']=True
    l['text']=lead+new.replace('·','?')

def main(entrada,salida,corr):
    fix=json.load(open(corr))['paginas']; os.makedirs(salida,exist_ok=True)
    for fn in sorted(os.listdir(entrada)):
        m=re.match(r'res(\d+)\.json$',fn)
        if not m: continue
        i=m.group(1); r=json.load(open(os.path.join(entrada,fn))); out=[]
        fx={int(k):v for k,v in fix.get(i,{}).items()}
        for n,l in enumerate(r['lines']):
            f=fx.get(n)
            if f==D: continue
            if f==F: l['foot']=True
            elif f==U: l['unk']=True; l['text']='···'
            elif f and f.startswith('~'): l['unk']=True; l['text']=f[1:]+' (deducido)'
            elif f: apply(l,f)
            for c in l['cells']:
                if c.get('ch')==Q: c['unsure']=True
            out.append(l)
        r['lines']=out
        json.dump(r,open(os.path.join(salida,fn),'w'))
if __name__=='__main__': main(*sys.argv[1:4])
