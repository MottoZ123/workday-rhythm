const defaults = require('../miniprogram/data/defaults')
const snapshot = require('../source/default_categories.snapshot.json')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(defaults.DEFAULT_CATEGORIES.length === snapshot.length, 'Category count differs from source snapshot')
for (let index = 0; index < snapshot.length; index += 1) {
  const actual = defaults.DEFAULT_CATEGORIES[index]
  const expected = snapshot[index]
  assert(actual.id === expected.id, `Category id mismatch at ${index}`)
  assert(actual.title === expected.title, `Category title mismatch at ${index}`)
  assert(actual.items.length === expected.items.length, `Item count mismatch in ${expected.id}`)
  for (let itemIndex = 0; itemIndex < expected.items.length; itemIndex += 1) {
    assert(actual.items[itemIndex].text === expected.items[itemIndex].text, `Item text mismatch in ${expected.id} at ${itemIndex}`)
  }
}

console.log('Source alignment tests passed')
