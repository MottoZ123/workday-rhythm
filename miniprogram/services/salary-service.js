const { deepClone, createId, safeText, clamp } = require('../utils/common')
const { formatDateKey } = require('../utils/date')

function elapsedSeconds(timer, nowInput) {
  const now = Number(nowInput == null ? Date.now() : nowInput)
  const base = Math.max(0, Math.floor(Number(timer && timer.accumulatedSeconds) || 0))
  if (!timer || !timer.running || !timer.startedAt) return base
  return base + Math.max(0, Math.floor((now - Number(timer.startedAt)) / 1000))
}

function updateSettings(state, settings) {
  const next = deepClone(state)
  next.salary.settings = Object.assign({}, next.salary.settings || {}, settings || {})
  return next
}

function setFishQuota(state, patch) {
  const next = deepClone(state)
  next.salary.fishQuota = Object.assign({}, next.salary.fishQuota || {}, patch || {})
  next.salary.fishQuota.minutes = clamp(Math.round(Number(next.salary.fishQuota.minutes) || 30), 5, 180)
  next.salary.fishQuota.enabled = next.salary.fishQuota.enabled !== false
  return next
}

function setLabels(state, labels) {
  const next = deepClone(state)
  const safe = Array.from(new Set((labels || []).map((label) => safeText(label)).filter(Boolean))).slice(0, 16)
  next.salary.labels = safe.length ? safe : ['发呆']
  if (!next.salary.labels.includes(next.salary.timer.label)) next.salary.timer.label = next.salary.labels[0]
  return next
}

function addLabel(state, label) {
  const text = safeText(label)
  if (!text) throw new Error('摸鱼类型不能为空')
  if (text.length > 8) throw new Error('摸鱼类型最多 8 个字')
  const labels = (state.salary.labels || []).slice()
  if (labels.includes(text)) throw new Error('这个类型已经存在')
  if (labels.length >= 16) throw new Error('最多保留 16 个摸鱼类型')
  labels.push(text)
  return setLabels(state, labels)
}

function updateLabel(state, oldLabel, newLabel) {
  const text = safeText(newLabel)
  if (!text) throw new Error('摸鱼类型不能为空')
  if (text.length > 8) throw new Error('摸鱼类型最多 8 个字')
  const labels = (state.salary.labels || []).slice()
  const index = labels.indexOf(oldLabel)
  if (index < 0) return state
  if (labels.some((item, i) => i !== index && item === text)) throw new Error('这个类型已经存在')
  labels[index] = text
  const next = setLabels(state, labels)
  if (next.salary.timer.label === oldLabel) next.salary.timer.label = text
  return next
}

function deleteLabel(state, label) {
  const labels = (state.salary.labels || []).filter((item) => item !== label)
  if (!labels.length) throw new Error('至少保留一个摸鱼类型')
  return setLabels(state, labels)
}

function startTimer(state, label, nowInput, options) {
  const next = deepClone(state)
  const now = Number(nowInput == null ? Date.now() : nowInput)
  const timer = next.salary.timer
  const opts = options || {}
  if (!timer.running) {
    timer.running = true
    timer.startedAt = now
    timer.openedAt = timer.openedAt || now
  }
  timer.label = safeText(label, timer.label || '发呆')
  if (Object.prototype.hasOwnProperty.call(opts, 'targetSeconds')) {
    timer.targetSeconds = Math.max(0, Math.floor(Number(opts.targetSeconds) || 0))
    timer.quickMinutes = timer.targetSeconds ? Math.round(timer.targetSeconds / 60) : 0
  }
  return next
}

function pauseTimer(state, nowInput) {
  const next = deepClone(state)
  const now = Number(nowInput == null ? Date.now() : nowInput)
  const timer = next.salary.timer
  if (timer.running) {
    timer.accumulatedSeconds = elapsedSeconds(timer, now)
    timer.running = false
    timer.startedAt = 0
  }
  return next
}

function resetTimer(state) {
  const next = deepClone(state)
  next.salary.timer = {
    running: false,
    startedAt: 0,
    accumulatedSeconds: 0,
    openedAt: 0,
    label: next.salary.timer && next.salary.timer.label ? next.salary.timer.label : '发呆',
    targetSeconds: 0,
    quickMinutes: 0
  }
  return next
}

function finishTimer(state, ratePerSecond, nowInput, options) {
  const now = Number(nowInput == null ? Date.now() : nowInput)
  const opts = options || {}
  const rawSeconds = elapsedSeconds(state.salary.timer, now)
  const maxSeconds = Math.max(0, Math.floor(Number(opts.maxSeconds) || 0))
  const totalSeconds = maxSeconds ? Math.min(rawSeconds, maxSeconds) : rawSeconds
  let next = pauseTimer(state, now)
  if (totalSeconds > 0) {
    const rate = Math.max(0, Number(ratePerSecond) || 0)
    next.salary.sessions = Array.isArray(next.salary.sessions) ? next.salary.sessions : []
    next.salary.sessions.unshift({
      id: createId('session'),
      dateKey: formatDateKey(now),
      label: safeText(next.salary.timer.label, '摸鱼'),
      seconds: totalSeconds,
      amount: Number((totalSeconds * rate).toFixed(6)),
      ratePerSecond: rate,
      source: safeText(opts.source, next.salary.timer.targetSeconds ? 'quick' : 'manual'),
      quickMinutes: Math.max(0, Math.floor(Number(next.salary.timer.quickMinutes) || 0)),
      startedAt: Number(next.salary.timer.openedAt || now - totalSeconds * 1000),
      endedAt: now
    })
    next.salary.sessions = next.salary.sessions.slice(0, 600)
  }
  next = resetTimer(next)
  return { state: next, saved: totalSeconds > 0, seconds: totalSeconds }
}

function maybeAutoFinish(state, ratePerSecond, nowInput) {
  const timer = state && state.salary ? state.salary.timer : null
  const target = Math.max(0, Math.floor(Number(timer && timer.targetSeconds) || 0))
  if (!timer || !timer.running || !target) return { state, finished: false, seconds: 0 }
  const elapsed = elapsedSeconds(timer, nowInput)
  if (elapsed < target) return { state, finished: false, seconds: elapsed }
  const result = finishTimer(state, ratePerSecond, nowInput, { maxSeconds: target, source: 'quick' })
  return { state: result.state, finished: result.saved, seconds: result.seconds }
}

function sessionsForDate(state, dateKey) {
  return (state.salary.sessions || []).filter((session) => session.dateKey === dateKey)
}

function summarizeSessions(sessions) {
  return (sessions || []).reduce((summary, session) => {
    summary.count += 1
    summary.seconds += Math.max(0, Number(session.seconds) || 0)
    summary.amount += Math.max(0, Number(session.amount) || 0)
    return summary
  }, { count: 0, seconds: 0, amount: 0 })
}

function deleteSession(state, sessionId) {
  const next = deepClone(state)
  next.salary.sessions = (next.salary.sessions || []).filter((session) => session.id !== sessionId)
  return next
}

function clearSessionsForDate(state, dateKey) {
  const next = deepClone(state)
  next.salary.sessions = (next.salary.sessions || []).filter((session) => session.dateKey !== dateKey)
  return next
}

module.exports = {
  elapsedSeconds,
  updateSettings,
  setFishQuota,
  setLabels,
  addLabel,
  updateLabel,
  deleteLabel,
  startTimer,
  pauseTimer,
  resetTimer,
  finishTimer,
  maybeAutoFinish,
  sessionsForDate,
  summarizeSessions,
  deleteSession,
  clearSessionsForDate
}
