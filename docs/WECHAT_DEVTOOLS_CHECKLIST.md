# WeChat Developer Tools Checklist — V1.1.4

Mark these only after actual observation.

## Import and compile

- [ ] Import the entire project root, not only `miniprogram/`.
- [ ] Confirm `miniprogramRoot` resolves correctly.
- [ ] Compile with no WXML, WXSS, JSON or component-path errors.
- [ ] Confirm five tabBar entries/icons render correctly: 今日 / 固定 / 工资 / 统计 / 管理.
- [ ] Confirm the non-tab 日报 page opens with `wx.navigateTo`.

## Today

- [ ] Cream/sage/orange Hero card and local cat illustration render without stretching.
- [ ] Eye/stealth control does not overlap title on 320/360/375/390/430px widths.
- [ ] Off-work countdown updates once per second and reaches 00:00:00 after end time.
- [ ] Salary amount is masked in stealth mode.
- [ ] Four quick tools stay within two-column layout; at <=360px they remain readable.
- [ ] 5-minute quick tool starts a capped timer and opens Salary.
- [ ] Random fish tool starts the suggested duration/type.
- [ ] Today only shows effective fixed + date-adjusted items.
- [ ] Long checklist text wraps naturally without being squeezed by action buttons.
- [ ] “微调今日” search/add/remove works and does not rewrite fixed template.

## Fixed

- [ ] `清空固定项 / 全部固定` remain bounded and never overflow.
- [ ] Search, category select/clear and global select/clear work.
- [ ] Add/edit/delete item works; new item is fixed by default.
- [ ] Fixed template persists across restart.

## Salary

- [ ] Hero illustration, off-work countdown and live income card render correctly.
- [ ] 3/5/10/15 minute selector stays one row and does not overflow.
- [ ] Quick timer auto-saves at the selected target after background/foreground.
- [ ] Manual timer start/pause/resume/finish/reset works.
- [ ] Fish-type chips display 3 columns normally and 2 columns <=360px; long custom names ellipsize.
- [ ] Add/edit/delete custom fish types works and history survives label deletion.
- [ ] Daily fish allowance switch/slider updates used/remaining/over-limit state.
- [ ] Random fish draw returns a title, duration and note; “按这个开始” starts the timer.
- [ ] Today history delete/clear works.
- [ ] Monthly/daily/hourly wage settings and real occupied hourly rate still calculate correctly.

## Stats / achievements

- [ ] Seven-day bars fit the screen and labels remain readable.
- [ ] Week total, count, amount and daily average update from session history.
- [ ] TOP 5 labels render with bounded bars.
- [ ] Streak increments on consecutive foreground-use days.
- [ ] Achievement cards show unlocked/progress state and stack safely <=360px.
- [ ] Stealth mode hides amount values in statistics.

## Daily report

- [ ] Daily report page displays current checklist/session data.
- [ ] “复制日报文字” copies the expected summary.
- [ ] “保存日报图片” generates a Canvas image and saves after photo-album authorization.
- [ ] Denied album permission shows a graceful message.
- [ ] Stealth mode exports a masked report image.

## Manage / privacy

- [ ] Boss-mode quick switch toggles display mode across Today/Salary/Stats/Report.
- [ ] “隐身时隐藏工资金额” switch behaves correctly.
- [ ] Badge/title/subtitle, category title/icon/color/order save.
- [ ] Trash restore/permanent delete work.
- [ ] JSON backup/import round-trip preserves schema-v3 fields.
- [ ] Full reset restores defaults.

## Migration

- [ ] Upgrade from a V1.0.3 device state without losing fixed items, checks, salary settings or session history.
- [ ] New schema-v3 fields receive sane defaults: labels, quota, privacy, visit dates, quick timer target.

## Privacy / release

- [ ] No page-level share button exists; only WeChat top-right native share.
- [ ] Native share contains no salary, checklist, timer, fixed-template or backup data.
- [ ] Replace `touristappid` with the real AppID before real-device preview/upload.
- [ ] Test trial upload before production release.
