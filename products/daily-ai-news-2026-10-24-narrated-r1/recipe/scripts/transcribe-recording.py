"""Episode-local ASR: preserve raw word timestamps for reviewed subtitle alignment."""
import argparse
import hashlib
import json
from pathlib import Path

from faster_whisper import WhisperModel


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Existing local CTranslate2 model directory")
    args = parser.parse_args()
    project = Path(__file__).resolve().parent.parent
    audio = project / "audio/source/narration-asr.wav"
    output = project / "audio/asr"
    output.mkdir(parents=True, exist_ok=True)
    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=8)
    segments, info = model.transcribe(
        str(audio), language="zh", beam_size=5, word_timestamps=True, vad_filter=True,
        initial_prompt="简体中文。Kimi K3.1 Pro，月之暗面，token，Godot，API，Harness平方，VoiceStudio。",
    )
    items = []
    for segment in segments:
        item = {
            "id": segment.id, "start": segment.start, "end": segment.end,
            "text": segment.text,
            "words": [{"start": w.start, "end": w.end, "text": w.word, "probability": w.probability}
                      for w in segment.words or []],
        }
        items.append(item)
        print(f"SEGMENT {segment.id} {segment.start:.2f} {segment.end:.2f}", flush=True)
    data = {
        "model": str(Path(args.model).resolve()), "language": info.language,
        "duration": info.duration, "device": "cpu", "computeType": "int8",
        "wordTimestamps": True, "source": "audio/source/narration-asr.wav",
        "sourceSha256": hashlib.sha256(audio.read_bytes()).hexdigest(),
        "originalSource": "audio/source/narration-original.m4a",
        "originalSha256": hashlib.sha256((project / 'audio/source/narration-original.m4a').read_bytes()).hexdigest(),
        "segments": items,
    }
    (output / "raw-words.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "raw-transcript.txt").write_text(
        "\n".join(f"[{s['start']:.2f}-{s['end']:.2f}] {s['text']}" for s in items) + "\n", encoding="utf-8")
    print(f"ASR_DONE segments={len(items)} seconds={info.duration:.3f}", flush=True)


if __name__ == "__main__":
    main()
