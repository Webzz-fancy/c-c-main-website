'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { run } = require('../scripts/auto-match-strategy-test.cjs')
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
test('scheduled job matches the existing paid test row without a browser and is idempotent', async () => {
  const f = fixture()
  assert.deepEqual(await run(f.options), { checked: 1, matched: 1, review: 0, errors: 0 })
  assert.equal(f.row.id, 'row'); assert.equal(f.row.booking_status, 'matched'); assert.equal(f.row.google_event_id, 'event-1')
  assert.equal(f.row.customer_name, 'Test'); assert.equal(f.row.whatsapp_e164, '+971501234567')
  // Real query excludes a matched row; emulate it here.
  f.store.recentUnmatchedPaidTests = async () => []
  assert.deepEqual(await run(f.options), { checked: 0, matched: 0, review: 0, errors: 0 })
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
  const f2 = fixture(); f2.store.recentUnmatchedPaidTests = async () => Array(26).fill(f2.row)
  await assert.rejects(run(f2.options)); assert.equal(f2.row.booking_status, 'not_booked')
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
  assert.equal(request.searchParams.get('limit'), '26')
  const overflow = createStore({ url: 'https://test.supabase.co', key: 'secret', fetchImpl: async () => ({ ok: true, json: async () => Array(26).fill({}) }) })
  await assert.rejects(overflow.recentUnmatchedPaidTests('2026-11-15T12:00:00Z'))
})
