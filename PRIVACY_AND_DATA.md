# Privacy and data treatment (V1.1.4 public-source)

**Public repository contains:** code, neutral generic checklist presets,
project-drawn cat/tab illustrations, general regression tests.
**It does not contain:** real salary, work employer, salary sessions,
check histories, personal todo items, backups, account or student identity,
screenshots of user devices, short links, or API secrets.

The first-run default amount is an empty string; `checksByDate`, `sessions`,
`visitDates`, `adjustmentsByDate` and `trash` are all empty.
Runtime data is in on-device WeChat storage under
`moyu_workday_companion_state` / `moyu_workday_companion_schema_version`.
The **管理 → 恢复初始版本** control resets local app data after confirmation.
The data backup/export button explicitly copies private JSON to the user's
clipboard: do NOT commit exported JSON or attach it to a public GitHub issue.
No cloud, user login, upload or background data collection exists.
