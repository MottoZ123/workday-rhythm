const defaults = require('../data/defaults')
const dateUtil = require('./date')
const { deepClone, safeText, clamp } = require('./common')

const SCHEMA_VERSION = 5
const KEYS = {
  schemaVersion: 'moyu_workday_companion_schema_version',
  state: 'moyu_workday_companion_state'
}

function normalizeItem(item, categoryId, index) {
  if (!item || typeof item !== 'object') return null
  const text = safeText(item.text || item.title)
  if (!text) return null
  return {
    id: safeText(item.id, `${categoryId}_legacy_${index}`),
    text
  }
}

function normalizeCategory(category, index) {
  if (!category || typeof category !== 'object') return null
  const id = safeText(category.id, `category_legacy_${index}`)
  const items = Array.isArray(category.items)
    ? category.items.map((item, itemIndex) => normalizeItem(item, id, itemIndex)).filter(Boolean)
    : []
  return {
    id,
    title: safeText(category.title, `分类 ${index + 1}`),
    icon: safeText(category.icon, defaults.ICON_PRESETS[index % defaults.ICON_PRESETS.length]),
    color: safeText(category.color, defaults.COLOR_PRESETS[index % defaults.COLOR_PRESETS.length]),
    items
  }
}

function allItemIds(categories) {
  const ids = []
  ;(categories || []).forEach((category) => {
    ;(category.items || []).forEach((item) => ids.push(item.id))
  })
  return ids
}

function normalizeAdjustments(raw, validIds) {
  const result = {}
  if (!raw || typeof raw !== 'object') return result
  Object.keys(raw).forEach((dateKey) => {
    const entry = raw[dateKey]
    if (!entry || typeof entry !== 'object') return
    const added = Array.isArray(entry.addedItemIds)
      ? Array.from(new Set(entry.addedItemIds.map(String).filter((id) => validIds.has(id))))
      : []
    const removed = Array.isArray(entry.removedItemIds)
      ? Array.from(new Set(entry.removedItemIds.map(String).filter((id) => validIds.has(id))))
      : []
    if (added.length || removed.length) result[dateKey] = { addedItemIds: added, removedItemIds: removed }
  })
  return result
}

function normalizeLabels(raw) {
  const source = Array.isArray(raw) ? raw : defaults.TIMER_LABELS
  const labels = Array.from(new Set(source.map((value) => safeText(value)).filter(Boolean))).slice(0, 16)
  return labels.length ? labels : defaults.TIMER_LABELS.slice()
}

function normalizeVisitDates(raw) {
  const dates = Array.isArray(raw) ? raw.map(String).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value)) : []
  return Array.from(new Set(dates)).sort().slice(-180)
}

