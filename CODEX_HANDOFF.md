# Codex Handoff — 工休伴侣 V1.1.4

## Baseline

- Native WeChat Mini Program.
- Five tab pages: Today / Fixed / Salary / Stats / Manage.
- One non-tab Daily Report page.
- Import project root containing `project.config.json`; `miniprogramRoot = miniprogram/`.
- Placeholder AppID: `touristappid`.
- Storage prefix: `moyu_workday_companion_`.
- Storage schema: `5`.

## Do not break the daily checklist model

1. `categories/items` = complete editable library;
2. `dailyPlan.fixedItemIds` = reusable daily template;
3. `dailyPlan.adjustmentsByDate[date]` = date-only additions/removals.

Today renders:

```text
fixed - removedToday + addedToday
```

## V1.1.4 feature invariants

1. Off-work countdown uses configured `endTime` and does not need a server.
2. Quick timer uses `targetSeconds`; when reopening after the target, auto-finish saves only the target duration, not the entire background elapsed time.
3. Custom fish labels are local and deleting a label never deletes old sessions.
4. Daily fish quota is advisory/local and never silently removes session history.
5. Weekly stats derive from local sessions; achievements derive from sessions, visit dates and checklist history.
6. Stealth/boss mode is display-only; it must not mutate or round stored salary/session values.
7. Report image generation stays local via Canvas and must respect amount masking in stealth mode.
8. No page-level `open-type="share"`; use only WeChat top-right native sharing.
9. Never reintroduce any user-provided reference screenshots or private visual source images.
10. Keep narrow-screen guards and bounded buttons; do not reintroduce horizontal fish-type scrolling or long native buttons.
11. In Today → 微调今日, checkbox selection is date-only, while add/edit/delete are master-library operations. New items must be selected for today but must not silently become fixed.
12. Edit/delete controls must remain separate from the row toggle hit-area; do not attach `toggleDailyPresence` to the whole management row.

## Main modules

- `utils/checklist-domain.js` — library, fixed template, date adjustments, check state.
- `utils/salary-domain.js` — salary rates, live earnings, off-work countdown.
- `services/salary-service.js` — timer, quick target, sessions, labels, quota.
- `utils/fun-domain.js` — quick presets, random break suggestions, daily fun copy, quota snapshot.
- `utils/stats-domain.js` — weekly stats, streaks, achievements, report data.
- `utils/storage.js` — schema-v3 normalization and migration.
- `pages/report/*` — Canvas daily report export.

## Verification

```bash
python tools/quality_gate.py --project .
python tools/package_project.py --project . --output ../deliverables
```

Never report WeChat Developer Tools, simulator, album permission or real-device checks as passed unless actually observed.

## 2026-10-26 · 项目展示与贡献者

- 重写功能导向 README，加入 SVG 功能概览和 Mermaid 使用流程。示意图不代表真机截图。
- 列出 Mary-Wym 为共同开发者 / Contributor；不冒用贡献者身份创建提交。
- About 使用项目功能梗概；文档更新不改变功能版本、运行逻辑或数据格式。

## 2026-10-26 · 品牌与共同作者更新

- README 移除开发者名单，保留贡献流程。
- 按维护者指定的 project1 方式，在本次发布提交中使用 Co-authored-by 关联 Mary-wym，账号采用 GitHub 数字 ID 对应的 noreply 地址。
