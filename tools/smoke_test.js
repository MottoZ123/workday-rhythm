const store = {}

global.wx = {
  getStorageSync(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : undefined
  },
  setStorageSync(key, value) {
    store[key] = value
  },
  removeStorageSync(key) {
    delete store[key]
  }
}

const storage = require('../miniprogram/utils/storage')
const defaults = require('../miniprogram/data/defaults')
const checklist = require('../miniprogram/utils/checklist-domain')
const share = require('../miniprogram/utils/share')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

storage.ensureSchema()
let state = storage.loadState()
assert(state.categories.length === 6, 'Default category count should be 6')
assert(state.categories.reduce((sum, category) => sum + category.items.length, 0) === 90, 'Default item count should be 90')

const firstCategory = state.categories[0]
const firstItem = firstCategory.items[0]
state = checklist.toggleItem(state, '2026-08-27', firstCategory.id, firstItem.id)
storage.saveState(state)
assert(checklist.buildSnapshot(storage.loadState(), '2026-08-27').completed === 1, 'Daily check did not round-trip')

const exported = storage.exportState()
state = storage.resetState()
assert(checklist.buildSnapshot(state, '2026-08-27').completed === 0, 'Reset did not clear daily check')
state = storage.importState(exported)
assert(checklist.buildSnapshot(state, '2026-08-27').completed === 1, 'Backup import did not restore daily check')

const message = share.appMessage()
const serialized = JSON.stringify(message)
assert(message.path === '/pages/today/today', 'Share path must be the public today page')
assert(!serialized.includes(String(state.salary.settings.amount || '22000')), 'Share payload leaked salary')
assert(!serialized.includes(firstItem.text), 'Share payload leaked checklist text')
assert(defaults.TIMER_LABELS.includes(state.salary.timer.label), 'Timer label normalization failed')

console.log('Smoke test passed')
