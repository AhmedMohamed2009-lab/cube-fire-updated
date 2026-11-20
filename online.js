'use strict';
// ===== مكعبات النار أونلاين – نسخة محسّنة =====
const $=id=>document.getElementById(id),M=Math,clamp=(v,a,b)=>M.max(a,M.min(b,v));
const cv=$('c'),ctx=cv.getContext('2d');
const touch=matchMedia('(pointer:coarse)').matches;if(touch)$('tc').style.display='block';
let W=0,H=0,F=0;
function resize(){const d=M.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);F=H*.75}
addEventListener('resize',resize);resize();

// ---------- audio ----------
let ac;function snd(f,d,t='square',v=.1,sl=0){if(!ac)return;try{const T=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.setValueAtTime(f,T);if(sl)o.frequency.exponentialRampToValueAtTime(M.max(30,f+sl),T+d);g.gain.setValueAtTime(v,T);g.gain.exponentialRampToValueAtTime(.001,T+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(T+d)}catch(e){}}

// ---------- 3D math ----------
const NEAR=.12,BG=[8,11,24];let CX=0,CY=1.6,CZ=0,cY=1,sY=0,cP=1,sP=0;
function setCam(){CX=pos.x;CY=pos.y+1.6;CZ=pos.z;cY=M.cos(yaw);sY=M.sin(yaw);cP=M.cos(pitch);sP=M.sin(pitch)}
function tr(x,y,z){const dx=x-CX,dy=y-CY,dz=z-CZ,z0=-dx*sY-dz*cY;return[dx*cY-dz*sY,dy*cP-z0*sP,dy*sP+z0*cP]}
function sc(v){return[W/2+v[0]/v[2]*F,H/2-v[1]/v[2]*F]}
function clipP(vs){const o=[];for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length],ai=a[2]>=NEAR,bi=b[2]>=NEAR;if(ai)o.push(a);if(ai!==bi){const t=(NEAR-a[2])/(b[2]-a[2]);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR])}}return o}
function shade(c,l,z,w){let f=clamp((z-6)/42,0,.88),o=[];for(let i=0;i<3;i++){let v=c[i]*l;v+=(255-v)*(w||0);v+=(BG[i]-v)*f;o.push(v|0)}return'rgb('+o+')'}
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

const MAP=30;
const pil=[[-10,-10],[10,-10],[-10,10],[10,10],[0,-16],[0,16],[-16,0],[16,0],[-6,4],[6,-4],[-14,7],[14,-7],[7,14],[-7,-14],[4,4],[-4,-4],[18,8],[-18,-8]].map(([x,z])=>({x,z}));

