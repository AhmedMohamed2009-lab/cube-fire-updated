'use strict';
// ===== مكعبات النار – نسخة محسّنة كاملة =====
const $=id=>document.getElementById(id),M=Math,clamp=(v,a,b)=>M.max(a,M.min(b,v));
const cv=$('c'),ctx=cv.getContext('2d');
const touch=matchMedia('(pointer:coarse)').matches;if(touch)$('tc').style.display='block';
let W=0,H=0,F=0;
function resize(){const d=M.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);F=H*.75}
addEventListener('resize',resize);resize();

// ---------- state ----------
const WP=[
  {n:'🔫 مسدس',mag:12,rate:.14,pel:1,spr:0,rl:1.1,gw:8,dm:1},
  {n:'💥 شوتجن',mag:6,rate:.65,pel:7,spr:.11,rl:1.5,gw:22,dm:1},
  {n:'⚡ رشاش',mag:30,rate:.07,pel:1,spr:.025,rl:1.4,gw:11,dm:.6},
  {n:'💣 قاذف',mag:4,rate:1.1,pel:1,spr:0,rl:2.2,gw:18,dm:0,grenade:1},
  {n:'🎯 سنايبر',mag:5,rate:1.4,pel:1,spr:0,rl:2.0,gw:14,dm:4.5},
  {n:'🔴 ليزر',mag:40,rate:.04,pel:1,spr:.01,rl:1.8,gw:10,dm:.35,laser:1}
];
let best=0,coins=0,theme=0;
try{best=+localStorage.getItem('cs_best')||0;coins=+localStorage.getItem('cs_coins')||0;theme=+localStorage.getItem('cs_theme')||0}catch(e){}
const S={hp:100,mhp:100,score:0,wave:1,kills:0,ammo:12,wp:0,combo:0,ct:0,rage:0,reload:0,fire:0,playing:false,started:false,amb:10,shield:0,slow:0,magnet:0,dj:0,dmgMul:1,reloadMul:1};
const mult=()=>M.min(6,1+(S.combo/3|0));
const pos={x:0,y:0,z:0};let yaw=0,pitch=0,vy=0,recoil=0,shake=0,flashT=0,holdFire=false,locked=false,bob=0,menuT=0,jumps=0;
const keys={},mv={x:0,y:0};
const ens=[],projs=[],parts=[],tracers=[],pk=[],dmgTxt=[],upgrades=[];
const MAP=32; // half-size (was 20)
const pil=[
  [-12,-12],[12,-12],[-12,12],[12,12],[0,-18],[0,18],[-18,0],[18,0],
  [-6,6],[6,-6],[-15,8],[15,-8],[8,15],[-8,-15],[4,4],[-4,-4],
  [20,10],[-20,-10],[10,22],[-10,-22],[22,-5],[-22,5]
].map(([x,z])=>({x,z}));

// Themes: neon / desert / factory
const THEMES=[
  {bg:[8,11,24],floor:'#101830',grid:'#2a4a9a',gridH:'#4f7bff',wall:'#17204a',line1:'#35e6ff',line2:'#ff4d9d',sky0:'#04060d',sky1:'#141b3d'},
  {bg:[40,28,12],floor:'#2a1e0e',grid:'#5a3a18',gridH:'#c48a3a',wall:'#3d2a14',line1:'#e8b060',line2:'#d06030',sky0:'#1a1208',sky1:'#3a2810'},
  {bg:[18,20,22],floor:'#1a1c20',grid:'#3a4048',gridH:'#6a7888',wall:'#2a2e34',line1:'#88a0b8',line2:'#c04040',sky0:'#0a0c10',sky1:'#1a1e24'}
];

// ---------- audio ----------
let ac,bgOsc=null,bgGain=null,musicRate=1;
function snd(f,d,t='square',v=.1,sl=0){if(!ac)return;try{const T=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.setValueAtTime(f,T);if(sl)o.frequency.exponentialRampToValueAtTime(M.max(30,f+sl),T+d);g.gain.setValueAtTime(v,T);g.gain.exponentialRampToValueAtTime(.001,T+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(T+d)}catch(e){}}
function startMusic(){if(!ac||bgOsc)return;try{
  bgGain=ac.createGain();bgGain.gain.value=.035;bgGain.connect(ac.destination);
  bgOsc=ac.createOscillator();bgOsc.type='sawtooth';bgOsc.frequency.value=55;bgOsc.connect(bgGain);bgOsc.start();
  const lfo=ac.createOscillator();lfo.frequency.value=.15;const lg=ac.createGain();lg.gain.value=8;lfo.connect(lg);lg.connect(bgOsc.frequency);lfo.start();
}catch(e){}}
function stopMusic(){try{bgOsc&&bgOsc.stop();bgOsc=null;bgGain=null}catch(e){}}
function setMusicRate(r){musicRate=r;if(bgOsc)try{bgOsc.frequency.value=55*r}catch(e){}}

// ---------- 3D math ----------
const NEAR=.12;let CX=0,CY=1.6,CZ=0,cY=1,sY=0,cP=1,sP=0;
function setCam(){CX=pos.x;CY=pos.y+1.6;CZ=pos.z;cY=M.cos(yaw);sY=M.sin(yaw);cP=M.cos(pitch);sP=M.sin(pitch)}
function tr(x,y,z){const dx=x-CX,dy=y-CY,dz=z-CZ,z0=-dx*sY-dz*cY;return[dx*cY-dz*sY,dy*cP-z0*sP,dy*sP+z0*cP]}
function sc(v){return[W/2+v[0]/v[2]*F,H/2-v[1]/v[2]*F]}
function clipP(vs){const o=[];for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length],ai=a[2]>=NEAR,bi=b[2]>=NEAR;if(ai)o.push(a);if(ai!==bi){const t=(NEAR-a[2])/(b[2]-a[2]);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR])}}return o}
function shade(c,l,z,w){const th=THEMES[theme],f=clamp((z-6)/42,0,.88),o=[];for(let i=0;i<3;i++){let v=c[i]*l;v+=(255-v)*(w||0);v+=(th.bg[i]-v)*f;o.push(v|0)}return'rgb('+o+')'}
function poly(vs,fill,stroke){vs=clipP(vs);if(vs.length<3)return;ctx.beginPath();for(let i=0;i<vs.length;i++){const p=sc(vs[i]);i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])}ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke()}}
function line3(a,b,style,lw){let ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(!ia&&!ib)return;if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]),m=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR];if(ia)b=m;else a=m}
  const p=sc(a),q=sc(b),z=(a[2]+b[2])/2,al=clamp(1-(z-6)/45,.05,1);ctx.globalAlpha=al;ctx.strokeStyle=style;ctx.lineWidth=lw||1;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();ctx.globalAlpha=1}
