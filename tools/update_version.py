#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path


def bump(version: str, part: str) -> str:
    match = re.fullmatch(r'(\d+)\.(\d+)\.(\d+)', version.strip())
    if not match:
        raise ValueError(f'Expected semantic version x.y.z, got: {version}')
    major, minor, patch = map(int, match.groups())
    if part == 'major':
        return f'{major + 1}.0.0'
    if part == 'minor':
        return f'{major}.{minor + 1}.0'
    return f'{major}.{minor}.{patch + 1}'


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('part', choices=['major', 'minor', 'patch'])
    parser.add_argument('--project', default='.')
    parser.add_argument('--summary', default='Describe the change before delivery.')
    args = parser.parse_args()
    project = Path(args.project).resolve()
    version_path = project / 'VERSION'
    old = version_path.read_text(encoding='utf-8').strip()
    new = bump(old, args.part)
    version_path.write_text(new + '\n', encoding='utf-8')

    changelog = project / 'CHANGELOG.md'
    existing = changelog.read_text(encoding='utf-8') if changelog.exists() else '# Changelog\n'
    header = f'## [{new}] - {dt.date.today().isoformat()}\n\n### Changed\n\n- {args.summary}\n\n'
    if existing.startswith('# Changelog'):
        rest = existing[len('# Changelog'):].lstrip('\n')
        changelog.write_text('# Changelog\n\n' + header + rest, encoding='utf-8')
    else:
        changelog.write_text('# Changelog\n\n' + header + existing, encoding='utf-8')
    print(f'{old} -> {new}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