// ---------- world drawing ----------
function drawWorld(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#04060d');g.addColorStop(1,'#141b3d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  poly([[-MAP,0,-MAP],[MAP,0,-MAP],[MAP,0,MAP],[-MAP,0,MAP]].map(v=>tr(v[0],v[1],v[2])),'#101830');
  for(let i=-MAP;i<=MAP;i+=2){const c=i%10?'#2a4a9a':'#4f7bff';line3(tr(i,0,-MAP),tr(i,0,MAP),c);line3(tr(-MAP,0,i),tr(MAP,0,i),c)}
  [[-MAP,-MAP,MAP,-MAP],[MAP,-MAP,MAP,MAP],[MAP,MAP,-MAP,MAP],[-MAP,MAP,-MAP,-MAP]].forEach(([x1,z1,x2,z2])=>{
    poly([tr(x1,0,z1),tr(x2,0,z2),tr(x2,5,z2),tr(x1,5,z1)],'#17204a');
    for(let k=0;k<=10;k++){const t=k/10,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;line3(tr(x,0,z),tr(x,5,z),'#2c3f86')}
    line3(tr(x1,.08,z1),tr(x2,.08,z2),'#35e6ff',2);line3(tr(x1,4.8,z1),tr(x2,4.8,z2),'#ff4d9d',2)});
  // platforms
  [[-20,-6,3.5],[20,6,3.5],[0,20,3]].forEach(([px,pz,h])=>{
    poly([[px-2.8,h,pz-2.8],[px+2.8,h,pz-2.8],[px+2.8,h,pz+2.8],[px-2.8,h,pz+2.8]].map(v=>tr(v[0],v[1],v[2])),'#1a2540')});
  const obj=[];
  pil.forEach(p=>{const z=tr(p.x,1.5,p.z)[2];if(z>-3)obj.push({z,d:()=>box(p.x,1.5,p.z,1,1.5,1,0,[70,95,170],0,false)})});
  ens.forEach(e=>{const z=tr(e.x,e.y,e.z)[2];if(z>-3)obj.push({z,d:()=>box(e.x,e.y,e.z,e.s/2,e.s/2,e.s/2,e.a,e.c,e.w,true)})});
  projs.forEach(p=>{const z=tr(p.x,p.y,p.z)[2];obj.push({z,d:()=>{sq(p.x,p.y,p.z,.7,'rgba(255,160,40,.35)');sq(p.x,p.y,p.z,.32,'#ffd27a')}})});
  parts.forEach(p=>{const z=tr(p.x,p.y,p.z)[2];obj.push({z,d:()=>sq(p.x,p.y,p.z,.18*clamp(p.l*1.6,0,1),p.c)})});
  obj.sort((a,b)=>b.z-a.z).forEach(o=>o.d());
  tracers.forEach(t=>{const v=tr(t.x,t.y,t.z);if(v[2]<NEAR)return;const p=sc(v);ctx.globalAlpha=clamp(t.t/.07,0,1);ctx.strokeStyle='#ffe9a0';ctx.lineWidth=2;ctx.beginPath();let mx=W*.64,my=H*.8;if(t.ox!==undefined){const o=tr(t.ox,t.oy,t.oz);if(o[2]>=NEAR){const q=sc(o);mx=q[0];my=q[1]}}ctx.moveTo(mx,my);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.globalAlpha=1});
  // floating dmg
  dmgTxt.forEach(d=>{const v=tr(d.x,d.y,d.z);if(v[2]<NEAR)return;const p=sc(v);ctx.globalAlpha=clamp(d.l,0,1);ctx.fillStyle=d.hs?'#ffee44':'#ff8866';ctx.font='bold '+(d.hs?20:15)+'px system-ui';ctx.textAlign='center';ctx.fillText((d.hs?'💥':'')+d.n,p[0],p[1]);ctx.globalAlpha=1});
}
function drawGun(){
  const bx=W*.64,dip=S.reload>0?M.sin(clamp(1-S.reload/WP[S.wp].rl,0,1)*M.PI)*H*.25:0,by=H*.64+recoil*H*.035+dip+M.abs(M.cos(bob))*4,sw=M.sin(bob)*6;
  ctx.save();ctx.translate(sw,0);
  ctx.fillStyle='#1d2238';ctx.beginPath();ctx.moveTo(bx-16,by+H*.1);ctx.lineTo(bx+16,by+H*.1);ctx.lineTo(bx+40,H+10);ctx.lineTo(bx-40,H+10);ctx.fill();
  ctx.fillStyle='#39425f';ctx.fillRect(bx-22,by+H*.02,44,H*.14);ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.strokeRect(bx-22,by+H*.02,44,H*.14);
  ctx.fillStyle='#99a3c7';ctx.fillRect(bx-WP[S.wp].gw/2,by-H*.08,WP[S.wp].gw,H*.12);ctx.fillStyle='#232a44';ctx.fillRect(bx-3,by-H*.09,6,H*.02);
  if(flashT>0){ctx.fillStyle='rgba(255,210,90,.95)';ctx.beginPath();for(let i=0;i<16;i++){const a=i/16*M.PI*2,r=i%2?16:36;ctx.lineTo(bx+M.cos(a)*r,by-H*.1+M.sin(a)*r)}ctx.fill()}
  ctx.restore();
  if(S.streak>=3){ctx.fillStyle='rgba(255,80,80,.25)';ctx.fillRect(0,0,W,H*.04);ctx.fillStyle='#ff6';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText('🔥 '+S.streak+' Kill Streak!',W/2,28)}
}

// ---------- input ----------
addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='KeyR')reload();if(e.code==='Digit1')sw(0);if(e.code==='Digit2')sw(1);if(e.code==='Digit3')sw(2);if(e.code==='KeyQ')sw((S.wp+1)%3);if(e.code==='Space'&&S.playing&&pos.y<=0)vy=6.5;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault()});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousedown',e=>{if(!S.playing||touch)return;if(e.button===0){holdFire=true;if(!locked)lock()}});
addEventListener('mouseup',e=>{if(e.button===0)holdFire=false});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(S.playing&&(locked||(e.buttons&2))){yaw-=e.movementX*.0022;pitch=clamp(pitch-e.movementY*.0022,-1.4,1.4)}});
addEventListener('wheel',e=>sw((S.wp+(e.deltaY>0?1:2))%3));
$('sw').addEventListener('touchstart',e=>{e.preventDefault();sw((S.wp+1)%3)},{passive:false});
const tm={};
addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.target.closest('button'))continue;tm[t.identifier]={x:t.clientX,y:t.clientY,lx:t.clientX,ly:t.clientY,L:t.clientX<innerWidth/2}}},{passive:false});
addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){const o=tm[t.identifier];if(!o)continue;if(o.L){mv.x=clamp((t.clientX-o.x)/45,-1,1);mv.y=clamp((o.y-t.clientY)/45,-1,1)}else{yaw-=(t.clientX-o.lx)*.006;pitch=clamp(pitch-(t.clientY-o.ly)*.006,-1.4,1.4);o.lx=t.clientX;o.ly=t.clientY}}},{passive:false});
const tend=e=>{for(const t of e.changedTouches){const o=tm[t.identifier];if(o&&o.L)mv.x=mv.y=0;delete tm[t.identifier]}};addEventListener('touchend',tend);addEventListener('touchcancel',tend);
$('fire').addEventListener('touchstart',e=>{e.preventDefault();holdFire=true},{passive:false});
['touchend','touchcancel'].forEach(n=>$('fire').addEventListener(n,()=>holdFire=false));
$('rel').addEventListener('touchstart',e=>{e.preventDefault();reload()},{passive:false});
$('jmp').addEventListener('touchstart',e=>{e.preventDefault();if(pos.y<=0)vy=6.5},{passive:false});

