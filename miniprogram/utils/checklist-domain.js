const defaults = require('../data/defaults')
const { deepClone, createId, safeText, clamp } = require('./common')

function getAllItems(state) {
  const rows = []
  ;(state.categories || []).forEach((category) => {
    ;(category.items || []).forEach((item) => {
      rows.push({ category, item })
    })
  })
  return rows
}

function getAllItemIds(state) {
  return getAllItems(state).map((row) => row.item.id)
}

function getAdjustment(state, dateKey) {
  const dailyPlan = state.dailyPlan || {}
  const adjustments = dailyPlan.adjustmentsByDate || {}
  const entry = adjustments[dateKey] || {}
  return {
    addedItemIds: Array.isArray(entry.addedItemIds) ? entry.addedItemIds.map(String) : [],
    removedItemIds: Array.isArray(entry.removedItemIds) ? entry.removedItemIds.map(String) : []
  }
}

function getPlanSets(state, dateKey) {
  const allIds = new Set(getAllItemIds(state))
  const fixedIds = new Set(((state.dailyPlan && state.dailyPlan.fixedItemIds) || []).filter((id) => allIds.has(id)))
  const adjustment = getAdjustment(state, dateKey)
  const addedIds = new Set(adjustment.addedItemIds.filter((id) => allIds.has(id)))
  const removedIds = new Set(adjustment.removedItemIds.filter((id) => allIds.has(id)))
  const effectiveIds = new Set()

  fixedIds.forEach((id) => {
    if (!removedIds.has(id)) effectiveIds.add(id)
  })
  addedIds.forEach((id) => {
    if (!fixedIds.has(id) || !removedIds.has(id)) effectiveIds.add(id)
  })

  return { allIds, fixedIds, addedIds, removedIds, effectiveIds }
}

function getPlanSummary(state, dateKey) {
  const sets = getPlanSets(state, dateKey)
  return {
    fixedCount: sets.fixedIds.size,
    addedCount: Array.from(sets.addedIds).filter((id) => !sets.fixedIds.has(id)).length,
    removedCount: Array.from(sets.removedIds).filter((id) => sets.fixedIds.has(id)).length,
    effectiveCount: sets.effectiveIds.size,
    libraryCount: sets.allIds.size
  }
}

function buildSnapshot(state, dateKey) {
  const checks = state.checksByDate && state.checksByDate[dateKey] ? state.checksByDate[dateKey] : {}
  const sets = getPlanSets(state, dateKey)
  let total = 0
  let completed = 0
  const categories = []

  ;(state.categories || []).forEach((category) => {
    let categoryCompleted = 0
    const items = (category.items || [])
      .filter((item) => sets.effectiveIds.has(item.id))
      .map((item) => {
        const checked = Boolean(checks[item.id])
        total += 1
        if (checked) {
          completed += 1
          categoryCompleted += 1
        }
        return Object.assign({}, item, {
          checked,
          fixed: sets.fixedIds.has(item.id),
          dailyAdded: sets.addedIds.has(item.id) && !sets.fixedIds.has(item.id)
        })
      })

    if (!items.length) return
    const categoryTotal = items.length
    categories.push(Object.assign({}, category, {
      items,
      completed: categoryCompleted,
      total: categoryTotal,
      percentage: categoryTotal ? Math.round(categoryCompleted / categoryTotal * 100) : 0
    }))
  })

  return {
    categories,
    total,
    completed,
    percentage: total ? Math.round(completed / total * 100) : 0,
    planSummary: getPlanSummary(state, dateKey)
  }
}

function buildDailyAdjustSnapshot(state, dateKey) {
  const sets = getPlanSets(state, dateKey)
  return (state.categories || []).map((category) => {
    const items = (category.items || []).map((item) => ({
      id: item.id,
      text: item.text,
      fixed: sets.fixedIds.has(item.id),
      selectedToday: sets.effectiveIds.has(item.id),
      dailyAdded: sets.addedIds.has(item.id) && !sets.fixedIds.has(item.id),
      dailyRemoved: sets.removedIds.has(item.id) && sets.fixedIds.has(item.id)
    }))
    const selectedCount = items.filter((item) => item.selectedToday).length
    return Object.assign({}, category, {
      items,
      selectedCount,
      total: items.length
    })
  })
}

function toggleItem(state, dateKey, categoryId, itemId) {
  const next = deepClone(state)
  if (!next.checksByDate || typeof next.checksByDate !== 'object') next.checksByDate = {}
  if (!next.checksByDate[dateKey]) next.checksByDate[dateKey] = {}
  const category = (next.categories || []).find((item) => item.id === categoryId)
  if (!category || !(category.items || []).some((item) => item.id === itemId)) return next
  next.checksByDate[dateKey][itemId] = !next.checksByDate[dateKey][itemId]
  return next
}

function ensureDailyPlan(next) {
  if (!next.dailyPlan || typeof next.dailyPlan !== 'object') next.dailyPlan = {}
  if (!Array.isArray(next.dailyPlan.fixedItemIds)) next.dailyPlan.fixedItemIds = []
  if (!next.dailyPlan.adjustmentsByDate || typeof next.dailyPlan.adjustmentsByDate !== 'object') {
    next.dailyPlan.adjustmentsByDate = {}
  }
  return next.dailyPlan
}

