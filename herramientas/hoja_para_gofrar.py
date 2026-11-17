"""Hoja en blanco para imprimir y luego gofrar (embosar) el braille encima.
Deja SOLO lo que añade ilumina (letras, números, casillas, renglones) en su sitio y quita los puntos, las sombras,
las anillas y el fondo. El PDF sale a tamaño real: se supone 2,5 mm entre puntos de una celda (estándar) y se calcula
el tamaño de cada página con eso. Imprimir al 100 % ("tamaño real", sin ajustar a página).
Uso: python hoja_para_gofrar.py CARPETA_TRABAJO salida.pdf pag1 pag2 ...   (números de página del PDF original, como r{i}.jpg)"""
import json,os,subprocess,sys
from PIL import Image
AQUI=os.path.dirname(os.path.abspath(__file__)); RAIZ=os.path.dirname(AQUI)
DPI=150; PUNTO_MM=2.5
def main(work,salida,*pags):
    ims=[]
    for i in pags:
        tmp=os.path.join(work,'hoja%s.png'%i)
        subprocess.run([sys.executable,'-I',os.path.join(RAIZ,'render','render.py'),work,str(i),tmp,'blanco'],check=True)
        im=Image.open(tmp).convert('RGB'); p=json.load(open(os.path.join(work,'res%s.json'%i)))['p']
        mm_px=PUNTO_MM/p; ancho_mm=im.width*mm_px; alto_mm=im.height*mm_px
        k=(25.4/mm_px)/DPI*0+DPI/(25.4/mm_px)       # px del PDF por px de la imagen
        im=im.resize((round(im.width*k),round(im.height*k)),Image.LANCZOS); ims.append(im)
        print('pagina',i,'tamaño real: %.0f x %.0f mm'%(ancho_mm,alto_mm))
    ims[0].save(salida,save_all=True,append_images=ims[1:],resolution=DPI)
if __name__=='__main__': main(sys.argv[1],sys.argv[2],*sys.argv[3:])