// ================= أونلاين (PeerJS) =================
const PAL=[[255,77,109],[61,200,255],[255,209,60],[110,255,130],[190,120,255],[255,150,60]];
const WP=[{n:'🔫 مسدس',mag:12,rate:.16,pel:1,spr:0,rl:1.1,gw:8,dm:28},{n:'💥 شوتجن',mag:6,rate:.7,pel:7,spr:.1,rl:1.5,gw:22,dm:13},{n:'⚡ رشاش',mag:30,rate:.08,pel:1,spr:.03,rl:1.4,gw:11,dm:11}];
const PC={config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]}};
const SP=[[-18,-18],[18,-18],[-18,18],[18,18],[0,-20],[0,20],[-20,0],[20,0],[-12,0],[12,0],[0,0],[-8,12],[8,-12]];
const pos={x:0,y:0,z:0};let yaw=0,pitch=0,vy=0,recoil=0,shake=0,flashT=0,holdFire=false,locked=false,bob=0;
const keys={},mv={x:0,y:0},ens=[],projs=[],parts=[],tracers=[],pk=[],dmgTxt=[];
const S={playing:false,st:'menu',wp:0,ammo:12,reload:0,fire:0,hp:100,alive:true,inv:0,tl:0,respT:0,streak:0,streakT:0,spdBoost:0,shield:0,dmgMul:1};
let peer=null,isHost=false,myId='',hostConn=null,code='',myName='',joined=false,ns=0,sn=0;
const cfg={max:3,min:5},conns=new Map(),P=new Map();
let localStream=null,mediaCalls=new Map(),muted=false,voiceReady=false;
try{myName=localStorage.getItem('cf_name')||''}catch(e){}$('nm').value=myName;
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const fmt=t=>{t=M.max(0,M.ceil(t));return(t/60|0)+':'+('0'+t%60).slice(-2)};
const show=id=>{['pm','pr','pe'].forEach(k=>$(k).hidden=k!==id);$('ov').style.display=id?'flex':'none'};
const status=t=>$('st').textContent=t;
function ainit(){try{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){}}
async function ensureMic(){
  if(localStream)return true;
  try{
    localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
    voiceReady=true;banner('🎤 المايك شغال');return true;
  }catch(e){banner('⚠️ المايك مرفوض أو مش متاح');voiceReady=false;return false}
}
function playRemote(stream,id){
  let a=document.getElementById('aud-'+id);
  if(!a){a=document.createElement('audio');a.id='aud-'+id;a.autoplay=true;a.playsInline=true;document.body.appendChild(a)}
  a.srcObject=stream;
}
function startVoice(){
  ensureMic().then(ok=>{
    if(!ok||!peer)return;
    const ids=[...P.keys()].filter(id=>id!==myId);
    ids.forEach(id=>{
      if(mediaCalls.has(id))return;
      try{
        const call=peer.call(id,localStream);
        if(call){call.on('stream',s=>playRemote(s,id));mediaCalls.set(id,call);call.on('close',()=>mediaCalls.delete(id))}
      }catch(e){}
    });
  });
}
function toggleMute(){
  muted=!muted;
  if(localStream)localStream.getAudioTracks().forEach(t=>t.enabled=!muted);
  const btn=$('mute');if(btn)btn.textContent=muted?'🔇':'🎤';
  banner(muted?'المايك مكتوم':'المايك مفتوح');
}
function col(p,r){for(const q of pil){const dx=p.x-q.x,dz=p.z-q.z,ox=1+r-M.abs(dx),oz=1+r-M.abs(dz);if(ox>0&&oz>0){if(ox<oz)p.x+=M.sign(dx||1)*ox;else p.z+=M.sign(dz||1)*oz}}
  [[-20,-6,3.5],[20,6,3.5],[0,20,3]].forEach(([px,pz,h])=>{if(M.abs(p.x-px)<3+r&&M.abs(p.z-pz)<3+r&&p.y<h+.2&&p.y>h-1){p.y=h;if(p===pos)vy=0}});
  p.x=clamp(p.x,-MAP+.8+r,MAP-.8-r);p.z=clamp(p.z,-MAP+.8+r,MAP-.8-r)}
