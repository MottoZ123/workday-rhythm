const { clamp, toNumber } = require('./common')

function parseTimeToSeconds(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || ''))
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return hour * 3600 + minute * 60
}

function scheduleFromSettings(settings) {
  const start = parseTimeToSeconds(settings.startTime)
  const end = parseTimeToSeconds(settings.endTime)
  const breakStart = parseTimeToSeconds(settings.breakStart)
  const breakEnd = parseTimeToSeconds(settings.breakEnd)
  const errors = []

  if (start == null || end == null) errors.push('请填写有效的上下班时间')
  if (start != null && end != null && end <= start) errors.push('下班时间必须晚于上班时间')

  let breakSeconds = 0
  let hasBreak = false
  if (breakStart != null && breakEnd != null && breakEnd > breakStart) {
    hasBreak = true
    if (start != null && end != null && (breakStart < start || breakEnd > end)) {
      errors.push('休息时间必须位于工作时段内')
    } else {
      breakSeconds = breakEnd - breakStart
    }
  }

  const grossSeconds = start != null && end != null ? Math.max(0, end - start) : 0
  const paidSeconds = Math.max(0, grossSeconds - breakSeconds)
  if (!errors.length && paidSeconds <= 0) errors.push('每日计薪时长必须大于 0')

  return {
    start,
    end,
    breakStart,
    breakEnd,
    hasBreak,
    breakSeconds,
    grossSeconds,
    paidSeconds,
    errors
  }
}

function validateSettings(settings, options) {
  const strictAmount = !options || options.strictAmount !== false
  const schedule = scheduleFromSettings(settings)
  const errors = schedule.errors.slice()
  const amount = toNumber(settings.amount, 0)
  const workdays = toNumber(settings.monthlyWorkdays, 0)

  if (strictAmount && amount <= 0) errors.push('工资金额必须大于 0')
  if (String(settings.payType || 'monthly') === 'monthly' && workdays <= 0) {
    errors.push('每月工作天数必须大于 0')
  }
  if (toNumber(settings.commuteMinutes, 0) < 0) errors.push('通勤时间不能为负数')
  if (toNumber(settings.unpaidOvertimeMinutes, 0) < 0) errors.push('无偿加班时间不能为负数')
  if (toNumber(settings.dailyExpense, 0) < 0) errors.push('每日工作成本不能为负数')

  return { valid: errors.length === 0, errors, schedule }
}

function calculateRates(settings) {
  const validation = validateSettings(settings, { strictAmount: false })
  const amount = Math.max(0, toNumber(settings.amount, 0))
  const workdays = Math.max(0, toNumber(settings.monthlyWorkdays, 0))
  const payType = String(settings.payType || 'monthly')
  const paidHours = validation.schedule.paidSeconds / 3600
  let dailyPay = 0
  let monthlyEquivalent = 0

  if (amount > 0 && paidHours > 0) {
    if (payType === 'hourly') {
      dailyPay = amount * paidHours
      monthlyEquivalent = workdays > 0 ? dailyPay * workdays : 0
    } else if (payType === 'daily') {
      dailyPay = amount
      monthlyEquivalent = workdays > 0 ? amount * workdays : 0
    } else if (workdays > 0) {
      dailyPay = amount / workdays
      monthlyEquivalent = amount
    }
  }

  const hourly = paidHours > 0 ? dailyPay / paidHours : 0
  const perMinute = hourly / 60
  const perSecond = hourly / 3600
  const commuteHours = Math.max(0, toNumber(settings.commuteMinutes, 0)) / 60
  const overtimeHours = Math.max(0, toNumber(settings.unpaidOvertimeMinutes, 0)) / 60
  const expense = Math.max(0, toNumber(settings.dailyExpense, 0))
  const occupiedHours = paidHours + commuteHours + overtimeHours
  const realHourly = occupiedHours > 0 ? Math.max(0, dailyPay - expense) / occupiedHours : 0

  return {
    configured: amount > 0 && paidHours > 0 && (payType !== 'monthly' || workdays > 0),
    payType,
    amount,
    workdays,
    dailyPay,
    monthlyEquivalent,
    paidHours,
    hourly,
    perMinute,
    perSecond,
    realHourly,
    hourlyGap: Math.max(0, hourly - realHourly),
    validation,
    schedule: validation.schedule
  }
}