const FC=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]];
const LD=[.4,.8,.45];
function box(cx,cy,cz,hx,hy,hz,a,color,w,eyes){
  const ca=M.cos(a),sa=M.sin(a),W3=(x,y,z)=>tr(cx+(x*ca+z*sa)*hx,cy+y*hy,cz+(-x*sa+z*ca)*hz);
  FC.forEach((f,i)=>{const n=f[0],nx=n[0]*ca+n[2]*sa,nz=-n[0]*sa+n[2]*ca,ny=n[1];
    const fx=cx+nx*hx,fy=cy+ny*hy,fz=cz+nz*hz;if(nx*(CX-fx)+ny*(CY-fy)+nz*(CZ-fz)<=0)return;
    const l=.42+.58*M.max(0,nx*LD[0]+ny*LD[1]+nz*LD[2]),z=tr(fx,fy,fz)[2];
    poly(f[1].map(v=>W3(v[0],v[1],v[2])),shade(color,l,z,w),'rgba(0,0,0,.4)');
    if(eyes&&i===0){const q=(x,y,s,c)=>poly([[x-s,y-s,1.02],[x+s,y-s,1.02],[x+s,y+s,1.02],[x-s,y+s,1.02]].map(v=>W3(v[0],v[1],v[2])),c);
      [-.45,.45].forEach(x=>{q(x,.2,.26,'#fff');q(x,.2,.12,'#000')})}})}
function sq(x,y,z,s,color){const v=tr(x,y,z);if(v[2]<NEAR)return;const p=sc(v),r=F*s/v[2];ctx.fillStyle=color;ctx.fillRect(p[0]-r/2,p[1]-r/2,r,r)}