function burst(x,y,z,c,n,sp){for(let i=0;i<n;i++)parts.push({x,y,z,vx:(M.random()-.5)*sp,vy:M.random()*sp*.8,vz:(M.random()-.5)*sp,l:.7+M.random()*.4,c})}
function banner(t){const b=$('bn');b.textContent=t;b.style.opacity=1;clearTimeout(banner.t);banner.t=setTimeout(()=>b.style.opacity=0,1800)}
function vig(){$('vg').style.opacity=1;shake=.25;snd(90,.25,'sawtooth',.2,-40)}
function feed(h){const d=document.createElement('div');d.innerHTML=h;$('kf').prepend(d);setTimeout(()=>d.remove(),5000);while($('kf').children.length>5)$('kf').lastChild.remove()}
function lock(){if(touch)return;try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function newP(id,name,ci){return{id,name,ci,c:PAL[ci],x:0,y:.5,z:0,tx:0,ty:.5,tz:0,a:0,ta:0,hp:100,alive:true,inv:0,k:0,d:0,respT:0,hf:0,w:0,s:1,streak:0}}
function upd(){$('am').textContent=WP[S.wp].n+' '+(S.reload>0?'⟳':S.ammo+' / '+WP[S.wp].mag)+(S.streak>=3?' 🔥'+S.streak:'');const f=$('hpf');f.style.width=S.hp+'%';f.style.background=S.hp>50?'var(--ok)':S.hp>25?'#ffc233':'var(--ac)'}
function lb(){$('sc').innerHTML=[...P.values()].sort((x,y)=>y.k-x.k||x.d-y.d).map(p=>'<span style="color:rgb('+PAL[p.ci]+')">'+esc(p.name)+'</span> '+p.k+' / '+p.d+(p.streak>=3?' 🔥':'')).join('<br>')}
function sw(i){if(!S.playing||!S.alive||i===S.wp)return;S.wp=i;S.ammo=WP[i].mag;S.reload=0;S.fire=.2;snd(260,.1,'triangle',.1,200);upd()}
function reload(){const w=WP[S.wp];if(S.reload>0||S.ammo===w.mag||!S.playing||!S.alive)return;S.reload=w.rl;snd(300,.15,'triangle',.1,200);upd()}
function addDmg(x,y,z,n,hs){dmgTxt.push({x,y:y+.7,z,n:M.round(n),l:1,hs:!!hs,vy:1.6})}

// ---- شبكة ----
function send(m){if(isHost){m.id=myId;conns.forEach(c=>c.open&&c.send(m))}else if(hostConn&&hostConn.open)hostConn.send(m)}
function bc(m,self){conns.forEach(c=>c.open&&c.send(m));if(self)onMsg(m)}
function spawnPt(id){let bs=SP[0],bd=-1;for(let i=0;i<8;i++){const s=SP[M.random()*SP.length|0];let md=99;P.forEach(p=>{if(p.id!==id&&p.alive)md=M.min(md,M.hypot(p.x-s[0],p.z-s[1]))});if(md>bd){bd=md;bs=s}}return bs}
function lobbyBc(){bc({t:'lobby',l:[...P.values()].map(p=>({id:p.id,name:p.name,ci:p.ci})),code,max:cfg.max,min:cfg.min},true)}
function hurt(vid,aid,d){const v=P.get(vid),a=P.get(aid);if(!v||!v.alive||v.inv>0)return;
  if(vid===myId&&S.shield>0){S.shield=M.max(0,S.shield-d*.35);shake=.1;snd(400,.07,'triangle',.08);return}
  v.hp=M.max(0,v.hp-d);v.hf=.15;
  if(vid===myId){S.hp=v.hp;upd();vig()}
  else{const c=conns.get(vid);c&&c.open&&c.send({t:'dmg'})}
  if(v.hp<=0){v.hp=0;v.alive=false;v.d++;v.respT=3;v.streak=0;
    if(aid!==vid){a.k++;a.streak=(a.streak||0)+1;a.streakT=8;
      if(a.streak===3)bc({t:'streak',id:aid,n:a.name,s:3},true);
      if(a.streak===5)bc({t:'streak',id:aid,n:a.name,s:5},true);
      if(aid===myId){S.streak=a.streak;S.streakT=8;if(S.streak===3)applyStreakReward();if(S.streak===5)banner('💀 أنت في حالة جنون!')}
    }
    bc({t:'kill',a:aid,v:vid,an:a.name,vn:v.name},true);lb()}}
function applyStreakReward(){
  const rewards=[
    {t:'⚡ رشاش سريع!',f:()=>{S.wp=2;S.ammo=WP[2].mag;S.fire=0}},
    {t:'🏃 سرعة زيادة!',f:()=>{S.spdBoost=1;setTimeout(()=>{S.spdBoost=0},10000)}},
    {t:'🛡️ درع مؤقت!',f:()=>{S.shield=8}},
    {t:'💥 ضرر مضاعف!',f:()=>{S.dmgMul=1.6;setTimeout(()=>{S.dmgMul=1},10000)}},
    {t:'❤ صحة كاملة!',f:()=>{S.hp=100;upd()}}
  ];
  const r=rewards[M.random()*rewards.length|0];
  r.f();banner('🔥 Kill Streak: '+r.t);upd();snd(500,.25,'triangle',.18,300)}
function hostMsg(c,m){const id=c.peer,p=P.get(id);
  if(m.t==='join'){if(S.st!=='lobby'||P.size>=cfg.max){c.send({t:'full'});setTimeout(()=>c.close(),400);return}
    conns.set(id,c);const ci=[0,1,2,3,4,5].find(i=>![...P.values()].some(q=>q.ci===i));P.set(id,newP(id,String(m.name||'لاعب').slice(0,12),ci));lobbyBc();return}
  if(!p)return;
  if(m.t==='s'){p.tx=+m.x;p.ty=.5+(+m.y);p.tz=+m.z;p.ta=+m.a}
  else if(m.t==='f'){m.id=id;conns.forEach((c2,i)=>{if(i!==id&&c2.open)c2.send(m)});onMsg(m)}
  else if(m.t==='hit')hurt(m.v,id,clamp(+m.d||0,0,130))
  else if(m.t==='chat')bc({t:'chat',n:p.name,c:m.c,ci:p.ci},true)}
function drop(id){if(!P.has(id))return;P.delete(id);conns.delete(id);if(S.st==='lobby')lobbyBc();else lb()}
function onMsg(m){
  if(m.t==='lobby'){if(!isHost){P.clear();m.l.forEach(p=>P.set(p.id,newP(p.id,p.name,p.ci)));code=m.code;cfg.max=m.max;cfg.min=m.min}S.st='lobby';S.playing=false;
    $('rc').textContent=code;$('rl').innerHTML=m.l.map(p=>'<div style="color:rgb('+PAL[p.ci]+')">■ '+esc(p.name)+(p.id===myId?' (أنت)':'')+'</div>').join('');
    $('rn').textContent=m.l.length+' / '+m.max+' لاعبين · '+m.min+' دقيقة';$('bs').hidden=!isHost;$('bs').disabled=m.l.length<2;$('rw').hidden=isHost;show('pr')}
  else if(m.t==='start'){if(!isHost){P.clear();m.l.forEach(p=>P.set(p.id,newP(p.id,p.name,p.ci)))}
    m.l.forEach(e=>{const p=P.get(e.id);p.x=p.tx=e.sx;p.z=p.tz=e.sz;p.hp=100;p.alive=true;p.inv=2;p.k=p.d=0;p.streak=0;if(e.id===myId){pos.x=e.sx;pos.z=e.sz;pos.y=0;vy=0;yaw=M.atan2(-e.sx,-e.sz)}});
    Object.assign(S,{st:'play',playing:true,wp:0,ammo:12,reload:0,fire:0,hp:100,alive:true,inv:1,tl:m.tl,respT:0,streak:0,streakT:0,spdBoost:0,shield:0,dmgMul:1});upd();lb();show(null);ainit();lock();startVoice();banner('الماتش بدأ! 🔥');tracers.length=parts.length=dmgTxt.length=0}
  else if(m.t==='S'){S.tl=m.tl;const ids=new Set();
    m.p.forEach(e=>{ids.add(e.id);if(e.id===myId){if(S.hp!==e.hp){S.hp=e.hp;upd()}S.alive=!!e.al;S.inv=e.inv;const p=P.get(myId);if(p){p.k=e.k;p.d=e.d;p.streak=e.st||0}return}
      const p=P.get(e.id);if(!p)return;if(e.hp<p.hp)p.hf=.15;p.hp=e.hp;p.alive=!!e.al;p.inv=e.inv;p.k=e.k;p.d=e.d;p.streak=e.st||0;if(!p.seen){p.seen=1;p.x=e.x;p.y=e.y;p.z=e.z;p.a=e.a}p.tx=e.x;p.ty=e.y;p.tz=e.z;p.ta=e.a});
    [...P.keys()].forEach(k=>{if(!ids.has(k))P.delete(k)});lb()}
  else if(m.t==='f'){tracers.push({x:m.ex,y:m.ey,z:m.ez,ox:m.ox,oy:m.oy,oz:m.oz,t:.07});snd(300,.08,'sawtooth',clamp(.1-M.hypot(m.ox-CX,m.oz-CZ)*.006,.01,.1),-200)}
  else if(m.t==='dmg'){vig()}
  else if(m.t==='kill'){feed('<b style="color:rgb('+PAL[(P.get(m.a)||{ci:0}).ci]+')">'+esc(m.an)+'</b> 🔫 <b style="color:rgb('+PAL[(P.get(m.v)||{ci:0}).ci]+')">'+esc(m.vn)+'</b>');
    const v=P.get(m.v);if(v&&m.v!==myId)burst(v.x,v.y,v.z,'rgb('+v.c+')',26,7);
    if(m.v===myId){S.alive=false;S.hp=0;S.respT=3;S.streak=0;holdFire=false;upd();burst(pos.x,.5,pos.z,'#fff',10,5);banner('💀 '+m.an+' قتلك')}
    else if(m.a===myId){banner('🔥 قتلت '+m.vn);snd(320,.25,'triangle',.16,-220)}}
  else if(m.t==='streak'){if(m.s===3)banner('🔥 '+m.n+' على Kill Streak!');
    if(m.s===5){banner('💀💀 '+m.n+' في حالة جنون!!!');feed('<b style="color:#ff6">'+esc(m.n)+'</b> في حالة جنون 🔥🔥🔥')}}
  else if(m.t==='chat'){feed('<span style="color:rgb('+PAL[m.ci||0]+')">'+esc(m.n)+'</span>: '+m.c)}
  else if(m.t==='resp'){if(m.id===myId){pos.x=m.x;pos.z=m.z;pos.y=0;vy=0;S.alive=true;S.hp=100;S.ammo=WP[S.wp].mag;S.reload=0;S.streak=0;upd();banner('رجعت للقتال! 🔥')}}
  else if(m.t==='end'){S.st='end';S.playing=false;holdFire=false;if(document.exitPointerLock)document.exitPointerLock();const r=m.r,tie=r[1]&&r[1].k===r[0].k&&r[1].d===r[0].d;
    const titles=['الطيار ✈️','الجزار 🔪','الظل 👻','القناص 🎯','المجنون 🤪','الناجي 🍀'];
    $('ep').innerHTML='<h2>'+(tie?'🤝 تعادل!':'🏆 الفائز: '+esc(r[0].name))+'</h2>'+r.map((p,i)=>'<div style="color:rgb('+PAL[p.ci]+')">'+(i+1)+'. '+esc(p.name)+' — قتلات '+p.k+' · موتات '+p.d+(i===0&&!tie?' 👑':'')+(p.k>=5?' · '+titles[p.k%titles.length]:'')+'</div>').join('');
    $('ba').hidden=!isHost;$('bw').hidden=isHost;show('pe')}
  else if(m.t==='full'){leave('الروم ممتلئة أو الماتش بدأ')}}
function begin(){if(P.size<2||S.st!=='lobby')return;S.st='play';const tl=cfg.min*60;P.forEach(p=>{const s=spawnPt(p.id);p.x=p.tx=s[0];p.z=p.tz=s[1];p.alive=true;p.streak=0});
  bc({t:'start',tl,l:[...P.values()].map(p=>({id:p.id,name:p.name,ci:p.ci,sx:p.x,sz:p.z}))},true)}
function hostTick(dt){
  S.tl-=dt;P.forEach(p=>{if(p.inv>0)p.inv-=dt;if(p.streakT>0){p.streakT-=dt;if(p.streakT<=0)p.streak=0}
    if(!p.alive){p.respT-=dt;if(p.respT<=0){const s=spawnPt(p.id);p.alive=true;p.hp=100;p.inv=2.2;p.x=p.tx=s[0];p.z=p.tz=s[1];p.y=p.ty=.5;p.streak=0;bc({t:'resp',id:p.id,x:s[0],z:s[1]},true)}}});
  const me=P.get(myId);S.inv=me.inv>0?1:0;if(me)S.streak=me.streak||0;
  sn-=dt;if(sn<=0){sn=.05;bc({t:'S',tl:S.tl,p:[...P.values()].map(p=>({id:p.id,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),a:+p.a.toFixed(2),hp:p.hp,al:p.alive?1:0,inv:p.inv>0?1:0,k:p.k,d:p.d,st:p.streak||0}))});lb()}
  if(S.tl<=0&&S.st==='play'){S.st='end';bc({t:'end',r:[...P.values()].sort((a,b)=>b.k-a.k||a.d-b.d).map(p=>({name:p.name,ci:p.ci,k:p.k,d:p.d}))},true)}}
