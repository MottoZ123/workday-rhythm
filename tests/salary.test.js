const defaults = require('../miniprogram/data/defaults')
const salary = require('../miniprogram/utils/salary-domain')
const service = require('../miniprogram/services/salary-service')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function close(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`)
  }
}

const settings = {
  payType: 'monthly',
  amount: '22000',
  monthlyWorkdays: '22',
  startTime: '09:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  endTime: '18:00',
  todayWorkday: true,
  commuteMinutes: '60',
  unpaidOvertimeMinutes: '0',
  dailyExpense: '20'
}

const validation = salary.validateSettings(settings)
assert(validation.valid, validation.errors.join('; '))
const rates = salary.calculateRates(settings)
close(rates.dailyPay, 1000, 1e-9, 'Daily pay')
close(rates.paidHours, 8, 1e-9, 'Paid hours')
close(rates.hourly, 125, 1e-9, 'Hourly pay')
close(rates.perSecond, 125 / 3600, 1e-12, 'Per-second pay')
close(rates.realHourly, 980 / 9, 1e-9, 'Real occupied hourly pay')

let live = salary.calculateLiveSnapshot(settings, new Date(2026, 7, 27, 10, 0, 0))
close(live.earned, 125, 0.01, '10:00 live income')
close(live.progress, 12.5, 0.01, '10:00 progress')

live = salary.calculateLiveSnapshot(settings, new Date(2026, 7, 27, 12, 30, 0))
close(live.earned, 375, 0.01, 'Lunch income should pause')
assert(live.status.includes('午休'), 'Lunch status missing')

live = salary.calculateLiveSnapshot(settings, new Date(2026, 7, 27, 18, 30, 0))
close(live.earned, 1000, 0.01, 'After-work income')
close(live.progress, 100, 0.01, 'After-work progress')

let state = defaults.createDefaultState(0)
state.salary.settings = settings
const t0 = new Date(2026, 7, 27, 10, 0, 0).getTime()
state = service.startTimer(state, '发呆', t0)
state = service.pauseTimer(state, t0 + 100000)
assert(service.elapsedSeconds(state.salary.timer, t0 + 150000) === 100, 'Pause accumulation failed')
state = service.startTimer(state, '发呆', t0 + 200000)
const finished = service.finishTimer(state, rates.perSecond, t0 + 250000)
assert(finished.saved && finished.seconds === 150, 'Pause/resume finish total failed')
assert(finished.state.salary.sessions.length === 1, 'Session was not saved')
close(finished.state.salary.sessions[0].amount, 150 * rates.perSecond, 1e-5, 'Session amount')

console.log('Salary domain tests passed')