function toggleFixedItem(state, itemId) {
  const next = deepClone(state)
  const allIds = new Set(getAllItemIds(next))
  if (!allIds.has(itemId)) return next
  const plan = ensureDailyPlan(next)
  const fixed = new Set(plan.fixedItemIds)
  if (fixed.has(itemId)) fixed.delete(itemId)
  else fixed.add(itemId)
  plan.fixedItemIds = Array.from(fixed)
  return next
}

function setFixedItem(state, itemId, selected) {
  const next = deepClone(state)
  const allIds = new Set(getAllItemIds(next))
  if (!allIds.has(itemId)) return next
  const plan = ensureDailyPlan(next)
  const fixed = new Set(plan.fixedItemIds)
  if (selected) fixed.add(itemId)
  else fixed.delete(itemId)
  plan.fixedItemIds = Array.from(fixed)
  return next
}

function setCategoryFixed(state, categoryId, selected) {
  const next = deepClone(state)
  const category = (next.categories || []).find((entry) => entry.id === categoryId)
  if (!category) return next
  const plan = ensureDailyPlan(next)
  const fixed = new Set(plan.fixedItemIds)
  ;(category.items || []).forEach((item) => {
    if (selected) fixed.add(item.id)
    else fixed.delete(item.id)
  })
  plan.fixedItemIds = Array.from(fixed)
  return next
}

function setAllFixed(state, selected) {
  const next = deepClone(state)
  const plan = ensureDailyPlan(next)
  plan.fixedItemIds = selected ? getAllItemIds(next) : []
  return next
}

function toggleDailyPresence(state, dateKey, itemId) {
  const next = deepClone(state)
  const sets = getPlanSets(next, dateKey)
  if (!sets.allIds.has(itemId)) return next
  const plan = ensureDailyPlan(next)
  const entry = getAdjustment(next, dateKey)
  const added = new Set(entry.addedItemIds)
  const removed = new Set(entry.removedItemIds)
  const isFixed = sets.fixedIds.has(itemId)
  const isSelected = sets.effectiveIds.has(itemId)

  if (isFixed) {
    added.delete(itemId)
    if (isSelected) removed.add(itemId)
    else removed.delete(itemId)
  } else {
    removed.delete(itemId)
    if (isSelected) added.delete(itemId)
    else added.add(itemId)
  }

  plan.adjustmentsByDate[dateKey] = {
    addedItemIds: Array.from(added),
    removedItemIds: Array.from(removed)
  }
  return next
}

function resetDailyAdjustments(state, dateKey) {
  const next = deepClone(state)
  const plan = ensureDailyPlan(next)
  delete plan.adjustmentsByDate[dateKey]
  return next
}

function upsertItem(state, categoryId, itemId, value) {
  const text = safeText(value)
  if (!text) throw new Error('清单内容不能为空')
  const next = deepClone(state)
  const category = (next.categories || []).find((item) => item.id === categoryId)
  if (!category) throw new Error('分类不存在')
  category.items = Array.isArray(category.items) ? category.items : []
  if (itemId) {
    const item = category.items.find((entry) => entry.id === itemId)
    if (!item) throw new Error('清单项不存在')
    item.text = text
  } else {
    category.items.push({ id: createId('item'), text })
  }
  return next
}

function removeItemReferences(next, itemIds) {
  const ids = new Set(itemIds)
  const plan = ensureDailyPlan(next)
  plan.fixedItemIds = plan.fixedItemIds.filter((id) => !ids.has(id))
  Object.keys(plan.adjustmentsByDate || {}).forEach((dateKey) => {
    const entry = getAdjustment(next, dateKey)
    plan.adjustmentsByDate[dateKey] = {
      addedItemIds: entry.addedItemIds.filter((id) => !ids.has(id)),
      removedItemIds: entry.removedItemIds.filter((id) => !ids.has(id))
    }
  })
  Object.keys(next.checksByDate || {}).forEach((dateKey) => {
    ids.forEach((id) => delete next.checksByDate[dateKey][id])
  })
}

function deleteItem(state, categoryId, itemId) {
  const next = deepClone(state)
  const category = (next.categories || []).find((item) => item.id === categoryId)
  if (!category) return next
  const index = (category.items || []).findIndex((item) => item.id === itemId)
  if (index < 0) return next
  const removed = category.items.splice(index, 1)[0]
  removeItemReferences(next, [removed.id])
  next.trash = Array.isArray(next.trash) ? next.trash : []
  next.trash.unshift({
    id: createId('trash'),
    type: 'item',
    deletedAt: new Date().toISOString(),
    payload: {
      item: removed,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color,
      originalIndex: index
    }
  })
  return next
}