// ---------- world drawing ----------
function drawWorld(){
  const th=THEMES[theme];
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,th.sky0);g.addColorStop(1,th.sky1);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  poly([[-MAP,0,-MAP],[MAP,0,-MAP],[MAP,0,MAP],[-MAP,0,MAP]].map(v=>tr(v[0],v[1],v[2])),th.floor);
  for(let i=-MAP;i<=MAP;i+=2){const c=i%10?th.grid:th.gridH;line3(tr(i,0,-MAP),tr(i,0,MAP),c);line3(tr(-MAP,0,i),tr(MAP,0,i),c)}
  // walls
  [[-MAP,-MAP,MAP,-MAP],[MAP,-MAP,MAP,MAP],[MAP,MAP,-MAP,MAP],[-MAP,MAP,-MAP,-MAP]].forEach(([x1,z1,x2,z2])=>{
    poly([tr(x1,0,z1),tr(x2,0,z2),tr(x2,5,z2),tr(x1,5,z1)],th.wall);
    for(let k=0;k<=10;k++){const t=k/10,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;line3(tr(x,0,z),tr(x,5,z),'#2c3f86')}
    line3(tr(x1,.08,z1),tr(x2,.08,z2),th.line1,2);line3(tr(x1,4.8,z1),tr(x2,4.8,z2),th.line2,2)});
  // raised platforms
  [[-22,-8,4],[22,8,4],[0,22,3],[-10,-20,3]].forEach(([px,pz,h])=>{
    poly([[px-3,h,pz-3],[px+3,h,pz-3],[px+3,h,pz+3],[px-3,h,pz+3]].map(v=>tr(v[0],v[1],v[2])),'#1a2540');
    [[-3,-3,3,-3],[3,-3,3,3],[3,3,-3,3],[-3,3,-3,-3]].forEach(([a,b,c,d])=>{
      poly([tr(px+a,0,pz+b),tr(px+c,0,pz+d),tr(px+c,h,pz+d),tr(px+a,h,pz+b)],'#243050')})});
  const obj=[];
  pil.forEach(p=>{const z=tr(p.x,1.5,p.z)[2];if(z>-3)obj.push({z,d:()=>box(p.x,1.5,p.z,1,1.5,1,0,[70,95,170],0,false)})});
  ens.forEach(e=>{const z=tr(e.x,e.y,e.z)[2];if(z>-3)obj.push({z,d:()=>box(e.x,e.y,e.z,e.s/2,e.s/2,e.s/2,e.a,e.c,e.w,true)})});
  projs.forEach(p=>{const z=tr(p.x,p.y,p.z)[2];obj.push({z,d:()=>{sq(p.x,p.y,p.z,.7,'rgba(255,160,40,.35)');sq(p.x,p.y,p.z,.32,'#ffd27a')}})});
  pk.forEach(p=>{const y=.45+M.sin(p.age*4)*.12,z=tr(p.x,y,p.z)[2];
    const col=p.t==='h'?[60,255,140]:p.t==='r'?[255,210,60]:p.t==='s'?[80,180,255]:p.t==='t'?[180,100,255]:p.t==='b'?[255,80,40]:[255,160,255];
    obj.push({z,d:()=>box(p.x,y,p.z,.22,.22,.22,p.age*2.5,col,.35,false)})});
  parts.forEach(p=>{const z=tr(p.x,p.y,p.z)[2];obj.push({z,d:()=>sq(p.x,p.y,p.z,.18*clamp(p.l*1.6,0,1),p.c)})});
  obj.sort((a,b)=>b.z-a.z).forEach(o=>o.d());
  tracers.forEach(t=>{const v=tr(t.x,t.y,t.z);if(v[2]<NEAR)return;const p=sc(v);ctx.globalAlpha=clamp(t.t/.07,0,1);ctx.strokeStyle=t.laser?'#ff4060':'#ffe9a0';ctx.lineWidth=t.laser?3:2;ctx.beginPath();ctx.moveTo(W*.64,H*.8);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.globalAlpha=1});
  // floating damage numbers
  dmgTxt.forEach(d=>{const v=tr(d.x,d.y,d.z);if(v[2]<NEAR)return;const p=sc(v);ctx.globalAlpha=clamp(d.l,0,1);ctx.fillStyle=d.hs?'#ffee44':'#ff8866';ctx.font='bold '+(d.hs?22:16)+'px system-ui';ctx.textAlign='center';ctx.fillText((d.hs?'💥':'')+d.n,p[0],p[1]);ctx.globalAlpha=1});
}
function drawGun(){
  const bx=W*.64,dip=S.reload>0?M.sin(clamp(1-S.reload/WP[S.wp].rl,0,1)*M.PI)*H*.25:0,by=H*.64+recoil*H*.035+dip+M.abs(M.cos(bob))*4,sw=M.sin(bob)*6;
  ctx.save();ctx.translate(sw,0);
  ctx.fillStyle='#1d2238';ctx.beginPath();ctx.moveTo(bx-16,by+H*.1);ctx.lineTo(bx+16,by+H*.1);ctx.lineTo(bx+40,H+10);ctx.lineTo(bx-40,H+10);ctx.fill();
  ctx.fillStyle='#39425f';ctx.fillRect(bx-22,by+H*.02,44,H*.14);ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.strokeRect(bx-22,by+H*.02,44,H*.14);
  ctx.fillStyle='#99a3c7';ctx.fillRect(bx-WP[S.wp].gw/2,by-H*.08,WP[S.wp].gw,H*.12);ctx.fillStyle='#232a44';ctx.fillRect(bx-3,by-H*.09,6,H*.02);
  if(flashT>0){ctx.fillStyle='rgba(255,210,90,.95)';ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*M.PI*2,r=i%2?16:36;ctx.lineTo(bx+M.cos(a)*r,by-H*.1+M.sin(a)*r)}ctx.fill()}
  ctx.restore();
  // shield visual
  if(S.shield>0){ctx.strokeStyle='rgba(80,180,255,'+(0.35+0.25*M.sin(performance.now()/120))+')';ctx.lineWidth=6;ctx.strokeRect(8,8,W-16,H-16)}
}

function drawRadar(){const cx=78,cy=122,R=62,k=2.2;ctx.save();ctx.fillStyle='rgba(8,14,34,.7)';ctx.beginPath();ctx.arc(cx,cy,R,0,6.283);ctx.fill();ctx.strokeStyle='#35e6ff';ctx.lineWidth=1.5;ctx.stroke();
  const dot=(x,z,c,s)=>{const dx=x-pos.x,dz=z-pos.z;let px=(dx*cY-dz*sY)*k,py=(dx*sY+dz*cY)*k;const m=M.hypot(px,py);if(m>R-4){px*=(R-4)/m;py*=(R-4)/m}ctx.fillStyle=c;ctx.fillRect(cx+px-s/2,cy+py-s/2,s,s)};
  ens.forEach(e=>dot(e.x,e.z,e.boss?'#c07bff':e.kamikaze?'#ffaa00':e.ghost?'#a0a0ff':e.nest?'#80ff80':'#ff4d6d',e.boss?9:5));
  pk.forEach(p=>dot(p.x,p.z,p.t==='h'?'#3dffa0':'#ffd23c',4));
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx-4,cy+4);ctx.lineTo(cx+4,cy+4);ctx.fill();ctx.restore();
  const b=ens.find(e=>e.boss);if(b){const w=M.min(W*.5,360);ctx.fillStyle='#0008';ctx.fillRect(W/2-w/2,H*.08-6,w,12);ctx.fillStyle='#c07bff';ctx.fillRect(W/2-w/2,H*.08-6,w*clamp(b.hp/b.mh,0,1),12);
    // phase markers
    ctx.fillStyle='#fff8';ctx.fillRect(W/2-w/2+w*.5-1,H*.08-8,2,16);ctx.fillRect(W/2-w/2+w*.25-1,H*.08-8,2,16)}}

