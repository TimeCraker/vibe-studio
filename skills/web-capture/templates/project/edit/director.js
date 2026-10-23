import { plan } from './timeline.js';
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d');
const title=document.querySelector('h1'), caption=document.querySelector('#caption');
let config, index, lastFrame=0;
const missing=new Set();
async function json(url){const r=await fetch(url);if(!r.ok)throw new Error(`Missing ${url}`);return r.json();}
window.__boot=async(options={})=>{
  config={...await json('video.json'),...options};
  canvas.width=config.width;canvas.height=config.height;
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
  const box={x:w*.06,y:h*(portrait?.3:.28),w:w*.88,h:h*(portrait?.42:.53)};
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
