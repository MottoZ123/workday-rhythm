const fs = require('fs')
const path = require('path')
const defaults = require('../miniprogram/data/defaults')
const checklist = require('../miniprogram/utils/checklist-domain')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const dateKey = '2026-08-30'
let state = defaults.createDefaultState(0)
state = checklist.setAllFixed(state, false)
const categoryId = state.categories[0].id

// Adding from “微调今日” should create a reusable library item, but only select it for today.
const before = state.categories[0].items.length
state = checklist.upsertItem(state, categoryId, null, '微调今日新增测试项')
const addedItem = state.categories[0].items[state.categories[0].items.length - 1]
assert(state.categories[0].items.length === before + 1, 'Daily adjust add must create a library item')
assert(!state.dailyPlan.fixedItemIds.includes(addedItem.id), 'Daily adjust add must not silently make the item fixed')
state = checklist.toggleDailyPresence(state, dateKey, addedItem.id)
let snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.categories.some((category) => category.items.some((item) => item.id === addedItem.id && item.dailyAdded)), 'New item must be visible today as a daily-added item')

// Editing from “微调今日” is a master-library edit, so future appearances use the new wording.
state = checklist.upsertItem(state, categoryId, addedItem.id, '微调今日修改后的测试项')
let adjustSnapshot = checklist.buildDailyAdjustSnapshot(state, dateKey)
let adjusted = adjustSnapshot.flatMap((category) => category.items).find((item) => item.id === addedItem.id)
assert(adjusted && adjusted.text === '微调今日修改后的测试项', 'Daily adjust edit must update the master item text')

// Deleting from “微调今日” must prune today/fixed/check references and move the item to Trash.
state.checksByDate[dateKey] = { [addedItem.id]: true }
state = checklist.deleteItem(state, categoryId, addedItem.id)
assert(!state.categories[0].items.some((item) => item.id === addedItem.id), 'Deleted item must leave the library')
assert(!state.dailyPlan.fixedItemIds.includes(addedItem.id), 'Deleted item must leave the fixed template')
const dayAdjustment = state.dailyPlan.adjustmentsByDate[dateKey] || { addedItemIds: [], removedItemIds: [] }
assert(!dayAdjustment.addedItemIds.includes(addedItem.id) && !dayAdjustment.removedItemIds.includes(addedItem.id), 'Deleted item must leave daily overrides')
assert(!state.checksByDate[dateKey][addedItem.id], 'Deleted item must leave daily check state')
assert(state.trash.some((entry) => entry.type === 'item' && entry.payload && entry.payload.item.id === addedItem.id), 'Deleted item must be recoverable from Trash')

// Static UI guard: the Today adjuster must expose add/edit/delete without making the whole row an accidental toggle target.
const root = path.resolve(__dirname, '..')
const wxml = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxml'), 'utf8')
const js = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.js'), 'utf8')
const json = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.json'), 'utf8')
const wxss = fs.readFileSync(path.join(root, 'miniprogram/pages/today/today.wxss'), 'utf8')
assert(wxml.includes('openAdjustAddItem') && wxml.includes('openAdjustEditItem') && wxml.includes('deleteAdjustItem'), 'Daily adjust CRUD controls must exist in WXML')
assert(js.includes('confirmAdjustEditor') && js.includes('checklist.deleteItem'), 'Daily adjust CRUD handlers must exist in JS')
assert(json.includes('edit-sheet'), 'Today page must register the edit-sheet component')
assert(wxss.includes('.adjust-choice') && wxss.includes('.adjust-item-actions'), 'Daily adjust row must separate toggle area from management actions')

console.log('Daily-adjust CRUD tests passed')
