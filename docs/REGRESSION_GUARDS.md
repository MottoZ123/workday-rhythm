# Regression Guards

## Data / behavior

1. Default source remains six categories and 90 items.
2. Completion is keyed by stable item IDs and date.
3. Today renders fixed items minus date removals plus date additions.
4. Date micro-adjustments never rewrite the reusable fixed template.
5. Deleting categories/items prunes dangling fixed/adjustment/check references.
6. V1.0.x data migrates to schema v3 without emptying Today or losing salary/session history.
7. Monthly 22,000 / 22 days / 8 paid hours remains 1,000 per day and 125 per hour.
8. Lunch pauses live income; end time caps live income at daily pay.
9. Quick timer target is capped: a 5-minute quick timer cannot become a 40-minute session after backgrounding.
10. Pause/resume preserves accumulated manual timer seconds.
11. Custom fish labels can be added/edited/deleted without deleting historical sessions.
12. Daily quota is advisory and local.
13. Stealth mode only changes presentation and never mutates stored money values.
14. Weekly statistics and achievements use local data only.
15. Daily report respects stealth amount masking.

## UI

- No page-level `open-type="share"` share buttons.
- Five tab labels remain <=2 Chinese characters to avoid bottom-bar crowding.
- Fish type labels use bounded wrapping grid, single-line text and ellipsis; never a horizontal scrolling strip.
- Fixed-page `清空固定项 / 全部固定` remain bounded compact controls.
- Today task text keeps full flexible width and no permanent edit/delete controls.
- No font-dependent play/pause glyphs in critical buttons.
- Today, Salary, Stats, Fixed and Manage keep <=360px layout guards.
- Major runtime pages use local illustration assets, not external URLs.

## V1.1.1 reference-layout guards

- Shortcut full-width guard: use explicit `.quick-row` groups and `.quick-tool { flex: 1 1 0; }`; do not return to `width: calc(50% - ...)`.
- Fish-label guard: use a 3-column grid with ellipsis; no horizontal scroll-view and no calc-based column widths.
- Custom tab bar guard: `tabBar.custom` and `custom-tab-bar/` must remain present.
- Reference assets guard: keep `miniprogram/assets/illustrations/reference-hero-strip.png` and `current_layout_issue.png` in full deliveries.

## V1.1.2 font/layout guards

- Persist only `small / medium / large`; normalize unknown font modes to `medium`.
- All six page roots must bind `font-{{fontMode}}`.
- Salary schedule must remain a two-column CSS Grid with full-width pickers; no percentage/calc widths.
- Large font mode must cap navigation and oversized metrics rather than scaling every value linearly.
- Do not use font-dependent arrow/play/pause glyphs for critical controls.
## V1.1.3 daily-adjust CRUD guards

- New items created in “微调今日” must be in the master library and selected for the current date only; do not auto-add them to `fixedItemIds`.
- Editing keeps the same item id and therefore preserves fixed/daily references.
- Deleting must prune fixed, daily-adjustment and check-state references and create a Trash entry.
- Edit/delete controls must not bubble into the date-only selection toggle.
- CRUD action labels must remain short and bounded on 320–360px devices.


## V1.1.4 branding guards

- 默认首页主标题必须为“摸鱼日常”，但管理页编辑入口必须保留。
- v4 旧默认标题“上班摸鱼”只能迁移一次；v5 之后用户主动改回该文字也不得被反复覆盖。
- 分享标题必须使用“工休伴侣｜今日清单、攒米进度与休息计时”。
- 攒米页导航标题为“攒米进度”，底栏短标签为“攒米”。
