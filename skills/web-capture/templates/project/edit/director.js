import { plan as basePlan } from './timeline.js';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const title=document.querySelector('h1'), caption=document.querySelector('#caption');
let config, index, lastFrame=0, plan=basePlan;
const missing=new Set();
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`Missing ${url}`);return r.json();}
window.__boot=async(options={})=>{
  config={...await json('video.json'),...options};
  if(config.timelineUrl)plan=await json(config.timelineUrl);
  canvas.width=config.width;canvas.height=config.height;
  const safe={top:.05,bottom:.06,left:.06,right:.06,...config.safeArea};
  const header=document.querySelector('header');
  header.style.left=title.style.left=caption.style.left=`${safe.left*100}%`;
  title.style.right=caption.style.right=`${safe.right*100}%`;
  header.style.top=`${safe.top*100}%`;title.style.top=`${Math.max(.1,safe.top+.055)*100}%`;
  caption.style.bottom=`${safe.bottom*100}%`;
  index=await json('../frames/index.json');
  const seconds=Math.max(...plan.units.map(u=>u.end));
  return {frames:Math.round(seconds*config.fps),fps:config.fps,width:config.width,height:config.height,shots:index.shots.length,units:plan.units.length,cues:plan.cues.length,sectionDrift:0};
};
window.__frame=async(i)=>{
  lastFrame=i;const t=i/config.fps;
  const unit=plan.units.find(u=>u.start<=t&&t<u.end);
  if(!unit)throw new Error(`No edit unit at ${t}`);
  const clip=index.shots.find(s=>s.id===unit.shot);
  if(!clip?.complete)throw new Error(`Missing complete clip ${unit.shot}`);
  const sourceFrame=Math.floor(((unit.sourceStart??0)+t-unit.start)*clip.fps+1e-6);
  if(sourceFrame>=clip.frames)throw new Error('Edit exceeds source frames');
  const src=`../frames/${unit.shot}/f${String(sourceFrame).padStart(5,'0')}.png`;
  const image=new Image();image.src=src;
  try{await image.decode();}catch{missing.add(src);throw new Error(`Missing frame ${src}`);}
  const w=canvas.width,h=canvas.height,portrait=h>w;
  ctx.fillStyle=config.background??'#f5f1e8';ctx.fillRect(0,0,w,h);
  const safe={left:.06,right:.06,bottom:.06,...config.safeArea};
  const box={x:w*safe.left,y:h*(portrait?.3:.28),w:w*(1-safe.left-safe.right),h:h*Math.min(portrait?.42:.53,1-safe.bottom-(portrait?.3:.28)-.12)};
  const crop=unit.crop??{x:0,y:0,w:1,h:1};
  const sw=image.width*crop.w,sh=image.height*crop.h;
  const scale=Math.min(box.w/sw,box.h/sh),dw=sw*scale,dh=sh*scale;
  ctx.drawImage(image,image.width*crop.x,image.height*crop.y,sw,sh,box.x+(box.w-dw)/2,box.y+(box.h-dh)/2,dw,dh);
  title.textContent=unit.title??'';
  caption.textContent=plan.cues.find(c=>c.start<=t&&t<c.end)?.text??'';
  caption.style.display=caption.textContent?'block':'none';
};
window.__cover=async(opts)=>{await window.__frame(opts.frame??lastFrame);if(opts.title)title.textContent=opts.title;caption.style.display='none';};
window.__debug=()=>({missing:[...missing],missingCount:missing.size,overflows:[title,caption].filter(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1).map(e=>e.tagName)});
