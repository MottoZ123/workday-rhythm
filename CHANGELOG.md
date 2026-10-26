# Changelog

## 1.1.4 — 2026-09-14

- 默认应用品牌由“摸鱼工作伴侣”更新为“工休伴侣”。
- 分享文案中的“工资进度”更新为“攒米进度”，攒米页导航与底栏同步采用“攒米”表达。
- 原版本首页默认标题已调整为开源版中性标题“摸鱼日常”，仍可在管理页自行修改。
- Schema 升级到 v5：只对仍使用旧默认标题“上班摸鱼”的用户执行一次迁移；自定义标题不会被覆盖。
- 保留原 storage key、条目、固定项、工资设置、摸鱼记录、三档字号与全部既有功能。

## 1.1.3 — 2026-08-30

### Added

- Added item creation directly inside Today → “微调今日”; each category exposes a bounded “＋ 新增” action.
- Added item editing and deletion inside the daily adjuster.
- New items created from the adjuster are stored in the master library and automatically selected for today, but are not silently added to the fixed template.

### Changed

- Clarified the scope boundary: daily checkbox toggles remain date-only, while add/edit/delete are master-library operations.
- Separated the daily-toggle hit area from edit/delete actions to avoid accidental state changes on mobile.
- Raised the reusable edit sheet above the daily-adjust sheet and added compact responsive CRUD controls.

### QA

- Added `tests/daily_adjust_crud.test.js` covering add-for-today, master edit, deletion reference pruning, Trash recovery path and UI separation guards.
- Storage schema remains v4; no new migration is required from V1.1.2.

## 1.1.2 — 2026-08-30

### Added

- Added global `small / medium / large` font-size preference under Manage; medium is the new default and is larger than V1.1.1.
- Added bounded font scaling across all six pages; oversized metrics and bottom-tab labels use safety caps.

### Fixed

- Rebuilt salary schedule fields as a real 2×2 CSS Grid so four time pickers fill the available width instead of wrapping into half-width rows.
- Replaced the time-picker glyph arrow with a CSS chevron to reduce font-dependent rendering variance.
- Rebuilt the salary conversion summary as a 2×2 metric grid with overflow protection.

### QA

- Storage schema upgraded from v3 to v4 with `ui.fontSizeMode` migration and invalid-value normalization.
- Added `tests/font_size_layout.test.js` and regression guards for font settings and salary form layout.

## 1.1.1 — 2026-08-29

### Fixed

- Fixed the Today shortcut card where each shortcut occupied only the left half and the right side remained blank on some WeChat viewport/base-library combinations.
- Replaced fragile percentage/calc shortcut sizing with explicit two-row flex groups and equal-width cells.
- Replaced fish-label percentage/calc sizing with a stable three-column CSS Grid.

### Changed

- Rebuilt the Today page to follow the supplied reference more closely: open title/illustration area, two-column countdown/earnings card, compact progress card, single checklist container with nested category panels.
- Added a rounded custom tab bar to match the reference's cream floating navigation treatment.
- Unified page background, warm borders, card radii, text hierarchy, green/orange accents and compact control heights across Fixed, Salary, Stats, Manage and Report.
- Added an exact crop of the user-supplied hero illustration strip for the normal-mode Today header.

### QA

- Added `tests/ui_reference_layout.test.js` and extended `ui_regression.test.js` to prevent shortcut blank-space regressions, fragile calc sizing, missing custom tab bar and missing reference assets.
- Added `docs/UI_PIXEL_SPEC.md` and corresponding UI checks; user reference screenshots are excluded from the public-source archive.

## 1.1.0 — 2026-08-29

### Added