// ---------- game logic ----------
function col(p,r){for(const q of pil){const dx=p.x-q.x,dz=p.z-q.z,ox=1+r-M.abs(dx),oz=1+r-M.abs(dz);if(ox>0&&oz>0){if(ox<oz)p.x+=M.sign(dx||1)*ox;else p.z+=M.sign(dz||1)*oz}}
  // platforms
  [[-22,-8,4],[22,8,4],[0,22,3],[-10,-20,3]].forEach(([px,pz,h])=>{
    if(M.abs(p.x-px)<3.2+r&&M.abs(p.z-pz)<3.2+r&&p.y<h+.2&&p.y>h-1.2){p.y=h;if(p===pos)vy=0}});
  p.x=clamp(p.x,-MAP+.8+r,MAP-.8-r);p.z=clamp(p.z,-MAP+.8+r,MAP-.8-r)}
function spawn(near,boss,forceType){
  const r=M.random(),a=M.random()*6.283,d=boss?14:near?5+M.random()*4:10+M.random()*14;
  const p={x:pos.x+M.sin(a)*d,z:pos.z+M.cos(a)*d};col(p,boss?1.5:.6);
  let t={c:[255,77,109],hp:3,sh:0,sp:2.3+S.wave*.18,S:1,md:8,pts:100};
  if(boss)t={c:[160,60,255],hp:28+S.wave*5,sh:0,sp:1.55,S:2.7,md:32,pts:1200,boss:1,phase:0};
  else if(forceType==='k'|| (S.wave>=3&&r<.12))t={c:[255,140,20],hp:2.5,sh:0,sp:4.2+S.wave*.15,S:.85,md:18,pts:180,kamikaze:1};
  else if(forceType==='n'|| (S.wave>=4&&r<.1))t={c:[80,220,100],hp:7,sh:0,sp:1.3,S:1.5,md:12,pts:220,nest:1};
  else if(forceType==='g'|| (S.wave>=5&&r<.11))t={c:[140,140,255],hp:4,sh:0,sp:2.8,S:1.1,md:10,pts:200,ghost:1,vis:1};
  else if(S.wave>=3&&r<.14)t={c:[130,90,230],hp:9,sh:0,sp:1.4,S:1.6,md:18,pts:250};
  else if(S.wave>=2&&r<.28)t={c:[255,230,60],hp:1.5,sh:0,sp:5+S.wave*.15,S:.7,md:6,pts:120};
  else if(r>.72-M.min(S.wave*.03,.22))t={c:[255,159,28],hp:2,sh:1,sp:1.6,S:1,md:8,pts:150};
  ens.push(Object.assign({x:p.x,y:.1,z:p.z,s:.2,a:0,age:0,cd:1+M.random()*1.5,hit:0,w:1,mh:t.hp},t));
  snd(boss?90:180,boss?.6:.3,boss?'sawtooth':'sine',.14,600)}
function burst(x,y,z,c,n,sp){for(let i=0;i<n;i++)parts.push({x,y,z,vx:(M.random()-.5)*sp,vy:M.random()*sp*.8,vz:(M.random()-.5)*sp,l:.7+M.random()*.4,c})}
function addDmg(x,y,z,n,hs){dmgTxt.push({x,y:y+.6,z,n:M.round(n*10)/10,l:1,hs:!!hs,vy:1.8})}
function dmg(n){if(!S.playing)return;if(S.shield>0){S.shield=M.max(0,S.shield-n*.4);shake=.12;snd(400,.08,'triangle',.1);return}
  S.hp=M.max(0,S.hp-n);shake=.28;$('vg').style.opacity=1;snd(90,.25,'sawtooth',.2,-40);upd();if(S.hp<=0)over()}
