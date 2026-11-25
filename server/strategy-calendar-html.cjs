'use strict'

const { Parser } = require('htmlparser2')
const BLOCKS = new Set(['p', 'div', 'li', 'tr', 'td', 'th', 'section', 'article', 'ul', 'ol', 'table', 'blockquote'])
const SKIP = new Set(['script', 'style', 'template', 'head', 'noscript'])

// Google event descriptions can be HTML. Turn only visible text into bounded
// plain text. Never consider attribute values, scripts, styles or hidden text.
function visibleCalendarText(value) {
  if (typeof value !== 'string' || value.length > 100000) return ''
  if (!/<\/?[a-z][^>]*>/i.test(value)) return value
  let output = '', stack = []
  const visible = () => !stack.length || !stack[stack.length - 1]
  const parser = new Parser({
    onopentag(name, attrs) {
      const inherited = !visible()
      const style = attrs.style || ''
      const hidden = inherited || SKIP.has(name) || Object.hasOwn(attrs, 'hidden') || (attrs['aria-hidden'] || '').toLowerCase() === 'true' || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(style)
      stack.push(hidden)
      if (!hidden && (name === 'br' || BLOCKS.has(name))) output += '\n'
    },
    ontext(text) { if (visible()) output += text },
    onclosetag(name) {
      if (visible() && BLOCKS.has(name)) output += '\n'
      stack.pop()
    },
  }, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true })
  parser.write(value); parser.end()
  return output.replace(/\u00a0/g, ' ')
}

// Safe structural hints for one known test reference; never return text itself.
function referenceLayout(description, reference) {
  if (!/^[a-f0-9]{32}$/.test(reference)) return 'not_visible'
  const lines = visibleCalendarText(description).split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean)
  const labels = [], references = []
  lines.forEach((line, index) => {
    if (/booking\s+reference/i.test(line)) labels.push(index)
    if (line.toLowerCase().includes(reference)) references.push(index)
  })
  if (!references.length) return 'not_visible'
  if (labels.length !== 1 || references.length !== 1) return 'other'
  if (labels[0] === references[0]) return 'same_line'
  return references[0] === labels[0] + 1 ? 'next_line' : 'other'
}

module.exports = { visibleCalendarText, referenceLayout }
