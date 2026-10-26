function pad(value) {
  return String(value).padStart(2, '0')
}

function formatDateKey(input) {
  const date = input instanceof Date ? input : new Date(input == null ? Date.now() : input)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatChineseDate(input) {
  const date = input instanceof Date ? input : new Date(input == null ? Date.now() : input)
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`
}

function formatClock(input) {
  const date = input instanceof Date ? input : new Date(input)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function humanDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟`
  return `${safe}秒`
}

module.exports = {
  pad,
  formatDateKey,
  formatChineseDate,
  formatClock,
  formatDuration,
  humanDuration
}
