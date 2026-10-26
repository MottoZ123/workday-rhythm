const storage = require('../../utils/storage')
const statsDomain = require('../../utils/stats-domain')
const salaryDomain = require('../../utils/salary-domain')
const salaryService = require('../../services/salary-service')
const dateUtil = require('../../utils/date')
const funDomain = require('../../utils/fun-domain')
const share = require('../../utils/share')

Page({
  data: {
    fontMode: 'medium',
    activeTab: 'week',
    stealthMode: false,
    weekDays: [],
    weekSummary: { durationText: '0分钟', amountText: '0.00', displayAmountText: '0.00', count: 0, avgMinutes: 0 },
    topLabels: [],
    achievements: { unlockedCount: 0, totalCount: 0, items: [], metrics: {} },
    streak: 0,
    quote: ''
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 3 })
    this.state = storage.loadState()
    this.render()
  },

  render() {
    const now = new Date()
    const week = statsDomain.summarizeWeek(this.state, now)
    const top = statsDomain.topLabels(this.state, 5)
    const maxSeconds = Math.max(1, ...top.map((item) => item.seconds))
    const achievement = statsDomain.achievements(this.state, now)
    const stealthMode = Boolean(this.state.privacy && this.state.privacy.stealthMode)
    const hideAmounts = stealthMode && this.state.privacy.hideAmounts !== false
    const amountText = salaryDomain.formatMoney(week.total.amount, 2)

    this.setData({
      fontMode: (this.state.ui && this.state.ui.fontSizeMode) || 'medium',
      stealthMode,
      weekDays: week.days,
      weekSummary: {
        durationText: dateUtil.humanDuration(week.total.seconds),
        amountText,
        displayAmountText: hideAmounts ? '••••' : amountText,
        count: week.total.count,
        avgMinutes: week.avgMinutes
      },
      topLabels: top.map((item) => ({
        label: item.label,
        durationText: dateUtil.humanDuration(item.seconds),
        count: item.count,
        width: Math.max(8, Math.round(item.seconds / maxSeconds * 100))
      })),
      achievements: achievement,
      streak: achievement.metrics.streak || 0,
      quote: funDomain.dailyCopy(dateUtil.formatDateKey(now), 'stats')
    })
  },

  switchSubTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/report' })
  },

  onShareAppMessage() { return share.appMessage() },
  onShareTimeline() { return share.timeline() }
})
