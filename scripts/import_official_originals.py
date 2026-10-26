#!/usr/bin/env python3
"""Verify the supplied four-PDF ZIP before optionally adding exact originals."""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import zipfile
ROOT = Path(__file__).resolve().parents[1]
MAX_PDF_BYTES = 20_000_000

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix='.' + path.name + '.', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def import_originals(root: Path, archive: Path, apply: bool = False) -> dict:
    root = root.resolve()
    articles = [json.loads((root / 'content' / 'official' / f'P{i:02}.json').read_text(encoding='utf-8')) for i in range(1, 5)]
    output_dir = root / 'public' / 'originals'
    registry_path = root / 'content' / 'official' / 'pdf-registry.json'
    registry = {a['id']: f"./originals/{a['id']}.pdf" for a in articles}
    for path in [root / 'public', output_dir, root / 'content', root / 'content' / 'official', registry_path]:
        if path.is_symlink():
            raise ValueError(f'Refusing symlink: {path}')
    current_registry = json.loads(registry_path.read_text(encoding='utf-8')) if registry_path.exists() else {}
    if not isinstance(current_registry, dict) or any(k not in registry or registry[k] != v for k, v in current_registry.items()):
        raise ValueError('Registry conflict; existing entries were not changed')
    pending = []
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        for article in articles:
            matches = [i for i in entries if i.filename == article['sourceFile']]
            if len(matches) != 1:
                raise ValueError(f"Missing or duplicate original: {article['sourceFile']}")
            info = matches[0]
            if info.is_dir() or stat.S_ISLNK(info.external_attr >> 16) or not 0 < info.file_size <= MAX_PDF_BYTES:
                raise ValueError(f'Invalid archive entry: {info.filename}')
            data = bundle.read(info)
            if not data.startswith(b'%PDF-') or digest(data) != article['sha256']:
                raise ValueError(f"PDF checksum mismatch: {article['id']}")
            destination = output_dir / f"{article['id']}.pdf"
            if destination.is_symlink() or (destination.exists() and (not destination.is_file() or digest(destination.read_bytes()) != article['sha256'])):
                raise ValueError(f'Existing original differs; refusing overwrite: {destination}')
            pending.append((destination, data))
    # Validate everything before writing; register links last, after all exact files exist.
    written = 0
    if apply:
        for destination, data in pending:
            if not destination.exists():
                atomic_write(destination, data)
                written += 1
        atomic_write(registry_path, (json.dumps(registry, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
    return {'verified': len(pending), 'written': written, 'mode': 'applied' if apply else 'preview', 'bytes': sum(len(data) for _, data in pending)}

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path, help='Path to wx-pdf-20261026.zip')
    parser.add_argument('--apply', action='store_true', help='Copy verified originals and enable PDF links; otherwise preview only')
    args = parser.parse_args()
    try:
        print(json.dumps(import_originals(ROOT, args.archive, args.apply), ensure_ascii=False))
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, RuntimeError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        raise SystemExit(1)
if __name__ == '__main__':
    main()
