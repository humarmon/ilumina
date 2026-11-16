"""Fase 1 (preparación): PDF escaneado -> n{i}.raw/.dim/.png (gris) + info.json.
- Salta páginas que no son braille (fotos, etc.): demasiado oscuras/grises.
- Detecta de qué lado están las anillas (2 agujeros redondos) y BORRA esa franja (11,5 % del ancho):
  ahí no hay braille y es donde el detector inventaba puntos.
Uso: python preparar.py entrada.pdf CARPETA_TRABAJO   (necesita pdfimages de poppler)
"""
import glob,json,os,subprocess,sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
FRANJA=0.115
def lado_anillas(a):
    h,w=a.shape; lab,_=ndi.label(a<90); sc={'L':0,'R':0}
    for i,sl in enumerate(ndi.find_objects(lab),1):
        y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop; bw,bh=x1-x0,y1-y0
        if not(0.008*w<bw<0.04*w and 0.008*w<bh<0.04*w and 0.6<bw/bh<1.6): continue
        if y0<0.03*h or y1>0.97*h or (lab[sl]==i).sum()/(bw*bh)<0.45: continue
        cx=(x0+x1)/2
        if cx<0.1*w: sc['L']+=1
        elif cx>0.9*w: sc['R']+=1
    return 'R' if sc['R']>sc['L'] else 'L'
def es_braille(a): return (a<140).mean()<0.06
def main(pdf,work):
    os.makedirs(work,exist_ok=True); subprocess.run(['pdfimages','-j',pdf,os.path.join(work,'raw')],check=True)
    info={}
    for k,f in enumerate(sorted(glob.glob(os.path.join(work,'raw-*.jpg')))):
        a=np.array(Image.open(f).convert('L'),dtype=np.uint8); h,w=a.shape
        if not es_braille(a): print('pagina',k,'no es braille: se salta'); continue
        side=lado_anillas(a); m=int(FRANJA*w); fondo=int(np.median(a[a>200])) if (a>200).any() else 250
        if side=='L': a[:,:m]=fondo
        else: a[:,w-m:]=fondo
        open(os.path.join(work,'n%d.raw'%k),'wb').write(a.tobytes()); json.dump([w,h],open(os.path.join(work,'n%d.dim'%k),'w'))
        Image.fromarray(a).save(os.path.join(work,'n%d.png'%k)); info[k]=dict(side=side,w=w,h=h); print('pagina',k,'anillas',side)
    json.dump(info,open(os.path.join(work,'info.json'),'w'))
if __name__=='__main__': main(*sys.argv[1:3])
