const store = {}
let appCount = 0
let pageCount = 0
let componentCount = 0

global.wx = {
  getStorageSync(key) { return store[key] },
  setStorageSync(key, value) { store[key] = value },
  removeStorageSync(key) { delete store[key] },
  setNavigationBarTitle() {},
  showToast() {},
  showModal() {},
  switchTab() {},
  navigateTo() {},
  stopPullDownRefresh() {},
  pageScrollTo() {},
  vibrateShort() {},
  setClipboardData() {},
  getClipboardData() {}
}
global.App = function registerApp(definition) {
  if (!definition || typeof definition !== 'object') throw new Error('Invalid App definition')
  appCount += 1
}
global.Page = function registerPage(definition) {
  if (!definition || typeof definition !== 'object') throw new Error('Invalid Page definition')
  pageCount += 1
}
global.Component = function registerComponent(definition) {
  if (!definition || typeof definition !== 'object') throw new Error('Invalid Component definition')
  componentCount += 1
}

require('../miniprogram/app')
require('../miniprogram/pages/today/today')
require('../miniprogram/pages/fixed/fixed')
require('../miniprogram/pages/salary/salary')
require('../miniprogram/pages/stats/stats')
require('../miniprogram/pages/manage/manage')
require('../miniprogram/pages/report/report')
require('../miniprogram/components/progress-bar/progress-bar')
require('../miniprogram/components/edit-sheet/edit-sheet')
require('../miniprogram/components/empty-state/empty-state')

if (appCount !== 1) throw new Error(`Expected 1 App registration, got ${appCount}`)
if (pageCount !== 6) throw new Error(`Expected 6 Page registrations, got ${pageCount}`)
if (componentCount !== 3) throw new Error(`Expected 3 Component registrations, got ${componentCount}`)

console.log('Page/component load tests passed')
