# Test Report

- Generated: 2026-10-26T17:51:10+08:00
- Overall: PASS WITH POSSIBLE NOT-RUN MANUAL/TOOL CHECKS

| Check | Status | Detail |
|---|---|---|
| Mini-program validator | PASS | exit 0 |
| Generic Smoke Test | PASS | exit 0 |
| Domain JavaScript test: branding_v114.test.js | PASS | exit 0 |
| Domain JavaScript test: checklist.test.js | PASS | exit 0 |
| Domain JavaScript test: daily_adjust_crud.test.js | PASS | exit 0 |
| Domain JavaScript test: daily_plan.test.js | PASS | exit 0 |
| Domain JavaScript test: features_v110.test.js | PASS | exit 0 |
| Domain JavaScript test: font_size_layout.test.js | PASS | exit 0 |
| Domain JavaScript test: page_load.test.js | PASS | exit 0 |
| Domain JavaScript test: salary.test.js | PASS | exit 0 |
| Domain JavaScript test: source_alignment.test.js | PASS | exit 0 |
| Domain JavaScript test: storage_migration.test.js | PASS | exit 0 |
| Domain JavaScript test: ui_reference_layout.test.js | PASS | exit 0 |
| Domain JavaScript test: ui_regression.test.js | PASS | exit 0 |

## Command output

### Mini-program validator

- Status: PASS
- Detail: exit 0

```text
[PASS] JSON parses: .\project.config.json
[PASS] miniprogramRoot exists: miniprogram
[PASS] JSON parses: .\miniprogram\app.json
[PASS] Registered pages: 6
[PASS] Page quartet complete: pages/today/today
[PASS] JSON parses: .\miniprogram\pages\today\today.json
[PASS] JSON parses: .\miniprogram\components\progress-bar\progress-bar.json
[PASS] Component resolves: pages/today/today -> progress-bar
[PASS] JSON parses: .\miniprogram\components\empty-state\empty-state.json
[PASS] Component resolves: pages/today/today -> empty-state
[PASS] JSON parses: .\miniprogram\components\edit-sheet\edit-sheet.json
[PASS] Component resolves: pages/today/today -> edit-sheet
[PASS] Page quartet complete: pages/fixed/fixed
[PASS] JSON parses: .\miniprogram\pages\fixed\fixed.json
[PASS] JSON parses: .\miniprogram\components\edit-sheet\edit-sheet.json
[PASS] Component resolves: pages/fixed/fixed -> edit-sheet
[PASS] JSON parses: .\miniprogram\components\empty-state\empty-state.json
[PASS] Component resolves: pages/fixed/fixed -> empty-state
[PASS] Page quartet complete: pages/salary/salary
[PASS] JSON parses: .\miniprogram\pages\salary\salary.json
[PASS] JSON parses: .\miniprogram\components\progress-bar\progress-bar.json
[PASS] Component resolves: pages/salary/salary -> progress-bar
[PASS] JSON parses: .\miniprogram\components\empty-state\empty-state.json
[PASS] Component resolves: pages/salary/salary -> empty-state
[PASS] JSON parses: .\miniprogram\components\edit-sheet\edit-sheet.json
[PASS] Component resolves: pages/salary/salary -> edit-sheet
[PASS] Page quartet complete: pages/stats/stats
[PASS] JSON parses: .\miniprogram\pages\stats\stats.json
[PASS] JSON parses: .\miniprogram\components\progress-bar\progress-bar.json
[PASS] Component resolves: pages/stats/stats -> progress-bar
[PASS] JSON parses: .\miniprogram\components\empty-state\empty-state.json
[PASS] Component resolves: pages/stats/stats -> empty-state
[PASS] Page quartet complete: pages/manage/manage
[PASS] JSON parses: .\miniprogram\pages\manage\manage.json
[PASS] JSON parses: .\miniprogram\components\edit-sheet\edit-sheet.json
[PASS] Component resolves: pages/manage/manage -> edit-sheet
[PASS] JSON parses: .\miniprogram\components\empty-state\empty-state.json
[PASS] Component resolves: pages/manage/manage -> empty-state
[PASS] Page quartet complete: pages/report/report
[PASS] JSON parses: .\miniprogram\pages\report\report.json
[PASS] JSON parses: .\miniprogram\components\progress-bar\progress-bar.json
[PASS] Component resolves: pages/report/report -> progress-bar
[PASS] tabBar entries checked: 5
[PASS] tabBar PNG assets checked: 10
[PASS] Local 144px app icon exists and is PNG
[PASS] lazyCodeLoading is requiredComponents
[PASS] JSON parses: .\miniprogram\sitemap.json
[WARN] AppID is touristappid; real-device/share/publish checks require a real AppID
[PASS] Required delivery file exists: README.md
[PASS] Required delivery file exists: DESIGN.md
[PASS] Required delivery file exists: CODEX_HANDOFF.md
[PASS] Required delivery file exists: CHANGELOG.md
[PASS] Required delivery file exists: VERSION
[PASS] Required delivery file exists: docs/USER_REQUIREMENTS.md
[PASS] Required delivery file exists: docs/ASSUMPTIONS.md
[PASS] Required delivery file exists: docs/CHANGE_SCOPE.md
[PASS] Required delivery file exists: docs/TEST_REPORT.md
[PASS] Required delivery file exists: docs/WECHAT_DEVTOOLS_CHECKLIST.md
[PASS] Required delivery file exists: docs/KNOWN_LIMITATIONS.md
[PASS] Required delivery file exists: docs/OPTIMIZATION_BACKLOG.md
[PASS] Required delivery file exists: docs/NEXT_ITERATION_PROMPT.md
[PASS] Required delivery file exists: docs/SOURCE_MANIFEST.md
[PASS] Required delivery file exists: docs/DELIVERY_REPORT.md
[PASS] Required delivery file exists: docs/DECISION_LOG.md
[PASS] Required delivery file exists: docs/REGRESSION_GUARDS.md
[PASS] Required delivery file exists: source/README.md
[PASS] Required delivery file exists: source/default_categories.snapshot.json
[PASS] Required delivery file exists: tests/checklist.test.js
[PASS] Required delivery file exists: tests/salary.test.js
[PASS] Required delivery file exists: tests/source_alignment.test.js
[PASS] Required delivery file exists: tests/page_load.test.js
[PASS] Required tool exists: tools/quality_gate.py
[PASS] Required tool exists: tools/package_project.py
[PASS] Required tool exists: tools/smoke_test.js
[PASS] No sensitive filenames detected
[PASS] No unresolved code placeholders in runtime files
[PASS] JavaScript syntax checks passed: 21 files
[PASS] Runtime file size measured: 357898 bytes

=== Validation summary ===
Passes: 77
Warnings: 1
Failures: 0
```

