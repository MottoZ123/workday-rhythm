const storage = require('../../utils/storage')
const checklist = require('../../utils/checklist-domain')
const salaryDomain = require('../../utils/salary-domain')
const salaryService = require('../../services/salary-service')
const funDomain = require('../../utils/fun-domain')
const dateUtil = require('../../utils/date')
const share = require('../../utils/share')

Page({
  data: {
    fontMode: 'medium',
    profile: {},
    dateText: '',
    dateKey: '',
    stealthMode: false,
    overall: { total: 0, completed: 0, percentage: 0 },
    planSummary: { fixedCount: 0, addedCount: 0, removedCount: 0, effectiveCount: 0, libraryCount: 0 },
    categories: [],
    allExpanded: false,
    salaryCard: {
      configured: false,
      amountText: '0.0000',
      displayAmountText: '0.0000',
      perSecondText: '0.0000',
      displayPerSecondText: '0.0000',
      progress: 0,
      status: '等待设置工资',
      statusDetail: '工资数字由你填写',
      remainingText: '--',
      offworkText: '--:--:--',
      endTime: '--:--'
    },
    fishSummary: { durationText: '0秒', quotaPercentage: 0, quotaText: '0 / 30 分钟' },
    adjustVisible: false,
    adjustSearchText: '',
    adjustCategories: [],
    adjustEditorVisible: false,
    adjustEditorTitle: '',
    adjustEditorValue: '',
    adjustEditorConfirmText: '保存',
    adjustEditorContext: null
  },

  onLoad() {
    this.expandedMap = {}
    this.timer = null
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 0 })
    this.loadAndRender(true)
    this.startTicker()
  },

  onHide() { this.stopTicker() },
  onUnload() { this.stopTicker() },

  onPullDownRefresh() {
    this.loadAndRender(false)
    wx.stopPullDownRefresh()
  },

  startTicker() {
    this.stopTicker()
    this.timer = setInterval(() => this.refreshSalaryCard(), 1000)
  },

  stopTicker() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  },

  loadAndRender(initializeExpanded) {
    this.state = storage.loadState()
    const now = new Date()
    const dateKey = dateUtil.formatDateKey(now)
    if (initializeExpanded && Object.keys(this.expandedMap || {}).length === 0) {
      const remembered = this.state.ui && Array.isArray(this.state.ui.expandedCategoryIds)
        ? this.state.ui.expandedCategoryIds
        : []
      remembered.forEach((id) => { this.expandedMap[id] = true })
    }
    this.renderChecklist(dateKey, now)
    const stealth = Boolean(this.state.privacy && this.state.privacy.stealthMode)
    wx.setNavigationBarTitle({ title: stealth ? '今日计划' : (this.state.profile.title || '摸鱼日常') })
  },

  renderChecklist(dateKey, now) {
    const snapshot = checklist.buildSnapshot(this.state, dateKey)
    if (!Object.keys(this.expandedMap).some((id) => this.expandedMap[id]) && snapshot.categories[0]) {
      this.expandedMap[snapshot.categories[0].id] = true
    }
    const categories = snapshot.categories.map((category) => Object.assign({}, category, {
      expanded: Boolean(this.expandedMap[category.id])
    }))
    const allExpanded = categories.length > 0 && categories.every((category) => category.expanded)
    this.setData({
      fontMode: (this.state.ui && this.state.ui.fontSizeMode) || 'medium',
      profile: this.state.profile,
      dateText: dateUtil.formatChineseDate(now || new Date()),
      dateKey,
      stealthMode: Boolean(this.state.privacy && this.state.privacy.stealthMode),
      overall: { total: snapshot.total, completed: snapshot.completed, percentage: snapshot.percentage },
      planSummary: snapshot.planSummary,
      categories,
      allExpanded
    })
    if (this.data.adjustVisible) this.renderAdjuster()
    this.refreshSalaryCard()
  },

  refreshSalaryCard() {
    if (!this.state || !this.state.salary) return
    const now = new Date()
    const live = salaryDomain.calculateLiveSnapshot(this.state.salary.settings, now)
    const offwork = salaryDomain.calculateOffworkCountdown(this.state.salary.settings, now)
    const dateKey = dateUtil.formatDateKey(now)
    const sessions = salaryService.sessionsForDate(this.state, dateKey)
    const summary = salaryService.summarizeSessions(sessions)
    const activeSeconds = salaryService.elapsedSeconds(this.state.salary.timer, Date.now())
    const quota = funDomain.quotaSnapshot(summary.seconds + activeSeconds, this.state.salary.fishQuota)
    const stealth = Boolean(this.state.privacy && this.state.privacy.stealthMode)
    const hide = stealth && this.state.privacy.hideAmounts !== false
    this.setData({
      stealthMode: stealth,
      salaryCard: {
        configured: live.configured,
        amountText: salaryDomain.formatMoney(live.earned, 4),
        displayAmountText: hide ? '••••' : salaryDomain.formatMoney(live.earned, 4),
        perSecondText: salaryDomain.formatMoney(live.rates.perSecond, 4),
        displayPerSecondText: hide ? '••••' : salaryDomain.formatMoney(live.rates.perSecond, 4),
        progress: Number(live.progress.toFixed(2)),
        status: stealth ? '今日工作进度' : live.status,
        statusDetail: stealth ? '金额与摸鱼字样已隐藏' : live.statusDetail,
        remainingText: live.configured ? dateUtil.humanDuration(live.remainingPaidSeconds) : '--',
        offworkText: offwork.configured ? dateUtil.formatDuration(offwork.seconds) : '--:--:--',
        endTime: this.state.salary.settings.endTime || '--:--'
      },
      fishSummary: {
        durationText: dateUtil.humanDuration(summary.seconds + activeSeconds),
        quotaPercentage: quota.percentage,
        quotaText: `${Math.floor((summary.seconds + activeSeconds) / 60)} / ${quota.limitMinutes} 分钟`
      }
    })
  },

  persist(nextState) {
    let cleaned = checklist.pruneCheckHistory(nextState, 45)
    cleaned = checklist.pruneDailyAdjustmentHistory(cleaned, 45)
    this.state = storage.saveState(cleaned)
    this.renderChecklist(this.data.dateKey || dateUtil.formatDateKey(new Date()), new Date())
  },

  toggleCategory(event) {
    const categoryId = event.currentTarget.dataset.id
    this.expandedMap[categoryId] = !this.expandedMap[categoryId]
    const expandedCategoryIds = Object.keys(this.expandedMap).filter((id) => this.expandedMap[id])
    this.state.ui = this.state.ui || {}
    this.state.ui.expandedCategoryIds = expandedCategoryIds
    this.state = storage.saveState(this.state)
    this.renderChecklist(this.data.dateKey, new Date())
  },

  toggleAllCategories() {
    const shouldExpand = !this.data.allExpanded
    this.expandedMap = {}
    ;(this.data.categories || []).forEach((category) => { this.expandedMap[category.id] = shouldExpand })
    this.state.ui = this.state.ui || {}
    this.state.ui.expandedCategoryIds = shouldExpand ? this.data.categories.map((category) => category.id) : []
    this.state = storage.saveState(this.state)
    this.renderChecklist(this.data.dateKey, new Date())
  },

  handleToggleItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const itemId = event.currentTarget.dataset.itemId
    const category = this.data.categories.find((entry) => entry.id === categoryId)
    const item = category && category.items.find((entry) => entry.id === itemId)
    const willComplete = item ? !item.checked : false
    this.persist(checklist.toggleItem(this.state, this.data.dateKey, categoryId, itemId))
    if (willComplete && wx.vibrateShort) wx.vibrateShort({ type: 'light' })
    if (this.data.overall.total > 0 && this.data.overall.completed === this.data.overall.total) {
      wx.showToast({ title: '今日全部完成啦', icon: 'success', duration: 1800 })
    }
  },

  openDailyAdjust() {
    this.setData({ adjustVisible: true, adjustSearchText: '' })
    this.renderAdjuster()
  },

  closeDailyAdjust() {
    this.setData({
      adjustVisible: false,
      adjustSearchText: '',
      adjustCategories: [],
      adjustEditorVisible: false,
      adjustEditorValue: '',
      adjustEditorContext: null
    })
  },

  renderAdjuster() {
    const query = String(this.data.adjustSearchText || '').trim().toLowerCase()
    const categories = checklist.buildDailyAdjustSnapshot(this.state, this.data.dateKey)
      .map((category) => {
        const items = query
          ? category.items.filter((item) => item.text.toLowerCase().includes(query) || category.title.toLowerCase().includes(query))
          : category.items
        return Object.assign({}, category, { items })
      })
      .filter((category) => !query || category.items.length)
    this.setData({ adjustCategories: categories })
  },

  handleAdjustSearch(event) { this.setData({ adjustSearchText: event.detail.value || '' }); this.renderAdjuster() },
  clearAdjustSearch() { this.setData({ adjustSearchText: '' }); this.renderAdjuster() },
  toggleDailyPresence(event) { this.persist(checklist.toggleDailyPresence(this.state, this.data.dateKey, event.currentTarget.dataset.itemId)) },

  openAdjustAddItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const category = (this.state.categories || []).find((entry) => entry.id === categoryId)
    if (!category) return
    this.setData({
      adjustEditorVisible: true,
      adjustEditorTitle: '新增选项',
      adjustEditorValue: '',
      adjustEditorConfirmText: '新增到今天',
      adjustEditorContext: { mode: 'add', categoryId }
    })
  },

  openAdjustEditItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const itemId = event.currentTarget.dataset.itemId
    const category = (this.state.categories || []).find((entry) => entry.id === categoryId)
    const item = category && (category.items || []).find((entry) => entry.id === itemId)
    if (!item) return
    this.setData({
      adjustEditorVisible: true,
      adjustEditorTitle: '修改选项',
      adjustEditorValue: item.text,
      adjustEditorConfirmText: '保存修改',
      adjustEditorContext: { mode: 'edit', categoryId, itemId }
    })
  },

  closeAdjustEditor() {
    this.setData({
      adjustEditorVisible: false,
      adjustEditorValue: '',
      adjustEditorContext: null
    })
  },

  confirmAdjustEditor(event) {
    const context = this.data.adjustEditorContext
    if (!context) return
    const value = event.detail && event.detail.value
    try {
      if (context.mode === 'edit') {
        this.persist(checklist.upsertItem(this.state, context.categoryId, context.itemId, value))
        wx.showToast({ title: '选项已修改', icon: 'success' })
      } else {
        let next = checklist.upsertItem(this.state, context.categoryId, null, value)
        const category = (next.categories || []).find((entry) => entry.id === context.categoryId)
        const item = category && (category.items || [])[category.items.length - 1]
        if (item) next = checklist.toggleDailyPresence(next, this.data.dateKey, item.id)
        this.persist(next)
        wx.showToast({ title: '已新增到今天', icon: 'success' })
      }
      this.closeAdjustEditor()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  deleteAdjustItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const itemId = event.currentTarget.dataset.itemId
    const category = (this.state.categories || []).find((entry) => entry.id === categoryId)
    const item = category && (category.items || []).find((entry) => entry.id === itemId)
    if (!item) return
    wx.showModal({
      title: '删除这个选项？',
      content: `“${item.text}”会从条目库、每日固定项和今日清单中移除，并进入管理页回收站。如果只想今天不显示，请直接取消勾选。`,
      confirmText: '删除',
      confirmColor: '#B85C38',
      success: (result) => {
        if (!result.confirm) return
        this.persist(checklist.deleteItem(this.state, categoryId, itemId))
        wx.showToast({ title: '已移到回收站', icon: 'success' })
      }
    })
  },

  resetDailyAdjustments() {
    const summary = this.data.planSummary
    if (!summary.addedCount && !summary.removedCount) {
      wx.showToast({ title: '今天还没有临时调整', icon: 'none' })
      return
    }
    wx.showModal({
      title: '恢复今天的固定模板？',
      content: '会取消今天的临时增加和临时移除，不影响每日固定项设置。',
      confirmText: '恢复模板',
      confirmColor: '#5D7B6F',
      success: (result) => { if (result.confirm) this.persist(checklist.resetDailyAdjustments(this.state, this.data.dateKey)) }
    })
  },

  resetToday() {
    wx.showModal({
      title: '重置今日打卡？',
      content: '只会清空今天的完成勾选，不会改变每日固定项或今天的临时微调。',
      confirmText: '重置',
      confirmColor: '#B85C38',
      success: (result) => { if (result.confirm) this.persist(checklist.resetDate(this.state, this.data.dateKey)) }
    })
  },

  toggleStealth() {
    this.state.privacy = this.state.privacy || {}
    this.state.privacy.stealthMode = !this.state.privacy.stealthMode
    this.state = storage.saveState(this.state)
    this.renderChecklist(this.data.dateKey, new Date())
    wx.setNavigationBarTitle({ title: this.state.privacy.stealthMode ? '今日计划' : (this.state.profile.title || '摸鱼日常') })
  },

  startQuickFive() {
    if (this.state.salary.timer.running) {
      wx.switchTab({ url: '/pages/salary/salary' })
      return
    }
    const validation = salaryDomain.validateSettings(this.state.salary.settings)
    if (!validation.valid) {
      wx.showToast({ title: '先去攒米页完成设置', icon: 'none' })
      wx.switchTab({ url: '/pages/salary/salary' })
      return
    }
    const label = (this.state.salary.labels || [])[1] || (this.state.salary.labels || [])[0] || '发呆'
    this.state = salaryService.startTimer(this.state, label, Date.now(), { targetSeconds: 300 })
    this.state = storage.saveState(this.state)
    wx.switchTab({ url: '/pages/salary/salary' })
  },

  randomQuickFish() {
    if (this.state.salary.timer.running) {
      wx.switchTab({ url: '/pages/salary/salary' })
      return
    }
    const validation = salaryDomain.validateSettings(this.state.salary.settings)
    if (!validation.valid) {
      wx.showToast({ title: '先去攒米页完成设置', icon: 'none' })
      wx.switchTab({ url: '/pages/salary/salary' })
      return
    }
    const pick = funDomain.randomSuggestion(this.state.salary.labels)
    this.state = salaryService.startTimer(this.state, pick.label, Date.now(), { targetSeconds: pick.minutes * 60 })
    this.state = storage.saveState(this.state)
    wx.showToast({ title: `${pick.title} · ${pick.minutes}分钟`, icon: 'none' })
    setTimeout(() => wx.switchTab({ url: '/pages/salary/salary' }), 350)
  },

  goSalary() { wx.switchTab({ url: '/pages/salary/salary' }) },
  goFixed() { wx.switchTab({ url: '/pages/fixed/fixed' }) },
  goStats() { wx.switchTab({ url: '/pages/stats/stats' }) },
  goReport() { wx.navigateTo({ url: '/pages/report/report' }) },
  goManage() { wx.switchTab({ url: '/pages/manage/manage' }) },
  noop() {},

  onShareAppMessage() { return share.appMessage() },
  onShareTimeline() { return share.timeline() }
})
