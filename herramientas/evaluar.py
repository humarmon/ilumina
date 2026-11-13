"""Mide el acierto de la lectura automática frente al texto corregido.
Uso: python evaluar.py datos/libro3
Acierto por carácter = parecido (difflib) entre 'leido' y 'correcto' en líneas de estado 'ok'."""
import json,sys,os,difflib
d=sys.argv[1];tot=n=0;malas=[]
for fn in sorted(os.listdir(d)):
    if not fn.startswith('p'): continue
    r=json.load(open(os.path.join(d,fn)));a=b=0
    for l in r['lineas']:
        if l['estado']!='ok' or not l['correcto'].strip(): continue
        s=difflib.SequenceMatcher(None,l['leido'],l['correcto'],autojunk=False)
        a+=sum(x.size for x in s.get_matching_blocks()); b+=len(l['correcto'])
    if b: tot+=a;n+=b; print(fn,'%.1f%%'%(100*a/b),b,'car.')
print('TOTAL %.1f%%'%(100*tot/max(n,1)))