function leave(msg){try{mediaCalls.forEach(c=>{try{c.close()}catch(_){}});mediaCalls.clear();document.querySelectorAll('audio[id^="aud-"]').forEach(a=>a.remove());if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null}peer&&peer.destroy()}catch(e){}peer=null;P.clear();conns.clear();isHost=false;hostConn=null;joined=false;voiceReady=false;S.st='menu';S.playing=false;if(document.exitPointerLock)document.exitPointerLock();show('pm');status(msg||'')}
function names(){myName=($('nm').value.trim()||'لاعب'+(1+M.random()*99|0)).slice(0,12);try{localStorage.setItem('cf_name',myName)}catch(e){}ainit();
  if(typeof Peer==='undefined'){status('ملف peerjs.min.js مش موجود جنب اللعبة!');return false}return true}
function hostRoom(){if(!names())return;cfg.max=+$('mx').value;cfg.min=+$('mn').value;status('بنعمل الروم...');let tries=0;
  const mk=()=>{code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[M.random()*32|0]).join('');peer=new Peer('cubefire-'+code,PC);
    peer.on('open',id=>{myId=id;isHost=true;P.clear();conns.clear();P.set(id,newP(id,myName,0));S.st='lobby';lobbyBc()});
    peer.on('connection',c=>{c.on('data',m=>hostMsg(c,m));c.on('close',()=>drop(c.peer));c.on('error',()=>drop(c.peer))});
    peer.on('call',call=>{if(!localStream){call.answer();return}call.answer(localStream);call.on('stream',s=>playRemote(s,call.peer));mediaCalls.set(call.peer,call);call.on('close',()=>mediaCalls.delete(call.peer))});
    peer.on('error',e=>{if(e.type==='unavailable-id'&&tries++<5){try{peer.destroy()}catch(_){}mk()}else status('خطأ في الاتصال: '+e.type)})};mk()}
