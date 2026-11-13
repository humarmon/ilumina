const fs=require('fs');const i=process.argv[2];
const [W,H]=JSON.parse(fs.readFileSync(`/tmp/l4/n${i}_1.dim`));
const g=fs.readFileSync(`/tmp/l4/n${i}_1.raw`);
const res=JSON.parse(fs.readFileSync(`/tmp/l4/final/res${i}.json`));const p=res.p;
const sig=0.22*p, R=Math.ceil(3*sig);
const k=[];let ks=0;for(let t=-R;t<=R;t++){const v=Math.exp(-t*t/(2*sig*sig));k.push(v);ks+=v;}for(let t=0;t<k.length;t++)k[t]/=ks;
let a=new Float32Array(W*H);for(let j=0;j<W*H;j++)a[j]=255-g[j];
let b=new Float32Array(W*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0;for(let t=-R;t<=R;t++){const xx=Math.min(W-1,Math.max(0,x+t));s+=a[y*W+xx]*k[t+R];}b[y*W+x]=s;}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let s=0;for(let t=-R;t<=R;t++){const yy=Math.min(H-1,Math.max(0,y+t));s+=b[yy*W+x]*k[t+R];}a[y*W+x]=s;}
const sc=(x,y)=>{let m=-1e9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=Math.round(x)+dx,yy=Math.round(y)+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H)m=Math.max(m,a[yy*W+xx]);}return m;};
const present=[],cand=[];
for(const L of res.lines)for(const c of L.cells){
  if(c.empty||c.ox===undefined||!c.pts)continue;
  const row0=c.oy+p;
  const pos=[];for(let r=0;r<3;r++)for(let cc=0;cc<2;cc++)pos.push({x:c.ox+(cc?0.5:-0.5)*p,y:row0+r*p});
  // ajuste local: desplazar según los puntos detectados de la celda
  let dx=0,dy=0,n=0;
  for(const q of c.pts){let best=null,bd=1e9;for(const s of pos){const d=Math.hypot(s.x-q.x,s.y-q.y);if(d<bd){bd=d;best=s;}}if(bd<0.6*p){dx+=q.x-best.x;dy+=q.y-best.y;n++;}}
  if(n){dx/=n;dy/=n;}
  for(const s of pos){s.x+=dx;s.y+=dy;const has=c.pts.some(q=>Math.hypot(q.x-s.x,q.y-s.y)<0.5*p);
    const v=sc(s.x,s.y);(has?present:cand).push({x:s.x,y:s.y,v,has});}
}
present.sort((u,v)=>u.v-v.v);const M=present[Math.floor(present.length/2)].v,P10=present[Math.floor(present.length*0.1)].v;
const cv=cand.map(c=>c.v).sort((u,v)=>u-v);
const pct=q=>cv[Math.floor(cv.length*q)];
console.log('p',p.toFixed(1),'present n',present.length,'median',M.toFixed(1),'p10',P10.toFixed(1),'cand n',cand.length,'cand pct 25/50/75/90/95',[0.25,0.5,0.75,0.9,0.95].map(pct).map(x=>x.toFixed(1)).join('/'));
const h={};for(const c of cand){const b=Math.floor(c.v/M*10);h[b]=(h[b]||0)+1;}console.log('hist cand v/M x10',JSON.stringify(h));
fs.writeFileSync(`/tmp/l4/cand${i}.json`,JSON.stringify({M,cand}));
