# Open-source release QA

Release preparation date: 2026-10-26. Mode: RELEASE.

## Automated scope

Run `python tools/workflow.py all` before publishing. Any failed subprocess stops packaging. Node.js is required; missing Node is a failure.

The gate runs the existing project regression suite, privacy tests, runtime JavaScript syntax checks, registered-page quartet checks, and the pre-publication scan. The scanner includes GitHub Actions and workbook XML; it rejects real AppIDs, recognized credential literals, phone/email-like personal identifiers, personal export filenames, private configuration, private image metadata and cloud calls.

Baseline: 6 pages (5 tabs), Schema v5, 12 domain/UI test files. Coverage includes checklist editing, daily overrides, salary calculations, timers, statistics, migration, page loading, typography and branding. Privacy tests require empty initial salary, history, visits, adjustments and trash.

## Manual checks still required

- WeChat Developer Tools compilation and rendering on all pages.
- Real-device storage persistence, native share behavior, small screens and safe areas.
- Three font sizes, 3/5/10/15-minute timers after backgrounding, stealth mode, backup/restore, Canvas report and album permission.
- Real AppID stays local; no WeChat upload, review or publication was performed.

## Evidence

Local command logs and remote commit/Actions status are recorded in the enclosing project release report. GitHub Actions is the reproducible per-commit test record; this document does not claim any unobserved device test or remote CI run passed.