function addCategory(state, title) {
  const next = deepClone(state)
  const cleanTitle = safeText(title, '新分类')
  const index = (next.categories || []).length
  const category = {
    id: createId('category'),
    title: cleanTitle,
    icon: defaults.ICON_PRESETS[index % defaults.ICON_PRESETS.length],
    color: defaults.COLOR_PRESETS[index % defaults.COLOR_PRESETS.length],
    items: []
  }
  next.categories = Array.isArray(next.categories) ? next.categories : []
  next.categories.push(category)
  return { state: next, categoryId: category.id }
}

function updateCategory(state, categoryId, patch) {
  const next = deepClone(state)
  const category = (next.categories || []).find((item) => item.id === categoryId)
  if (!category) throw new Error('分类不存在')
  if (Object.prototype.hasOwnProperty.call(patch, 'title')) category.title = safeText(patch.title, category.title)
  if (Object.prototype.hasOwnProperty.call(patch, 'icon')) category.icon = safeText(patch.icon, category.icon)
  if (Object.prototype.hasOwnProperty.call(patch, 'color')) category.color = safeText(patch.color, category.color)
  return next
}

function reorderCategory(state, categoryId, direction) {
  const next = deepClone(state)
  const list = next.categories || []
  const index = list.findIndex((item) => item.id === categoryId)
  if (index < 0) return next
  const target = clamp(index + Number(direction || 0), 0, list.length - 1)
  if (target === index) return next
  const moved = list.splice(index, 1)[0]
  list.splice(target, 0, moved)
  return next
}

function deleteCategory(state, categoryId) {
  const next = deepClone(state)
  const index = (next.categories || []).findIndex((item) => item.id === categoryId)
  if (index < 0) return next
  const removed = next.categories.splice(index, 1)[0]
  removeItemReferences(next, (removed.items || []).map((item) => item.id))
  next.trash = Array.isArray(next.trash) ? next.trash : []
  next.trash.unshift({
    id: createId('trash'),
    type: 'category',
    deletedAt: new Date().toISOString(),
    payload: { category: removed, originalIndex: index }
  })
  return next
}

function restoreTrash(state, trashId) {
  const next = deepClone(state)
  const index = (next.trash || []).findIndex((entry) => entry.id === trashId)
  if (index < 0) return next
  const entry = next.trash[index]

  if (entry.type === 'category' && entry.payload && entry.payload.category) {
    const category = entry.payload.category
    const existing = (next.categories || []).find((item) => item.id === category.id)
    if (existing) {
      const ids = new Set((existing.items || []).map((item) => item.id))
      ;(category.items || []).forEach((item) => {
        if (!ids.has(item.id)) existing.items.push(item)
      })
    } else {
      const insertAt = clamp(Number(entry.payload.originalIndex || 0), 0, next.categories.length)
      next.categories.splice(insertAt, 0, category)
    }
  } else if (entry.type === 'item' && entry.payload && entry.payload.item) {
    let category = (next.categories || []).find((item) => item.id === entry.payload.categoryId)
    if (!category) {
      category = {
        id: createId('recovered'),
        title: `已恢复 · ${safeText(entry.payload.categoryTitle, '原分类')}`,
        icon: safeText(entry.payload.categoryIcon, '📦'),
        color: safeText(entry.payload.categoryColor, '#8D7B68'),
        items: []
      }
      next.categories.push(category)
    }
    if (!(category.items || []).some((item) => item.id === entry.payload.item.id)) {
      const insertAt = clamp(Number(entry.payload.originalIndex || 0), 0, category.items.length)
      category.items.splice(insertAt, 0, entry.payload.item)
    }
  }

  next.trash.splice(index, 1)
  return next
}

function permanentlyDeleteTrash(state, trashId) {
  const next = deepClone(state)
  next.trash = (next.trash || []).filter((entry) => entry.id !== trashId)
  return next
}

function clearTrash(state) {
  const next = deepClone(state)
  next.trash = []
  return next
}

function resetDate(state, dateKey) {
  const next = deepClone(state)
  if (next.checksByDate) delete next.checksByDate[dateKey]
  return next
}

function pruneCheckHistory(state, keepDays) {
  const next = deepClone(state)
  const keys = Object.keys(next.checksByDate || {}).sort().reverse()
  keys.slice(Math.max(1, Number(keepDays || 45))).forEach((key) => delete next.checksByDate[key])
  return next
}

function pruneDailyAdjustmentHistory(state, keepDays) {
  const next = deepClone(state)
  const plan = ensureDailyPlan(next)
  const keys = Object.keys(plan.adjustmentsByDate || {}).sort().reverse()
  keys.slice(Math.max(1, Number(keepDays || 45))).forEach((key) => delete plan.adjustmentsByDate[key])
  return next
}

module.exports = {
  getAllItemIds,
  getPlanSummary,
  buildSnapshot,
  buildDailyAdjustSnapshot,
  toggleItem,
  toggleFixedItem,
  setFixedItem,
  setCategoryFixed,
  setAllFixed,
  toggleDailyPresence,
  resetDailyAdjustments,
  upsertItem,
  deleteItem,
  addCategory,
  updateCategory,
  reorderCategory,
  deleteCategory,
  restoreTrash,
  permanentlyDeleteTrash,
  clearTrash,
  resetDate,
  pruneCheckHistory,
  pruneDailyAdjustmentHistory
}
