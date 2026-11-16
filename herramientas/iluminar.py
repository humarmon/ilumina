"""Pipeline completo: PDF escaneado de braille -> PDF iluminado.
Uso: python herramientas/iluminar.py entrada.pdf salida.pdf [carpeta_trabajo]
Pasos: preparar (anillas) -> detectar (node) -> reglas de contexto (+) -> render -> PDF.
Imprime también el texto de cada página (la 1ª línea suele traer los números de página arriba a la derecha)."""
import json,os,subprocess,sys,tempfile
from PIL import Image
AQUI=os.path.dirname(os.path.abspath(__file__)); RAIZ=os.path.dirname(AQUI)
def run(c,**k): return subprocess.run(c,check=True,**k)
def main(pdf,salida,work=None):
    work=work or tempfile.mkdtemp(prefix='ilumina_'); os.makedirs(work,exist_ok=True)
    run([sys.executable,'-I',os.path.join(RAIZ,'fase1_puntos','preparar.py'),pdf,work])
    paginas=sorted(int(k) for k in json.load(open(os.path.join(work,'info.json'))))
    env=dict(os.environ,WORK=work)
    for i in paginas:
        r=run(['node',os.path.join(RAIZ,'fase1_puntos','detectar_basico.js'),str(i)],env=env,capture_output=True,text=True)
        print('--- pagina',i,r.stderr.strip()); print(r.stdout)
    run([sys.executable,'-I',os.path.join(RAIZ,'fase3_contexto','reglas.py'),work])
    ims=[]
    for i in paginas:
        jpg=os.path.join(work,'r%d.jpg'%i); run([sys.executable,'-I',os.path.join(RAIZ,'render','render.py'),work,str(i),jpg])
        im=Image.open(jpg).convert('RGB'); im.thumbnail((1700,2040)); ims.append(im)
    ims[0].save(salida,save_all=True,append_images=ims[1:],resolution=150); print('PDF:',salida)
if __name__=='__main__': main(*sys.argv[1:4])
