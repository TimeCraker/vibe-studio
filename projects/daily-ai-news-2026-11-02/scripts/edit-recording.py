"""Apply this edition's explicit, conservative pause edit; retain all raw evidence."""
from pathlib import Path
from hashlib import sha256
import json
import subprocess
import wave
import numpy as np

root = Path(__file__).resolve().parents[1]
load = lambda name: json.loads((root / name).read_text(encoding='utf-8-sig'))
def write(name, value):
    (root / name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
digest = lambda path: sha256(path.read_bytes()).hexdigest()
baseline = root / 'audio/recording-import-721d99e16b3b.json'
if not baseline.exists():
    baseline.write_bytes((root / 'audio/recording.json').read_bytes())
rec = json.loads(baseline.read_text(encoding='utf-8-sig'))
assert rec['originalSha256'].startswith('721d99e16b3b')
source = root / rec['source']
assert digest(source) == rec['sourceSha256']
assert digest(root / rec['originalSource']) == rec['originalSha256']
plan = load('audio/edit-plan.json')
for name in ['raw-words.json', 'raw-transcript.txt']:
    target = root / 'audio/asr' / name.replace('raw-', 'original-721d99e16b3b-')
    if not target.exists():
        target.write_bytes((root / 'audio/asr' / name).read_bytes())
with wave.open(str(source), 'rb') as f:
    rate, channels, width = f.getframerate(), f.getnchannels(), f.getsampwidth()
    assert (rate, channels, width) == (48000, 2, 2)
    pcm = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').reshape(-1, channels)
cuts = plan['cuts']
cursor = 0
keeps = []
for cut in cuts:
    a, b = round(cut['start'] * rate), round(cut['end'] * rate)
    assert cursor <= a < b <= len(pcm)
    if a > cursor:
        keeps.append((cursor, a))
    cursor = b
if cursor < len(pcm):
    keeps.append((cursor, len(pcm)))
parts, mapping, offset = [], [], 0
for a, b in keeps:
    piece = pcm[a:b].astype(np.float64)
    fade = min(192, len(piece)//4)
    ramp = np.linspace(0, 1, fade)[:, None]
    piece[:fade] *= ramp
    piece[-fade:] *= ramp[::-1]
    parts.append(np.rint(piece).astype('<i2'))
    mapping.append({'sourceIn': a/rate, 'sourceOut': b/rate, 'outputIn': offset/rate,
                    'outputOut': (offset+b-a)/rate, 'speed': 1, 'edgeFadeMs': 4})
    offset += b-a
edited = np.concatenate(parts)
out = root / 'audio/source/narration-edited-721d99e16b3b-v1.wav'
with wave.open(str(out), 'wb') as f:
    f.setnchannels(channels); f.setsampwidth(width); f.setframerate(rate)
    f.writeframes(edited.tobytes())
asr = out.with_name('narration-edited-asr-721d99e16b3b-v1.wav')
preview = out.with_name('标准录音39-剪辑版-v1.mp3')
for dest, args in [(asr, ['-ar','16000','-ac','1','-c:a','pcm_s16le']),
                   (preview, ['-c:a','libmp3lame','-b:a','192k'])]:
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(out),*args,str(dest)], check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(preview),'-f','null','NUL'], check=True)
assert len(edited) == sum(b-a for a,b in keeps)
with wave.open(str(out),'rb') as f:
    assert f.getnframes() == len(edited)
edl = {'schemaVersion':1, 'originalSource':rec['originalSource'], 'originalSha256':rec['originalSha256'],
       'source':rec['source'], 'sourceSha256':rec['sourceSha256'], 'sourceDuration':len(pcm)/rate,
       'editedFile':out.relative_to(root).as_posix(), 'editedSha256':digest(out),
       'editedDuration':len(edited)/rate, 'removedSeconds':(len(pcm)-len(edited))/rate,
       'preview':preview.relative_to(root).as_posix(), 'previewSha256':digest(preview),
       'cuts':cuts, 'keptIntervals':mapping, 'processing':'Original speed and pitch; 4ms edge fades; no denoising or synthetic speech.',
       'review':{'technical':'sample-count, monotonic mapping, source hashes and MP3 decode verified',
                 'listening':'pending; model cannot listen; edits based on transcript and measured pause windows',
                 'unconfirmedSpeech':'No uncertain spoken words deleted; ASR spellings are not certified subtitles.'}}
write('audio/edit-decision.json', edl)
write('audio/recording.json', {**rec, 'source':edl['editedFile'], 'sourceSha256':digest(out),
      'asrSource':asr.relative_to(root).as_posix(), 'asrSha256':digest(asr), 'sourceDuration':edl['editedDuration'],
      'rawDecodedSource':rec['source'], 'rawDecodedSha256':rec['sourceSha256'],
      'editDecision':'audio/edit-decision.json', 'editDecisionSha256':digest(root/'audio/edit-decision.json'),
      'clock':'Edited 48k PCM, explicit original-to-output map; speed 1.0; listening pending.'})
print(json.dumps({k:edl[k] for k in ['sourceDuration','editedDuration','removedSeconds','preview']},ensure_ascii=False))
