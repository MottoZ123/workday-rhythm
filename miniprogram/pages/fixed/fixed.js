const storage = require('../../utils/storage')
const checklist = require('../../utils/checklist-domain')
const share = require('../../utils/share')

Page({
  data: {
    fontMode: 'medium',
    searchText: '',
    selectedCount: 0,
    totalCount: 0,
    categories: [],
    allExpanded: false,
    editorVisible: false,
    editorTitle: '',
    editorValue: '',
    editorContext: null
  },

  onLoad() {
    this.expandedMap = {}
  },

  onShow() {
    if (this.getTabBar && this.getTabBar()) this.getTabBar().setData({ selected: 1 })
    this.state = storage.loadState()
    const remembered = this.state.ui && Array.isArray(this.state.ui.fixedExpandedCategoryIds)
      ? this.state.ui.fixedExpandedCategoryIds
      : []
    if (!Object.keys(this.expandedMap).length) {
      remembered.forEach((id) => { this.expandedMap[id] = true })
      if (!remembered.length && this.state.categories[0]) this.expandedMap[this.state.categories[0].id] = true
    }
    this.render()
  },

  render() {
    const fixed = new Set((this.state.dailyPlan && this.state.dailyPlan.fixedItemIds) || [])
    const query = String(this.data.searchText || '').trim().toLowerCase()
    const categories = []
    let totalCount = 0
    let selectedCount = 0

    ;(this.state.categories || []).forEach((category) => {
      const allItems = (category.items || []).map((item) => {
        const selected = fixed.has(item.id)
        totalCount += 1
        if (selected) selectedCount += 1
        return Object.assign({}, item, { selected })
      })
      const visibleItems = query
        ? allItems.filter((item) => item.text.toLowerCase().includes(query) || category.title.toLowerCase().includes(query))
        : allItems
      if (query && !visibleItems.length) return
      const categorySelected = allItems.filter((item) => item.selected).length
      categories.push(Object.assign({}, category, {
        items: visibleItems,
        selectedCount: categorySelected,
        total: allItems.length,
        expanded: query ? true : Boolean(this.expandedMap[category.id]),
        allSelected: allItems.length > 0 && categorySelected === allItems.length
      }))
    })

    const allExpanded = categories.length > 0 && categories.every((category) => category.expanded)
    this.setData({ fontMode: (this.state.ui && this.state.ui.fontSizeMode) || 'medium', categories, totalCount, selectedCount, allExpanded })
  },

  save(nextState, toastText) {
    this.state = storage.saveState(nextState)
    this.render()
    if (toastText) wx.showToast({ title: toastText, icon: 'success' })
  },

  handleSearch(event) {
    this.setData({ searchText: event.detail.value || '' })
    this.render()
  },

  clearSearch() {
    this.setData({ searchText: '' })
    this.render()
  },

  toggleCategory(event) {
    if (this.data.searchText) return
    const id = event.currentTarget.dataset.id
    this.expandedMap[id] = !this.expandedMap[id]
    this.state.ui = this.state.ui || {}
    this.state.ui.fixedExpandedCategoryIds = Object.keys(this.expandedMap).filter((key) => this.expandedMap[key])
    this.state = storage.saveState(this.state)
    this.render()
  },

  toggleAllCategories() {
    const shouldExpand = !this.data.allExpanded
    this.expandedMap = {}
    ;(this.state.categories || []).forEach((category) => { this.expandedMap[category.id] = shouldExpand })
    this.state.ui = this.state.ui || {}
    this.state.ui.fixedExpandedCategoryIds = shouldExpand ? this.state.categories.map((category) => category.id) : []
    this.state = storage.saveState(this.state)
    this.render()
  },

  toggleFixedItem(event) {
    const itemId = event.currentTarget.dataset.itemId
    this.save(checklist.toggleFixedItem(this.state, itemId))
  },

  toggleCategoryFixed(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const select = String(event.currentTarget.dataset.select) === 'true'
    this.save(checklist.setCategoryFixed(this.state, categoryId, select))
  },

  selectAll() {
    wx.showModal({
      title: '全部设为固定项？',
      content: '首页会重新显示条目库中的全部选项。',
      confirmText: '全部固定',
      confirmColor: '#5D7B6F',
      success: (result) => {
        if (result.confirm) this.save(checklist.setAllFixed(this.state, true), '已全部设为固定')
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: '清空每日固定项？',
      content: '不会删除条目库，只会让首页的固定清单变为空；你可以随后重新勾选常用项。',
      confirmText: '清空固定项',
      confirmColor: '#B85C38',
      success: (result) => {
        if (result.confirm) this.save(checklist.setAllFixed(this.state, false), '固定项已清空')
      }
    })
  },

  openAddItem(event) {
    this.setData({
      editorVisible: true,
      editorTitle: '新增条目并设为固定',
      editorValue: '',
      editorContext: { mode: 'add', categoryId: event.currentTarget.dataset.categoryId }
    })
  },

  openEditItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const itemId = event.currentTarget.dataset.itemId
    const category = (this.state.categories || []).find((entry) => entry.id === categoryId)
    const item = category && (category.items || []).find((entry) => entry.id === itemId)
    if (!item) return
    this.setData({
      editorVisible: true,
      editorTitle: '修改条目内容',
      editorValue: item.text,
      editorContext: { mode: 'edit', categoryId, itemId }
    })
  },

  closeEditor() {
    this.setData({ editorVisible: false, editorValue: '', editorContext: null })
  },

  confirmEditor(event) {
    const context = this.data.editorContext
    if (!context) return
    try {
      if (context.mode === 'edit') {
        this.save(checklist.upsertItem(this.state, context.categoryId, context.itemId, event.detail.value), '条目已更新')
      } else {
        let next = checklist.upsertItem(this.state, context.categoryId, null, event.detail.value)
        const category = (next.categories || []).find((entry) => entry.id === context.categoryId)
        const item = category && category.items && category.items[category.items.length - 1]
        if (item) next = checklist.setFixedItem(next, item.id, true)
        this.save(next, '已新增并设为固定')
      }
      this.closeEditor()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  },

  deleteItem(event) {
    const categoryId = event.currentTarget.dataset.categoryId
    const itemId = event.currentTarget.dataset.itemId
    const category = (this.state.categories || []).find((entry) => entry.id === categoryId)
    const item = category && (category.items || []).find((entry) => entry.id === itemId)
    if (!item) return
    wx.showModal({
      title: '移到回收站？',
      content: `“${item.text}”会从条目库、固定项和今日清单中移除，可在管理页恢复。`,
      confirmText: '删除',
      confirmColor: '#B85C38',
      success: (result) => {
        if (result.confirm) this.save(checklist.deleteItem(this.state, categoryId, itemId), '已移到回收站')
      }
    })
  },

  goToday() {
    wx.switchTab({ url: '/pages/today/today' })
  },

  onShareAppMessage() {
    return share.appMessage()
  },

  onShareTimeline() {
    return share.timeline()
  }
})
