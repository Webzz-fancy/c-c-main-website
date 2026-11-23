'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const esbuild = require('esbuild')
const React = require('react')
const { act, create } = require('react-test-renderer')

// Bundle the real TSX component for an in-memory React test, without making
// network requests or loading the website's real environment variables.
const built = esbuild.buildSync({ entryPoints: [path.join(__dirname, '../src/components/StrategyLiveCheckout.tsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime'], define: { 'import.meta.env': '{}' }, write: false })
const loaded = new Module(path.join(__dirname, 'strategy-live-ui-bundle.cjs'), module)
loaded.filename = path.join(__dirname, 'strategy-live-ui-bundle.cjs'); loaded.paths = module.paths
loaded._compile(built.outputFiles[0].text, loaded.filename)
const Component = loaded.exports.default
const absent = { ok: false, error: 'No booking session. Please contact us for help.' }
const paid = { ok: true, status: 'paid', reference: '0123456789abcdef0123456789abcdef', calendar: 'https://calendar.google.com/calendar/appointments/schedules/example' }
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data })
async function renderWith(fetchImpl, returned = false) {
  const oldFetch = global.fetch; global.fetch = fetchImpl
  let tree
  try { await act(async () => { tree = create(React.createElement(Component, { returned })); await Promise.resolve(); await Promise.resolve() }); return { tree, cleanup() { tree.unmount(); global.fetch = oldFetch } } }
  catch (error) { global.fetch = oldFetch; throw error }
}
const text = (tree) => JSON.stringify(tree.toJSON())

test('new live visitor sees checkout and WhatsApp help, without payment-check button or email', async () => {
  const seen = []
  const view = await renderWith(async (url, options) => { seen.push({ url, options }); return response(401, absent) })
  try {
    assert.equal(seen.length, 1); assert.equal(seen[0].url, '/api/strategy-live/status'); assert.equal(seen[0].options.credentials, 'same-origin')
    assert.equal(view.tree.root.findAllByType('form').length, 1)
    assert.match(text(view.tree), /Having trouble\? Contact us on WhatsApp/)
    assert.doesNotMatch(text(view.tree), /Check an existing payment|mailto:|email us/i)
  } finally { view.cleanup() }
})
test('reopening in the same browser restores verified payment and reference without starting another checkout', async () => {
  const seen = []
  const view = await renderWith(async (url) => { seen.push(url); return response(200, paid) })
  try {
    assert.deepEqual(seen, ['/api/strategy-live/status']); assert.equal(view.tree.root.findAllByType('form').length, 0)
    assert.match(text(view.tree), /Your payment is confirmed/); assert.match(text(view.tree), new RegExp(paid.reference))
    assert.equal(view.tree.root.findAllByType('iframe').length, 0)
    const choose = view.tree.root.findAllByType('button').find((b) => b.children.includes('Choose a time'))
    await act(async () => choose.props.onClick())
    assert.equal(view.tree.root.findByType('iframe').props.src, paid.calendar)
  } finally { view.cleanup() }
})
test('unattempted payment shows the saved details and resumes the same attempt without creating checkout', async () => {
  const requests = [], oldWindow = global.window
  global.window = { location: { assign: (url) => requests.push(`redirect:${url}`) } }
  const view = await renderWith(async (url) => {
    requests.push(url)
    return url.endsWith('/status') ? response(200, { ok: true, status: 'resumable', name: 'Sample', phone: '+971501234567' }) : response(200, { ok: true, redirectUrl: 'https://pay.ziina.com/pay' })
  })
  try {
    const inputs = view.tree.root.findAllByType('input')
    assert.equal(inputs.length, 2); assert.equal(inputs[0].props.value, 'Sample'); assert.equal(inputs[1].props.value, '+971501234567')
    assert.equal(inputs[0].props.readOnly, true); assert.equal(inputs[1].props.readOnly, true)
    const button = view.tree.root.findAllByType('button').find((b) => b.children.includes('Continue to secure payment'))
    await act(async () => { await button.props.onClick() })
    assert.deepEqual(requests, ['/api/strategy-live/status', '/api/strategy-live/resume', 'redirect:https://pay.ziina.com/pay'])
    assert.equal(view.tree.root.findByType('button').props.disabled, true)
  } finally { view.cleanup(); global.window = oldWindow }
})
test('a changed payment is rechecked and a newly paid session shows the booking reference', async () => {
  let calls = 0
  const view = await renderWith(async (url) => {
    if (url.endsWith('/resume')) return response(409, {})
    return ++calls === 1 ? response(200, { ok: true, status: 'resumable', name: 'Sample', phone: '+971501234567' }) : response(200, paid)
  })
  try {
    const button = view.tree.root.findAllByType('button').find((b) => b.children.includes('Continue to secure payment'))
    await act(async () => { await button.props.onClick(); await Promise.resolve() })
    assert.match(text(view.tree), /Your payment is confirmed/); assert.equal(view.tree.root.findAllByType('form').length, 0)
  } finally { view.cleanup() }
})
test('a lost session during resume does not offer a new checkout', async () => {
  let calls = 0
  const view = await renderWith(async (url) => {
    if (url.endsWith('/resume')) return response(409, {})
    return ++calls === 1 ? response(200, { ok: true, status: 'resumable', name: 'Sample', phone: '+971501234567' }) : response(401, absent)
  })
  try {
    const button = view.tree.root.findAllByType('button').find((b) => b.children.includes('Continue to secure payment'))
    await act(async () => { await button.props.onClick(); await Promise.resolve() })
    assert.equal(view.tree.root.findAllByType('form').length, 0); assert.match(text(view.tree), /before trying to pay again/)
  } finally { view.cleanup() }
})
test('return without cookie, pending, and failed verification never invite another payment', async () => {
  for (const [result, returned] of [[response(401, absent), true], [response(200, { ok: true, status: 'pending' }), false], [response(503, {}), false], [response(200, { ...paid, calendar: 'https://bad.example/' }), false], [response(401, { ok: false, error: 'other' }), false]]) {
    const view = await renderWith(async () => result, returned)
    try { assert.equal(view.tree.root.findAllByType('form').length, 0); assert.match(text(view.tree), /WhatsApp/) }
    finally { view.cleanup() }
  }
})
test('checkout uncertainty removes the form and directs the customer to WhatsApp', async () => {
  const view = await renderWith(async (url) => url.endsWith('/status') ? response(401, absent) : response(503, { ok: false, error: 'unavailable' }))
  try {
    const inputs = view.tree.root.findAllByType('input')
    await act(async () => { inputs[0].props.onChange({ target: { value: 'Test' } }); inputs[1].props.onChange({ target: { value: '+971501234567' } }) })
    await act(async () => { await view.tree.root.findByType('form').props.onSubmit({ preventDefault() {} }) })
    assert.equal(view.tree.root.findAllByType('form').length, 0)
    assert.match(text(view.tree), /before trying again/); assert.match(text(view.tree), /WhatsApp/)
  } finally { view.cleanup() }
})
