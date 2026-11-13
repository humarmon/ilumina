"""Exporta pares (leído por el programa, corregido) a datos/<libro>/pNN.json.
Uso: python exportar_datos.py CARPETA_RES_SIN_CORREGIR CARPETA_RES_CORREGIDOS SALIDA
Cada línea guarda: celdas [patrón, letra] ('0' = hueco), texto leído, texto correcto y estado.
No guarda imágenes."""
import json,os,re,sys
def celdas(l): return [['0' if c.get('empty') else c.get('pat','?'), c.get('ch','')] for c in l['cells']]
def main(raw,cor,out):
    os.makedirs(out,exist_ok=True)
    for fn in sorted(os.listdir(cor)):
        m=re.match(r'res(\d+)\.json$',fn)
        if not m or not os.path.exists(os.path.join(raw,fn)): continue
        a=json.load(open(os.path.join(raw,fn)));b=json.load(open(os.path.join(cor,fn)))
        pr={round(l['y']):l['text'] for l in a['lines']}
        L=[]
        for l in b['lines']:
            est='pie' if l.get('foot') else 'ilegible' if l.get('unk') else 'ok'
            L.append({'y':round(l['y']),'estado':est,'leido':pr.get(round(l['y']),''),'correcto':l['text'],'celdas':celdas(l)})
        json.dump({'pagina':int(m.group(1)),'p':b.get('p'),'lineas':L},open(os.path.join(out,'p%02d.json'%int(m.group(1))),'w'),ensure_ascii=False)
if __name__=='__main__': main(*sys.argv[1:4])