function joinRoom(){if(!names())return;code=$('cd').value.trim().toUpperCase();if(code.length<4){status('اكتب كود الروم (4 حروف)');return}status('بنتصل بالروم...');joined=false;
  peer=new Peer(PC);peer.on('open',id=>{myId=id;hostConn=peer.connect('cubefire-'+code);
    hostConn.on('open',()=>{joined=true;hostConn.send({t:'join',name:myName})});hostConn.on('data',onMsg);hostConn.on('close',()=>{if(S.st!=='menu')leave('الهوست قفل الروم')});
    setTimeout(()=>{if(!joined&&S.st==='menu')status('مش عارف أوصل للروم — اتأكد من الكود')},12000)});
  peer.on('call',call=>{if(!localStream){call.answer();return}call.answer(localStream);call.on('stream',s=>playRemote(s,call.peer));mediaCalls.set(call.peer,call);call.on('close',()=>mediaCalls.delete(call.peer))});
  peer.on('error',e=>status(e.type==='peer-unavailable'?'الروم مش موجودة، اتأكد من الكود':'خطأ في الاتصال: '+e.type))}
$('bh').onclick=hostRoom;$('bj').onclick=joinRoom;$('bs').onclick=begin;$('bl').onclick=()=>leave('');$('bw2').onclick=()=>leave('');
$('ba').onclick=()=>{S.st='lobby';P.forEach(p=>{p.k=p.d=0;p.hp=100;p.alive=true;p.streak=0});lobbyBc()};
$('rc').onclick=()=>{try{navigator.clipboard.writeText(code);banner('اتنسخ الكود ✅')}catch(e){}};
// quick chat
document.querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>{if(S.st!=='play')return;send({t:'chat',c:b.dataset.chat})});
$('mute')&&($('mute').onclick=()=>toggleMute());
document.addEventListener('pointerlockchange',()=>{const l=document.pointerLockElement===cv;if(locked&&!l&&S.playing)banner('اضغط كليك للرجوع للتصويب');locked=l});

