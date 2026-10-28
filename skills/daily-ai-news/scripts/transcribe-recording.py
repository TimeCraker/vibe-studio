"""Keep reusable word-level ASR evidence for an explicitly selected edition."""
import argparse
from hashlib import sha256
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True)
    parser.add_argument('--model', default='large-v3-turbo')
    args = parser.parse_args()
    root = Path(args.project).resolve()
    recording = json.loads((root / 'audio/recording.json').read_text(encoding='utf-8-sig'))
    for key, digest in [('asrSource', 'asrSha256'), ('originalSource', 'originalSha256'), ('source', 'sourceSha256')]:
        if sha256((root / recording[key]).read_bytes()).hexdigest() != recording[digest]:
            raise ValueError('Recording changed: ' + key)
    out = root / 'audio/asr'
    out.mkdir(exist_ok=True)
    result_path = out / 'raw-words.json'
    if result_path.exists():
        previous = json.loads(result_path.read_text(encoding='utf-8-sig'))
        if previous.get('originalSha256') == recording['originalSha256'] and previous.get('sourceSha256') == recording['asrSha256']:
            print('ASR_CACHE: existing word evidence matches this recording; inspect before rerunning')
            return
        backup = out / ('raw-words-' + previous.get('originalSha256', 'unknown')[:12] + '.json')
        if not backup.exists():
            backup.write_bytes(result_path.read_bytes())
    from faster_whisper import WhisperModel
    draft = (root / recording['manuscript']).read_text(encoding='utf-8-sig')
    model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=8)
    segments, info = model.transcribe(str(root / recording['asrSource']), language='zh', beam_size=5,
                                      word_timestamps=True, vad_filter=True, initial_prompt=draft[:1500])
    items = []
    for s in segments:
        items.append({'id': s.id, 'start': s.start, 'end': s.end, 'text': s.text,
                      'words': [{'start': w.start, 'end': w.end, 'text': w.word, 'probability': w.probability} for w in s.words or []]})
        print(f'SEGMENT {s.id} {s.start:.2f} {s.end:.2f}', flush=True)
    result = {'model': args.model, 'language': info.language, 'duration': info.duration,
              'device': 'cpu', 'computeType': 'int8', 'wordTimestamps': True,
              'source': recording['asrSource'], 'sourceSha256': recording['asrSha256'],
              'originalSource': recording['originalSource'], 'originalSha256': recording['originalSha256'], 'segments': items}
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (out / 'raw-transcript.txt').write_text('\n'.join(f"[{s['start']:.2f}-{s['end']:.2f}] {s['text']}" for s in items) + '\n', encoding='utf-8')
    print(f'ASR_DONE segments={len(items)} seconds={info.duration:.3f}; wording/facts/anchors require agent review')


if __name__ == '__main__':
    main()
