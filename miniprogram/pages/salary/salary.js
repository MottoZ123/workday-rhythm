const storage = require('../../utils/storage')
const salaryDomain = require('../../utils/salary-domain')
const salaryService = require('../../services/salary-service')
const dateUtil = require('../../utils/date')
const funDomain = require('../../utils/fun-domain')
const share = require('../../utils/share')

const PAY_TYPES = [
  { value: 'monthly', label: '月薪' },
  { value: 'daily', label: '日薪 / 实习' },
  { value: 'hourly', label: '时薪' }
]

Page({
  data: {
    fontMode: 'medium',
    payTypes: PAY_TYPES,
    quickMinutes: funDomain.QUICK_MINUTES,
    selectedQuickMinutes: 5,
    timerLabels: [],
    selectedTimerLabel: '发呆',
    draft: {},
    showAdvanced: false,
    labelManagerOpen: false,
    labelEditorVisible: false,
    labelEditorTitle: '新增摸鱼类型',
    labelEditorValue: '',
    live: {
      configured: false,
      earnedText: '0.0000',
      displayEarnedText: '0.0000',
      progress: 0,
      status: '等待设置工资',
      detail: '',
      remainingText: '--',
      offworkText: '--:--:--',
      offworkStatus: '距离下班'
    },
    rates: {
      dailyPayText: '0.00',
      hourlyText: '0.00',
      perMinuteText: '0.0000',
      perSecondText: '0.0000',
      realHourlyText: '0.00',
      monthlyText: '0.00',
      paidHoursText: '0.00'
    },
    displayRates: {},
    timerView: {
      running: false,
      quickMode: false,
      clockText: '00:00:00',
      clockLabel: '本次已计时',
      elapsedText: '00:00:00',
      amountText: '0.0000',
      displayAmountText: '0.0000',
      targetText: ''
    },
    todaySessions: [],
    sessionSummary: {
      count: 0,
      durationText: '0秒',
      amountText: '0.0000',
      displayAmountText: '0.0000'
    },
    quota: {
      enabled: true,
      limitMinutes: 30,
      usedText: '0分钟',
      remainingText: '30分钟',
      percentage: 0,
      exceeded: false
    },
    randomPick: null,
    dailyCopy: '',
    stealthMode: false,
    amountLabel: '到手月薪',
    validationHint: '',
    settingsSavedAt: ''
  },

  onLoad() {
    this.tickTimer = null
    this.editingLabel = null
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 2 })
    this.loadState()
    this.startTicker()
  },

  onHide() { this.stopTicker() },
  onUnload() { this.stopTicker() },

  loadState() {
    this.state = storage.loadState()
    const draft = Object.assign({}, this.state.salary.settings)
    const labels = (this.state.salary.labels || []).slice()
    const selectedTimerLabel = labels.includes(this.state.salary.timer.label)
      ? this.state.salary.timer.label
      : (labels[0] || '发呆')
    this.setData({
      fontMode: (this.state.ui && this.state.ui.fontSizeMode) || 'medium',
      draft,
      timerLabels: labels,
      selectedTimerLabel,
      stealthMode: Boolean(this.state.privacy && this.state.privacy.stealthMode)
    }, () => this.refreshComputed())
  },

  startTicker() {
    this.stopTicker()
    this.tickTimer = setInterval(() => this.refreshComputed(), 500)
  },

  stopTicker() {
    if (this.tickTimer) clearInterval(this.tickTimer)
    this.tickTimer = null
  },

  mask(value) {
    return this.data.stealthMode ? '••••' : value
  },

  refreshComputed() {
    if (!this.state) return
    const now = new Date()
    const draft = this.data.draft || {}
    const live = salaryDomain.calculateLiveSnapshot(draft, now)
    const rates = live.rates

    const auto = salaryService.maybeAutoFinish(this.state, rates.perSecond, Date.now())
    if (auto.finished) {
      this.state = storage.saveState(auto.state)
      wx.showToast({ title: `快捷休息完成 ${dateUtil.humanDuration(auto.seconds)}`, icon: 'none' })
    } else if (auto.state !== this.state) {
      this.state = auto.state
    }

    const timer = this.state.salary.timer
    const elapsed = salaryService.elapsedSeconds(timer, Date.now())
    const targetSeconds = Math.max(0, Number(timer.targetSeconds) || 0)
    const quickMode = targetSeconds > 0
    const remainingQuick = quickMode ? Math.max(0, targetSeconds - elapsed) : 0
    const dateKey = dateUtil.formatDateKey(now)
    const sessions = salaryService.sessionsForDate(this.state, dateKey)
    const summary = salaryService.summarizeSessions(sessions)
    const quota = funDomain.quotaSnapshot(summary.seconds + elapsed, this.state.salary.fishQuota)
    const validation = salaryDomain.validateSettings(draft, { strictAmount: false })
    const offwork = salaryDomain.calculateOffworkCountdown(draft, now)
    const hide = Boolean(this.state.privacy && this.state.privacy.stealthMode && this.state.privacy.hideAmounts)
    const money = (value) => hide ? '••••' : value

    const sessionRows = sessions.map((session) => ({
      id: session.id,
      label: session.label,
      durationText: dateUtil.humanDuration(session.seconds),
      amountText: salaryDomain.formatMoney(session.amount, 4),
      displayAmountText: money(salaryDomain.formatMoney(session.amount, 4)),
      endTimeText: dateUtil.formatClock(session.endedAt),
      quick: session.source === 'quick'
    }))

    const dailyCopy = funDomain.dailyCopy(dateKey, `${summary.count}:${Math.floor(summary.seconds / 60)}`)

    this.setData({
      amountLabel: draft.payType === 'hourly' ? '每小时工资' : (draft.payType === 'daily' ? '每日 / 实习日薪' : '到手月薪'),
      stealthMode: Boolean(this.state.privacy && this.state.privacy.stealthMode),
      timerLabels: (this.state.salary.labels || []).slice(),
      live: {
        configured: live.configured,
        earnedText: salaryDomain.formatMoney(live.earned, 4),
        displayEarnedText: money(salaryDomain.formatMoney(live.earned, 4)),
        progress: Number(live.progress.toFixed(2)),
        status: this.data.stealthMode ? '今日工作进度' : live.status,
        detail: this.data.stealthMode ? '敏感工资与摸鱼字样已隐藏' : live.statusDetail,
        remainingText: live.configured ? dateUtil.humanDuration(live.remainingPaidSeconds) : '--',
        offworkText: offwork.configured ? dateUtil.formatDuration(offwork.seconds) : '--:--:--',
        offworkStatus: offwork.status
      },
      rates: {
        dailyPayText: salaryDomain.formatMoney(rates.dailyPay, 2),
        hourlyText: salaryDomain.formatMoney(rates.hourly, 2),
        perMinuteText: salaryDomain.formatMoney(rates.perMinute, 4),
        perSecondText: salaryDomain.formatMoney(rates.perSecond, 4),
        realHourlyText: salaryDomain.formatMoney(rates.realHourly, 2),
        monthlyText: salaryDomain.formatMoney(rates.monthlyEquivalent, 2),
        paidHoursText: salaryDomain.formatMoney(rates.paidHours, 2)
      },
      displayRates: {
        dailyPayText: money(salaryDomain.formatMoney(rates.dailyPay, 2)),
        hourlyText: money(salaryDomain.formatMoney(rates.hourly, 2)),
        perMinuteText: money(salaryDomain.formatMoney(rates.perMinute, 4)),
        perSecondText: money(salaryDomain.formatMoney(rates.perSecond, 4)),
        realHourlyText: money(salaryDomain.formatMoney(rates.realHourly, 2)),
        monthlyText: money(salaryDomain.formatMoney(rates.monthlyEquivalent, 2))
      },
      timerView: {
        running: Boolean(timer.running),
        quickMode,
        clockText: quickMode ? dateUtil.formatDuration(remainingQuick) : dateUtil.formatDuration(elapsed),
        clockLabel: quickMode ? `剩余 · ${Math.round(targetSeconds / 60)} 分钟快捷休息` : '本次已计时',
        elapsedText: dateUtil.formatDuration(elapsed),
        amountText: salaryDomain.formatMoney(elapsed * rates.perSecond, 4),
        displayAmountText: money(salaryDomain.formatMoney(elapsed * rates.perSecond, 4)),
        targetText: quickMode ? `${Math.round(targetSeconds / 60)}分钟` : ''
      },
      todaySessions: sessionRows,
      sessionSummary: {
        count: summary.count,
        durationText: dateUtil.humanDuration(summary.seconds),
        amountText: salaryDomain.formatMoney(summary.amount, 4),
        displayAmountText: money(salaryDomain.formatMoney(summary.amount, 4))
      },
      quota: {
        enabled: quota.enabled,
        limitMinutes: quota.limitMinutes,
        usedText: dateUtil.humanDuration(quota.usedSeconds),
        remainingText: dateUtil.humanDuration(quota.remainingSeconds),
        percentage: quota.percentage,
        exceeded: quota.exceeded
      },
      dailyCopy,
      validationHint: validation.errors.length ? validation.errors[0] : ''
    })
  },

  persistDraft(showToast) {
    this.state = salaryService.updateSettings(this.state, this.data.draft)
    this.state = storage.saveState(this.state)
    this.refreshComputed()
    if (showToast) {
      const validation = salaryDomain.validateSettings(this.data.draft)
      if (!validation.valid) {
        wx.showToast({ title: validation.errors[0], icon: 'none' })
        return false
      }
      this.setData({ settingsSavedAt: `已保存 · ${dateUtil.formatClock(Date.now())}` })
      wx.showToast({ title: '攒米设置已保存', icon: 'success' })
    }
    return true
  },

  changePayType(event) {
    this.setData({ 'draft.payType': event.currentTarget.dataset.value }, () => this.persistDraft(false))
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`draft.${field}`]: event.detail.value }, () => this.persistDraft(false))
  },

  handleTimeChange(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`draft.${field}`]: event.detail.value }, () => this.persistDraft(false))
  },

  handleWorkdayChange(event) {
    this.setData({ 'draft.todayWorkday': Boolean(event.detail.value) }, () => this.persistDraft(false))
  },

  toggleAdvanced() { this.setData({ showAdvanced: !this.data.showAdvanced }) },
  saveSettings() { this.persistDraft(true) },

  chooseTimerLabel(event) {
    const label = event.currentTarget.dataset.label
    this.setData({ selectedTimerLabel: label })
    this.state.salary.timer.label = label
    this.state = storage.saveState(this.state)
    this.refreshComputed()
  },

  chooseQuickMinutes(event) {
    this.setData({ selectedQuickMinutes: Number(event.currentTarget.dataset.minutes) || 5 })
  },

  validateBeforeTimer() {
    const validation = salaryDomain.validateSettings(this.data.draft)
    if (!validation.valid) {
      wx.showToast({ title: validation.errors[0], icon: 'none' })
      this.jumpToSettings()
      return false
    }
    return true
  },

  startFishTimer() {
    if (!this.validateBeforeTimer()) return
    this.state = salaryService.updateSettings(this.state, this.data.draft)
    this.state = salaryService.startTimer(this.state, this.data.selectedTimerLabel, Date.now(), { targetSeconds: 0 })
    this.state = storage.saveState(this.state)
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    this.refreshComputed()
  },

  startQuickTimer() {
    if (!this.validateBeforeTimer()) return
    const minutes = Number(this.data.selectedQuickMinutes) || 5
    this.state = salaryService.updateSettings(this.state, this.data.draft)
    this.state = salaryService.startTimer(this.state, this.data.selectedTimerLabel, Date.now(), { targetSeconds: minutes * 60 })
    this.state = storage.saveState(this.state)
    if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    this.refreshComputed()
  },

  pauseFishTimer() {
    this.state = storage.saveState(salaryService.pauseTimer(this.state, Date.now()))
    this.refreshComputed()
  },

  finishFishTimer() {
    const rates = salaryDomain.calculateRates(this.data.draft)
    const result = salaryService.finishTimer(this.state, rates.perSecond, Date.now())
    this.state = storage.saveState(result.state)
    this.refreshComputed()
    wx.showToast({ title: result.saved ? `已记录 ${dateUtil.humanDuration(result.seconds)}` : '还没有计时时长', icon: 'none' })
  },

  resetFishTimer() {
    wx.showModal({
      title: '重置当前计时？',
      content: '当前计时不会进入历史记录。',
      confirmText: '重置',
      confirmColor: '#B85C38',
      success: (result) => {
        if (!result.confirm) return
        this.state = storage.saveState(salaryService.resetTimer(this.state))
        this.refreshComputed()
      }
    })
  },

  handleQuotaSwitch(event) {
    this.state = salaryService.setFishQuota(this.state, { enabled: Boolean(event.detail.value) })
    this.state = storage.saveState(this.state)
    this.refreshComputed()
  },

  handleQuotaSlider(event) {
    this.state = salaryService.setFishQuota(this.state, { minutes: Number(event.detail.value) })
    this.state = storage.saveState(this.state)
    this.refreshComputed()
  },

  randomFish() {
    const pick = funDomain.randomSuggestion(this.state.salary.labels)
    this.setData({ randomPick: pick, selectedTimerLabel: pick.label, selectedQuickMinutes: pick.minutes })
  },

  startRandomFish() {
    if (!this.data.randomPick) this.randomFish()
    setTimeout(() => this.startQuickTimer(), 0)
  },

  toggleLabelManager() { this.setData({ labelManagerOpen: !this.data.labelManagerOpen }) },

  openAddLabel() {
    this.editingLabel = null
    this.setData({ labelEditorVisible: true, labelEditorTitle: '新增摸鱼类型', labelEditorValue: '' })
  },

  openEditLabel(event) {
    const label = event.currentTarget.dataset.label
    this.editingLabel = label
    this.setData({ labelEditorVisible: true, labelEditorTitle: '修改摸鱼类型', labelEditorValue: label })
  },

  closeLabelEditor() {
    this.editingLabel = null
    this.setData({ labelEditorVisible: false, labelEditorValue: '' })
  },

  confirmLabelEditor(event) {
    try {
      const value = event.detail.value
      this.state = this.editingLabel
        ? salaryService.updateLabel(this.state, this.editingLabel, value)
        : salaryService.addLabel(this.state, value)
      this.state = storage.saveState(this.state)
      this.closeLabelEditor()
      this.loadState()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  deleteLabel(event) {
    const label = event.currentTarget.dataset.label
    wx.showModal({
      title: `删除“${label}”？`,
      content: '已有历史记录不会被删除。',
      confirmText: '删除',
      confirmColor: '#B85C38',
      success: (result) => {
        if (!result.confirm) return
        try {
          this.state = storage.saveState(salaryService.deleteLabel(this.state, label))
          this.loadState()
        } catch (error) {
          wx.showToast({ title: error.message || '删除失败', icon: 'none' })
        }
      }
    })
  },

  deleteSession(event) {
    this.state = storage.saveState(salaryService.deleteSession(this.state, event.currentTarget.dataset.id))
    this.refreshComputed()
  },

  clearTodaySessions() {
    if (!this.data.todaySessions.length) return
    wx.showModal({
      title: '清空今日休息记录？',
      content: '该操作不会修改清单和工资设置。',
      confirmText: '清空',
      confirmColor: '#B85C38',
      success: (result) => {
        if (!result.confirm) return
        this.state = storage.saveState(salaryService.clearSessionsForDate(this.state, dateUtil.formatDateKey(new Date())))
        this.refreshComputed()
      }
    })
  },

  toggleStealth() {
    this.state.privacy = this.state.privacy || {}
    this.state.privacy.stealthMode = !this.state.privacy.stealthMode
    this.state = storage.saveState(this.state)
    this.setData({ stealthMode: this.state.privacy.stealthMode }, () => this.refreshComputed())
    wx.setNavigationBarTitle({ title: this.state.privacy.stealthMode ? '工作进度' : '攒米进度' })
  },

  goStats() { wx.switchTab({ url: '/pages/stats/stats' }) },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }) },
  jumpToSettings() { wx.pageScrollTo({ selector: '#salary-settings', duration: 300 }) },

  onShareAppMessage() { return share.appMessage() },
  onShareTimeline() { return share.timeline() }
})
