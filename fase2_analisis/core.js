// ---- Braille OCR core (sin dependencias) ----
const TABLE={'1':'a','12':'b','14':'c','145':'d','15':'e','124':'f','1245':'g','125':'h','24':'i','245':'j','13':'k','123':'l','134':'m','1345':'n','12456':'ñ','135':'o','1234':'p','12345':'q','1235':'r','234':'s','2345':'t','136':'u','1236':'v','2456':'w','1346':'x','13456':'y','1356':'z','12356':'á','2346':'é','34':'í','346':'ó','23456':'ú','1256':'ü','2':',','23':';','25':':','3':'.','26':'¿','235':'¡','126':'(','345':')','35':'*','56':'□','2356':'=','123456':'●','36':'-'};
const PAIR={'26':['¿','?'],'236':['«','»'],'235':['¡','!']};
const DIGITS={a:'1',b:'2',c:'3',d:'4',e:'5',f:'6',g:'7',h:'8',i:'9',j:'0'};

function gauss(src,W,H,s){
  const r=Math.max(1,Math.ceil(3*s)),k=new Float32Array(2*r+1);let sum=0;
  for(let i=-r;i<=r;i++){k[i+r]=Math.exp(-i*i/(2*s*s));sum+=k[i+r];}
  for(let i=0;i<k.length;i++)k[i]/=sum;
  const tmp=new Float32Array(W*H),out=new Float32Array(W*H);
  for(let y=0;y<H;y++){const o=y*W;for(let x=0;x<W;x++){let a=0;for(let i=-r;i<=r;i++){let xx=x+i;xx=xx<0?0:xx>=W?W-1:xx;a+=src[o+xx]*k[i+r];}tmp[o+x]=a;}}
  for(let y=0;y<H;y++){for(let x=0;x<W;x++){let a=0;for(let i=-r;i<=r;i++){let yy=y+i;yy=yy<0?0:yy>=H?H-1:yy;a+=tmp[yy*W+x]*k[i+r];}out[y*W+x]=a;}}
  return out;
}
function boxBlur(src,W,H,R){ // media con imagen integral
  const I=new Float64Array((W+1)*(H+1));
  for(let y=0;y<H;y++){let row=0;for(let x=0;x<W;x++){row+=src[y*W+x];I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+row;}}
  const out=new Float32Array(W*H);
  for(let y=0;y<H;y++){const y0=Math.max(0,y-R),y1=Math.min(H,y+R+1);
    for(let x=0;x<W;x++){const x0=Math.max(0,x-R),x1=Math.min(W,x+R+1);
      out[y*W+x]=(I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0])/((x1-x0)*(y1-y0));}}
  return out;
}
function pct(arr,q){const a=Float32Array.from(arr);a.sort();return a[Math.min(a.length-1,Math.floor(q*a.length))];}

