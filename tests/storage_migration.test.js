const storage = require('../miniprogram/utils/storage')
const defaults = require('../miniprogram/data/defaults')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const legacy = defaults.createDefaultState(0)
delete legacy.dailyPlan
delete legacy.privacy
delete legacy.activity
delete legacy.salary.labels
delete legacy.salary.fishQuota
legacy.schemaVersion = 1
legacy.categories[0].items.splice(0, 2)
const migrated = storage.normalizeState(legacy)
const currentItemCount = migrated.categories.reduce((sum, category) => sum + category.items.length, 0)
assert(migrated.schemaVersion === 5, 'Legacy data should migrate to schema 5')
assert(migrated.dailyPlan.fixedItemIds.length === currentItemCount, 'Legacy migration should preserve visible behavior by fixing all current items')
assert(migrated.dailyPlan.adjustmentsByDate && typeof migrated.dailyPlan.adjustmentsByDate === 'object', 'Migration should add adjustment map')
assert(Array.isArray(migrated.salary.labels) && migrated.salary.labels.length >= 1, 'Migration should add custom fish labels')
assert(migrated.salary.fishQuota && migrated.salary.fishQuota.minutes === 30, 'Migration should add fish quota')
assert(migrated.privacy && migrated.privacy.hideAmounts === true, 'Migration should add privacy settings')
assert(migrated.activity && Array.isArray(migrated.activity.visitDates), 'Migration should add visit history')
assert(Object.prototype.hasOwnProperty.call(migrated.salary.timer, 'targetSeconds'), 'Migration should add quick timer target')
assert(migrated.ui && migrated.ui.fontSizeMode === 'medium', 'Migration should add safe medium font mode')

const withDangling = defaults.createDefaultState(0)
withDangling.dailyPlan.fixedItemIds.push('missing_item')
withDangling.dailyPlan.adjustmentsByDate['2026-08-29'] = {
  addedItemIds: ['missing_item', withDangling.categories[0].items[0].id],
  removedItemIds: ['missing_item']
}
const normalized = storage.normalizeState(withDangling)
assert(!normalized.dailyPlan.fixedItemIds.includes('missing_item'), 'Normalization should remove dangling fixed IDs')
assert(!normalized.dailyPlan.adjustmentsByDate['2026-08-29'].addedItemIds.includes('missing_item'), 'Normalization should remove dangling daily-add IDs')


const invalidFont = defaults.createDefaultState(0)
invalidFont.ui.fontSizeMode = 'huge'
const normalizedFont = storage.normalizeState(invalidFont)
assert(normalizedFont.ui.fontSizeMode === 'medium', 'Invalid font modes should normalize to medium')

console.log('Storage migration tests passed')

const legacyBrand = defaults.createDefaultState()
legacyBrand.schemaVersion = 4
legacyBrand.profile.title = '上班摸鱼'
const migratedBrand = storage.normalizeState(legacyBrand)
assert(migratedBrand.profile.title === '摸鱼日常', 'Old default title should migrate to 摸鱼日常')

const customBrand = defaults.createDefaultState()
customBrand.schemaVersion = 4
customBrand.profile.title = '我的快乐小站'
const migratedCustomBrand = storage.normalizeState(customBrand)
assert(migratedCustomBrand.profile.title === '我的快乐小站', 'Customized title must survive schema v5 migration')
