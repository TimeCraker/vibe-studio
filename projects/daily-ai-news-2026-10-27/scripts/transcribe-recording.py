"""Transcribe the preserved human recording with real word timestamps."""
import argparse
from hashlib import sha256
import json
from pathlib import Path
from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument("--model", required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = root / "audio/source/narration-original.mp3"
wav = root / "audio/source/narration-asr.wav"
out = root / "audio/asr"
out.mkdir(exist_ok=True)
model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=8)
segments, info = model.transcribe(str(wav), language="zh", beam_size=5, word_timestamps=True, vad_filter=True,
    initial_prompt="简体中文。OpenAI，GPT-6.1 Terra，GPT-5.6 Terra，ChatGPT Work，Codex，指数时间假设，Phronix，Mistral Large 4，Hugging Face，甲骨文，Oracle Fusion，十月二十六日，十月三十一日。")
items = []
for s in segments:
    items.append({"id": s.id, "start": s.start, "end": s.end, "text": s.text,
                  "words": [{"start": w.start, "end": w.end, "text": w.word, "probability": w.probability} for w in s.words or []]})
    print(f"SEGMENT {s.id} {s.start:.2f} {s.end:.2f}", flush=True)
data = {"model": str(Path(args.model).resolve()), "language": info.language, "duration": info.duration,
        "device": "cpu", "computeType": "int8", "wordTimestamps": True,
        "source": "audio/source/narration-asr.wav", "sourceSha256": sha256(wav.read_bytes()).hexdigest(),
        "originalSource": "audio/source/narration-original.mp3", "originalSha256": sha256(source.read_bytes()).hexdigest(), "segments": items}
(out / "raw-words.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(out / "raw-transcript.txt").write_text("\n".join(f"[{s['start']:.2f}-{s['end']:.2f}] {s['text']}" for s in items) + "\n", encoding="utf-8")
print(f"ASR_DONE segments={len(items)} seconds={info.duration:.3f}", flush=True)
