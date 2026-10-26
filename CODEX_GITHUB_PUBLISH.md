# Codex: prepare / publish THIS Moyu repo (V1.1.4)

## Goal
Use this folder as input for a **separate public GitHub repository**. Recommended
name: `workday-rhythm`. Do not combine with the timetable mini-program.

## Mandatory checks
1. Read `AGENTS.md`, `PRIVACY_AND_DATA.md`.
2. `python tools/quality_gate.py --project .`
3. `node tools/privacy_test.js`
4. `python tools/prepublish_check.py`
5. Ensure screenshots / original HTML / personal backup JSON are absent.
6. Ensure real salary is NOT filled in defaults and AppID is `touristappid`.
7. Confirm public-source icon/illustration assets are okay to redistribute.

## GitHub CLI
Authenticate interactively: `gh auth login` (never echo/save tokens).
Publish as a fresh repo with no prior private history:

```bash
git init -b main
git add .
git diff --cached --name-only
git commit -m "chore: publish sanitized V1.1.4 local-only source"
gh repo create workday-rhythm --public --source . --remote origin --push
```

Check existing name/remote before any creation; don't overwrite or force-push.
Afterwards return the real GitHub URL, commit hash and CI statuses. GitHub upload
is NOT a WeChat mini-program release; deployment is a separate manual operation.
