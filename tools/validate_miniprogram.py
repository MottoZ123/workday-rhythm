#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REQUIRED_DOCS = [
    'README.md',
    'DESIGN.md',
    'CODEX_HANDOFF.md',
    'CHANGELOG.md',
    'VERSION',
    'docs/USER_REQUIREMENTS.md',
    'docs/ASSUMPTIONS.md',
    'docs/CHANGE_SCOPE.md',
    'docs/TEST_REPORT.md',
    'docs/WECHAT_DEVTOOLS_CHECKLIST.md',
    'docs/KNOWN_LIMITATIONS.md',
    'docs/OPTIMIZATION_BACKLOG.md',
    'docs/NEXT_ITERATION_PROMPT.md',
    'docs/SOURCE_MANIFEST.md',
    'docs/DELIVERY_REPORT.md',
    'docs/DECISION_LOG.md',
    'docs/REGRESSION_GUARDS.md',
    'source/README.md',
    'source/default_categories.snapshot.json',
    'tests/checklist.test.js',
    'tests/salary.test.js',
    'tests/source_alignment.test.js',
    'tests/page_load.test.js',
]

SENSITIVE_NAME_PATTERNS = [
    re.compile(r'^\.env(?:\..+)?$', re.I),
    re.compile(r'^private\..+\.key$', re.I),
    re.compile(r'^project\.private\.config\.json$', re.I),
    re.compile(r'.+\.(?:pem|p12|pfx)$', re.I),
    re.compile(r'^(?:auth|credentials?)\.json$', re.I),
]

PLACEHOLDER_PATTERNS = [
    re.compile(r'\bTODO\b', re.I),
    re.compile(r'\bFIXME\b', re.I),
    re.compile(r'代码同上'),
    re.compile(r'其余省略'),
    re.compile(r'待实现'),
]

class Reporter:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.warnings: list[str] = []
        self.passes: list[str] = []

    def ok(self, message: str) -> None:
        self.passes.append(message)
        print(f'[PASS] {message}')

    def warn(self, message: str) -> None:
        self.warnings.append(message)
        print(f'[WARN] {message}')

    def fail(self, message: str) -> None:
        self.failures.append(message)
        print(f'[FAIL] {message}')


def load_json(path: Path, reporter: Reporter):
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
        reporter.ok(f'JSON parses: {path}')
        return data
    except Exception as exc:
        reporter.fail(f'Invalid JSON {path}: {exc}')
        return None


def resolve_component(base_dir: Path, mini_root: Path, component_path: str) -> Path | None:
    if component_path.startswith(('plugin://', 'ext://', 'weui-miniprogram/')):
        return None
    raw = component_path.split('?')[0]
    if raw.startswith('/'):
        candidate = mini_root / raw.lstrip('/')
    else:
        candidate = base_dir / raw
    return candidate.resolve()


def has_quartet(base: Path) -> list[str]:
    missing = []
    for ext in ('.js', '.json', '.wxml', '.wxss'):
        if not base.with_suffix(ext).is_file():
            missing.append(ext)
    return missing


def check_sensitive_files(root: Path, reporter: Reporter) -> None:
    found = []
    for path in root.rglob('*'):
        if not path.is_file():
            continue
        if any(part in {'.git', 'node_modules', '__pycache__'} for part in path.parts):
            continue
        if any(pattern.match(path.name) for pattern in SENSITIVE_NAME_PATTERNS):
            found.append(path.relative_to(root).as_posix())
    if found:
        reporter.fail('Sensitive files present: ' + ', '.join(found))
    else:
        reporter.ok('No sensitive filenames detected')


def check_placeholders(mini_root: Path, reporter: Reporter) -> None:
    hits = []
    for path in mini_root.rglob('*'):
        if path.suffix.lower() not in {'.js', '.wxml', '.wxss', '.json'}:
            continue
        try:
            text = path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            continue
        for pattern in PLACEHOLDER_PATTERNS:
            if pattern.search(text):
                hits.append(f'{path.relative_to(mini_root)} ({pattern.pattern})')
    if hits:
        reporter.fail('Unresolved code placeholders: ' + '; '.join(hits))
    else:
        reporter.ok('No unresolved code placeholders in runtime files')


def check_js_syntax(mini_root: Path, reporter: Reporter) -> None:
    node = shutil.which('node')
    if not node:
        reporter.warn('Node.js not found; JavaScript syntax checks were not executed')
        return
    failed = []
    files = sorted(mini_root.rglob('*.js'))
    for path in files:
        result = subprocess.run([node, '--check', str(path)], capture_output=True, text=True)
        if result.returncode != 0:
            failed.append(f'{path}: {result.stderr.strip()}')
    if failed:
        reporter.fail('JavaScript syntax errors:\n' + '\n'.join(failed))
    else:
        reporter.ok(f'JavaScript syntax checks passed: {len(files)} files')


