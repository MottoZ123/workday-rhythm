function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createId(prefix) {
  const safePrefix = String(prefix || 'id').replace(/[^a-z0-9_-]/gi, '') || 'id'
  return `${safePrefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

function safeText(value, fallback) {
  const text = String(value == null ? '' : value).trim()
  return text || String(fallback || '')
}

function toNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : Number(fallback || 0)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

module.exports = {
  deepClone,
  createId,
  safeText,
  toNumber,
  clamp
}
