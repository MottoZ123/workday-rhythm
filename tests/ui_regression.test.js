const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

const appJson = JSON.parse(read('miniprogram/app.json'))
const todayWxml = read('miniprogram/pages/today/today.wxml')
const todayWxss = read('miniprogram/pages/today/today.wxss')
const fixedWxml = read('miniprogram/pages/fixed/fixed.wxml')
const fixedWxss = read('miniprogram/pages/fixed/fixed.wxss')
const fixedJs = read('miniprogram/pages/fixed/fixed.js')
const salaryWxml = read('miniprogram/pages/salary/salary.wxml')
const salaryWxss = read('miniprogram/pages/salary/salary.wxss')
const salaryJs = read('miniprogram/pages/salary/salary.js')
const statsWxml = read('miniprogram/pages/stats/stats.wxml')
const reportWxml = read('miniprogram/pages/report/report.wxml')
const manageWxml = read('miniprogram/pages/manage/manage.wxml')
const todayJs = read('miniprogram/pages/today/today.js')

;[todayWxml, fixedWxml, salaryWxml, statsWxml, reportWxml, manageWxml].forEach((content) => {
  assert(!content.includes('open-type="share"'), 'Standalone share button must not return')
})
assert(todayJs.includes('onShareAppMessage'), 'Today page must retain native menu sharing handler')
assert(salaryJs.includes('onShareAppMessage'), 'Salary page must retain native menu sharing handler')
assert(fixedJs.includes('onShareAppMessage'), 'Fixed page must retain native menu sharing handler')

assert(appJson.pages.includes('pages/stats/stats'), 'Statistics page must be registered')
assert(appJson.pages.includes('pages/report/report'), 'Daily report page must be registered')
assert(appJson.tabBar.list.length === 5, 'Tab bar should use five short labels')
appJson.tabBar.list.forEach((entry) => assert(entry.text.length <= 2, `Tab label should stay compact: ${entry.text}`))

assert(todayWxml.includes('微调今日'), 'Today page must expose daily micro adjustment')
assert(todayWxml.includes('固定项'), 'Today page must link to fixed-item setup')
assert(todayWxml.includes('5分钟休息') && todayWxml.includes('随机摸鱼') && todayWxml.includes('今日日报'), 'Today quick tools must expose new functions')
assert(todayWxml.includes('eye-button'), 'Today page needs compact stealth toggle')
assert(!todayWxml.includes('task-actions'), 'Today rows should stay execution-only')
assert(todayWxss.includes('.task-content { flex: 1; min-width: 0;'), 'Long task text needs flexible width protection')
assert(todayWxss.includes('@media (max-width: 360px)'), 'Today page needs narrow-screen protection')

assert(fixedWxml.includes('清空固定项') && fixedWxml.includes('全部固定'), 'Fixed page needs compact global actions')
assert(fixedWxss.includes('.template-actions { margin-top: 16rpx; display: flex;'), 'Fixed actions should use stable flex layout, not fragile grid sizing')
assert(fixedWxss.includes('height: 58rpx') && fixedWxss.includes('white-space: nowrap'), 'Fixed actions need bounded height and no-wrap protection')
assert(fixedWxss.includes('@media (max-width: 360px)'), 'Fixed page needs narrow-screen protection')

assert(salaryWxml.includes('快捷') && salaryWxml.includes('今日摸鱼') || salaryWxml.includes('今日{{stealthMode ?'), 'Salary page should include quick break and quota features')
assert(salaryWxml.includes('class="quick-grid"'), 'Quick 3/5/10/15 minute selector must exist')
assert(salaryWxml.includes('class="label-grid"'), 'Fish labels must use stable wrapping grid')
assert(!salaryWxml.includes('<scroll-view class="label-scroll"'), 'Fish labels must not return to horizontal scroll-view')
assert(salaryWxss.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'), 'Fish type chips need stable three-column grid')
assert(salaryWxss.includes('white-space: nowrap') && salaryWxss.includes('text-overflow: ellipsis'), 'Fish label text must be ellipsis-protected')
assert(salaryWxml.includes('今日{{stealthMode ? \'休息\' : \'摸鱼\'}}额度'), 'Daily fish quota card must exist')
assert(salaryWxml.includes('今天摸什么？'), 'Random fish draw must exist')
assert(salaryWxml.includes('管理类型'), 'Custom fish type management must exist')
assert(salaryWxss.includes('@media (max-width: 360px)'), 'Salary page needs narrow-screen protection')

assert(statsWxml.includes('近 7 天') && statsWxml.includes('成就勋章'), 'Statistics page must include weekly chart and achievements')
assert(reportWxml.includes('保存日报图片') && reportWxml.includes('复制日报文字'), 'Daily report must support image save and text copy')
assert(manageWxml.includes('隐身 / 老板模式'), 'Management page must expose stealth/boss mode')


assert(appJson.tabBar.custom === true, 'V1.1.1 should use custom tab bar for reference-style rounded navigation')
const customTabWxml = read('miniprogram/custom-tab-bar/index.wxml')
const customTabWxss = read('miniprogram/custom-tab-bar/index.wxss')
assert(customTabWxml.includes('tab-panel') && customTabWxml.includes('tab-item'), 'Custom tab bar markup must exist')
assert(customTabWxss.includes('border-radius: 34rpx 34rpx 24rpx 24rpx'), 'Custom tab bar should preserve rounded reference silhouette')
assert((todayWxml.match(/class="quick-row"/g) || []).length === 2, 'Today shortcuts must be explicitly grouped into two rows')
assert(todayWxss.includes('.quick-tool {') && todayWxss.includes('flex: 1 1 0;'), 'Today shortcut cells must equally fill each row')
assert(!todayWxss.includes('.quick-tool { width: calc(50%'), 'Fragile shortcut calc width must not return')
assert(todayWxml.includes('reference-hero-strip.png'), 'Today hero should use the supplied reference-style illustration strip')


assert(salaryWxml.includes('class="schedule-panel"'), 'Salary settings should use the optimized schedule panel')
assert(salaryWxss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), 'Salary time inputs should fill a stable 2x2 grid')
assert(manageWxml.includes('显示字号'), 'Management page must expose the three-step font selector')

console.log('PASS ui_regression.test.js')
