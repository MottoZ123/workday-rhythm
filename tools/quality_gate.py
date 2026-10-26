#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import datetime as dt
import shutil
import subprocess
import sys
from pathlib import Path


def run(command: list[str], cwd: Path) -> tuple[int, str]:
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8',
                            env={**os.environ, 'PYTHONUTF8': '1', 'PYTHONIOENCODING': 'utf-8'})
    output = (result.stdout or '') + (('\n' + result.stderr) if result.stderr else '')
    return result.returncode, output.replace(str(cwd), '.').strip()


def main() -> int:
    parser = argparse.ArgumentParser(description='Run the complete project quality gate.')
    parser.add_argument('--project', default='.')
    args = parser.parse_args()
    project = Path(args.project).resolve()
    python = sys.executable

    checks: list[tuple[str, list[str] | None, str]] = []
    checks.append(('Mini-program validator', [python, 'tools/validate_miniprogram.py', '--project', '.'], 'required'))

    node = shutil.which('node')
    if node:
        checks.append(('Generic Smoke Test', [node, 'tools/smoke_test.js'], 'required'))
        for test in sorted((project / 'tests').glob('*.js')):
            checks.append((f'Domain JavaScript test: {test.name}', [node, str(test)], 'required'))
    else:
        checks.append(('Generic Smoke Test', None, 'not-run: Node.js unavailable'))

    for test in sorted((project / 'tests').glob('test_*.py')):
        checks.append((f'Domain Python test: {test.name}', [python, str(test)], 'required'))

    rows = []
    failed = False
    for name, command, policy in checks:
        if command is None:
            failed = True
            rows.append((name, 'NOT RUN', policy, ''))
            print(f'[NOT RUN] {name}: {policy}')
            continue
        code, output = run(command, project)
        status = 'PASS' if code == 0 else 'FAIL'
        rows.append((name, status, f'exit {code}', output))
        print(f'[{status}] {name}')
        if output:
            print(output)
        if code != 0:
            failed = True

    report_path = project / 'docs' / 'TEST_REPORT.md'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now().astimezone().isoformat(timespec='seconds')
    lines = [
        '# Test Report',
        '',
        f'- Generated: {now}',
        f'- Overall: {"FAIL" if failed else "PASS WITH POSSIBLE NOT-RUN MANUAL/TOOL CHECKS"}',
        '',
        '| Check | Status | Detail |',
        '|---|---|---|',
    ]
    for name, status, detail, _ in rows:
        lines.append(f'| {name.replace("|", "/")} | {status} | {detail.replace("|", "/")} |')
    lines.extend(['', '## Command output', ''])
    for name, status, detail, output in rows:
        lines.extend([f'### {name}', '', f'- Status: {status}', f'- Detail: {detail}', '', '```text', output or '(no output)', '```', ''])
    lines.extend([
        '## Manual checks not implied by this report',
        '',
        '- WeChat Developer Tools compile/render.',
        '- Real-device behavior and native sharing.',
        '- Trial upload or production release.',
        '',
        'Use `docs/WECHAT_DEVTOOLS_CHECKLIST.md` and mark items only after observation.',
    ])
    report_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'Wrote {report_path}')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
