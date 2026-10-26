const dateUtil = require('./date')
const checklist = require('./checklist-domain')
const salaryService = require('../services/salary-service')

function addDays(input, delta) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input == null ? Date.now() : input)
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + Number(delta || 0))
  return date
}

function lastDateKeys(nowInput, count) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput == null ? Date.now() : nowInput)
  const days = Math.max(1, Number(count) || 7)
  const keys = []
  for (let offset = days - 1; offset >= 0; offset -= 1) keys.push(dateUtil.formatDateKey(addDays(now, -offset)))
  return keys
}

function weekdayShort(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`)
  return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
}

function summarizeWeek(state, nowInput) {
  const keys = lastDateKeys(nowInput, 7)
  const sessions = state && state.salary && Array.isArray(state.salary.sessions) ? state.salary.sessions : []
  const days = keys.map((dateKey) => {
    const summary = salaryService.summarizeSessions(sessions.filter((session) => session.dateKey === dateKey))
    return {
      dateKey,
      weekday: `周${weekdayShort(dateKey)}`,
      seconds: summary.seconds,
      minutes: Math.round(summary.seconds / 60),
      amount: summary.amount,
      count: summary.count
    }
  })
  const maxMinutes = Math.max(1, ...days.map((day) => day.minutes))
  days.forEach((day) => { day.bar = Math.max(day.minutes ? 12 : 3, Math.round(day.minutes / maxMinutes * 100)) })
  const total = salaryService.summarizeSessions(sessions.filter((session) => keys.includes(session.dateKey)))
  const avgMinutes = Math.round((total.seconds / 60) / 7)
  return { keys, days, total, avgMinutes }
}

function topLabels(state, limit) {
  const rows = {}
  const sessions = state && state.salary && Array.isArray(state.salary.sessions) ? state.salary.sessions : []
  sessions.forEach((session) => {
    const label = String(session.label || '其他')
    if (!rows[label]) rows[label] = { label, seconds: 0, count: 0, amount: 0 }
    rows[label].seconds += Math.max(0, Number(session.seconds) || 0)
    rows[label].count += 1
    rows[label].amount += Math.max(0, Number(session.amount) || 0)
  })
  return Object.values(rows).sort((a, b) => b.seconds - a.seconds).slice(0, Math.max(1, Number(limit) || 5))
}

function currentStreak(visitDates, nowInput) {
  const dates = new Set((visitDates || []).map(String))
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput == null ? Date.now() : nowInput)
  let streak = 0
  for (let i = 0; i < 366; i += 1) {
    const key = dateUtil.formatDateKey(addDays(now, -i))
    if (!dates.has(key)) break
    streak += 1
  }
  return streak
}

function perfectChecklistDays(state) {
  let total = 0
  Object.keys((state && state.checksByDate) || {}).forEach((dateKey) => {
    const snapshot = checklist.buildSnapshot(state, dateKey)
    if (snapshot.total > 0 && snapshot.completed === snapshot.total) total += 1
  })
  return total
}

const ACHIEVEMENT_DEFS = [
  { id: 'streak3', icon: '🌱', title: '连续出现', desc: '连续打开 3 天', metric: 'streak', target: 3 },
  { id: 'streak7', icon: '🏕️', title: '摸鱼常驻民', desc: '连续打开 7 天', metric: 'streak', target: 7 },
  { id: 'sessions5', icon: '🐟', title: '初级摸鱼员', desc: '累计完成 5 次摸鱼', metric: 'sessions', target: 5 },
  { id: 'sessions20', icon: '🐠', title: '熟练摸鱼员', desc: '累计完成 20 次摸鱼', metric: 'sessions', target: 20 },
  { id: 'minutes60', icon: '⏳', title: '带薪一小时', desc: '累计摸鱼 60 分钟', metric: 'minutes', target: 60 },
  { id: 'minutes300', icon: '🛋️', title: '休息学者', desc: '累计摸鱼 300 分钟', metric: 'minutes', target: 300 },
  { id: 'amount100', icon: '🪙', title: '摸鱼百元户', desc: '累计摸鱼收益达到 ¥100', metric: 'amount', target: 100 },
  { id: 'perfect1', icon: '✅', title: '今日清空', desc: '完成 1 个满打卡日', metric: 'perfect', target: 1 },
  { id: 'perfect7', icon: '🏆', title: '清单高手', desc: '累计 7 个满打卡日', metric: 'perfect', target: 7 }
]

function achievements(state, nowInput) {
  const sessions = state && state.salary && Array.isArray(state.salary.sessions) ? state.salary.sessions : []
  const summary = salaryService.summarizeSessions(sessions)
  const metrics = {
    streak: currentStreak(state && state.activity ? state.activity.visitDates : [], nowInput),
    sessions: summary.count,
    minutes: Math.floor(summary.seconds / 60),
    amount: summary.amount,
    perfect: perfectChecklistDays(state)
  }
  const items = ACHIEVEMENT_DEFS.map((def) => {
    const value = Number(metrics[def.metric] || 0)
    const progress = Math.min(100, Math.round(value / def.target * 100))
    return Object.assign({}, def, { value, progress, unlocked: value >= def.target })
  })
  return {
    metrics,
    unlockedCount: items.filter((item) => item.unlocked).length,
    totalCount: items.length,
    items
  }
}

function reportData(state, dateKey, nowInput) {
  const key = dateKey || dateUtil.formatDateKey(nowInput == null ? Date.now() : nowInput)
  const snapshot = checklist.buildSnapshot(state, key)
  const sessions = salaryService.sessionsForDate(state, key)
  const sessionSummary = salaryService.summarizeSessions(sessions)
  const labels = {}
  sessions.forEach((session) => { labels[session.label || '其他'] = (labels[session.label || '其他'] || 0) + Number(session.seconds || 0) })
  const favorite = Object.keys(labels).sort((a, b) => labels[b] - labels[a])[0] || '暂无'
  return {
    dateKey: key,
    checklistTotal: snapshot.total,
    checklistCompleted: snapshot.completed,
    checklistPercentage: snapshot.percentage,
    fishCount: sessionSummary.count,
    fishSeconds: sessionSummary.seconds,
    fishAmount: sessionSummary.amount,
    favorite
  }
}

module.exports = {
  addDays,
  lastDateKeys,
  summarizeWeek,
  topLabels,
  currentStreak,
  perfectChecklistDays,
  achievements,
  reportData
}
