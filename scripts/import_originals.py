#!/usr/bin/env python3
"""Import the supplied original-materials ZIP without overwriting different files.

Usage: python scripts/import_originals.py /path/lakang-originals.zip --apply
Without --apply, verify and report only. The script does not run git commands.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import stat
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

MAX_BYTES = 64 * 1024 * 1024
MAX_FILES = 128
ROOT = Path(__file__).resolve().parents[1]

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def safe_relative(name: str) -> PurePosixPath:
    if not isinstance(name, str) or '\\' in name or '\x00' in name:
        raise ValueError('Invalid archive path')
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or path.as_posix() != name:
        raise ValueError(f'Unsafe or noncanonical path: {name}')
    if path.parts[:2] != ('references', 'originals') or len(path.parts) < 3:
        raise ValueError(f'Only references/originals/ may be imported: {name}')
    return path

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--repo', type=Path, default=ROOT)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    root = args.repo.resolve()
    if not (root / 'AGENTS.md').is_file():
        raise ValueError('Target does not look like the lakang handoff repository')
    expected = json.loads((root / 'references' / 'original-assets.json').read_text(encoding='utf-8'))['assets']
    pending: list[tuple[Path, bytes, str]] = []
    unchanged = 0
    with zipfile.ZipFile(args.archive) as archive:
        infos = archive.infolist()
        names = [item.filename for item in infos]
        if len(names) != len(set(names)):
            raise ValueError('Duplicate ZIP member')
        if sum(item.file_size for item in infos) > MAX_BYTES:
            raise ValueError('Archive exceeds uncompressed size limit')
        info = archive.getinfo('MANIFEST.json')
        if info.file_size > 1024 * 1024:
            raise ValueError('Manifest is too large')
        manifest = json.loads(archive.read('MANIFEST.json'))
        if manifest.get('schemaVersion') != 1:
            raise ValueError('Unsupported manifest version')
        files = manifest.get('files')
        if not isinstance(files, list) or not 1 <= len(files) <= MAX_FILES:
            raise ValueError('Invalid manifest file count')
        by_name = {entry['path']: entry for entry in files}
        if len(by_name) != len(files):
            raise ValueError('Duplicate manifest path')
        for known in expected:
            entry = by_name.get(known['path'])
            if entry is None or entry.get('sha256') != known['sha256'] or entry.get('bytes') != known['bytes']:
                raise ValueError(f"Original baseline mismatch: {known['path']}")
        total = 0
        for entry in files:
            relative = safe_relative(entry['path'])
            info = archive.getinfo(entry['path'])
            if info.is_dir() or stat.S_ISLNK(info.external_attr >> 16):
                raise ValueError(f'Not a regular file: {relative}')
            if info.file_size != entry['bytes']:
                raise ValueError(f'Size mismatch: {relative}')
            total += info.file_size
            if total > MAX_BYTES:
                raise ValueError('Payload exceeds size limit')
            data = archive.read(info)
            if len(data) != entry['bytes'] or digest(data) != entry['sha256']:
                raise ValueError(f'Checksum mismatch: {relative}')
            target = root.joinpath(*relative.parts)
            if not target.resolve().is_relative_to(root):
                raise ValueError(f'Path escapes repository: {relative}')
            probe = target
            while probe != root:
                if probe.is_symlink():
                    raise ValueError(f'Symlink in target path: {probe}')
                probe = probe.parent
            if target.exists():
                if not target.is_file() or digest(target.read_bytes()) != entry['sha256']:
                    raise ValueError(f'Refusing to overwrite different file: {relative}')
                unchanged += 1
            else:
                pending.append((target, data, str(relative)))
    for target, data, name in pending:
        if args.apply:
            target.parent.mkdir(parents=True, exist_ok=True)
            handle, temporary = tempfile.mkstemp(prefix='.import-', dir=target.parent)
            try:
                with os.fdopen(handle, 'wb') as output:
                    output.write(data)
                if target.exists():
                    raise ValueError(f'Target appeared during import: {name}')
                os.replace(temporary, target)
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
        print(('IMPORTED ' if args.apply else 'VERIFIED ') + name)
    print(f'{len(pending)} new; {unchanged} identical existing; apply={args.apply}')
    print('No git commit or push performed. Review git status and update references/ASSETS.md after committing.')

if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as exc:
        print(f'IMPORT FAILED: {exc}', file=sys.stderr)
        sys.exit(1)
