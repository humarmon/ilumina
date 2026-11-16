"""Une en un solo PDF las páginas iluminadas de varias carpetas de trabajo, en el orden dado.
Uso: python unir.py salida.pdf carpeta1 carpeta2 ...   (cada carpeta, tras iluminar.py, tiene r{i}.jpg)"""
import glob,os,re,sys
from PIL import Image
def main(salida,*carpetas):
    ims=[]
    for d in carpetas:
        fs=sorted(glob.glob(os.path.join(d,'r[0-9]*.jpg')),key=lambda f:int(re.findall(r'r(\d+)\.jpg',f)[0]))
        for f in fs:
            im=Image.open(f).convert('RGB'); im.thumbnail((1700,2040)); ims.append(im)
    ims[0].save(salida,save_all=True,append_images=ims[1:],resolution=150); print(len(ims),'páginas ->',salida)
if __name__=='__main__': main(*sys.argv[1:])