function sw(i){if(!S.playing||i===S.wp||i>=WP.length)return;S.wp=i;S.ammo=WP[i].mag;S.reload=0;S.fire=.2;snd(260,.1,'triangle',.1,200);upd()}
function reload(){const w=WP[S.wp];if(S.reload>0||S.ammo===w.mag||!S.playing)return;S.reload=w.rl*(S.reloadMul||1);snd(300,.15,'triangle',.1,200);upd()}
function banner(t){const b=$('bn');b.textContent=t;b.style.opacity=1;clearTimeout(banner.t);banner.t=setTimeout(()=>b.style.opacity=0,2000)}
function slab(o,d,h){let t0=0,t1=1e9;for(let i=0;i<3;i++){if(M.abs(d[i])<1e-9){if(M.abs(o[i])>h[i])return Infinity}else{let a=(-h[i]-o[i])/d[i],b=(h[i]-o[i])/d[i];if(a>b){const t=a;a=b;b=t}t0=M.max(t0,a);t1=M.min(t1,b);if(t0>t1)return Infinity}}return t0}
function shoot(){
  const w=WP[S.wp];if(!S.playing||S.fire>0||S.reload>0)return;
  if(S.ammo<=0){reload();return}
  S.ammo--;S.fire=w.rate/(S.rage>0?2:1);recoil=w.pel>1||w.grenade?1.8:1;flashT=.05;
  snd(w.grenade?120:w.laser?600:w.pel>1?200:420,.12,w.laser?'sine':'sawtooth',.14,w.laser?-100:-300);
  const o=[CX,CY,CZ];let hit=0;
  // grenade special
  if(w.grenade){
    const d=[-sY*cP,sP,-cY*cP];const n=M.hypot(...d);d[0]/=n;d[1]/=n;d[2]/=n;
    const gx=o[0]+d[0]*2,gy=o[1]+d[1]*2,gz=o[2]+d[2]*2;
    projs.push({x:gx,y:gy,z:gz,vx:d[0]*18,vy:d[1]*18+2,vz:d[2]*18,l:2.2,grenade:1,owner:'p'});
    if(S.ammo===0)reload();upd();return;
  }
  for(let k=0;k<w.pel;k++){
    const sx=(M.random()-.5)*2*w.spr,sy=(M.random()-.5)*2*w.spr;
    let d=[-sY*cP+cY*sx+sY*sP*sy,sP+cP*sy,-cY*cP-sY*sx+cY*sP*sy];const n=M.hypot(d[0],d[1],d[2]);d=d.map(v=>v/n);
    let best=Infinity,be=null,wall=Infinity;
    ens.forEach(e=>{if(e.age<.12||(e.ghost&&e.vis<.3))return;const ca=M.cos(e.a),sa=M.sin(e.a),rx=o[0]-e.x,ry=o[1]-e.y,rz=o[2]-e.z;
      const t=slab([rx*ca-rz*sa,ry,rx*sa+rz*ca],[d[0]*ca-d[2]*sa,d[1],d[0]*sa+d[2]*ca],[e.s/2,e.s/2,e.s/2]);if(t<best){best=t;be=e}});
    pil.forEach(p=>{const t=slab([o[0]-p.x,o[1]-1.5,o[2]-p.z],d,[1,1.5,1]);if(t<wall)wall=t});
    if(wall<best){be=null;best=wall}
    const T=M.min(best,50),hx=o[0]+d[0]*T,hy=o[1]+d[1]*T,hz=o[2]+d[2]*T;
    tracers.push({x:hx,y:hy,z:hz,t:.07,laser:!!w.laser});
    if(be){
      const dmgAmt=(w.dm*(S.dmgMul||1))*(S.rage>0?1.3:1);
      const hs=hy>be.y+be.s*.25; // headshot-ish
      const final=dmgAmt*(hs?1.6:1);
      be.hp-=final;be.hit=.14;be.x+=d[0]*.18;be.z+=d[2]*.18;col(be,.5);
      burst(hx,hy,hz,hs?'#ffee88':'#ffe066',hs?8:4,3);addDmg(be.x,be.y,be.z,final,hs);
      hit=1;if(hs)snd(800,.1,'square',.15);if(be.hp<=0)kill(be)
    }else if(best<1e8)burst(hx,hy,hz,'#8899cc',2,2)}
  if(hit){const hm=$('hm');hm.style.opacity=1;setTimeout(()=>hm.style.opacity=0,90);snd(150,.08,'square',.12);shake=M.max(shake,.08)}
  if(S.ammo===0)reload();upd()}
function kill(e){
  burst(e.x,e.y,e.z,'rgb('+e.c+')',e.boss?80:e.nest?30:18,e.boss?11:6);
  burst(e.x,e.y,e.z,'#fff',8,5);ens.splice(ens.indexOf(e),1);
  S.combo++;S.ct=3.2;S.score+=e.pts*mult();S.kills++;coins+=e.boss?15:e.nest?4:2;
  try{localStorage.setItem('cs_coins',coins)}catch(_){}
  snd(320,.25,'triangle',.16,-220);
  // nest spawns small cubes
  if(e.nest){for(let i=0;i<3;i++){const a=M.random()*6.28;ens.push({x:e.x+M.cos(a)*1.2,y:.3,z:e.z+M.sin(a)*1.2,s:.4,a:0,age:.3,cd:1,hit:0,w:.5,c:[100,255,120],hp:1.2,sh:0,sp:3.5,S:.55,md:5,pts:40,mh:1.2})}}
  // drop powerups (more variety)
  if(M.random()<(e.boss?1:.32)){
    const types=['h','h','r','s','t','b','m'];const t=types[M.random()*types.length|0];
    pk.push({x:e.x,z:e.z,t,age:0})}
  if(e.boss){S.hp=S.mhp;banner('🏆 دمّرت الزعيم!');coins+=25}
  else if(S.kills>=6+S.wave*3){S.wave++;S.kills=0;S.hp=M.min(S.mhp,S.hp+30);setMusicRate(1+S.wave*.04);
    if(S.wave%5===0){spawn(0,1);banner('👹 زعيم! الموجة '+S.wave)}
    else{banner('الموجة '+S.wave+' 🔥');showUpgrades()}}
  upd()}
