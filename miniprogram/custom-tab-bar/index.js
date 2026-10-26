const storage = require('../utils/storage')

Component({
  data: {
    selected: 0,
    fontMode: 'medium',
    list: [
      { pagePath: '/pages/today/today', text: '今日', icon: '/assets/tab/checklist.png', activeIcon: '/assets/tab/checklist-active.png' },
      { pagePath: '/pages/fixed/fixed', text: '固定', icon: '/assets/tab/fixed.png', activeIcon: '/assets/tab/fixed-active.png' },
      { pagePath: '/pages/salary/salary', text: '攒米', icon: '/assets/tab/salary.png', activeIcon: '/assets/tab/salary-active.png' },
      { pagePath: '/pages/stats/stats', text: '统计', icon: '/assets/tab/stats.png', activeIcon: '/assets/tab/stats-active.png' },
      { pagePath: '/pages/manage/manage', text: '管理', icon: '/assets/tab/manage.png', activeIcon: '/assets/tab/manage-active.png' }
    ]
  },
  lifetimes: {
    attached() {
      try {
        const state = storage.loadState()
        this.setData({ fontMode: (state.ui && state.ui.fontSizeMode) || 'medium' })
      } catch (error) {}
    }
  },
  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item) return
      this.setData({ selected: index })
      wx.switchTab({ url: item.pagePath })
    }
  }
})