def validate(project: Path) -> Reporter:
    reporter = Reporter()
    project = project.resolve()

    config_path = project / 'project.config.json'
    if not config_path.is_file():
        reporter.fail('Missing project.config.json')
        return reporter
    config = load_json(config_path, reporter)
    if not isinstance(config, dict):
        return reporter

    mini_rel = str(config.get('miniprogramRoot') or 'miniprogram/').strip()
    mini_root = (project / mini_rel).resolve()
    if not mini_root.is_dir():
        reporter.fail(f'miniprogramRoot does not exist: {mini_rel}')
        return reporter
    reporter.ok(f'miniprogramRoot exists: {mini_root.relative_to(project)}')

    app_json_path = mini_root / 'app.json'
    if not app_json_path.is_file():
        reporter.fail('Missing miniprogram/app.json')
        return reporter
    app = load_json(app_json_path, reporter)
    if not isinstance(app, dict):
        return reporter

    pages = app.get('pages')
    if not isinstance(pages, list) or not pages:
        reporter.fail('app.json pages must be a non-empty array')
        pages = []
    elif len(pages) != len(set(pages)):
        reporter.fail('app.json contains duplicate page registrations')
    else:
        reporter.ok(f'Registered pages: {len(pages)}')

    for page in pages:
        base = mini_root / str(page)
        missing = has_quartet(base)
        if missing:
            reporter.fail(f'Page {page} missing: {", ".join(missing)}')
            continue
        reporter.ok(f'Page quartet complete: {page}')
        page_json = load_json(base.with_suffix('.json'), reporter)
        if not isinstance(page_json, dict):
            continue
        components = page_json.get('usingComponents', {})
        if components is None:
            components = {}
        if not isinstance(components, dict):
            reporter.fail(f'usingComponents must be an object: {page}')
            continue
        for tag, component_path in components.items():
            if not isinstance(component_path, str):
                reporter.fail(f'Component path for {tag} in {page} is not a string')
                continue
            target = resolve_component(base.parent, mini_root, component_path)
            if target is None:
                reporter.warn(f'External component not locally resolved: {tag} -> {component_path}')
                continue
            missing_component = has_quartet(target)
            if missing_component:
                reporter.fail(f'Component {tag} from {page} missing {missing_component}: {component_path}')
                continue
            component_json = load_json(target.with_suffix('.json'), reporter)
            if not isinstance(component_json, dict) or component_json.get('component') is not True:
                reporter.fail(f'Component JSON must contain component=true: {component_path}')
            else:
                reporter.ok(f'Component resolves: {page} -> {tag}')

    tab_bar = app.get('tabBar')
    if isinstance(tab_bar, dict):
        tab_list = tab_bar.get('list', [])
        if not isinstance(tab_list, list):
            reporter.fail('tabBar.list must be an array')
        else:
            checked_assets = 0
            for item in tab_list:
                page_path = item.get('pagePath') if isinstance(item, dict) else None
                if page_path not in pages:
                    reporter.fail(f'tabBar page is not registered: {page_path}')
                for field in ('iconPath', 'selectedIconPath'):
                    icon_rel = item.get(field) if isinstance(item, dict) else None
                    if not isinstance(icon_rel, str) or not icon_rel.strip():
                        reporter.fail(f'tabBar {field} is missing for page: {page_path}')
                        continue
                    icon_path = (mini_root / icon_rel).resolve()
                    try:
                        icon_path.relative_to(mini_root)
                    except ValueError:
                        reporter.fail(f'tabBar {field} escapes miniprogramRoot: {icon_rel}')
                        continue
                    if not icon_path.is_file():
                        reporter.fail(f'tabBar icon does not exist: {icon_rel}')
                        continue
                    data = icon_path.read_bytes()
                    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
                        reporter.fail(f'tabBar icon is not a PNG: {icon_rel}')
                        continue
                    if len(data) > 40 * 1024:
                        reporter.warn(f'tabBar icon exceeds 40 KiB: {icon_rel} ({len(data)} bytes)')
                    checked_assets += 1
            reporter.ok(f'tabBar entries checked: {len(tab_list)}')
            reporter.ok(f'tabBar PNG assets checked: {checked_assets}')

    app_icon = mini_root / 'assets' / 'app-icon-144.png'
    if app_icon.is_file() and app_icon.read_bytes().startswith(b'\x89PNG\r\n\x1a\n'):
        reporter.ok('Local 144px app icon exists and is PNG')
    else:
        reporter.fail('Missing or invalid local app icon: assets/app-icon-144.png')

    if app.get('lazyCodeLoading') == 'requiredComponents':
        reporter.ok('lazyCodeLoading is requiredComponents')
    else:
        reporter.warn('lazyCodeLoading is not set to requiredComponents')

    sitemap = app.get('sitemapLocation', 'sitemap.json')
    if (mini_root / sitemap).is_file():
        load_json(mini_root / sitemap, reporter)
    else:
        reporter.fail(f'Sitemap file does not exist: {sitemap}')

    appid = str(config.get('appid') or '')
    if appid == 'touristappid':
        reporter.warn('AppID is touristappid; real-device/share/publish checks require a real AppID')
    elif not appid:
        reporter.fail('project.config.json appid is empty')
    else:
        reporter.ok('AppID is configured')

    for rel in REQUIRED_DOCS:
        if (project / rel).is_file():
            reporter.ok(f'Required delivery file exists: {rel}')
        else:
            reporter.fail(f'Missing required delivery file: {rel}')

    for rel in ['tools/quality_gate.py', 'tools/package_project.py', 'tools/smoke_test.js']:
        if (project / rel).is_file():
            reporter.ok(f'Required tool exists: {rel}')
        else:
            reporter.fail(f'Missing required tool: {rel}')

    check_sensitive_files(project, reporter)
    check_placeholders(mini_root, reporter)
    check_js_syntax(mini_root, reporter)

    total_bytes = sum(p.stat().st_size for p in mini_root.rglob('*') if p.is_file())
    reporter.ok(f'Runtime file size measured: {total_bytes} bytes')
    return reporter


def main() -> int:
    parser = argparse.ArgumentParser(description='Validate a native WeChat Mini Program delivery.')
    parser.add_argument('--project', default='.', help='Project root containing project.config.json')
    args = parser.parse_args()
    reporter = validate(Path(args.project))
    print('\n=== Validation summary ===')
    print(f'Passes: {len(reporter.passes)}')
    print(f'Warnings: {len(reporter.warnings)}')
    print(f'Failures: {len(reporter.failures)}')
    return 1 if reporter.failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
