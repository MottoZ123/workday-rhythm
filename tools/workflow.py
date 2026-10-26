#!/usr/bin/env python3
"""Offline regression and clean release packaging; never deploys services."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def run(args):
    result = subprocess.run(args, cwd=ROOT)
    if result.returncode:
        raise SystemExit(result.returncode)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["all", "test", "validate", "package", "release"])
    parser.add_argument("--output", default="release")
    args = parser.parse_args()
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required; install Node 22+ and add it to PATH.")
    is_schedule = (ROOT / "tools/validate_schedule.py").exists()
    if is_schedule:
        run([sys.executable, "tools/validate_schedule.py"])
        run([node, "tools/smoke_test.js"])
    else:
        run([sys.executable, "tools/quality_gate.py", "--project", "."])
    app = json.loads((ROOT / "miniprogram/app.json").read_text(encoding="utf-8"))
    for page in app["pages"]:
        for ext in [".js", ".json", ".wxml", ".wxss"]:
            if not (ROOT / "miniprogram" / (page + ext)).is_file():
                raise SystemExit("Missing page file: " + page + ext)
    for source in sorted((ROOT / "miniprogram").rglob("*.js")):
        run([node, "--check", str(source)])
    run([node, "tools/privacy_test.js"])
    run([sys.executable, "tools/prepublish_check.py"])
    print("PASS: all offline checks; pages:", len(app["pages"]))
    if args.action in {"test", "validate"}:
        return
    output = (ROOT / args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    version = "2.1.7" if is_schedule else "1.1.4"
    slug = "courseday-planner" if is_schedule else "workday-rhythm"
    prefix = slug + "-v" + version
    archive_path = output / (prefix + ".zip")
    excluded = {".git", "release", "node_modules", "__pycache__", "deliverables", "dist", "runs"}
    files = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(p in excluded for p in rel.parts) or path.is_relative_to(output):
            continue
        if path.suffix in {".zip", ".sha256", ".pyc", ".log"}:
            continue
        if path.name in {"DELIVERY_MANIFEST.json", "PACKAGE_MANIFEST.json"}:
            continue
        files.append((path, rel.as_posix()))
    manifest = {"name": slug, "version": version, "files": [
        {"path": rel, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
         "size": path.stat().st_size} for path, rel in files
    ]}
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as z:
        for path, rel in files:
            z.write(path, prefix + "/" + rel)
        z.writestr(prefix + "/PACKAGE_MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(archive_path) as z:
        assert z.testzip() is None
    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    archive_path.with_suffix(".zip.sha256").write_text(digest + "  " + archive_path.name + "\n", encoding="utf-8")
    (output / (prefix + ".manifest.json")).write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("ZIP:", archive_path)
    print("SHA-256:", digest)

if __name__ == "__main__":
    main()
