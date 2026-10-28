"""Build real word-window subtitles and production inputs; never allocate by script length."""
import argparse
import difflib
from hashlib import sha256
import json
from pathlib import Path
import re


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True)
    args = parser.parse_args()
    root = Path(args.project).resolve()
    pending = {}

    def load(name):
        return json.loads((root / name).read_text(encoding='utf-8-sig'))

    def write(name, value):
        pending[name] = json.dumps(value, ensure_ascii=False, indent=2) + '\n'

    def local(name):
        path = (root / name).resolve()
        if not path.is_relative_to(root) or path == root:
            raise ValueError('Unsafe project path: ' + name)
        return path

    rec, raw, config, content, edition = [load(n) for n in ['audio/recording.json', 'audio/asr/raw-words.json', 'audio/alignment.json', 'content.json', 'edition.json']]
    review = config.get('review', {})
    if review.get('status') != 'reviewed' or not review.get('reviewer') or not review.get('notes'):
        raise ValueError('Review ASR spelling, numbers, facts and scene anchors; record agent reviewer/notes in audio/alignment.json')
    for key, digest in [('originalSource', 'originalSha256'), ('source', 'sourceSha256')]:
        if sha256(local(rec[key]).read_bytes()).hexdigest() != rec[digest]:
            raise ValueError('Preserved recording changed: ' + key)
    if raw['originalSha256'] != rec['originalSha256'] or raw['sourceSha256'] != rec['asrSha256'] or not raw.get('wordTimestamps'):
        raise ValueError('ASR evidence belongs to a different recording or lacks word timestamps')
    if sha256(local(rec['asrSource']).read_bytes()).hexdigest() != rec['asrSha256']:
        raise ValueError('ASR input changed')
    units = [dict(w, segment=s['id']) for s in raw['segments'] for w in s['words'] if w.get('text', '').strip()]
    if not units:
        raise ValueError('No speech words; check the recording/transcription')
    for w in units:
        w['text'] = w['text'].strip().translate(str.maketrans({',': '，', '?': '？', '!': '！'}))
        if w['start'] < 0 or w['end'] < w['start'] or w['end'] > rec['sourceDuration'] + .1:
            raise ValueError('Invalid raw word timestamp')
    corrections = []
    for correction in config.get('corrections', []):
        old, new, reason = correction['old'], correction['new'], correction['reason']
        if not old or not new or not reason:
            raise ValueError('Every ASR correction requires old/new/reason; never rewrite actual user remarks')
        text = ''.join(w['text'] for w in units)
        matches = list(re.finditer(re.escape(old), text))
        if not matches:
            raise ValueError('Correction text not found: ' + old)
        for match in reversed(matches):
            offset, selected = 0, []
            for i, w in enumerate(units):
                if offset < match.end() and offset + len(w['text']) > match.start():
                    selected.append(i)
                offset += len(w['text'])
            first, last = selected[0], selected[-1]
            prefix = sum(len(w['text']) for w in units[:first])
            chunk = ''.join(w['text'] for w in units[first:last + 1])
            replacement = chunk[:match.start() - prefix] + new + chunk[match.end() - prefix:]
            merged = dict(units[first], end=units[last]['end'], text=replacement)
            corrections.append(dict(raw=old, text=new, start=merged['start'], end=merged['end'], reason=reason))
            units[first:last + 1] = [merged]
    definitions = content.get('scenes', [])
    if not definitions or definitions[0]['id'] != 'overview' or len({s['id'] for s in definitions}) != len(definitions):
        raise ValueError('content.scenes needs unique ids and starts with overview')
    joined = ''.join(w['text'] for w in units)
    starts, offset, positions = [], 0, []
    for w in units:
        positions.append(offset)
        offset += len(w['text'])
    search_from = 0
    for s in definitions:
        anchor = s.get('anchor', '')
        if not anchor:
            raise ValueError('Missing actual-speech anchor for ' + s['id'])
        pos = joined.find(anchor, search_from)
        if pos < 0:
            raise ValueError('Actual speech anchor missing/in wrong order: ' + anchor)
        index = max(i for i, start in enumerate(positions) if start <= pos)
        if starts and index <= starts[-1]:
            raise ValueError('Scene anchors must start in different, increasing speech words')
        starts.append(index)
        search_from = pos + len(anchor)
    if starts[0] != 0:
        raise ValueError('Overview anchor must include the first spoken words; do not discard the greeting')
    for n, s in enumerate(definitions):
        for w in units[starts[n]:starts[n + 1] if n + 1 < len(starts) else len(units)]:
            w['scene'] = s['id']

    visual_length = lambda text: sum(.55 if ord(c) < 128 else 1 for c in text)
    cues, group = [], []

    def flush():
        if group:
            text = ''.join(w['text'] for w in group).strip('，。！？、 ')
            if text:
                cues.append({'start': round(group[0]['start'], 3), 'end': round(group[-1]['end'], 3), 'text': text, 'scene': group[0]['scene']})
            group.clear()

    for w in units:
        if group and (w['scene'] != group[0]['scene'] or w['start'] - group[-1]['end'] > .45 or visual_length(''.join(v['text'] for v in group) + w['text']) > 24):
            flush()
        group.append(w)
        if re.search('[，。！？]$', w['text']) and visual_length(''.join(v['text'] for v in group)) >= 5 and w['end'] - group[0]['start'] >= .55:
            flush()
    flush()
    for i in range(len(cues) - 1, -1, -1):
        if cues[i]['end'] - cues[i]['start'] < .3:
            if i and cues[i - 1]['scene'] == cues[i]['scene'] and cues[i]['start'] - cues[i - 1]['end'] < .3 and visual_length(cues[i - 1]['text'] + cues[i]['text']) <= 24:
                cues[i - 1].update(end=cues[i]['end'], text=cues[i - 1]['text'] + cues[i]['text'])
                del cues[i]
            elif i + 1 < len(cues) and cues[i + 1]['scene'] == cues[i]['scene'] and cues[i + 1]['start'] - cues[i]['end'] < .3 and visual_length(cues[i]['text'] + cues[i + 1]['text']) <= 24:
                cues[i + 1].update(start=cues[i]['start'], text=cues[i]['text'] + cues[i + 1]['text'])
                del cues[i]
            else:
                raise ValueError('Isolated short subtitle: review word boundaries/correction grouping, not script-length timing')
    for i, c in enumerate(cues):
        if c['end'] <= c['start'] or i and c['start'] < cues[i - 1]['end'] - .001:
            raise ValueError('Overlapping/empty real-word cue')
    source_in = config.get('sourceIn')
    source_out = config.get('sourceOut')
    source_in = max(0, cues[0]['start'] - .15) if source_in is None else source_in
    source_out = min(rec['sourceDuration'], cues[-1]['end'] + .2) if source_out is None else source_out
    if not 0 <= source_in <= cues[0]['start'] < cues[-1]['end'] <= source_out <= rec['sourceDuration']:
        raise ValueError('Trim must preserve all spoken cues; no internal cuts or voice acceleration')
    manuscript_path = local(rec['manuscript'])
    if sha256(manuscript_path.read_bytes()).hexdigest() != rec.get('manuscriptSha256'):
        raise ValueError('Preserved manuscript snapshot changed or has no digest')
    manuscript = manuscript_path.read_text(encoding='utf-8-sig')
    draft = manuscript.split('## 朗读正文')[1].split('## 录音说明')[0]
    norm = lambda t: re.sub(r'[^\w]', '', t.lower())
    similarity = difflib.SequenceMatcher(None, norm(draft), norm(joined), autojunk=False).ratio()
    if similarity < .85 and not config.get('actualChangesExplained'):
        raise ValueError('Draft/recording similarity below .85: explain actual changes/fact verification in actualChangesExplained')
    reviewed_scenes = [{'id': s['id'], 'title': s['title'], 'start': units[starts[i]]['start']} for i, s in enumerate(definitions)]
    r = {**rec, 'schemaVersion': 1, 'sourceIn': source_in, 'sourceOut': source_out, 'timing': 'real ASR word windows; reviewed agent spelling/anchors, human listening pending', 'similarityToDraft': round(similarity, 4), 'corrections': corrections, 'review': review, 'scenes': reviewed_scenes, 'cues': cues}
    write('audio/recording-review.json', r)
    pending['narration-recorded.md'] = '# 实际录音采用稿\n\n' + '\n\n'.join(''.join(w['text'] for w in units if w['scene'] == s['id']) for s in definitions) + '\n'
    fps = 60
    ranking_seconds = edition.get('rankingSeconds', 7)
    if not isinstance(ranking_seconds, (float, int)) or not 0 < ranking_seconds <= 15:
        raise ValueError('Choose a reasonable positive rankingSeconds (at most 15 seconds per page)')
    intro, voice = ranking_seconds * 2, source_out - source_in
    frames = round((intro + voice + .8) * fps)
    seconds = frames / fps
    boundaries = [intro] + [round((intro + s['start'] - source_in) * fps) / fps for s in reviewed_scenes[1:]]
    scenes = [{'id': 'global', 'title': '全球 AI 模型综合能力 TOP15', 'start': 0, 'end': ranking_seconds, 'purpose': '当期全球榜与官标，BGM，无口播', 'subject': '全球 ECI TOP15', 'claimIds': ['ranking']}, {'id': 'domestic', 'title': '国产 AI 模型综合能力 TOP15', 'start': ranking_seconds, 'end': intro, 'purpose': '同版式当期国产榜', 'subject': '国产 ECI TOP15', 'claimIds': ['ranking']}]
    for i, s in enumerate(definitions):
        scenes.append({'id': s['id'], 'title': s['title'], 'start': boundaries[i], 'end': boundaries[i + 1] if i + 1 < len(definitions) else seconds, 'purpose': s.get('purpose', '按实际语义展示变化与材料'), 'subject': s['title'], 'claimIds': s.get('claimIds', [])})
    frame_cues = [{'id': i + 1, 'scene': c['scene'], 'text': c['text'], 'from': round((intro + c['start'] - source_in) * fps), 'to': round((intro + c['end'] - source_in) * fps), 'sourceStart': c['start'], 'sourceEnd': c['end']} for i, c in enumerate(cues)]
    timeline = {'date': edition['date'], 'fps': fps, 'width': 1920, 'height': 1080, 'durationInFrames': frames, 'seconds': seconds, 'voice': 'human-recorded', 'timingMode': 'real-ASR-word-windows-agent-reviewed-human-listening-pending', 'recording': rec['originalSource'], 'recordingSha256': rec['originalSha256'], 'sourceIn': source_in, 'sourceOut': source_out, 'voiceStart': intro, 'scenes': scenes, 'cues': frame_cues}
    write('timeline.json', timeline)
    write('storyboard.json', {'schemaVersion': 1, 'audience': '关注 AI 实际变化的普通观众', 'goal': '讲清本期真实、有用的 AI 新闻', 'profile': 'data', 'claims': load('claims.json'), 'scenes': scenes, 'review': {'status': 'pending'}})
    write('script.json', {'meta': {'title': '今日 AI 资讯 · 实际录音', 'lang': 'zh', 'budgetSeconds': voice, 'charsPerSecond': 5.8, 'bannedWords': []}, 'segments': [{'id': c['id'], 'kind': 'subtitle', 'text': c['text'], 'ref': 'scene ' + c['scene']} for c in frame_cues]})
    def stamp(t):
        ms = round(t * 1000)
        return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'
    pending['captions.srt'] = '\n\n'.join(f"{i+1}\n{stamp(c['from']/fps)} --> {stamp(c['to']/fps)}\n{c['text']}" for i, c in enumerate(frame_cues)) + '\n'
    write('captions.cues.json', {'subtitles': [{'start': round(c['from']/fps, 3), 'end': round(c['to']/fps, 3), 'text': c['text']} for c in frame_cues]})
    write('audio-voice.json', {'schemaVersion': 1, 'duration': voice, 'target': {'integrated': -18, 'truePeak': -2, 'range': 9}, 'ducking': False, 'tracks': [{'file': rec['source'], 'role': 'voice', 'in': source_in, 'duration': voice, 'fadeIn': .03, 'fadeOut': .08, 'highpassHz': 65}]})
    music = content.get('music', {})
    if not music.get('file') or not music.get('credit') or not local(music['file']).is_file():
        raise ValueError('Choose a local BGM and preserve its source/license credit in content.music')
    write('audio.json', {'schemaVersion': 1, 'duration': seconds, 'target': {'integrated': -16, 'truePeak': -2, 'range': 11}, 'ducking': {'threshold': .03, 'ratio': 6, 'attack': 12, 'release': 280}, 'tracks': [{'file': 'audio/voice-clean.wav', 'role': 'voice', 'start': intro, 'duration': voice, 'fadeIn': .03, 'fadeOut': .08}, {'file': music['file'], 'role': 'music', 'duration': intro, 'loop': True, 'gainDb': -4, 'fadeIn': min(.6,intro/4), 'fadeOut': min(.6,intro/4)}, {'file': music['file'], 'role': 'music', 'start': max(0,intro - .3), 'duration': seconds - max(0,intro - .3), 'loop': True, 'gainDb': -15, 'fadeIn': .6, 'fadeOut': min(1.2,(seconds-intro)/4)}]})
    write('qc.json', {'width': 1920, 'height': 1080, 'fps': fps, 'duration': seconds, 'subtitles': {'maxCharsPerSecond': 14}})
    old_plan = load('media-plan.json') if (root / 'media-plan.json').exists() else {}
    shots = []
    for s in definitions:
        m = s.get('media')
        shot = {'sceneId': s['id'], 'inputs': [m['file']] if m else [], 'note': s.get('source', '')}
        if m and m.get('kind') == 'video':
            scene = next(v for v in scenes if v['id'] == s['id'])
            clip_duration = m['sourceOut'] - m['sourceIn']
            if clip_duration <= 0 or m['sourceIn'] < 0:
                raise ValueError('Invalid clip source range')
            if clip_duration < scene['end'] - scene['start'] - 1/fps and not m.get('poster'):
                raise ValueError('Short clip needs a relevant poster for its remaining scene: ' + s['id'])
            shot['videoClips'] = [{'sceneId': s['id'], 'file': m['file'], 'sourceIn': m['sourceIn'], 'sourceOut': m['sourceOut'], 'timelineIn': scene['start'], 'timelineOut': min(scene['end'], scene['start'] + clip_duration), 'playbackRate': 1, 'muted': True}]
        shots.append(shot)
    write('media-plan.json', {**old_plan, 'schemaVersion': 1, 'editionDate': edition['date'], 'shots': shots, 'timing': 'actual recorded speech; real video ranges, original speed'})
    edition.update(status='recording-aligned-render-pending', adoptedNarration='narration-recorded.md')
    edition.setdefault('production', {}).update(humanRecording='received-and-preserved', asrAlignment='word-windows-agent-reviewed', render='pending', humanReview='pending')
    write('edition.json', edition)
    # Validate the complete set before replacing any prior aligned production inputs.
    for name, text in pending.items():
        target = local(name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding='utf-8')
    print(f'ALIGNED scenes={len(scenes)} cues={len(cues)} seconds={seconds:.3f} similarity={similarity:.4f}; human review pending')


if __name__ == '__main__':
    main()