// ---- لعب ----
function shoot(){
  const w=WP[S.wp];if(!S.playing||!S.alive||S.fire>0||S.reload>0)return;
  if(S.ammo<=0){reload();return}
  S.ammo--;S.fire=w.rate;recoil=w.pel>1?1.7:1;flashT=.05;snd(w.pel>1?200:420,.12,'sawtooth',.14,-300);
  const o=[CX,CY,CZ],dm=new Map();let first=null;
  for(let k=0;k<w.pel;k++){
    const sx=(M.random()-.5)*2*w.spr,sy=(M.random()-.5)*2*w.spr;
    let d=[-sY*cP+cY*sx+sY*sP*sy,sP+cP*sy,-cY*cP-sY*sx+cY*sP*sy];const n=M.hypot(d[0],d[1],d[2]);d=d.map(v=>v/n);
    let best=Infinity,bv=null,wall=Infinity;
    ens.forEach(e=>{const ca=M.cos(e.a),sa=M.sin(e.a),rx=o[0]-e.x,ry=o[1]-e.y,rz=o[2]-e.z;const t=slab([rx*ca-rz*sa,ry,rx*sa+rz*ca],[d[0]*ca-d[2]*sa,d[1],d[0]*sa+d[2]*ca],[.5,.5,.5]);if(t<best){best=t;bv=e}});
    pil.forEach(p=>{const t=slab([o[0]-p.x,o[1]-1.5,o[2]-p.z],d,[1,1.5,1]);if(t<wall)wall=t});
    if(wall<best){bv=null;best=wall}
    const T=M.min(best,45),hx=o[0]+d[0]*T,hy=o[1]+d[1]*T,hz=o[2]+d[2]*T;tracers.push({x:hx,y:hy,z:hz,t:.07});if(!first)first=[hx,hy,hz];
    if(bv){const hs=hy>bv.y+.3;const dmgAmt=w.dm*(hs?1.45:1)*(S.dmgMul||1);dm.set(bv.id,(dm.get(bv.id)||0)+dmgAmt);burst(hx,hy,hz,hs?'#ffee88':'#ffe066',hs?7:4,3);addDmg(bv.x,bv.y,bv.z,dmgAmt,hs);if(hs)snd(750,.09,'square',.14)}
    else if(best<1e8)burst(hx,hy,hz,'#8899cc',2,2)}
  send({t:'f',ox:o[0],oy:o[1]-.2,oz:o[2],ex:first[0],ey:first[1],ez:first[2]});
  if(dm.size){const hm=$('hm');hm.style.opacity=1;setTimeout(()=>hm.style.opacity=0,90);snd(150,.08,'square',.12);shake=M.max(shake,.1);
    dm.forEach((d,id)=>{if(isHost)hurt(id,myId,d);else if(hostConn&&hostConn.open)hostConn.send({t:'hit',v:id,d})})}
  if(S.ammo===0)reload();upd()}
function slab(o,d,h){let t0=0,t1=1e9;for(let i=0;i<3;i++){if(M.abs(d[i])<1e-9){if(M.abs(o[i])>h[i])return Infinity}else{let a=(-h[i]-o[i])/d[i],b=(h[i]-o[i])/d[i];if(a>b){const t=a;a=b;b=t}t0=M.max(t0,a);t1=M.min(t1,b);if(t0>t1)return Infinity}}return t0}
function update(dt){
  if(S.alive){
    if(keys.ArrowLeft)yaw+=2*dt;if(keys.ArrowRight)yaw-=2*dt;if(keys.ArrowUp)pitch=clamp(pitch+1.5*dt,-1.4,1.4);if(keys.ArrowDown)pitch=clamp(pitch-1.5*dt,-1.4,1.4);
    let f=(keys.KeyW?1:0)-(keys.KeyS?1:0)+mv.y,r=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mv.x;const l=M.hypot(f,r);if(l>1){f/=l;r/=l}
    const sp=(keys.ShiftLeft||keys.ShiftRight?9:5.5)*(S.streak>=3?1.2:1)*(S.spdBoost?1.35:1);
    pos.x+=(-M.sin(yaw)*f+M.cos(yaw)*r)*sp*dt;pos.z+=(-M.cos(yaw)*f-M.sin(yaw)*r)*sp*dt;
    P.forEach(p=>{if(p.id!==myId&&p.alive){const dx=pos.x-p.x,dz=pos.z-p.z,d=M.hypot(dx,dz);if(d<.9&&d>0){pos.x+=dx/d*(.9-d);pos.z+=dz/d*(.9-d)}}});col(pos,.4);
    vy-=18*dt;pos.y=M.max(0,pos.y+vy*dt);if(pos.y===0)vy=0;bob+=l*sp*dt*1.6;
    S.fire=M.max(0,S.fire-dt);if(S.reload>0){S.reload-=dt;if(S.reload<=0){S.ammo=WP[S.wp].mag;upd()}}
    if(S.streakT>0){S.streakT-=dt;if(S.streakT<=0)S.streak=0}
    if(S.shield>0)S.shield-=dt;
    if(holdFire)shoot()}else S.respT-=dt;
  const me=P.get(myId);if(me){me.x=me.tx=pos.x;me.z=me.tz=pos.z;me.y=me.ty=.5+pos.y;me.a=me.ta=yaw+M.PI}
  ns-=dt;if(ns<=0){ns=.05;if(!isHost&&hostConn&&hostConn.open)hostConn.send({t:'s',x:pos.x,y:pos.y,z:pos.z,a:yaw+M.PI})}
  if(isHost)hostTick(dt)
  for(let i=dmgTxt.length-1;i>=0;i--){const d=dmgTxt[i];d.y+=d.vy*dt;d.l-=dt*1.5;if(d.l<=0)dmgTxt.splice(i,1)}}