// gray: Float32Array o Uint8 (W*H). Devuelve puntos [{x,y}] en coordenadas de la imagen dada.
function detectDots(gray,W,H,sigma){
  const R=Math.round(9*sigma);
  const bg=boxBlur(gray,W,H,R);
  const d=new Float32Array(W*H);
  for(let i=0;i<d.length;i++){const v=bg[i]-gray[i];d[i]=v>0?v:0;}
  const g1=gauss(d,W,H,sigma),g2=gauss(d,W,H,sigma*1.8);
  const r=new Float32Array(W*H);for(let i=0;i<r.length;i++)r[i]=g1[i]-g2[i];
  // umbrales relativos
  const sub=[];for(let i=0;i<r.length;i+=7)sub.push(r[i]);
  const rmax=pct(sub,0.9995), thrR=(globalThis.__rrel||0.07)*rmax;
  const dsub=[];for(let i=0;i<d.length;i+=7)dsub.push(d[i]);
  const dmax=pct(dsub,0.997), thrM=0.33*dmax;
  const rad=Math.round(sigma*1.4), w=Math.max(2,Math.round(sigma*1.5));
  // componentes conexas de la máscara oscura a dos niveles de contraste (el lápiz pegado a un punto se separa en el nivel alto)
  const stack=new Int32Array(W*H);
  const label=(thr)=>{
    const lab=new Int32Array(W*H),info=[null];let nl=0;
    for(let i0=0;i0<W*H;i0++){
      if(d[i0]<=thr||lab[i0])continue;
      nl++;let sp=0,area=0,x1=1e9,x2=-1,y1=1e9,y2=-1;stack[sp++]=i0;lab[i0]=nl;
      while(sp){const i=stack[--sp],x=i%W,y=(i-x)/W;area++;if(x<x1)x1=x;if(x>x2)x2=x;if(y<y1)y1=y;if(y>y2)y2=y;
        if(x>0&&!lab[i-1]&&d[i-1]>thr){lab[i-1]=nl;stack[sp++]=i-1;}
        if(x<W-1&&!lab[i+1]&&d[i+1]>thr){lab[i+1]=nl;stack[sp++]=i+1;}
        if(y>0&&!lab[i-W]&&d[i-W]>thr){lab[i-W]=nl;stack[sp++]=i-W;}
        if(y<H-1&&!lab[i+W]&&d[i+W]>thr){lab[i+W]=nl;stack[sp++]=i+W;}}
      info.push({area,w:x2-x1+1,h:y2-y1+1});
    }
    return {lab,info};
  };
  const LV=[label(thrM),label(Math.max(thrM*1.8,0.6*dmax))];
  const dia=sigma*2.83, maxA=2.6*Math.PI*(dia/2)**2, maxS=2.2*dia;
  const dots=[], margin=Math.max(Math.round(sigma*5),Math.round(0.025*Math.min(W,H)));  // ignora bordes (canto de la pila, sombras)
  for(let y=margin;y<H-margin;y++)for(let x=margin;x<W-margin;x++){
    const v=r[y*W+x]; if(v<=thrR)continue;
    let ok=true;
    for(let dy=-w;dy<=w&&ok;dy++)for(let dx=-w;dx<=w;dx++){const u=r[(y+dy)*W+x+dx];if(u>v||(u===v&&(dy<0||(dy===0&&dx<0)))){ok=false;break;}}
    if(!ok)continue;
    // componente compacta cercana (descarta trazos largos de tinta/lápiz)
    let okc=false;
    for(let lv=0;lv<LV.length;lv++){
      const {lab,info}=LV[lv];
      let id=0,bestN=0;const cnt={};
      for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){const l=lab[(y+dy)*W+x+dx];if(l){cnt[l]=(cnt[l]||0)+1;if(cnt[l]>bestN){bestN=cnt[l];id=l;}}}
      if(!id)continue;const f=info[id];
      const dotA=Math.PI*(dia/2)**2;
      if(lv===0){if(f.area<=maxA&&f.w<=maxS&&f.h<=maxS){okc=true;break;}}
      else if(f.area>=0.5*dotA&&f.area<=1.7*dotA&&f.w/f.h>0.6&&f.w/f.h<1.7&&f.w<=1.6*dia&&f.h<=1.6*dia&&v>=0.45*rmax){okc=true;break;}
    }
    if(!okc)continue;
    dots.push({x,y,s:v});
  }
  return dots;
}

function nnPitch(P){
  const n=P.length,dd=[];
  for(let i=0;i<n;i++){let m=1e9;for(let j=0;j<n;j++)if(i!==j){const q=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);if(q<m)m=q;}dd.push(m);}
  const s=[...dd].sort((a,b)=>a-b);return {p:s[Math.floor(s.length/2)],dd};
}

