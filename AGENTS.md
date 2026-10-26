# Codex rules — Workday Rhythm V1.1.4 public-source

- Keep native WeChat mini-program pages, edits, timer, salary calculator, stats,
  report, privacy display mode, local backups and local-only data storage.
- Starting state must contain NO real salary, history, names, task completion or accounts.
- Do not re-add private UI screenshots, user original HTML, private docs or social short links.
- Never introduce cloud, account sync or external data collection without explicit request.
- `touristappid` is intentional for public source code; publishing an actual WeChat
  mini-program needs the maintainer's private AppID configured locally.
- Keep Storage schema v5 and migrations and original features in V1.1.4.
- Run `python tools/quality_gate.py --project .`, `node tools/privacy_test.js`,
  and `python tools/prepublish_check.py` before publishing.
- For GitHub publishing, follow `CODEX_GITHUB_PUBLISH.md`; do not commit secrets.