function drawNames(){ctx.textAlign='center';ctx.font='bold 14px system-ui,sans-serif';ens.forEach(p=>{const v=tr(p.x,p.y+.9,p.z);if(v[2]<NEAR||v[2]>32)return;const q=sc(v);
  ctx.fillStyle='#0008';ctx.fillRect(q[0]-26,q[1]-4,52,6);ctx.fillStyle=p.hp>50?'#3dffa0':p.hp>25?'#ffc233':'#ff4d6d';ctx.fillRect(q[0]-25,q[1]-3,50*clamp(p.hp/100,0,1),4);ctx.fillStyle='#fff';ctx.fillText(p.name+(p.streak>=3?'🔥':''),q[0],q[1]-9)})}
function drawRadar(){const cx=78,cy=122,R=62,k=2.4;ctx.save();ctx.fillStyle='rgba(8,14,34,.7)';ctx.beginPath();ctx.arc(cx,cy,R,0,6.283);ctx.fill();ctx.strokeStyle='#35e6ff';ctx.lineWidth=1.5;ctx.stroke();
  ens.forEach(p=>{const dx=p.x-pos.x,dz=p.z-pos.z;let px=(dx*cY-dz*sY)*k,py=(dx*sY+dz*cY)*k;const m=M.hypot(px,py);if(m>R-4){px*=(R-4)/m;py*=(R-4)/m}ctx.fillStyle='rgb('+p.c+')';ctx.fillRect(cx+px-3,cy+py-3,6,6)});
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx-4,cy+4);ctx.lineTo(cx+4,cy+4);ctx.fill();ctx.restore()}
// ---- لوب ----
let last=performance.now();
function loop(now){requestAnimationFrame(loop);const dt=M.min((now-last)/1000,.05);last=now;const play=S.st==='play';
  if(play)update(dt);else yaw+=dt*.25;
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.vy-=14*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.08){p.y=.08;p.vy*=-.3;p.vx*=.6;p.vz*=.6}p.l-=dt;if(p.l<=0)parts.splice(i,1)}
  for(let i=tracers.length-1;i>=0;i--){tracers[i].t-=dt;if(tracers[i].t<=0)tracers.splice(i,1)}
  ens.length=0;const T2=2*M.PI;P.forEach(p=>{if(p.id===myId)return;const k=clamp(dt*14,0,1);p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;p.z+=(p.tz-p.z)*k;p.a+=((((p.ta-p.a+M.PI)%T2)+T2)%T2-M.PI)*k;p.hf=M.max(0,p.hf-dt);
    p.w=p.hf>0?.8:p.inv>0?.35+.35*M.sin(now/60):0;if(p.alive&&play)ens.push(p)});
  recoil=M.max(0,recoil-dt*8);flashT=M.max(0,flashT-dt);shake=M.max(0,shake-dt);
  const v=$('vg');if(+v.style.opacity>0)v.style.opacity=M.max(0,+v.style.opacity-dt*1.5);
  const tt=play?fmt(S.tl):'';if($('tm').textContent!==tt)$('tm').textContent=tt;
  setCam();if(play&&!S.alive)CY=.5;ctx.save();if(shake>0)ctx.translate((M.random()-.5)*shake*30,(M.random()-.5)*shake*30);
  try{drawWorld();if(play&&S.alive)drawGun();if(play){drawNames();drawRadar()}}catch(e){console.error(e)}ctx.restore();
  if(play&&!S.alive){ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 34px system-ui,sans-serif';ctx.fillText('بتظهر بعد '+M.max(1,M.ceil(S.respT))+' ثانية',W/2,H*.4)}
  if(play&&S.alive&&S.inv){ctx.strokeStyle='rgba(53,230,255,.7)';ctx.lineWidth=8;ctx.strokeRect(4,4,W-8,H-8)}}
S.alive=true;upd();show('pm');requestAnimationFrame(loop);
