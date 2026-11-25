'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { run, configIssue } = require('../scripts/auto-match-strategy-test.cjs')
const { createStore } = require('../server/strategy-adapters.cjs')
const reference = '0123456789abcdef0123456789abcdef'
const now = Date.parse('2026-11-22T12:00:00Z')
const env = { STRATEGY_EXPERIMENTAL: 'true', STRATEGY_MODE: 'test', STRATEGY_AUTO_MATCH_TEST: 'true', Z_A_KEY: 'private-test', ZIINA_WEBHOOK_SECRET: 'x'.repeat(32), SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private', STRATEGY_ORIGIN: 'https://example.test', BOOKING_STRATEGY_EMBED: 'https://calendar.google.com/calendar/appointments/schedules/test' }
const makeRow = () => ({ id: 'row', booking_reference: reference, payment_environment: 'test', payment_status: 'completed', booking_status: 'not_booked', google_event_id: null, ziina_intent_id: 'intent-1', ziina_account_id: 'account-1', customer_name: 'Test', whatsapp_e164: '+971501234567' })
const makeEvent = () => ({ id: 'event-1', status: 'confirmed', start: { dateTime: '2026-11-23T10:00:00Z' }, description: `<div><b>Booking reference:</b><br>${reference}</div>` })
function fixture() {
  const row = makeRow(), event = makeEvent()
  const intent = { id: 'intent-1', account_id: 'account-1', amount: 120000, currency_code: 'AED', status: 'completed' }
  const store = {
    recentPendingTestPayments: async () => [],
    markCompletedTestIntent: async ({ id, intentId, accountId }) => {
      if (id !== row.id || row.payment_environment !== 'test' || row.payment_status !== 'pending' || row.ziina_intent_id !== intentId || row.ziina_account_id !== accountId) return false
      row.payment_status = 'completed'; return true
    },
    recentUnmatchedPaidTests: async () => [ { ...row } ],
    byPaidTestReference: async (ref) => ref === row.booking_reference ? { ...row } : null,
    matchPaidTestBooking: async ({ id, reference: ref, eventId, startsAt }) => {
      if (id !== row.id || ref !== row.booking_reference || row.payment_status !== 'completed' || row.booking_status !== 'not_booked') return false
      Object.assign(row, { booking_status: 'matched', google_event_id: eventId, booking_starts_at: startsAt }); return true
    },
  }
  const reader = { list: async () => ({ items: [event] }) }
  const options = { env, now: () => now, storeFactory: () => store, ziinaFactory: () => ({ get: async () => intent }), readerFactory: () => reader }
  return { row, event, intent, store, reader, options }
}
test('scheduled matching is explicitly test-only and never constructs providers when disabled', async () => {
  for (const change of [{ STRATEGY_AUTO_MATCH_TEST: '' }, { STRATEGY_MODE: 'live' }, { STRATEGY_EXPERIMENTAL: 'false' }]) {
    const f = fixture(); let calls = 0
    await assert.rejects(run({ ...f.options, env: { ...env, ...change }, storeFactory: () => { calls++; return f.store } }))
    assert.equal(calls, 0)
  }
})
test('configuration diagnostics return fixed categories without secret values', () => {
  assert.equal(configIssue({ ...env, STRATEGY_AUTO_MATCH_TEST: '' }), 'auto_flag_not_enabled')
  assert.equal(configIssue({ ...env, STRATEGY_MODE: '' }), 'test_mode_not_enabled')
  assert.equal(configIssue({ ...env, Z_A_KEY: '' }), 'ziina_key_missing')
  assert.equal(configIssue({ ...env, SUPABASE_SERVICE_ROLE_KEY: '' }), 'supabase_settings_missing')
  assert.equal(configIssue({ ...env, ZIINA_WEBHOOK_SECRET: '' }), 'webhook_secret_missing')
  assert.equal(configIssue({ ...env, STRATEGY_ORIGIN: '' }), 'site_or_booking_settings_missing')
  assert.equal(configIssue(env), 'settings_invalid_or_conflicting')
  const { spawnSync } = require('node:child_process')
  const result = spawnSync(process.execPath, ['scripts/auto-match-strategy-test.cjs'], { env: { ...env, STRATEGY_AUTO_MATCH_TEST: '', Z_A_KEY: 'private-sensitive-key' }, encoding: 'utf8' })
  assert.equal(result.status, 1); assert.match(result.stderr, /auto_flag_not_enabled/)
  assert.equal(result.stderr.includes('private-sensitive-key'), false)
})
test('scheduled failures categorize database and calendar steps without returning provider error text', async () => {
  const f = fixture(); f.store.recentPendingTestPayments = async () => { throw Error('private provider detail') }
  await assert.rejects(run(f.options), (error) => error.message === 'database_read_failed')
  const f2 = fixture(); f2.reader.list = async () => { throw Error('Calendar authorization failed') }
  await assert.rejects(run(f2.options), (error) => error.message === 'calendar_authorization_failed')
  const f3 = fixture(); f3.reader.list = async () => { throw Error('private provider detail') }
  await assert.rejects(run(f3.options), (error) => error.message === 'calendar_read_failed')
})
test('scheduled job matches the existing paid test row without a browser and is idempotent', async () => {
  const f = fixture()
  assert.deepEqual(await run(f.options), { checked: 1, matched: 1, review: 0, errors: 0, paymentChecked: 0, paymentRecovered: 0 })
  assert.equal(f.row.id, 'row'); assert.equal(f.row.booking_status, 'matched'); assert.equal(f.row.google_event_id, 'event-1')
  assert.equal(f.row.customer_name, 'Test'); assert.equal(f.row.whatsapp_e164, '+971501234567')
  // Real query excludes a matched row; emulate it here.
  f.store.recentUnmatchedPaidTests = async () => []
  assert.deepEqual(await run(f.options), { checked: 0, matched: 0, review: 0, errors: 0, paymentChecked: 0, paymentRecovered: 0 })
})
test('scheduled test job recovers an independently verified payment without browser return and matches the same row', async () => {
  const f = fixture(); f.row.payment_status = 'pending'
  f.store.recentPendingTestPayments = async () => f.row.payment_status === 'pending' ? [{ ...f.row }] : []
  f.store.recentUnmatchedPaidTests = async () => f.row.payment_status === 'completed' && f.row.booking_status === 'not_booked' ? [{ ...f.row }] : []
  const result = await run(f.options)
  assert.deepEqual(result, { checked: 1, matched: 1, review: 0, errors: 0, paymentChecked: 1, paymentRecovered: 1 })
  assert.equal(f.row.id, 'row'); assert.equal(f.row.payment_status, 'completed'); assert.equal(f.row.booking_status, 'matched')
  assert.equal((await run(f.options)).paymentRecovered, 0)
})
test('payment recovery rejects wrong account, amount, unpaid, live and refunded cases', async () => {
  for (const [rowChange, intentChange] of [[{}, { status: 'pending' }], [{}, { amount: 1 }], [{}, { account_id: 'wrong' }], [{ payment_environment: 'live' }, {}], [{ payment_status: 'refunded' }, {}]]) {
    const f = fixture(); f.row.payment_status = 'pending'; Object.assign(f.row, rowChange); Object.assign(f.intent, intentChange)
    f.store.recentPendingTestPayments = async () => [{ ...f.row }]
    f.store.recentUnmatchedPaidTests = async () => []
    assert.equal((await run(f.options)).paymentRecovered, 0)
    assert.notEqual(f.row.payment_status, 'completed')
  }
})
test('too many pending test payments skip recovery but do not block existing paid booking matches', async () => {
  for (const overflow of [async () => { throw Error('Test batch limit exceeded') }, async () => Array(11).fill({})]) {
    const f = fixture(); let recoveryWrites = 0
    f.store.recentPendingTestPayments = overflow
    f.store.markCompletedTestIntent = async () => { recoveryWrites++; return true }
    const result = await run(f.options)
    assert.equal(result.paymentBatchOverflow, true); assert.equal(result.errors, 1)
    assert.equal(result.paymentChecked, 0); assert.equal(recoveryWrites, 0)
    assert.equal(result.matched, 1); assert.equal(f.row.booking_status, 'matched')
  }
})
test('payment recovery cannot undo a concurrent refund or a changed bound intent', async () => {
  for (const change of [{ payment_status: 'refunded' }, { ziina_intent_id: 'new-intent' }]) {
    const f = fixture(); f.row.payment_status = 'pending'; f.store.recentPendingTestPayments = async () => [{ ...f.row }]
    const update = f.store.markCompletedTestIntent
    f.store.markCompletedTestIntent = async (args) => { Object.assign(f.row, change); return update(args) }
    f.store.recentUnmatchedPaidTests = async () => []
    assert.equal((await run(f.options)).paymentRecovered, 0)
    assert.equal(f.row.payment_status, change.payment_status || 'pending')
  }
})
test('unverified, wrong-account, wrong-amount, live and refunded payments never match', async () => {
  for (const change of [{ status: 'pending' }, { account_id: 'wrong' }, { amount: 1 }]) {
    const f = fixture(); Object.assign(f.intent, change)
    const result = await run(f.options); assert.equal(result.matched, 0); assert.equal(result.review, 1); assert.equal(f.row.booking_status, 'not_booked')
  }
  for (const change of [{ payment_environment: 'live' }, { payment_status: 'refunded' }]) {
    const f = fixture(); Object.assign(f.row, change)
    assert.equal((await run(f.options)).matched, 0); assert.equal(f.row.booking_status, 'not_booked')
  }
})
test('duplicate, unknown and cancelled events do not claim a booking', async () => {
  for (const events of [[makeEvent(), { ...makeEvent(), id: 'second', description: `<p>Reference: ${reference}</p>` }], [{ ...makeEvent(), description: `<p>Unrelated: ${reference}</p>` }], [{ ...makeEvent(), status: 'cancelled' }]]) {
    const f = fixture(); f.reader.list = async () => ({ items: events })
    assert.equal((await run(f.options)).matched, 0); assert.equal(f.row.booking_status, 'not_booked')
  }
})
test('reads every page before writes; failures and oversized batches fail closed', async () => {
  const f = fixture(); let pages = 0
  f.reader.list = async () => { if (++pages === 1) return { items: [f.event], nextPageToken: 'next' }; throw Error('private') }
  await assert.rejects(run(f.options)); assert.equal(f.row.booking_status, 'not_booked')
  const f2 = fixture(); f2.store.recentUnmatchedPaidTests = async () => Array(11).fill(f2.row)
  await assert.rejects(run(f2.options)); assert.equal(f2.row.booking_status, 'not_booked')
})
test('scheduled payment recovery query and update restrict to bound test rows', async () => {
  const requests = []
  const store = createStore({ url: 'https://test.supabase.co', key: 'secret', fetchImpl: async (url, options) => { requests.push({ url: new URL(url), options }); return { ok: true, json: async () => options.method === 'PATCH' ? [{ id: 'row' }] : [] } } })
  await store.recentPendingTestPayments('2026-11-15T12:00:00Z')
  const query = requests[0].url.searchParams
  assert.equal(query.get('payment_environment'), 'eq.test'); assert.equal(query.get('payment_status'), 'eq.pending')
  assert.equal(query.get('ziina_intent_id'), 'not.is.null'); assert.equal(query.get('ziina_account_id'), 'not.is.null')
  assert.equal(await store.markCompletedTestIntent({ id: 'row', intentId: 'intent-1', accountId: 'account-1' }), true)
  const guard = requests[1].url.searchParams
  assert.equal(guard.get('id'), 'eq.row'); assert.equal(guard.get('payment_environment'), 'eq.test'); assert.equal(guard.get('payment_status'), 'eq.pending')
  assert.equal(guard.get('ziina_intent_id'), 'eq.intent-1'); assert.equal(guard.get('ziina_account_id'), 'eq.account-1')
  assert.equal(JSON.parse(requests[1].options.body).payment_status, 'completed')
})
test('scheduled query restricts to recent unmatched paid tests and rejects overflow', async () => {
  let request
  const store = createStore({ url: 'https://test.supabase.co', key: 'secret', fetchImpl: async (url) => { request = new URL(url); return { ok: true, json: async () => [] } } })
  assert.deepEqual(await store.recentUnmatchedPaidTests('2026-11-15T12:00:00Z'), [])
  assert.equal(request.searchParams.get('payment_environment'), 'eq.test')
  assert.equal(request.searchParams.get('payment_status'), 'eq.completed')
  assert.equal(request.searchParams.get('booking_status'), 'eq.not_booked')
  assert.equal(request.searchParams.get('google_event_id'), 'is.null')
  assert.equal(request.searchParams.get('created_at'), 'gte.2026-11-15T12:00:00Z')
  assert.equal(request.searchParams.get('limit'), '11')
  const overflow = createStore({ url: 'https://test.supabase.co', key: 'secret', fetchImpl: async () => ({ ok: true, json: async () => Array(11).fill({}) }) })
  await assert.rejects(overflow.recentUnmatchedPaidTests('2026-11-15T12:00:00Z'))
})
