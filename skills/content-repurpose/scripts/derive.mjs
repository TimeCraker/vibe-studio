import{existsSync,readFileSync,mkdirSync,writeFileSync}from'node:fs';import{resolve,join,relative,isAbsolute}from'node:path';import{pathToFileURL}from'node:url';
const write=(path,data)=>writeFileSync(path,JSON.stringify(data,null,2)+'\n');
const stamp=seconds=>{const ms=Math.round(seconds*1000);return`${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
export function derive(project){
 project=resolve(project);const storyboard=JSON.parse(readFileSync(join(project,'storyboard.json'),'utf8')),variants=JSON.parse(readFileSync(join(project,'variants.json'),'utf8'));
 if(variants.schemaVersion!==1||!variants.platforms||!Object.keys(variants.platforms).length)throw new Error('variants requires platforms');
 const publish={driver:'pw',platforms:{}},reports=[],pending=[];
 for(const [platform,v]of Object.entries(variants.platforms)){
  if(!['bili','douyin','xhs'].includes(platform))throw new Error('Unknown platform');
  if(typeof v.title!=='string'||!v.title.trim()||!Array.isArray(v.description)||v.description.some(p=>typeof p!=='string'||!p.trim())||!v.description.length)throw new Error('Platform title/description required');
  if(v.limits?.titleChars&&[...v.title].length>v.limits.titleChars)throw new Error(`Title too long: ${platform}`);
  if(!Array.isArray(v.sceneIds)||!v.sceneIds.length||new Set(v.sceneIds).size!==v.sceneIds.length)throw new Error('sceneIds must be unique and non-empty');
  const selected=v.sceneIds.map(id=>{const s=storyboard.scenes.find(s=>s.id===id);if(!s)throw new Error(`Unknown scene ${id}`);return s;});
  const f=v.format;if(!f||![f.width,f.height].every(n=>Number.isInteger(n)&&n>0&&n%2===0)||!Number.isFinite(f.fps)||f.fps<=0)throw new Error('Invalid variant format');
  for(const name of ['video','cover']){if(typeof v[name]!=='string'||isAbsolute(v[name])||relative(project,resolve(project,v[name])).startsWith('..'))throw new Error(`Invalid variant ${name}`);}
  const area=v.safeArea??{};if(Object.values(area).some(n=>!Number.isFinite(n)||n<0||n>=.5))throw new Error('Invalid safe area');
  if((area.left??0)+(area.right??0)>=1||(area.top??0)+(area.bottom??0)>=1)throw new Error('Safe area leaves no content');
  if(v.crop&&(!['x','y','w','h'].every(k=>Number.isFinite(v.crop[k]))||v.crop.x<0||v.crop.y<0||v.crop.w<=0||v.crop.h<=0||v.crop.x+v.crop.w>1||v.crop.y+v.crop.h>1))throw new Error('Invalid crop');
  let start=0;const units=[],cues=[];
  for(const scene of selected){const seconds=scene.end-scene.start;if(!Number.isFinite(seconds)||seconds<=0)throw new Error('Invalid scene duration');
   units.push({id:scene.id,shot:scene.shot??null,start,end:start+seconds,sourceStart:scene.sourceStart??0,title:scene.title,crop:v.crop??scene.crop});
   const text=scene.caption??scene.voiceover;if(text)cues.push({start,end:start+seconds,text});start+=seconds;
  }
  pending.push({platform,v,f,area,units,cues,seconds:start});
  publish.platforms[platform]={video:v.video,cover:v.cover,spec:`exports/${platform}/form.json`,topics:(v.tags??[]).join(','),...(v.declare?{declare:v.declare}:{}),...(v.original===true?{original:true}:{})};
  reports.push({platform,seconds:start,scenes:v.sceneIds,renderableByGenericC:units.every(u=>u.shot),review:'pending'});
 }
 // Invalid later variants must not partially rewrite an earlier platform's form.
 for(const {platform,v,f,area,units,cues,seconds}of pending){
  const dir=join(project,'exports',platform);mkdirSync(dir,{recursive:true});
  write(join(dir,'timeline.json'),{units,cues});write(join(dir,'render-spec.json'),{...f,safeArea:area,timelineUrl:`../exports/${platform}/timeline.json`,sourceSceneIds:v.sceneIds,seconds,needsLayoutReview:true});
  write(join(dir,'qc.json'),{...f,duration:seconds});
  write(join(dir,'form.json'),{title:v.title,description:v.description,tags:v.tags??[]});
  writeFileSync(join(dir,'captions.srt'),cues.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n'),'utf8');
 }
 write(join(project,'publish-plan.json'),publish);return{ok:true,variants:reports};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const i=process.argv.indexOf('--project');console.log(JSON.stringify(derive(i>=0?process.argv[i+1]:'.'),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