function medNN(P){const {p}=nnPitch(P);return p;}
function decodeDots(dots){
  if(dots.length<6)return null;
  let {p,dd}=nnPitch(dots);
  let P=dots.filter((_,i)=>dd[i]<3.3*p);
  if(P.length<6)return null;
  ({p}=nnPitch(P));
  // enderezado global
  const rowScore=(pts,a,pp)=>{const t=a*Math.PI/180,bins=new Map();
    for(const q of pts){const y=-q.x*Math.sin(t)+q.y*Math.cos(t);const b=Math.round(y/(pp/3));bins.set(b,(bins.get(b)||0)+1);}
    let s=0;for(const v of bins.values())s+=v*v;return s;};
  // agrupar en líneas: se buscan orientaciones sucesivas (cada línea puede tener la suya)
  P=P.map(q=>({ox:q.x,oy:q.y,x:q.x,y:q.y}));
  const groups=[];let rest=P,firstAngle=0;const failed=[];
  for(let it=0;it<14&&rest.length>=3;it++){
    let best={s:-1,a:0};
    for(let a=-10;a<=10;a+=0.25){if(failed.some(f=>Math.abs(f-a)<1.2))continue;const s=rowScore(rest,a,p);if(s>best.s)best={s,a};}
    if(best.s<0)break;
    if(it===0)firstAngle=best.a;
    const t=best.a*Math.PI/180,ct=Math.cos(t),st=Math.sin(t);
    const R=rest.map(q=>({ox:q.ox,oy:q.oy,x:q.ox*ct+q.oy*st,y:-q.ox*st+q.oy*ct}));
    const o=[...R].sort((u,v)=>u.y-v.y),gs=[];let cur=[o[0]];
    for(let i=1;i<o.length;i++){if(o[i].y-o[i-1].y>1.45*p){gs.push(cur);cur=[o[i]];}else cur.push(o[i]);}
    gs.push(cur);
    const taken=new Set();let got=0;
    for(const g of gs){
      if(g.length<3)continue;
      const ys=g.map(q=>q.y).sort((u,v)=>u-v),k4=Math.floor(ys.length*0.04),spread=ys[ys.length-1-k4]-ys[k4];
      const wd=Math.max(...g.map(q=>q.x))-Math.min(...g.map(q=>q.x));
      if(spread>2.5*p+0.015*wd)continue;
      groups.push({pts:g,tg:t});got++;g.forEach(q=>taken.add(q.ox+','+q.oy));
    }
    if(!got)failed.push(best.a);
    rest=rest.filter(q=>!taken.has(q.ox+','+q.oy));
  }
  groups.sort((u,v)=>u.pts.reduce((s,q)=>s+q.oy,0)/u.pts.length-v.pts.reduce((s,q)=>s+q.oy,0)/v.pts.length);
  const mapDot={0:'1',2:'2',4:'3',1:'4',3:'5',5:'6'};
  const res=[],prep=[];
  for(const G of groups){
    const L=G.pts;if(L.length<3)continue;
    const cx0=L.reduce((s,q)=>s+q.x,0)/L.length,cy0=L.reduce((s,q)=>s+q.y,0)/L.length;
    const pl=(()=>{const dd=[];for(let i=0;i<L.length;i++){let m=1e9;for(let j=0;j<L.length;j++)if(i!==j){const q=Math.hypot(L[i].x-L[j].x,L[i].y-L[j].y);if(q<m)m=q;}if(m<1.3*p)dd.push(m);}
      if(dd.length<6)return p;dd.sort((a,b)=>a-b);return dd[Math.floor(dd.length/2)];})();
    // inclinación propia de la línea
    const Lc=L.map(q=>({x:q.x-cx0,y:q.y-cy0}));
    let bl={s:-1,a:0};
    for(let a=-2;a<=2;a+=0.2){const s=rowScore(Lc,a,pl);if(s>bl.s)bl={s,a};}
    const tl=bl.a*Math.PI/180,cl=Math.cos(tl),sl=Math.sin(tl);
    const Q=L.map(q=>({x:Lc[0]&&((q.x-cx0)*cl+(q.y-cy0)*sl),y:-(q.x-cx0)*sl+(q.y-cy0)*cl,ox:q.ox,oy:q.oy}));
    prep.push({L,cx0,cy0,pl,cl,sl,Q,tg:G.tg});
    continue;
  }
  // razón c/p estable: mediana de las líneas largas con ajuste libre
  const fit=(Q,pl,c0,c1,st)=>{let bc=null;for(let c=c0;c<=c1;c+=st*pl)for(let x0=0;x0<c;x0+=0.02*pl){let e=0;for(const q of Q){const k=Math.floor((q.x-x0)/c+0.15),r=q.x-x0-k*c;const er=Math.min(Math.abs(r),Math.abs(r-pl));e+=Math.min(er,0.4*pl)**2;}if(!bc||e<bc.e)bc={e,c,x0};}return bc;};
  const ratios=[];
  for(const pr of prep){if(pr.Q.length>=25){const f=fit(pr.Q,pr.pl,2.15*pr.pl,2.65*pr.pl,0.01);ratios.push(f.c/pr.pl);}}
  ratios.sort((a,b)=>a-b);
  const rg=ratios.length?ratios[Math.floor(ratios.length/2)]:2.37;
  for(const pr of prep){
    const {L,cx0,cy0,pl,cl,sl,Q}=pr;const cg=Math.cos(pr.tg),sg=Math.sin(pr.tg);
    const bc=fit(Q,pl,rg*pl*0.95,rg*pl*1.05,0.004);
    const c=bc.c,x0=bc.x0;
    const ymin=Math.min(...Q.map(q=>q.y));
    const srt=[...Q].sort((u,v)=>u.x-v.x),words=[];let wcur=[srt[0]];
    for(let i=1;i<srt.length;i++){if(srt[i].x-srt[i-1].x>3.6*pl){words.push(wcur);wcur=[srt[i]];}else wcur.push(srt[i]);}
    words.push(wcur);
    let prior={x:x0,c:c};const out=[];
    const back=(lx,ly)=>{const gx=cx0+(lx*cl-ly*sl),gy=cy0+(lx*sl+ly*cl);return [gx*cg-gy*sg,gx*sg+gy*cg];};
    words.forEach((Wd,wi)=>{
      let minX=Wd[0].x,bw=null;
      for(let cc=prior.c*0.96;cc<=prior.c*1.04;cc+=0.005*prior.c){
        for(let xx=minX-cc-0.5*pl;xx<=minX+0.5*pl;xx+=0.02*pl){
          let e=0;for(const q of Wd){const k=Math.floor((q.x-xx)/cc+0.15),r=q.x-xx-k*cc;const er=Math.min(Math.abs(r),Math.abs(r-pl));e+=Math.min(er,0.4*pl)**2;}
          let dph=((xx-prior.x)%cc+cc*1.5)%cc-cc/2;
          e+=1.5*dph*dph; if(!bw||e<bw.e)bw={e,c:cc,x0:xx};
        }
      }
      // línea base propia de cada palabra (el papel puede curvarse y una palabra quedar más baja que el resto)
      const ymw=Math.min(...Wd.map(q=>q.y));
      const base=(Wd.length>=4&&Math.abs(ymw-ymin)<=1.4*pl)?ymw:ymin;
      const cells=new Map();
      for(const q of Wd){
        const k=Math.floor((q.x-bw.x0)/bw.c+0.15),col=(q.x-bw.x0-k*bw.c)<pl/2?0:1;
        // línea base local: el punto más alto entre las celdas vecinas (el papel puede ondularse dentro de la línea)
        let top=1e9;for(const r2 of Wd){if(Math.abs(r2.x-q.x)<=2.2*bw.c&&r2.y<top)top=r2.y;}
        if(!(Math.abs(top-base)<=0.9*pl))top=base;
        const row=Math.min(2,Math.max(0,Math.round((q.y-top)/pl)));
        if(!cells.has(k))cells.set(k,{set:new Set(),pts:[]});
        const cc=cells.get(k);cc.set.add(row*2+col);cc.pts.push(q);
      }
      const ks=[...cells.keys()].sort((u,v)=>u-v);
      if(wi>0)out.push({k:-1,pat:'',empty:true});
      for(let k=ks[0];k<=ks[ks.length-1];k++){
        const cc=cells.get(k);
        if(!cc){out.push({k,pat:'',empty:true});continue;}
        const pat=[...cc.set].map(i=>mapDot[i]).sort().join('');
        const [ox,oy]=back(bw.x0+k*bw.c+pl/2,base-1.0*pl);
        out.push({k,pat,ox,oy,pts:cc.pts.map(q=>({x:q.ox,y:q.oy}))});
      }
      if(Wd.length>=3)prior={x:bw.x0,c:bw.c};
    });
    res.push({y:cy0,yo:L.reduce((s,q)=>s+q.oy,0)/L.length,cells:out});
  }
  res.sort((u,v)=>u.yo-v.yo);return {p,angle:firstAngle,lines:res};
}

