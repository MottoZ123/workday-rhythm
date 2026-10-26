const defaults = require('../miniprogram/data/defaults')
const checklist = require('../miniprogram/utils/checklist-domain')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

let state = defaults.createDefaultState(0)
const dateKey = '2026-08-29'
const allIds = checklist.getAllItemIds(state)
assert(allIds.length === 90, 'Expected 90 library items')
assert(state.dailyPlan.fixedItemIds.length === 90, 'Default migration-safe template should initially include all items')

state = checklist.setAllFixed(state, false)
let snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.total === 0, 'Clearing fixed template should empty Today')

const first = state.categories[0].items[0]
const second = state.categories[1].items[0]
const third = state.categories[2].items[0]
state = checklist.setFixedItem(state, first.id, true)
state = checklist.setFixedItem(state, second.id, true)
state = checklist.setFixedItem(state, third.id, true)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.total === 3, 'Three fixed items should produce a three-item Today list')
assert(snapshot.planSummary.fixedCount === 3, 'Fixed summary should be three')

const nonFixed = state.categories[3].items[0]
state = checklist.toggleDailyPresence(state, dateKey, nonFixed.id)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.total === 4, 'Daily add should add one non-fixed item')
assert(snapshot.planSummary.addedCount === 1, 'Daily added summary should be one')
assert(snapshot.categories.some((category) => category.items.some((item) => item.id === nonFixed.id && item.dailyAdded)), 'Daily-added item should be marked')

state = checklist.toggleDailyPresence(state, dateKey, first.id)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.total === 3, 'Daily removal should remove one fixed item')
assert(snapshot.planSummary.removedCount === 1, 'Daily removed summary should be one')

state = checklist.resetDailyAdjustments(state, dateKey)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.total === 3, 'Resetting adjustments should restore fixed template')
assert(snapshot.planSummary.addedCount === 0 && snapshot.planSummary.removedCount === 0, 'Adjustment summary should reset')

state = checklist.toggleItem(state, dateKey, state.categories[1].id, second.id)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.completed === 1, 'Completion should still be date-specific on effective items')

state = checklist.deleteItem(state, state.categories[1].id, second.id)
assert(!state.dailyPlan.fixedItemIds.includes(second.id), 'Deleting an item must prune fixed-template reference')
Object.values(state.dailyPlan.adjustmentsByDate).forEach((entry) => {
  assert(!entry.addedItemIds.includes(second.id) && !entry.removedItemIds.includes(second.id), 'Deleting an item must prune daily adjustment references')
})

console.log('Daily-plan domain tests passed')