- Added real-time off-work countdown.
- Added 3/5/10/15 minute quick-break timer with automatic capped completion.
- Added stealth/boss mode with neutral copy and optional amount masking.
- Added daily fish-time quota with adjustable limit.
- Added weekly statistics page with seven-day bars and type ranking.
- Added local streak tracking and achievement badges.
- Added custom fish-type create/edit/delete.
- Added random fish draw and deterministic daily fun copy.
- Added daily report page with local Canvas image export and text copy.
- Added local hand-drawn cat/duck illustration assets and excluded all private UI screenshots and visual studies from public distribution.

### Changed

- Reworked the whole visual language to warm cream paper, sage green, warm orange, bounded cards and compact mobile controls.
- Expanded tab bar to five short labels: 今日 / 固定 / 工资 / 统计 / 管理.
- Storage schema upgraded from v2 to v3 while preserving V1.0.x data.
- Added <=360px layout guards for Today, Salary, Statistics and Management.

### Safety / privacy

- No page-level share button was added; native top-right WeChat sharing remains.
- All new statistics, achievements, quota, custom labels and privacy settings remain local.

## 1.0.3 — 2026-08-29

### Fixed

- Replaced the oversized global fixed-template native buttons with two bounded compact actions: “清空固定项” and “全部固定”.
- Moved the explanatory sentence out of the button and converted expand/collapse into a lightweight text action.
- Added nowrap, ellipsis and <=360px layout protection so the fixed-item toolbar cannot grow beyond the viewport.
- Added UI regression assertions for compact fixed-template controls.

## 1.0.2 — 2026-08-29

### Added

- Added a fourth bottom-tab page, “每日固定项”, for one-time daily template setup.
- Added persistent `dailyPlan.fixedItemIds` and per-date `addedItemIds` / `removedItemIds` overrides.
- Added category-level select-all/clear, global select-all/clear, search, collapse/expand and fixed-count summaries.
- Added “微调今日” on the Today page so users can temporarily add non-fixed items or remove fixed items for only the current date.
- Added “恢复今天的固定模板” to discard the current date's temporary adjustments.
- Added item creation/edit/deletion to the fixed-item library page; newly created items are automatically selected as fixed.
- Added schema-v1 to schema-v2 migration: legacy projects preserve their current visible checklist by treating all existing items as fixed until the user refines the template.
- Added daily-plan domain and migration regression tests.

### Changed

- Today page now shows only the effective daily list instead of the entire source library.
- Master item editing/deletion was moved out of the Today page and into the fixed-item library page so the homepage remains a lightweight daily execution surface.
- Backup/export now includes fixed templates and per-date adjustments.

## 1.0.1 — 2026-08-27

### Fixed

- Removed all in-page share buttons; native sharing remains available from the WeChat top-right menu.
- Replaced the fish-timer horizontal scrolling button strip with a stable 3×2 type grid.
- Forced fish-timer labels to a single line with ellipsis protection to prevent narrow-screen wrapping corruption.
- Rebuilt checklist rows so long item text keeps the full content width and Edit/Delete controls sit below the text.
- Removed special play/pause glyphs from timer actions to avoid font-dependent garbled rendering.
- Replaced the history emoji marker with a CSS dot for more consistent rendering.
- Added a UI regression test covering the above layout constraints.

## 1.0.0 — 2026-08-27

### Added

- Converted the supplied editable HTML checklist into a native WeChat Mini Program.
- Preserved six source categories and 90 default checklist items.
- Added editable app badge, main title and subtitle.
- Added category title creation, renaming, icon/color customization, reordering and deletion.
- Added checklist item creation, editing, completion, deletion and restoration.
- Added category and item recycle bin.
- Added per-date checklist completion state and daily reset.
- Added monthly, daily/intern and hourly pay modes.
- Added schedule-aware live salary counter with lunch pause.
- Added per-second, per-minute, hourly and daily salary conversion.
- Added real occupied hourly rate using commute, unpaid overtime and daily expenses.
- Added fish-time timer, categories, session history and earnings calculation.
- Added privacy-safe native sharing.
- Added local JSON backup/import/reset.
- Added validation, domain tests, page-load tests, quality gate and deterministic packaging.