### Generic Smoke Test

- Status: PASS
- Detail: exit 0

```text
Smoke test passed
```

### Domain JavaScript test: branding_v114.test.js

- Status: PASS
- Detail: exit 0

```text
Branding V1.1.4 tests passed
```

### Domain JavaScript test: checklist.test.js

- Status: PASS
- Detail: exit 0

```text
Checklist domain tests passed
```

### Domain JavaScript test: daily_adjust_crud.test.js

- Status: PASS
- Detail: exit 0

```text
Daily-adjust CRUD tests passed
```

### Domain JavaScript test: daily_plan.test.js

- Status: PASS
- Detail: exit 0

```text
Daily-plan domain tests passed
```

### Domain JavaScript test: features_v110.test.js

- Status: PASS
- Detail: exit 0

```text
V1.1.0 feature tests passed
```

### Domain JavaScript test: font_size_layout.test.js

- Status: PASS
- Detail: exit 0

```text
PASS font_size_layout.test.js
```

### Domain JavaScript test: page_load.test.js

- Status: PASS
- Detail: exit 0

```text
Page/component load tests passed
```

### Domain JavaScript test: salary.test.js

- Status: PASS
- Detail: exit 0

```text
Salary domain tests passed
```

### Domain JavaScript test: source_alignment.test.js

- Status: PASS
- Detail: exit 0

```text
Source alignment tests passed
```

### Domain JavaScript test: storage_migration.test.js

- Status: PASS
- Detail: exit 0

```text
Storage migration tests passed
```

### Domain JavaScript test: ui_reference_layout.test.js

- Status: PASS
- Detail: exit 0

```text
PASS ui_reference_layout.test.js
```

### Domain JavaScript test: ui_regression.test.js

- Status: PASS
- Detail: exit 0

```text
PASS ui_regression.test.js
```

## Manual checks not implied by this report

- WeChat Developer Tools compile/render.
- Real-device behavior and native sharing.
- Trial upload or production release.

Use `docs/WECHAT_DEVTOOLS_CHECKLIST.md` and mark items only after observation.
