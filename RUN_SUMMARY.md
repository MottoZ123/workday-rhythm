# Release preparation

- Mode: RELEASE; date: 2026-10-26.
- Renamed the public project and user-facing app brand by function.
- Retained original runtime features, storage keys and schema/migrations.
- Kept MIT LICENSE, AGENTS.md, CONTRIBUTING, SECURITY and GitHub Actions.
- Strengthened privacy scans to include workflow files, workbook XML and image metadata.
- Archived the obsolete input package manifest outside the repository; new ZIPs carry a fresh PACKAGE_MANIFEST.json.
- Full verification: `python tools/workflow.py all`.
- Publication uses a newly initialized main branch; no input Git history is copied.
- Requested collaborator: Mary-Wym with write access, subject to invitation acceptance.
- GitHub publication is source hosting only; no cloud or WeChat deployment.

## Documentation release · 2026-10-26

Mode: RELEASE. Rewrote README, added feature diagrams and contributor credit. Retained functional version and runtime behavior. Validation command: `python tools/workflow.py all`; results recorded in local publication logs and per-commit CI.
