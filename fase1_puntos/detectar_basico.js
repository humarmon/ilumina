const fs=require('fs');const {autoRun}=require('../fase2_analisis/core.js');
const WORK=process.env.WORK||'.';const i=process.argv[2];const [W,H]=JSON.parse(fs.readFileSync(WORK+'/n'+i+'.dim'));
const g=Float32Array.from(fs.readFileSync(WORK+'/n'+i+'.raw'));
const r=autoRun(g,W,H,4);
console.error('sigma',r.sigma.toFixed(2),'dots',r.dots.length,'p',r.dec&&r.dec.p.toFixed(1));
fs.writeFileSync(WORK+'/res'+i+'.json',JSON.stringify({sigma:r.sigma,p:r.dec&&r.dec.p,lines:r.lines,dots:r.dots.map(d=>[d.x,d.y])}));
for(const l of r.lines)console.log(l.text);