function calculateLiveSnapshot(settings, nowInput) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput == null ? Date.now() : nowInput)
  const rates = calculateRates(settings)
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000
  const schedule = rates.schedule

  if (!rates.configured) {
    return {
      configured: false,
      status: '等待设置工资',
      statusDetail: '工资数字由你填写，所有计算仅保存在本机',
      earned: 0,
      progress: 0,
      elapsedPaidSeconds: 0,
      remainingPaidSeconds: schedule.paidSeconds || 0,
      rates
    }
  }

  if (!settings.todayWorkday) {
    return {
      configured: true,
      status: '今天休息',
      statusDetail: '关闭“今日工作”后不会累计今日收入',
      earned: 0,
      progress: 0,
      elapsedPaidSeconds: 0,
      remainingPaidSeconds: schedule.paidSeconds,
      rates
    }
  }

  let elapsed = 0
  let status = '还没上班'
  let statusDetail = `计划 ${settings.startTime} 开始赚钱`

  if (nowSeconds < schedule.start) {
    elapsed = 0
  } else if (nowSeconds >= schedule.end) {
    elapsed = schedule.paidSeconds
    status = '今日工资已到账'
    statusDetail = '按本次设置，今天的计薪时段已经结束'
  } else if (schedule.hasBreak && nowSeconds >= schedule.breakStart && nowSeconds < schedule.breakEnd) {
    elapsed = schedule.breakStart - schedule.start
    status = '午休暂停计薪'
    statusDetail = `${settings.breakEnd} 继续增长`
  } else {
    status = '财富正在增长'
    statusDetail = '看着每一秒变成工资'
    if (schedule.hasBreak && nowSeconds >= schedule.breakEnd) {
      elapsed = (schedule.breakStart - schedule.start) + (nowSeconds - schedule.breakEnd)
    } else {
      elapsed = nowSeconds - schedule.start
    }
  }

  elapsed = clamp(elapsed, 0, schedule.paidSeconds)
  const progress = schedule.paidSeconds > 0 ? clamp(elapsed / schedule.paidSeconds * 100, 0, 100) : 0
  const earned = rates.dailyPay * progress / 100

  return {
    configured: true,
    status,
    statusDetail,
    earned,
    progress,
    elapsedPaidSeconds: elapsed,
    remainingPaidSeconds: Math.max(0, schedule.paidSeconds - elapsed),
    rates
  }
}


function calculateOffworkCountdown(settings, nowInput) {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput == null ? Date.now() : nowInput)
  const schedule = scheduleFromSettings(settings || {})
  if (schedule.end == null || schedule.start == null) {
    return { configured: false, seconds: 0, status: '等待设置下班时间' }
  }
  if (settings && settings.todayWorkday === false) {
    return { configured: true, seconds: 0, status: '今天休息' }
  }
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000
  if (nowSeconds >= schedule.end) {
    return { configured: true, seconds: 0, status: '已经下班' }
  }
  return {
    configured: true,
    seconds: Math.max(0, Math.floor(schedule.end - nowSeconds)),
    status: nowSeconds < schedule.start ? '距离今天下班' : '距离下班还有'
  }
}

function formatMoney(value, digits) {
  const number = Number(value)
  const safe = Number.isFinite(number) ? number : 0
  const decimals = Number.isInteger(digits) ? digits : 2
  return safe.toFixed(decimals)
}

module.exports = {
  parseTimeToSeconds,
  scheduleFromSettings,
  validateSettings,
  calculateRates,
  calculateLiveSnapshot,
  calculateOffworkCountdown,
  formatMoney
}
