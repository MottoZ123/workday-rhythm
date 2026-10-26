const defaults = require('../miniprogram/data/defaults')
const checklist = require('../miniprogram/utils/checklist-domain')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

let state = defaults.createDefaultState(0)
assert(state.categories.length === 6, 'Expected six source categories')
assert(state.categories.reduce((sum, category) => sum + category.items.length, 0) === 90, 'Expected ninety source items')

const dateKey = '2026-08-27'
const categoryId = state.categories[0].id
const itemId = state.categories[0].items[0].id
state = checklist.toggleItem(state, dateKey, categoryId, itemId)
let snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.completed === 1 && snapshot.percentage === 1, 'Toggle or percentage failed')

state = checklist.upsertItem(state, categoryId, itemId, '修改后的第一项')
assert(state.categories[0].items[0].text === '修改后的第一项', 'Item edit failed')
const beforeAdd = state.categories[0].items.length
state = checklist.upsertItem(state, categoryId, null, '新清单项')
assert(state.categories[0].items.length === beforeAdd + 1, 'Item add failed')

const added = checklist.addCategory(state, '七、带薪试验')
state = added.state
assert(state.categories.some((category) => category.id === added.categoryId), 'Category add failed')
state = checklist.updateCategory(state, added.categoryId, { title: '七、带薪实验室', icon: '💡', color: '#7E6A8A' })
assert(state.categories.find((category) => category.id === added.categoryId).title === '七、带薪实验室', 'Category rename failed')
state = checklist.reorderCategory(state, added.categoryId, -1)
assert(state.categories[state.categories.length - 2].id === added.categoryId, 'Category reorder failed')

const addedItem = state.categories[0].items[state.categories[0].items.length - 1]
state = checklist.deleteItem(state, categoryId, addedItem.id)
assert(state.trash[0].type === 'item', 'Item trash record missing')
const itemTrashId = state.trash[0].id
state = checklist.restoreTrash(state, itemTrashId)
assert(state.categories[0].items.some((item) => item.id === addedItem.id), 'Item restore failed')

state = checklist.deleteCategory(state, added.categoryId)
assert(state.trash[0].type === 'category', 'Category trash record missing')
const categoryTrashId = state.trash[0].id
state = checklist.restoreTrash(state, categoryTrashId)
assert(state.categories.some((category) => category.id === added.categoryId), 'Category restore failed')

state = checklist.resetDate(state, dateKey)
snapshot = checklist.buildSnapshot(state, dateKey)
assert(snapshot.completed === 0, 'Daily reset failed')

console.log('Checklist domain tests passed')
