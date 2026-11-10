"""Build sentence cues from actual ASR word windows, keeping recognition evidence."""
import hashlib
import json
import re
from pathlib import Path

project = Path(__file__).resolve().parent.parent
raw = json.loads((project / 'audio/asr/raw-words.json').read_text(encoding='utf-8'))
if hashlib.sha256((project/raw['source']).read_bytes()).hexdigest()!=raw['sourceSha256']:
    raise ValueError('ASR input changed: regenerate transcription')
if hashlib.sha256((project/raw['originalSource']).read_bytes()).hexdigest()!=raw['originalSha256']:
    raise ValueError('Original recording changed: regenerate WAV and transcription')
scene_ids = {
    1: 'overview', 2: 'kimi-title', 3: 'kimi-title', 4: 'kimi-bench', 5: 'kimi-bench',
    6: 'kimi-creative', 7: 'kimi-creative', 8: 'kimi-access', 9: 'kimi-access', 10: 'kimi-access',
    11: 'harness', 12: 'harness', 13: 'harness-use', 14: 'voice', 15: 'voice-api',
    16: 'voice-api', 17: 'close', 18: 'close',
}
if [s['id'] for s in raw['segments']] != list(scene_ids):
    raise ValueError('Different transcription: manually review scene mapping before proceeding')
units = [dict(w, scene=scene_ids[s['id']], segment=s['id']) for s in raw['segments'] for w in s['words']]
for unit in units:
    unit['text'] = unit['text'].strip().translate(str.maketrans({',': '，', '?': '？', '!': '！'}))

corrections = []
for old, new, reason in [
    ('产物任务', '长任务', 'ASR疑似同音误识；依据已交付稿与官方长任务说明校订，保留待审听点'),
    ('许个条件', '许可条件', '依据上下文与原稿校订ASR用字，未改变配音'),
    ('KimiK3.1Pro', 'Kimi K3.1 Pro', '统一模型名排版，原语音不变'),
    ('Harness平方', 'Harness²', '口语读法转官方项目名'),
    ('VoiceStudio', 'VoiceStudio', '合并拆开的英文项目名词元，避免字幕切断名称'),
    ('Godot', 'Godot', '保留完整引擎名称'),
    ('GitHub', 'GitHub', '保留完整站点名称'),
    ('token', 'token', '保留完整单位名称'),
    ('65.7%', '65.7%', '保留完整数字与单位，不在小数中途切字幕'),
]:
    joined = ''.join(u['text'] for u in units)
    for match in reversed(list(re.finditer(re.escape(old), joined))):
        offset = 0
        indexes = []
        for i, unit in enumerate(units):
            if offset < match.end() and offset + len(unit['text']) > match.start():
                indexes.append(i)
            offset += len(unit['text'])
        first, last = indexes[0], indexes[-1]
        prefix = ''.join(u['text'] for u in units[:first])
        chunk = ''.join(u['text'] for u in units[first:last+1])
        relative_start = match.start()-len(prefix)
        relative_end = match.end()-len(prefix)
        replacement = chunk[:relative_start]+new+chunk[relative_end:]
        item = dict(units[first], end=units[last]['end'], text=replacement)
        corrections.append({'raw': old, 'text': new, 'start': item['start'], 'end': item['end'], 'reason': reason})
        units[first:last+1] = [item]

cues = []
group = []
joined = ''.join(u['text'] for u in units)
breaks = set()
for phrase in ['官方还展示了Godot的游戏作品', '经常制作旁白和视频配音的朋友']:
    position = joined.index(phrase)+len(phrase)
    breaks.add(position)

def flush():
    if not group:
        return
    text = ''.join(u['text'] for u in group).strip('，。！？、 ')
    if text:
        cues.append({'start': round(group[0]['start'],3), 'end': round(group[-1]['end'],3),
                     'text': text, 'scene': group[0]['scene'],
                     'asrSegments': sorted(set(u['segment'] for u in group))})
    group.clear()

position = 0
for unit in units:
    if group and (unit['scene'] != group[0]['scene'] or unit['start']-group[-1]['end']>.45
                  or len(''.join(u['text'] for u in group))+len(unit['text'])>20):
        flush()
    group.append(unit)
    position += len(unit['text'])
    text = ''.join(u['text'] for u in group)
    if position in breaks or (re.search('[，。！？]$',unit['text']) and len(text)>=6 and unit['end']-group[0]['start']>=.65):
        flush()
flush()
if cues[5]['text']=='首先' and cues[6]['scene']==cues[5]['scene']:
    cues[6] = dict(cues[6], start=cues[5]['start'], text='首先，'+cues[6]['text'])
    del cues[5]
for i,cue in enumerate(cues):
    if cue['end']-cue['start']<.3:
        raise ValueError(f'Too short cue: {cue}')
    if i and cue['start']<cues[i-1]['end']-.001:
        raise ValueError('Overlapping ASR windows: review needed')

original = project/'audio/source/narration-original.m4a'
result = {
    'schemaVersion': 1, 'source': 'audio/source/narration-original.m4a',
    'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest(),
    'sourceDuration': 138.920875, 'sourceIn': .25, 'sourceOut': 136.92,
    'edit': '仅裁去首部0.25秒和尾部空白；不加速、不删除内部停顿，未发现明显整句重念',
    'timing': 'faster-whisper large-v3-turbo实际词时间窗；按词聚合句级字幕，非按字数摊时',
    'actualWording': '保留录音中的好成绩、11月4号、感谢观看、下期再见等实际改词',
    'corrections': corrections, 'cues': cues,
    'listening': {'status': 'pending', 'note': '当前通过ASR与稿件文本核对，未实际审听；17.0至17.56秒长任务识别需优先复核'},
}
(project/'audio/recording-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(project/'audio/asr/reviewed-transcript.txt').write_text('\n'.join(f"[{c['start']:.2f}-{c['end']:.2f}] {c['text']}" for c in cues)+'\n',encoding='utf-8')
print(f'REVIEWED cues={len(cues)} voice_seconds={result["sourceOut"]-result["sourceIn"]:.3f}')
