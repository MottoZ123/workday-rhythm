const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }
function assert(condition, message) { if (!condition) throw new Error(message) }

const defaults = read('miniprogram/data/defaults.js')
const storageSource = read('miniprogram/utils/storage.js')
const share = read('miniprogram/utils/share.js')
const appJson = JSON.parse(read('miniprogram/app.json'))
const salaryWxml = read('miniprogram/pages/salary/salary.wxml')
const salaryJson = JSON.parse(read('miniprogram/pages/salary/salary.json'))
const todayJs = read('miniprogram/pages/today/today.js')
const manageWxml = read('miniprogram/pages/manage/manage.wxml')

assert(defaults.includes('"title": "摸鱼日常"'), 'Default editable home title should be 摸鱼日常')
assert(share.includes('工休伴侣｜今日清单、攒米进度与休息计时'), 'Share title should use 工休伴侣 / 攒米进度')
assert(appJson.window.navigationBarTitleText === '工休伴侣', 'Global navigation title should be 工休伴侣')
assert(appJson.tabBar.list.some(item => item.pagePath.includes('/salary/') && item.text === '攒米'), 'Salary tab fallback should be 攒米')
assert(salaryJson.navigationBarTitleText === '攒米进度', 'Salary page navigation should use 攒米进度')
assert(salaryWxml.includes("'攒米进度'"), 'Salary hero should use 攒米进度')
assert(todayJs.includes("this.state.profile.title || '摸鱼日常'"), 'Today page fallback should use 摸鱼日常')
assert(manageWxml.includes('bindinput="handleProfileInput"') && manageWxml.includes('saveProfile'), 'Home title must remain user-editable')
assert(storageSource.includes("rawSchemaVersion < 5 && profile.title === '上班摸鱼'"), 'Legacy default title needs one-time migration guard')
assert(storageSource.includes('const SCHEMA_VERSION = 5'), 'Brand migration should use schema v5')
console.log('Branding V1.1.4 tests passed')
