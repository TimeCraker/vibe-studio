"""Verify authorized edit lineage and every kept PCM segment, without claiming listening."""
from hashlib import sha256
import json
from pathlib import Path
import wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
def load(name): return json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
def digest(name): return sha256((ROOT/name).read_bytes()).hexdigest()
def pcm(name):
    with wave.open(str(ROOT/name),'rb') as f:
        assert (f.getframerate(),f.getnchannels(),f.getsampwidth())==(48000,2,2)
        return np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2)
rec=load('audio/recording.json'); edl=load('audio/edit-decision.json')
for name,key in [('originalSource','originalSha256'),('source','sourceSha256'),('asrSource','asrSha256'),('rawDecodedSource','rawDecodedSha256'),('manuscript','manuscriptSha256'),('editDecision','editDecisionSha256')]:
    assert digest(rec[name])==rec[key],name+' changed'
assert digest(edl['source'])==edl['sourceSha256']
assert digest(edl['editedFile'])==edl['editedSha256']==rec['sourceSha256']
raw,edited=pcm(edl['source']),pcm(edl['editedFile'])
cursor=0; seams=[]
for keep in edl['keptIntervals']:
    first,last=[round(keep[k]*48000) for k in ['sourceIn','sourceOut']]
    start,end=[round(keep[k]*48000) for k in ['outputIn','outputOut']]
    assert keep['speed']==1 and start==cursor and end-start==last-first
    piece=raw[first:last].astype(np.float64)
    fade=min(round(keep['fadeInOutMs']*.001*48000),len(piece)//4)
    ramp=np.linspace(0,1,fade,endpoint=True)[:,None]
    piece[:fade]*=ramp;piece[-fade:]*=ramp[::-1]
    expected=np.clip(np.rint(piece),-32768,32767).astype('<i2')
    assert np.array_equal(expected,edited[start:end]),'PCM lineage differs at '+str(start)
    if start:
        seams.append({'seconds':start/48000,'boundaryDelta':int(np.abs(edited[start].astype(int)-edited[start-1]).max())})
    cursor=end
assert cursor==len(edited)
assert abs(len(raw)/48000-edl['sourceDuration'])<1/48000
assert abs(len(edited)/48000-edl['editedDuration'])<1/48000
assert all(s['boundaryDelta']==0 for s in seams)
review=load('audio/recording-review.json');timeline=load('timeline.json')
assert review['sourceSha256']==rec['sourceSha256']
assert timeline['sourceOut']<=len(edited)/48000
cues=timeline['cues']
assert all(c['to']-c['from']>=18 for c in cues)
assert all(a['to']<=b['from'] for a,b in zip(cues,cues[1:]))
report={'ok':True,'originalUnchanged':True,'allKeptSamplesMatched':True,'sourceSeconds':len(raw)/48000,'editedSeconds':len(edited)/48000,'removedSeconds':(len(raw)-len(edited))/48000,'keptSegments':len(edl['keptIntervals']),'seams':seams,'playbackRate':1,'syntheticSpeech':False,'subtitleCues':len(cues),'minimumCueSeconds':min(c['to']-c['from'] for c in cues)/60,'originalSha256':rec['originalSha256'],'editedSha256':rec['sourceSha256'],'reviewScope':'Exact PCM/hash, edit maps and word-window checks only. Subjective listening and acceptance remain pending.'}
(ROOT/'qa').mkdir(exist_ok=True)
(ROOT/'qa/edit-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps({k:v for k,v in report.items() if k!='seams'},ensure_ascii=False))