function normalizeState(raw) {
  const fallback = defaults.createDefaultState()
  if (!raw || typeof raw !== 'object') return fallback
  const categories = Array.isArray(raw.categories)
    ? raw.categories.map(normalizeCategory).filter(Boolean)
    : fallback.categories
  const validIds = new Set(allItemIds(categories))
  const salary = raw.salary && typeof raw.salary === 'object' ? raw.salary : {}
  const timer = salary.timer && typeof salary.timer === 'object' ? salary.timer : {}
  const hasDailyPlan = raw.dailyPlan && typeof raw.dailyPlan === 'object'
  const rawFixed = hasDailyPlan && Array.isArray(raw.dailyPlan.fixedItemIds)
    ? raw.dailyPlan.fixedItemIds.map(String)
    : allItemIds(categories)
  const fixedItemIds = Array.from(new Set(rawFixed.filter((id) => validIds.has(id))))
  const fishQuota = salary.fishQuota && typeof salary.fishQuota === 'object' ? salary.fishQuota : {}
  const privacy = raw.privacy && typeof raw.privacy === 'object' ? raw.privacy : {}
  const activity = raw.activity && typeof raw.activity === 'object' ? raw.activity : {}
  const labels = normalizeLabels(salary.labels)
  const timerLabel = safeText(timer.label, labels[1] || labels[0] || '发呆')

  const rawSchemaVersion = Math.max(0, Number(raw.schemaVersion) || 0)
  const profile = Object.assign({}, fallback.profile, raw.profile || {})
  if (rawSchemaVersion < 5 && profile.title === '上班摸鱼') profile.title = defaults.DEFAULT_PROFILE.title

  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: safeText(raw.createdAt, fallback.createdAt),
    updatedAt: safeText(raw.updatedAt, fallback.updatedAt),
    profile,
    categories,
    checksByDate: raw.checksByDate && typeof raw.checksByDate === 'object' ? raw.checksByDate : {},
    dailyPlan: {
      fixedItemIds,
      adjustmentsByDate: normalizeAdjustments(hasDailyPlan ? raw.dailyPlan.adjustmentsByDate : {}, validIds)
    },
    trash: Array.isArray(raw.trash) ? raw.trash : [],
    salary: {
      settings: Object.assign({}, fallback.salary.settings, salary.settings || {}),
      timer: {
        running: Boolean(timer.running),
        startedAt: Math.max(0, Number(timer.startedAt) || 0),
        accumulatedSeconds: Math.max(0, Math.floor(Number(timer.accumulatedSeconds) || 0)),
        openedAt: Math.max(0, Number(timer.openedAt) || 0),
        label: labels.includes(timerLabel) ? timerLabel : (labels[0] || timerLabel),
        targetSeconds: Math.max(0, Math.floor(Number(timer.targetSeconds) || 0)),
        quickMinutes: Math.max(0, Math.floor(Number(timer.quickMinutes) || 0))
      },
      labels,
      fishQuota: {
        enabled: fishQuota.enabled !== false,
        minutes: clamp(Math.round(Number(fishQuota.minutes) || defaults.DEFAULT_FISH_QUOTA.minutes), 5, 180)
      },
      sessions: Array.isArray(salary.sessions) ? salary.sessions.filter(Boolean).slice(0, 600) : []
    },
    privacy: {
      stealthMode: Boolean(privacy.stealthMode),
      hideAmounts: privacy.hideAmounts !== false,
      neutralText: privacy.neutralText !== false
    },
    activity: {
      visitDates: normalizeVisitDates(activity.visitDates)
    },
    ui: {
      expandedCategoryIds: raw.ui && Array.isArray(raw.ui.expandedCategoryIds)
        ? raw.ui.expandedCategoryIds.map(String)
        : fallback.ui.expandedCategoryIds,
      fixedExpandedCategoryIds: raw.ui && Array.isArray(raw.ui.fixedExpandedCategoryIds)
        ? raw.ui.fixedExpandedCategoryIds.map(String)
        : fallback.ui.fixedExpandedCategoryIds,
      fontSizeMode: raw.ui && ['small', 'medium', 'large'].includes(raw.ui.fontSizeMode)
        ? raw.ui.fontSizeMode
        : 'medium'
    }
  }
}

function ensureSchema() {
  const current = Number(wx.getStorageSync(KEYS.schemaVersion)) || 0
  const raw = wx.getStorageSync(KEYS.state)
  const normalized = normalizeState(raw)
  wx.setStorageSync(KEYS.schemaVersion, SCHEMA_VERSION)
  wx.setStorageSync(KEYS.state, normalized)
  if (current > SCHEMA_VERSION) console.warn('Stored schema is newer than this app version:', current)
  return SCHEMA_VERSION
}

function loadState() {
  ensureSchema()
  return deepClone(normalizeState(wx.getStorageSync(KEYS.state)))
}

function saveState(state) {
  const normalized = normalizeState(state)
  normalized.updatedAt = new Date().toISOString()
  wx.setStorageSync(KEYS.state, normalized)
  wx.setStorageSync(KEYS.schemaVersion, SCHEMA_VERSION)
  return deepClone(normalized)
}

function recordVisit(state, dateKey) {
  const next = normalizeState(state)
  const key = safeText(dateKey, dateUtil.formatDateKey(new Date()))
  const dates = new Set(next.activity.visitDates || [])
  dates.add(key)
  next.activity.visitDates = Array.from(dates).sort().slice(-180)
  return next
}

function recordVisitToday() {
  return saveState(recordVisit(loadState(), dateUtil.formatDateKey(new Date())))
}

function resetState() {
  return saveState(defaults.createDefaultState())
}

function exportState() {
  return JSON.stringify({
    product: 'moyu-workday-companion',
    version: '1.1.4',
    exportedAt: new Date().toISOString(),
    state: loadState()
  }, null, 2)
}

function importState(text) {
  const parsed = JSON.parse(String(text || ''))
  const rawState = parsed && parsed.state ? parsed.state : parsed
  if (!rawState || typeof rawState !== 'object') throw new Error('备份内容不是有效对象')
  return saveState(rawState)
}

module.exports = {
  SCHEMA_VERSION,
  KEYS,
  normalizeState,
  ensureSchema,
  loadState,
  saveState,
  recordVisit,
  recordVisitToday,
  resetState,
  exportState,
  importState
}
