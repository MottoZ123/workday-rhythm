#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

EXCLUDED_DIRS = {'.git', 'node_modules', '__pycache__', '.codex-log', 'dist', 'deliverables', 'runs'}
EXCLUDED_SUFFIXES = {'.pyc', '.pyo', '.sha256'}
SENSITIVE_PATTERNS = [
    re.compile(r'^\.env(?:\..+)?$', re.I),
    re.compile(r'^private\..+\.key$', re.I),
    re.compile(r'^project\.private\.config\.json$', re.I),
    re.compile(r'.+\.(?:pem|p12|pfx)$', re.I),
    re.compile(r'^(?:auth|credentials?)\.json$', re.I),
]
PACKAGE_BLOCK_RE = re.compile(
    r'\n?<!-- PACKAGE-INFO:START -->.*?<!-- PACKAGE-INFO:END -->\n?',
    re.S,
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def safe_name(value: str) -> str:
    value = re.sub(r'[^A-Za-z0-9._-]+', '_', value.strip())
    return value.strip('._-') or 'WeChat_MiniProgram'


def iter_files(project: Path):
    for path in sorted(project.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(project)
        if any(part in EXCLUDED_DIRS for part in rel.parts):
            continue
        if path.suffix.lower() in EXCLUDED_SUFFIXES:
            continue
        if path.name == 'DELIVERY_MANIFEST.json':
            continue
        if path.suffix.lower() == '.zip':
            continue
        if any(pattern.match(path.name) for pattern in SENSITIVE_PATTERNS):
            raise RuntimeError(f'Sensitive file blocks packaging: {rel.as_posix()}')
        yield path, rel


def update_delivery_report(
    project: Path,
    archive_name: str,
    checksum_name: str,
    folder_name: str,
) -> None:
    report_path = project / 'docs' / 'DELIVERY_REPORT.md'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    existing = report_path.read_text(encoding='utf-8') if report_path.exists() else '# Delivery Report\n'
    existing = PACKAGE_BLOCK_RE.sub('\n', existing).rstrip() + '\n'
    block = f"""
<!-- PACKAGE-INFO:START -->
## Package output

- Packaged at: `{dt.datetime.now().astimezone().isoformat(timespec='seconds')}`
- Archive filename: `{archive_name}`
- SHA-256 sidecar: `{checksum_name}`
- Top-level folder: `{folder_name}/`
- Sensitive files: excluded and packaging-blocked
- Final archive SHA-256: written after ZIP creation to the external sidecar and printed by the packager.

> A ZIP cannot reliably contain its own final checksum: writing that value back into the archive changes the archive. The external `.sha256` file is therefore the source of truth; `DELIVERY_MANIFEST.json` records hashes for files inside the ZIP.
<!-- PACKAGE-INFO:END -->
"""
    report_path.write_text(existing + block, encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate and package a complete mini-program delivery.')
    parser.add_argument('--project', default='.')
    parser.add_argument('--output', default='../deliverables')
    parser.add_argument('--skip-quality', action='store_true', help='Only for controlled factory self-tests')
    args = parser.parse_args()

    project = Path(args.project).resolve()
    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = (project / output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not args.skip_quality:
        result = subprocess.run([sys.executable, 'tools/quality_gate.py', '--project', '.'], cwd=project)
        if result.returncode != 0:
            print('Quality gate failed; archive was not created.', file=sys.stderr)
            return result.returncode

    config = json.loads((project / 'project.config.json').read_text(encoding='utf-8'))
    version = (project / 'VERSION').read_text(encoding='utf-8').strip() or '0.0.0'
    project_name = safe_name(str(config.get('projectname') or project.name))
    date = dt.datetime.now().astimezone().strftime('%Y%m%d')
    folder_name = f'{project_name}_V{safe_name(version)}'
    archive_path = output_dir / f'{folder_name}_{date}.zip'
    checksum_path = archive_path.with_suffix(archive_path.suffix + '.sha256')

    update_delivery_report(
        project=project,
        archive_name=archive_path.name,
        checksum_name=checksum_path.name,
        folder_name=folder_name,
    )

    files = list(iter_files(project))
    entries = [
        {
            'path': rel.as_posix(),
            'size': path.stat().st_size,
            'sha256': sha256(path),
        }
        for path, rel in files
    ]
    manifest = {
        'project': project_name,
        'version': version,
        'generated_at': dt.datetime.now().astimezone().isoformat(timespec='seconds'),
        'file_count_excluding_manifest': len(entries),
        'files': entries,
        'excluded_sensitive_patterns': [p.pattern for p in SENSITIVE_PATTERNS],
        'archive_checksum_source': checksum_path.name,
    }
    manifest_path = project / 'DELIVERY_MANIFEST.json'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    archive_path.unlink(missing_ok=True)
    checksum_path.unlink(missing_ok=True)

    with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path, rel in files:
            archive.write(path, Path(folder_name) / rel)
        archive.write(manifest_path, Path(folder_name) / 'DELIVERY_MANIFEST.json')

    with zipfile.ZipFile(archive_path, 'r') as archive:
        names = set(archive.namelist())
        required = {
            f'{folder_name}/project.config.json',
            f'{folder_name}/miniprogram/app.json',
            f'{folder_name}/README.md',
            f'{folder_name}/DESIGN.md',
            f'{folder_name}/CODEX_HANDOFF.md',
            f'{folder_name}/DELIVERY_MANIFEST.json',
        }
        missing = sorted(required - names)
        if missing:
            archive_path.unlink(missing_ok=True)
            raise RuntimeError('Archive verification failed, missing: ' + ', '.join(missing))
        bad = archive.testzip()
        if bad:
            archive_path.unlink(missing_ok=True)
            raise RuntimeError(f'Archive CRC verification failed: {bad}')

    archive_hash = sha256(archive_path)
    checksum_path.write_text(f'{archive_hash}  {archive_path.name}\n', encoding='utf-8')

    print(f'Archive: {archive_path}')
    print(f'Checksum: {checksum_path}')
    print(f'SHA-256: {archive_hash}')
    print(f'Files: {len(entries) + 1}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