function showUpgrades(){
  // pause and show 3 choices
  S.playing=false;holdFire=false;
  const pool=[
    {id:'dmg',t:'💥 ضرر +25%',f:()=>{S.dmgMul=(S.dmgMul||1)*1.25}},
    {id:'rl',t:'⚡ تعبئة أسرع',f:()=>{S.reloadMul=(S.reloadMul||1)*.75}},
    {id:'hp',t:'❤ صحة قصوى +30',f:()=>{S.mhp+=30;S.hp=M.min(S.mhp,S.hp+30)}},
    {id:'dj',t:'🦘 قفزة مزدوجة',f:()=>{S.dj=1}},
    {id:'spd',t:'🏃 سرعة حركة',f:()=>{S.spdBoost=1}},
    {id:'mag',t:'🧲 مغناطيس دائم أقوى',f:()=>{S.magnet=999}}
  ];
  const picks=[];while(picks.length<3){const c=pool[M.random()*pool.length|0];if(!picks.find(p=>p.id===c.id))picks.push(c)}
  const ov=$('ov');ov.style.display='flex';$('t').textContent='ترقية الموجة '+S.wave;
  $('d').innerHTML='اختار واحدة:<br><br>'+picks.map((p,i)=>'<button class="upg" data-i="'+i+'" style="margin:6px;display:block;width:100%">'+p.t+'</button>').join('');
  $('go').style.display='none';
  ov.querySelectorAll('.upg').forEach(btn=>{btn.onclick=()=>{picks[+btn.dataset.i].f();S.playing=true;ov.style.display='none';$('go').style.display='';banner('تم! 🔥');upd()}});
}
function upd(){$('sc').innerHTML='النقاط: '+S.score+'<br>الموجة: '+S.wave+'<br>🏆 '+best+(mult()>1?'<br>🔥 كومبو ×'+mult():'')+(coins?'<br>🪙 '+coins:'');
  $('am').textContent=S.reload>0?'⟳ تعبئة...':WP[S.wp].n+' '+S.ammo+' / '+WP[S.wp].mag+(S.rage>0?' ⚡':'')+(S.shield>0?' 🛡️':'')+(S.slow>0?' 🐌':'');
  const f=$('hpf');f.style.width=(S.hp/S.mhp*100)+'%';f.style.background=S.hp>S.mhp*.5?'var(--ok)':S.hp>S.mhp*.25?'#ffc233':'var(--ac)'}
function reset(){ens.length=projs.length=parts.length=tracers.length=dmgTxt.length=0;pk.length=0;
  Object.assign(S,{hp:100,mhp:100,score:0,wave:1,kills:0,ammo:12,wp:0,combo:0,ct:0,rage:0,reload:0,fire:0,amb:10,shield:0,slow:0,magnet:0,dj:0,dmgMul:1,reloadMul:1,spdBoost:0});
  pos.x=pos.y=pos.z=0;vy=0;yaw=0;pitch=0;spT=1;jumps=0;setMusicRate(1);upd()}
function lock(){if(touch)return;try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function start(){
  try{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();startMusic()}catch(e){}
  if(S.hp<=0||!S.started)reset();S.started=true;$('ov').style.display='none';S.playing=true;lock()}
function over(){S.playing=false;holdFire=false;stopMusic();if(S.score>best){best=S.score;try{localStorage.setItem('cs_best',best)}catch(e){}}
  if(document.exitPointerLock)document.exitPointerLock();$('t').textContent='خلصت! 💀';
  $('d').innerHTML='النقاط: <b>'+S.score+'</b> · وصلت للموجة <b>'+S.wave+'</b><br>🏆 أعلى نتيجة: <b>'+best+'</b><br>🪙 عملات: <b>'+coins+'</b>';
  $('go').textContent='العب تاني';$('go').style.display='';$('ov').style.display='flex'}
$('go').onclick=start;
document.addEventListener('pointerlockchange',()=>{const l=document.pointerLockElement===cv;if(locked&&!l&&S.playing){S.playing=false;holdFire=false;$('t').textContent='متوقفة ⏸';$('d').textContent='دوس كمّل وارجع للقتال';$('go').textContent='كمّل';$('ov').style.display='flex'}locked=l});

// ---------- input ----------
addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='KeyR')reload();
  if(e.code==='Digit1')sw(0);if(e.code==='Digit2')sw(1);if(e.code==='Digit3')sw(2);if(e.code==='Digit4')sw(3);if(e.code==='Digit5')sw(4);if(e.code==='Digit6')sw(5);
  if(e.code==='KeyQ')sw((S.wp+1)%WP.length);
  if(e.code==='Space'&&S.playing){if(pos.y<=0.05||(S.dj&&jumps<2)){vy=6.8;jumps++}}
  if(e.code==='KeyT'){theme=(theme+1)%THEMES.length;try{localStorage.setItem('cs_theme',theme)}catch(_){}banner(['🌃 نيون','🏜️ صحراء','🏭 مصنع'][theme])}
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousedown',e=>{if(!S.playing||touch)return;if(e.button===0){holdFire=true;if(!locked)lock()}});
addEventListener('mouseup',e=>{if(e.button===0)holdFire=false});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(S.playing&&(locked||(e.buttons&2))){yaw-=e.movementX*.0022;pitch=clamp(pitch-e.movementY*.0022,-1.4,1.4)}});
addEventListener('wheel',e=>sw((S.wp+(e.deltaY>0?1:WP.length-1))%WP.length));
$('sw').addEventListener('touchstart',e=>{e.preventDefault();sw((S.wp+1)%WP.length)},{passive:false});
const tm={};
addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.target.closest('button'))continue;tm[t.identifier]={x:t.clientX,y:t.clientY,lx:t.clientX,ly:t.clientY,L:t.clientX<innerWidth/2}}},{passive:false});
addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){const o=tm[t.identifier];if(!o)continue;if(o.L){mv.x=clamp((t.clientX-o.x)/45,-1,1);mv.y=clamp((o.y-t.clientY)/45,-1,1)}else{yaw-=(t.clientX-o.lx)*.006;pitch=clamp(pitch-(t.clientY-o.ly)*.006,-1.4,1.4);o.lx=t.clientX;o.ly=t.clientY}}},{passive:false});
const tend=e=>{for(const t of e.changedTouches){const o=tm[t.identifier];if(o&&o.L)mv.x=mv.y=0;delete tm[t.identifier]}};addEventListener('touchend',tend);addEventListener('touchcancel',tend);
$('fire').addEventListener('touchstart',e=>{e.preventDefault();holdFire=true},{passive:false});
['touchend','touchcancel'].forEach(n=>$('fire').addEventListener(n,()=>holdFire=false));
$('rel').addEventListener('touchstart',e=>{e.preventDefault();reload()},{passive:false});
$('jmp').addEventListener('touchstart',e=>{e.preventDefault();if(pos.y<=0.05||(S.dj&&jumps<2)){vy=6.8;jumps++}},{passive:false});

