const storage = require('../../utils/storage')
const checklist = require('../../utils/checklist-domain')
const defaults = require('../../data/defaults')
const share = require('../../utils/share')

Page({
  data: {
    fontMode: 'medium',
    profile: {},
    privacy: { stealthMode: false, hideAmounts: true, neutralText: true },
    categories: [],
    trash: [],
    iconPresets: defaults.ICON_PRESETS,
    colorPresets: defaults.COLOR_PRESETS,
    editorVisible: false,
    editorValue: '',
    editorTitle: '新增分类标题'
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 4 })
    this.loadAndRender()
  },

  loadAndRender() {
    this.state = storage.loadState()
    this.render()
  },

  render() {
    const categories = (this.state.categories || []).map((category, index, list) => Object.assign({}, category, {
      itemCount: (category.items || []).length,
      iconIndex: Math.max(0, defaults.ICON_PRESETS.indexOf(category.icon)),
      canUp: index > 0,
      canDown: index < list.length - 1
    }))
    const trash = (this.state.trash || []).map((entry) => {
      if (entry.type === 'category') {
        const category = entry.payload && entry.payload.category ? entry.payload.category : {}
        return {
          id: entry.id,
          type: entry.type,
          typeText: '分类标题',
          icon: category.icon || '📦',
          title: category.title || '未命名分类',
          description: `包含 ${(category.items || []).length} 条清单项`
        }
      }
      const payload = entry.payload || {}
      return {
        id: entry.id,
        type: entry.type,
        typeText: '清单项',
        icon: payload.categoryIcon || '📝',
        title: payload.item ? payload.item.text : '未命名清单项',
        description: `原分类：${payload.categoryTitle || '未知'}`
      }
    })
    const fontMode = (this.state.ui && this.state.ui.fontSizeMode) || 'medium'
    this.setData({
      fontMode,
      profile: Object.assign({}, this.state.profile),
      privacy: Object.assign({}, this.state.privacy || {}),
      categories,
      trash
    })
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 4, fontMode })
  },

  save(nextState, toastText) {
    this.state = storage.saveState(nextState)
    this.render()
    if (toastText) wx.showToast({ title: toastText, icon: 'success' })
  },


  changeFontSize(event) {
    const mode = String(event.currentTarget.dataset.mode || '')
    if (!['small', 'medium', 'large'].includes(mode)) return
    const next = Object.assign({}, this.state)
    next.ui = Object.assign({}, next.ui || {}, { fontSizeMode: mode })
    this.state = storage.saveState(next)
    this.render()
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ fontMode: mode, selected: 4 })
    wx.showToast({ title: mode === 'small' ? '已切换小字号' : (mode === 'large' ? '已切换大字号' : '已切换标准字号'), icon: 'none' })
  },


  handlePrivacySwitch(event) {
    const field = event.currentTarget.dataset.field
    const next = Object.assign({}, this.state)
    next.privacy = Object.assign({}, next.privacy || {}, { [field]: Boolean(event.detail.value) })
    this.save(next)
    if (field === 'stealthMode') {
      wx.showToast({ title: event.detail.value ? '隐身模式已开启' : '已回到正常模式', icon: 'none' })
    }
  },

  toggleBossMode() {
    const next = Object.assign({}, this.state)
    next.privacy = Object.assign({}, next.privacy || {}, { stealthMode: !(next.privacy && next.privacy.stealthMode) })
    this.save(next, next.privacy.stealthMode ? '老板模式已开启' : '老板模式已关闭')
  },

  handleProfileInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [`profile.${field}`]: event.detail.value })
  },

  saveProfile() {
    const title = String(this.data.profile.title || '').trim()
    if (!title) {
      wx.showToast({ title: '主标题不能为空', icon: 'none' })
      return
    }
    const next = Object.assign({}, this.state, {
      profile: {
        badge: String(this.data.profile.badge || '').trim() || defaults.DEFAULT_PROFILE.badge,
        title,
        subtitle: String(this.data.profile.subtitle || '').trim() || defaults.DEFAULT_PROFILE.subtitle
      }
    })
    this.save(next, '页面标题已保存')
    wx.setNavigationBarTitle({ title: '管理中心' })
  },

  updateCategoryTitle(event) {
    const categoryId = event.currentTarget.dataset.id
    const value = String(event.detail.value || '').trim()
    if (!value) {
      wx.showToast({ title: '分类标题不能为空', icon: 'none' })
      this.render()
      return
    }
    try {
      this.save(checklist.updateCategory(this.state, categoryId, { title: value }))
    } catch (error) {
      wx.showToast({ title: error.message || '修改失败', icon: 'none' })
    }
  },

  changeCategoryIcon(event) {
    const categoryId = event.currentTarget.dataset.id
    const icon = defaults.ICON_PRESETS[Number(event.detail.value)] || defaults.ICON_PRESETS[0]
    this.save(checklist.updateCategory(this.state, categoryId, { icon }))
  },

  changeCategoryColor(event) {
    const categoryId = event.currentTarget.dataset.id
    const color = event.currentTarget.dataset.color
    this.save(checklist.updateCategory(this.state, categoryId, { color }))
  },

  moveCategory(event) {
    const categoryId = event.currentTarget.dataset.id
    const direction = Number(event.currentTarget.dataset.direction)
    this.save(checklist.reorderCategory(this.state, categoryId, direction))
  },

  deleteCategory(event) {
    const categoryId = event.currentTarget.dataset.id
    const category = this.state.categories.find((entry) => entry.id === categoryId)
    if (!category) return
    wx.showModal({
      title: '删除这个分类标题？',
      content: `“${category.title}”及其清单项会进入回收站，可随时恢复。`,
      confirmText: '删除',
      confirmColor: '#B85C38',
      success: (result) => {
        if (result.confirm) this.save(checklist.deleteCategory(this.state, categoryId), '已移到回收站')
      }
    })
  },

  openAddCategory() {
    this.setData({ editorVisible: true, editorValue: '', editorTitle: '新增分类标题' })
  },

  closeEditor() {
    this.setData({ editorVisible: false, editorValue: '' })
  },

  confirmAddCategory(event) {
    const result = checklist.addCategory(this.state, event.detail.value)
    this.save(result.state, '分类已新增')
    this.closeEditor()
  },

  restoreTrash(event) {
    const id = event.currentTarget.dataset.id
    this.save(checklist.restoreTrash(this.state, id), '已恢复')
  },

  deleteTrashPermanently(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({
      title: '彻底删除？',
      content: '彻底删除后无法恢复。',
      confirmText: '彻底删除',
      confirmColor: '#B85C38',
      success: (result) => {
        if (result.confirm) this.save(checklist.permanentlyDeleteTrash(this.state, id))
      }
    })
  },

  clearTrash() {
    if (!this.data.trash.length) return
    wx.showModal({
      title: '清空回收站？',
      content: '回收站中的分类和清单项将无法恢复。',
      confirmText: '清空',
      confirmColor: '#B85C38',
      success: (result) => {
        if (result.confirm) this.save(checklist.clearTrash(this.state), '回收站已清空')
      }
    })
  },

  exportBackup() {
    wx.setClipboardData({
      data: storage.exportState(),
      success: () => wx.showToast({ title: '备份已复制', icon: 'success' })
    })
  },

  importBackup() {
    wx.getClipboardData({
      success: (result) => {
        const content = String(result.data || '').trim()
        if (!content) {
          wx.showToast({ title: '剪贴板没有备份内容', icon: 'none' })
          return
        }
        wx.showModal({
          title: '导入剪贴板备份？',
          content: '当前本机数据会被备份内容覆盖。',
          confirmText: '导入',
          confirmColor: '#5D7B6F',
          success: (confirmResult) => {
            if (!confirmResult.confirm) return
            try {
              this.state = storage.importState(content)
              this.render()
              wx.showToast({ title: '导入成功', icon: 'success' })
            } catch (error) {
              wx.showToast({ title: '备份格式无效', icon: 'none' })
            }
          }
        })
      }
    })
  },

  resetAllData() {
    wx.showModal({
      title: '恢复初始版本？',
      content: '会重置全部标题、清单、打卡、工资设置和摸鱼记录。建议先复制备份。',
      confirmText: '全部重置',
      confirmColor: '#B85C38',
      success: (result) => {
        if (!result.confirm) return
        this.state = storage.resetState()
        this.render()
        wx.showToast({ title: '已恢复初始内容', icon: 'success' })
      }
    })
  },

  onShareAppMessage() {
    return share.appMessage()
  },

  onShareTimeline() {
    return share.timeline()
  }
})
