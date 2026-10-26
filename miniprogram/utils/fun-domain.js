const { clamp, safeText } = require('./common')

const QUICK_MINUTES = [3, 5, 10, 15]
const DEFAULT_SUGGESTIONS = [
  { label: '喝水', title: '去接杯水', minutes: 3, note: '顺便走两步，眼睛也休息一下。' },
  { label: '发呆', title: '看窗外发呆', minutes: 5, note: '短暂清空缓存，再回来继续。' },
  { label: '刷手机', title: '刷一会手机', minutes: 5, note: '定好时间，快乐不要超支。' },
  { label: '散步', title: '站起来走走', minutes: 10, note: '去茶水间或楼下绕一圈。' },
  { label: '聊天', title: '和同事聊两句', minutes: 5, note: '换换脑子，也补一点社交能量。' },
  { label: '其他', title: '闭眼放松', minutes: 3, note: '肩膀放下来，深呼吸几次。' },
  { label: '喝水', title: '泡杯喜欢的茶', minutes: 5, note: '慢一点，今天也不用一直冲刺。' },
  { label: '散步', title: '去晒两分钟太阳', minutes: 5, note: '离开屏幕，给大脑换个背景。' },
  { label: '发呆', title: '什么都不做', minutes: 3, note: '三分钟也可以是一段完整的休息。' }
]

const COPY_LINES = [
  '公司购买了你今天的发呆时间，请放心交付。',
  '认真工作是为了更好地摸鱼，节奏很重要。',
  '你不是在走神，你是在进行低功耗后台整理。',
  '今天也要记得把注意力还给自己几分钟。',
  '摸鱼不是消失，是给大脑安排一次短暂维护。',
  '带薪休息也是休息，别忘了喝水和眨眼。',
  '工作会继续，肩膀可以先放下来。',
  '完成一点，休息一点，今天也算稳稳前进。',
  '别把所有电量都留给工作，自己也要充电。',
  '短暂离线不是偷懒，是避免系统过热。'
]

function hashString(text) {
  let hash = 2166136261
  const value = String(text || '')
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededIndex(seedText, length) {
  if (!length) return 0
  return hashString(seedText) % length
}

function dailyCopy(dateKey, salt) {
  return COPY_LINES[seededIndex(`${dateKey || ''}:${salt || 'copy'}`, COPY_LINES.length)]
}

function randomSuggestion(labels, randomValue) {
  const safeLabels = (labels || []).map((label) => safeText(label)).filter(Boolean)
  const pool = DEFAULT_SUGGESTIONS.concat(
    safeLabels
      .filter((label) => !DEFAULT_SUGGESTIONS.some((item) => item.label === label))
      .map((label, index) => ({
        label,
        title: `来一段${label}`,
        minutes: QUICK_MINUTES[index % QUICK_MINUTES.length],
        note: '给自己一个有边界的小休息。'
      }))
  )
  if (!pool.length) return DEFAULT_SUGGESTIONS[0]
  const random = Number.isFinite(randomValue) ? clamp(randomValue, 0, 0.999999) : Math.random()
  return Object.assign({}, pool[Math.floor(random * pool.length)])
}

function quotaSnapshot(seconds, settings) {
  const enabled = !settings || settings.enabled !== false
  const limitMinutes = clamp(Math.round(Number(settings && settings.minutes) || 30), 5, 180)
  const usedSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const limitSeconds = limitMinutes * 60
  const remainingSeconds = Math.max(0, limitSeconds - usedSeconds)
  const percentage = limitSeconds > 0 ? clamp(usedSeconds / limitSeconds * 100, 0, 100) : 0
  return {
    enabled,
    limitMinutes,
    usedSeconds,
    remainingSeconds,
    percentage: Math.round(percentage),
    exceeded: enabled && usedSeconds > limitSeconds
  }
}

module.exports = {
  QUICK_MINUTES,
  DEFAULT_SUGGESTIONS,
  COPY_LINES,
  dailyCopy,
  randomSuggestion,
  quotaSnapshot
}