// ---------- loop ----------
let last=performance.now(),spT=1;
const eob=t=>{const c=1.70158;t-=1;return 1+(c+1)*t*t*t+c*t*t};
function update(dt){
  const timeScale=S.slow>0?.45:1;dt*=timeScale;
  if(keys.ArrowLeft)yaw+=2*dt;if(keys.ArrowRight)yaw-=2*dt;if(keys.ArrowUp)pitch=clamp(pitch+1.5*dt,-1.4,1.4);if(keys.ArrowDown)pitch=clamp(pitch-1.5*dt,-1.4,1.4);
  let f=(keys.KeyW?1:0)-(keys.KeyS?1:0)+mv.y,r=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mv.x;const l=M.hypot(f,r);if(l>1){f/=l;r/=l}
  const sp=(keys.ShiftLeft||keys.ShiftRight?9:5.5)*(S.spdBoost?1.35:1)*(S.rage>0?1.15:1);
  pos.x+=(-M.sin(yaw)*f+M.cos(yaw)*r)*sp*dt;pos.z+=(-M.cos(yaw)*f-M.sin(yaw)*r)*sp*dt;col(pos,.4);
  vy-=18*dt;pos.y=M.max(0,pos.y+vy*dt);if(pos.y<=0.05){pos.y=0;vy=0;jumps=0}bob+=l*sp*dt*1.6;
  S.fire=M.max(0,S.fire-dt);S.ct-=dt;if(S.ct<=0&&S.combo){S.combo=0;upd()}
  if(S.rage>0)S.rage-=dt;if(S.shield>0)S.shield-=dt;if(S.slow>0)S.slow-=dt;if(S.magnet>0&&S.magnet<900)S.magnet-=dt;
  if(S.reload>0){S.reload-=dt;if(S.reload<=0){S.ammo=WP[S.wp].mag;upd()}}
  if(holdFire)shoot();
  // magnet pull
  if(S.magnet>0)pk.forEach(p=>{const dx=pos.x-p.x,dz=pos.z-p.z,d=M.hypot(dx,dz);if(d<12){p.x+=dx/d*8*dt;p.z+=dz/d*8*dt}});
  spT-=dt;const mx=M.min(5+S.wave*2,18);if(spT<=0&&ens.length<mx){spawn(M.random()<.28);spT=M.max(.55,2.2-S.wave*.18)*(.7+M.random()*.55)}
  S.amb-=dt;if(S.amb<=0){S.amb=12+M.random()*6;banner('⚠ كمين!');for(let i=0;i<3&&ens.length<mx+4;i++)spawn(true)}
  // enemies
  for(const e of ens.slice()){
    e.age+=dt;const dx=pos.x-e.x,dz=pos.z-e.z,d=M.hypot(dx,dz)||1;e.a=M.atan2(dx,dz);e.hit=M.max(0,e.hit-dt);let w=e.hit>0?.8:0;
    // boss phases
    if(e.boss){
      if(e.phase===0&&e.hp<e.mh*.5){e.phase=1;e.sp*=1.45;banner('👹 الزعيم زعل!');snd(60,.5,'sawtooth',.2,200)}
      if(e.phase===1&&e.hp<e.mh*.25){e.phase=2;e.sp*=1.2;banner('🔥 استدعاء مكعبات!');for(let i=0;i<5;i++)spawn(true,false,'k')}}
    // ghost visibility
    if(e.ghost){e.vis=0.25+0.75*(0.5+0.5*M.sin(e.age*1.8));w=M.max(w,1-e.vis)}
    if(e.age<.45){const k=e.age/.45;e.s=M.max(.2,.2+(e.S-.2)*eob(k));e.y=e.s/2+.9*M.sin(k*M.PI)*(1-k);w=M.max(w,1-k)}
    else{e.s=e.S;const spd=e.sp;let dir=1;if(e.sh)dir=d>10?1:d<6?-1:0;
      if(e.kamikaze)dir=1;
      e.x+=dx/d*spd*dir*dt+(e.sh&&!dir?-dz/d*1.4*dt:0);e.z+=dz/d*spd*dir*dt+(e.sh&&!dir?dx/d*1.4*dt:0);col(e,.5);
      e.y=.5+M.abs(M.sin(e.age*7))*.25;e.cd-=dt;
      // kamikaze explode
      if(e.kamikaze&&d<1.8){burst(e.x,e.y,e.z,'#ff8800',40,9);dmg(22);ens.splice(ens.indexOf(e),1);snd(80,.4,'sawtooth',.25,-60);continue}
      if(!e.sh&&!e.kamikaze&&d<e.S/2+.9&&e.cd<=0){e.cd=.9;dmg(e.md);e.x-=dx/d*.6;e.z-=dz/d*.6}
      if((e.sh||e.boss)&&e.cd<=0&&d<24){e.cd=e.boss?1.5:2.1;for(let q=e.boss?-1:0;q<=(e.boss?1:0);q++){const vx=pos.x-e.x,vy2=CY-.3-e.y,vz=pos.z-e.z,n=M.hypot(vx,vy2,vz)||1;projs.push({x:e.x,y:e.y,z:e.z,vx:vx/n*11+q*3.2*cY,vy:vy2/n*11,vz:vz/n*11-q*3.2*sY,l:4})}}}
    e.w=w}
  // pickups
  for(let i=pk.length-1;i>=0;i--){const p=pk[i];p.age+=dt;
    if(M.hypot(p.x-pos.x,p.z-pos.z)<1.1){
      if(p.t==='h'){S.hp=M.min(S.mhp,S.hp+28);banner('❤ +28 صحة')}
      else if(p.t==='r'){S.rage=9;banner('⚡ نار سريعة!')}
      else if(p.t==='s'){S.shield=8;banner('🛡️ درع 8 ثواني')}
      else if(p.t==='t'){S.slow=6;banner('🐌 زمن بطيء!')}
      else if(p.t==='b'){banner('💣 قنبلة!');ens.slice().forEach(e=>{if(M.hypot(e.x-pos.x,e.z-pos.z)<9){e.hp-=12;burst(e.x,e.y,e.z,'#ff4400',15,6);if(e.hp<=0)kill(e)}});shake=.4;snd(70,.5,'sawtooth',.22,-80)}
      else if(p.t==='m'){S.magnet=10;banner('🧲 مغناطيس!')}
      snd(600,.2,'sine',.15,400);pk.splice(i,1);upd()
    }else if(p.age>16)pk.splice(i,1)}
  // projectiles (enemy + grenades)
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.l-=dt;p.vy-=(p.grenade?12:0)*dt;
    if(p.grenade){
      if(p.y<.2||p.l<=0){ // explode
        burst(p.x,p.y,p.z,'#ff6600',50,10);shake=.35;snd(90,.4,'sawtooth',.2,-100);
        ens.slice().forEach(e=>{const dd=M.hypot(e.x-p.x,e.z-p.z);if(dd<6){e.hp-=18*(1-dd/6);burst(e.x,e.y,e.z,'#ffaa44',10,5);if(e.hp<=0)kill(e)}});
        projs.splice(i,1);continue}
    }else if(M.hypot(p.x-CX,p.y-(CY-.4),p.z-CZ)<.85){dmg(11);p.l=0}
    if(p.l<=0)projs.splice(i,1)}
  // dmg text
  for(let i=dmgTxt.length-1;i>=0;i--){const d=dmgTxt[i];d.y+=d.vy*dt;d.l-=dt*1.4;if(d.l<=0)dmgTxt.splice(i,1)}
}
function loop(now){requestAnimationFrame(loop);const dt=M.min((now-last)/1000,.05);last=now;
  if(S.playing)update(dt);else{menuT+=dt;if(!S.started)yaw+=dt*.22}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.vy-=14*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.08){p.y=.08;p.vy*=-.3;p.vx*=.6;p.vz*=.6}p.l-=dt;if(p.l<=0)parts.splice(i,1)}
  for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0)tracers.splice(i,1)}
  recoil=M.max(0,recoil-dt*8);flashT=M.max(0,flashT-dt);shake=M.max(0,shake-dt);
  const v=$('vg');if(+v.style.opacity>0)v.style.opacity=M.max(0,+v.style.opacity-dt*1.5);
  setCam();ctx.save();if(shake>0)ctx.translate((M.random()-.5)*shake*32,(M.random()-.5)*shake*32);
  try{drawWorld();drawGun();drawRadar()}catch(e){console.error(e)}ctx.restore()}
upd();requestAnimationFrame(loop);