// Pasa celdas a texto; marca celdas dudosas
function toText(lines){
  const out=[];
  for(const L of lines){
    let txt='',cap=false,num=false,trail=0;const cellsOut=[];let alt={};
    for(const ce of L.cells){
      if(ce.empty){trail++;if(trail===1)txt+=' ';num=false;cellsOut.push({...ce,ch:' '});continue;}
      trail=0;let ch,unsure=false;
      if(ce.pat==='46'){cap=true;ch='';}
      else if(ce.pat==='3456'){num=true;ch='';}
      else if(PAIR[ce.pat]){alt[ce.pat]=!alt[ce.pat];ch=PAIR[ce.pat][alt[ce.pat]?0:1];num=false;}
      else{
        ch=TABLE[ce.pat];
        if(ch===undefined){ch='�';unsure=true;}
        else if(num&&DIGITS[ch]){ch=DIGITS[ch];}
        else{num=false;}
        if(cap&&/[a-zñáéíóúü]/.test(ch)){ch=ch.toUpperCase();cap=false;}
      }
      txt+=ch;cellsOut.push({...ce,ch,unsure});
    }
    // paréntesis que rodean una sola letra = letra resaltada (como el color/negrita del libro impreso)
    for(let i=0;i+2<cellsOut.length;i++){
      const a=cellsOut[i];if(a.pat!=='35')continue;
      let j=i+1;while(j<cellsOut.length&&!cellsOut[j].empty&&cellsOut[j].ch==='')j++;   // salta el signo de mayúscula
      const b=cellsOut[j],c3=cellsOut[j+1];
      if(b&&c3&&c3.pat==='35'&&b.ch&&b.ch.length===1&&/[A-Za-zñÑáéíóúüÁÉÍÓÚÜ]/.test(b.ch)){a.drop=true;c3.drop=true;b.hl=true;}
    }
    // hueco para escribir la respuesta: 3 o más celdas "36" seguidas (con una celda de borde a cada lado)
    for(let i=0;i<cellsOut.length;){
      if(cellsOut[i].pat==='36'){
        let j=i;while(j<cellsOut.length&&cellsOut[j].pat==='36')j++;
        if(j-i>=3){
          let a=i,b=j-1;
          const isEdge=(ce)=>ce&&!ce.empty&&ce.pat&&ce.pat.includes('3')&&ce.pat.includes('6')&&ce.pat.length>=4;
          if(isEdge(cellsOut[a-1]))a--;
          if(isEdge(cellsOut[b+1]))b++;
          for(let k=a;k<=b;k++)cellsOut[k].blank=true;
          cellsOut[a].blankStart=true;cellsOut[a].bx2=cellsOut[b].ox;
        }
        i=j;
      }else i++;
    }
    for(let i=0;i<cellsOut.length;){
      if(cellsOut[i].pat==='14'){let j=i;while(j<cellsOut.length&&cellsOut[j].pat==='14')j++;
        if(j-i>=8){for(let k=i;k<j;k++)cellsOut[k].sep=true;cellsOut[i].sepStart=true;}
        i=j;}else i++;
    }
    const segs=[];let prevSpace=true;
    for(const ce of cellsOut){
      if(ce.sep){if(ce.sepStart){segs.push({ch:'────────',sep:true});prevSpace=false;}continue;}
      if(ce.blank){if(ce.blankStart){segs.push({ch:'______',blank:true});prevSpace=false;}continue;}
      if(ce.drop)continue;
      if(ce.empty){if(!prevSpace)segs.push({ch:' '});prevSpace=true;continue;}
      if(!ce.ch)continue;
      segs.push({ch:ce.ch,hl:!!ce.hl,unsure:!!ce.unsure});prevSpace=false;
    }
    while(segs.length&&segs[segs.length-1].ch===' ')segs.pop();
    out.push({text:segs.map(x=>x.ch).join(''),segs,y:L.y,cells:cellsOut});
  }
  return out;
}

// Selección automática del tamaño de punto: converge sigma ≈ p/5.8
function autoRun(gray,W,H,sigma0,fixed){
  let s=sigma0||4,dots;
  for(let it=0;it<(fixed?0:3);it++){
    dots=detectDots(gray,W,H,s);
    if(dots.length<6)break;
    const p=nnPitch(dots).p, sn=Math.max(2,Math.min(14,p/5.8));
    if(Math.abs(sn-s)/s<0.12){s=sn;break;}
    s=sn;
  }
  dots=detectDots(gray,W,H,s);
  if(globalThis.__ink){const K=globalThis.__ink;dots=dots.filter(d=>{let n=0;const cx=Math.round(d.x)+K.ox,cy=Math.round(d.y)+K.oy;for(let dy=-5;dy<=5;dy+=2)for(let dx=-5;dx<=5;dx+=2)if(K.m[(cy+dy)*K.W+cx+dx])n++;return n<3;});}
  if(globalThis.__extra)dots=dots.concat(globalThis.__extra);
  const dec=decodeDots(dots);
  return {sigma:s,dots,dec,lines:dec?toText(dec.lines):[]};
}
if(typeof module!=='undefined')module.exports={detectDots,decodeDots,toText,autoRun};
