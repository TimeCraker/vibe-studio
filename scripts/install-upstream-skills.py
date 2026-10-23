"""Install the pinned official skill without overwriting local modifications.

The system skill-installer can also install this exact repo/ref/path. This
standalone bootstrap keeps a fresh clone usable outside a Codex installation.
"""
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
spec = json.loads((ROOT / 'skills/video-motion/references/upstream.json').read_text(encoding='utf-8'))
cache = ROOT / '.cache/upstream-skills'
dest = cache / spec['name']
url = f"https://codeload.github.com/{spec['repo']}/zip/{spec['ref']}"
request = urllib.request.Request(url, headers={'User-Agent': 'vibe-studio-pinned-skills'})
with urllib.request.urlopen(request, timeout=45) as response:
    data = response.read()
expected = {}
with zipfile.ZipFile(io.BytesIO(data)) as archive:
    top = archive.namelist()[0].split('/')[0]
    prefix = f"{top}/{spec['path']}/"
    for entry in archive.infolist():
        if not entry.filename.startswith(prefix) or entry.is_dir():
            continue
        rel = entry.filename[len(prefix):]
        parts = PurePosixPath(rel)
        if parts.is_absolute() or '..' in parts.parts or '\\' in rel or stat.S_ISLNK(entry.external_attr >> 16):
            raise SystemExit('Unsafe upstream archive path')
        expected[rel] = archive.read(entry)
if 'SKILL.md' not in expected:
    raise SystemExit('Upstream skill not found')
if dest.exists():
    current = {p.relative_to(dest).as_posix(): p.read_bytes() for p in dest.rglob('*') if p.is_file()}
    if current != expected:
        raise SystemExit('Existing upstream skill differs; preserve local edits and use a new cache revision')
else:
    for rel, payload in expected.items():
        path = dest / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(payload)
lock = {'repo': spec['repo'], 'ref': spec['ref'], 'files': {rel: hashlib.sha256(payload).hexdigest() for rel, payload in expected.items()}}
(cache / 'remotion-lock.json').write_text(json.dumps(lock, indent=2) + '\n', encoding='utf-8')
print(f"OK {spec['name']} ref={spec['ref']} files={len(expected)}")
