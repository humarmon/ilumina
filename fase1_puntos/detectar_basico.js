const fs=require('fs');const {autoRun}=require('../fase2_analisis/core.js');
const WORK=process.env.WORK||'.';const i=process.argv[2];const [W,H]=JSON.parse(fs.readFileSync(WORK+'/n'+i+'.dim'));
const g=Float32Array.from(fs.readFileSync(WORK+'/n'+i+'.raw'));
// Por defecto sigma FIJO según el ancho (4.5 a 2600 px): la estimación automática falla en páginas con poco texto.
// REL = umbral relativo de punto (0.25 por defecto): 0.07 detecta más pero mete puntos fantasma (sombra del reverso, grano del papel).
// AUTO=1 recupera la estimación automática.
globalThis.__rrel=parseFloat(process.env.REL||'0.25');
const auto=process.env.AUTO==='1';const s0=auto?4:4.5*W/2600;
const r=autoRun(g,W,H,s0,!auto);
console.error('sigma',r.sigma.toFixed(2),'dots',r.dots.length,'p',r.dec&&r.dec.p.toFixed(1));
fs.writeFileSync(WORK+'/res'+i+'.json',JSON.stringify({sigma:r.sigma,p:r.dec&&r.dec.p,lines:r.lines,dots:r.dots.map(d=>[d.x,d.y])}));
for(const l of r.lines)console.log(l.text);
