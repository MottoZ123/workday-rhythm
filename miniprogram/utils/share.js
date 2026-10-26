const DEFAULT_PATH = '/pages/today/today'

function appMessage() {
  return {
    title: '工休伴侣｜今日清单、攒米进度与休息计时',
    path: DEFAULT_PATH
  }
}

function timeline() {
  return {
    title: '工休伴侣｜把生活节奏和休息都安排明白',
    query: ''
  }
}

module.exports = {
  DEFAULT_PATH,
  appMessage,
  timeline
}
