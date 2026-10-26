const storage = require('./utils/storage')

App({
  globalData: {
    appName: '工休伴侣',
    version: '1.1.4'
  },

  onLaunch() {
    storage.ensureSchema()
  },

  onShow() {
    try {
      storage.recordVisitToday()
    } catch (error) {
      console.warn('Unable to record visit date', error)
    }
  }
})
