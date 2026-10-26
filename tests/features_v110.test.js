const defaults = require('../miniprogram/data/defaults')
const salaryDomain = require('../miniprogram/utils/salary-domain')
const salaryService = require('../miniprogram/services/salary-service')
const funDomain = require('../miniprogram/utils/fun-domain')
const statsDomain = require('../miniprogram/utils/stats-domain')

function assert(condition, message) { if (!condition) throw new Error(message) }
function close(actual, expected, tolerance, message) { if (Math.abs(actual - expected) > tolerance) throw new Error(`${message}: expected ${expected}, got ${actual}`) }

const settings = {
  payType: 'monthly', amount: '22000', monthlyWorkdays: '22', startTime: '09:00', breakStart: '12:00', breakEnd: '13:00', endTime: '18:00', todayWorkday: true, commuteMinutes: '60', unpaidOvertimeMinutes: '0', dailyExpense: '0'
}
const offwork = salaryDomain.calculateOffworkCountdown(settings, new Date(2026, 7, 29, 15, 30, 0))
assert(offwork.seconds === 9000, '15:30 to 18:00 should be 9000 seconds')

let state = defaults.createDefaultState(new Date(2026, 7, 29).getTime())
state.salary.settings = settings
const t0 = new Date(2026, 7, 29, 10, 0, 0).getTime()
state = salaryService.startTimer(state, '发呆', t0, { targetSeconds: 300 })
assert(state.salary.timer.targetSeconds === 300, 'Quick timer target should persist')
const rates = salaryDomain.calculateRates(settings)
const auto = salaryService.maybeAutoFinish(state, rates.perSecond, t0 + 301000)
assert(auto.finished, 'Quick timer should auto-finish after target')
assert(auto.state.salary.sessions[0].seconds === 300, 'Quick timer should cap saved session to target')
assert(auto.state.salary.sessions[0].source === 'quick', 'Quick timer should record quick source')

state = salaryService.addLabel(auto.state, '看小说')
assert(state.salary.labels.includes('看小说'), 'Custom label should be added')
state = salaryService.updateLabel(state, '看小说', '看漫画')
assert(state.salary.labels.includes('看漫画') && !state.salary.labels.includes('看小说'), 'Custom label should update')
state = salaryService.deleteLabel(state, '看漫画')
assert(!state.salary.labels.includes('看漫画'), 'Custom label should delete')

const quota = funDomain.quotaSnapshot(18 * 60, { enabled: true, minutes: 30 })
assert(quota.percentage === 60, '18/30 minute quota should be 60%')
assert(quota.remainingSeconds === 12 * 60, 'Quota remaining should be 12 minutes')

state.activity.visitDates = ['2026-08-27', '2026-08-28', '2026-08-29']
const achievements = statsDomain.achievements(state, new Date(2026, 7, 29, 12, 0, 0))
assert(achievements.metrics.streak === 3, 'Visit streak should be 3 days')
assert(achievements.items.find((item) => item.id === 'streak3').unlocked, '3-day streak achievement should unlock')

const suggestion = funDomain.randomSuggestion(['发呆', '看漫画'], 0.999)
assert(suggestion && suggestion.minutes > 0 && suggestion.label, 'Random suggestion should return an actionable break')
assert(typeof funDomain.dailyCopy('2026-08-29') === 'string', 'Daily copy should be deterministic string')

console.log('V1.1.0 feature tests passed')
