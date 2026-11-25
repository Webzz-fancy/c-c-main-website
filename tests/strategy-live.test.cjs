'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const { readConfig, readLiveConfig, strategyRouter } = require('../server/strategy-booking.cjs')
const { createStore } = require('../server/strategy-adapters.cjs')
const liveJob = require('../scripts/auto-match-strategy-live.cjs')
const testJob = require('../scripts/auto-match-strategy-test.cjs')
const reference = '0123456789abcdef0123456789abcdef'
const env = { STRATEGY_EXPERIMENTAL: 'true', STRATEGY_MODE: 'live', STRATEGY_LIVE_ENABLED: 'true', STRATEGY_AUTO_MATCH_LIVE: 'true', Z_A_KEY: 'test-key', ZIINA_WEBHOOK_SECRET: 'x'.repeat(32), SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'private', STRATEGY_ORIGIN: 'https://example.test', BOOKING_STRATEGY_EMBED: 'https://calendar.google.com/calendar/appointments/schedules/example' }
const phone = '+971501234567'
function fixture() {
  const records = []
  let intent, payload
  const store = {
    insert: async (data) => { const row = { ...data, id: 'row-1', payment_status: 'pending', booking_status: 'not_booked', google_event_id: null }; records.push(row); return row },
    bindIntent: async (id, intentId, accountId) => { Object.assign(records.find((r) => r.id === id), { ziina_intent_id: intentId, ziina_account_id: accountId }) },
    byHash: async (hash) => records.find((r) => r.recovery_token_hash === hash && r.payment_environment === 'live') || null,
    markCompleted: async ({ id, intentId, accountId }) => { const r = records.find((v) => v.id === id); if (!r || r.payment_environment !== 'live' || !['pending', 'completed'].includes(r.payment_status) || r.ziina_intent_id !== intentId || r.ziina_account_id !== accountId) throw Error('changed'); r.payment_status = 'completed'; return r },
    pendingLive: async () => records.filter((r) => r.payment_status === 'pending').map((r) => ({ ...r })),
    unmatchedLive: async () => records.filter((r) => r.payment_status === 'completed' && r.booking_status === 'not_booked').map((r) => ({ ...r })),
    markCompletedTestIntent: async ({ id, intentId, accountId }) => { const r = records.find((v) => v.id === id); if (!r || r.payment_environment !== 'live' || r.payment_status !== 'pending' || r.ziina_intent_id !== intentId || r.ziina_account_id !== accountId) return false; r.payment_status = 'completed'; return true },
    touchLiveAttempt: async () => true,
    byPaidTestReference: async (ref) => records.find((r) => r.booking_reference === ref && r.payment_environment === 'live' && r.payment_status === 'completed') || null,
    matchPaidTestBooking: async ({ id, reference: ref, eventId, startsAt }) => { const r = records.find((v) => v.id === id); if (!r || r.payment_environment !== 'live' || r.booking_reference !== ref || r.payment_status !== 'completed' || r.booking_status !== 'not_booked' || r.google_event_id) return false; Object.assign(r, { booking_status: 'matched', google_event_id: eventId, booking_starts_at: startsAt }); return true },
  }
  const ziina = { create: async (body) => { payload = body; intent = { id: 'intent-1', account_id: 'account-1', amount: 120000, currency_code: 'AED', status: 'pending', redirect_url: 'https://pay.ziina.com/pay' }; return intent }, get: async () => intent }
  return { store, ziina, records, get intent() { return intent }, get payload() { return payload } }
}
async function withServer(f, fn) {
  const app = express(); app.use(express.json()); app.use('/api/strategy-live', strategyRouter({ config: readLiveConfig(env), ...f }))
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  try { await fn(`http://127.0.0.1:${server.address().port}`) } finally { await new Promise((resolve) => server.close(resolve)) }
}
const checkout = (base, cookie, origin = env.STRATEGY_ORIGIN) => fetch(`${base}/api/strategy-live/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify({ name: 'Test', phone }) })
const status = (base, cookie) => fetch(`${base}/api/strategy-live/status`, { headers: { Cookie: cookie } })
test('live requires explicit live mode and live flag; test config stays test-only', () => {
  assert.ok(readLiveConfig(env)); assert.equal(readConfig(env), null)
  for (const change of [{ STRATEGY_MODE: 'test' }, { STRATEGY_LIVE_ENABLED: '' }, { STRATEGY_EXPERIMENTAL: '' }, { Z_A_KEY: '' }, { BOOKING_STRATEGY_EMBED: 'https://invalid.example' }]) assert.equal(readLiveConfig({ ...env, ...change }), null)
})
test('sessionless status requests do not consume provider or checkout rate limit', async () => {
  const f = fixture(); let limitedCalls = 0
  f.rateLimited = () => { limitedCalls++; return true }
  await withServer(f, async (base) => {
    assert.equal((await status(base, '')).status, 401); assert.equal(limitedCalls, 0)
    assert.equal((await status(base, '__Host-strategy_live_session=' + 'a'.repeat(43))).status, 429); assert.equal(limitedCalls, 1)
  })
})
test('live checkout creates a real intent with separate session and verifies before showing calendar', async () => {
  const f = fixture()
  await withServer(f, async (base) => {
    assert.equal((await checkout(base, null, 'https://bad.test')).status, 403)
    const response = await checkout(base)
    assert.equal(response.status, 200); assert.equal(f.payload.test, false); assert.equal(f.payload.amount, 120000); assert.equal(f.payload.currency_code, 'AED')
    assert.equal(f.payload.success_url, 'https://example.test/?booking=live-paid'); assert.equal(f.records[0].payment_environment, 'live')
    const cookie = response.headers.get('set-cookie').split(';')[0]; assert.match(cookie, /^__Host-strategy_live_session=/)
    assert.equal((await checkout(base, cookie)).status, 409)
    assert.equal((await status(base, cookie.replace('__Host-strategy_live_session', '__Host-strategy_session'))).status, 401)
    assert.equal((await (await status(base, cookie)).json()).status, 'pending')
    f.intent.status = 'completed'; f.intent.amount = 1
    assert.equal((await status(base, cookie)).status, 503); assert.equal(f.records[0].payment_status, 'pending')
    f.intent.amount = 120000
    const data = await (await status(base, cookie)).json(); assert.equal(data.status, 'paid'); assert.equal(data.reference, f.records[0].booking_reference)
    f.records[0].payment_status = 'refunded'; assert.equal((await (await status(base, cookie)).json()).status, 'needs_review')
  })
})
test('a session with an unattempted live payment shows saved details and resumes the same Ziina intent', async () => {
  const f = fixture()
  await withServer(f, async (base) => {
    const created = await checkout(base), cookie = created.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'requires_payment_instrument'
    const before = await status(base, cookie), data = await before.json()
    assert.equal(before.headers.get('cache-control'), 'no-store')
    assert.deepEqual(data, { ok: true, status: 'resumable', name: 'Test', phone })
    const resume = (headers = {}) => fetch(`${base}/api/strategy-live/resume`, { method: 'POST', headers: { Origin: env.STRATEGY_ORIGIN, Cookie: cookie, ...headers } })
    assert.equal((await resume({ Origin: 'https://attacker.test' })).status, 403)
    assert.equal((await resume({ Cookie: '' })).status, 401)
    f.ziina.create = async () => { throw Error('resume must not create a new intent') }
    const result = await resume()
    assert.equal(result.status, 200); assert.deepEqual(await result.json(), { ok: true, redirectUrl: 'https://pay.ziina.com/pay' })
    assert.equal(f.records.length, 1); assert.equal(f.records[0].ziina_intent_id, 'intent-1')
  })
})
test('resume fails closed on processing, completed, refunded, wrong-account and unsafe redirects', async () => {
  for (const change of [{ status: 'pending' }, { status: 'requires_user_action' }, { status: 'failed' }, { status: 'completed' }, { status: 'requires_payment_instrument', account_id: 'wrong' }, { status: 'requires_payment_instrument', amount: 1 }, { status: 'requires_payment_instrument', redirect_url: 'https://evil.example/' }]) {
    const f = fixture()
    await withServer(f, async (base) => {
      const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
      Object.assign(f.intent, change)
      const r = await fetch(`${base}/api/strategy-live/resume`, { method: 'POST', headers: { Origin: env.STRATEGY_ORIGIN, Cookie: cookie } })
      assert.equal(r.status, 409); assert.equal(f.records.length, 1)
    })
  }
  const f = fixture()
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'requires_payment_instrument'; f.records[0].payment_status = 'refunded'
    assert.equal((await fetch(`${base}/api/strategy-live/resume`, { method: 'POST', headers: { Origin: env.STRATEGY_ORIGIN, Cookie: cookie } })).status, 409)
    assert.equal((await (await status(base, cookie)).json()).status, 'needs_review')
  })
})
test('resume rejects a row changed during Ziina verification', async () => {
  const f = fixture()
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'requires_payment_instrument'
    let reads = 0; const original = f.store.byHash
    f.store.byHash = async (hash) => { const row = await original(hash); if (++reads === 2) row.payment_status = 'refund_review'; return { ...row } }
    const r = await fetch(`${base}/api/strategy-live/resume`, { method: 'POST', headers: { Origin: env.STRATEGY_ORIGIN, Cookie: cookie } })
    assert.equal(r.status, 409); assert.equal(f.records[0].payment_status, 'refund_review')
  })
})
test('live scheduler rechecks a paid bound intent then matches its reference, without touching test records', async () => {
  const f = fixture()
  await f.store.insert({ booking_reference: reference, payment_environment: 'live', customer_name: 'Test', whatsapp_e164: phone })
  await f.ziina.create({}); await f.store.bindIntent('row-1', 'intent-1', 'account-1'); f.intent.status = 'completed'
  const options = { env, now: () => Date.parse('2026-11-22T12:00:00Z'), storeFactory: (args) => { assert.equal(args.environment, 'live'); return f.store }, ziinaFactory: () => f.ziina, readerFactory: () => ({ list: async () => ({ items: [{ id: 'event-1', status: 'confirmed', start: { dateTime: '2026-11-23T10:00:00Z' }, description: `<div><b>Booking reference:</b><br>${reference}</div>` }] }) }) }
  const result = await liveJob.run(options)
  assert.equal(result.paymentRecovered, 1); assert.equal(result.matched, 1); assert.equal(f.records[0].booking_status, 'matched')
  await assert.rejects(liveJob.run({ ...options, env: { ...env, STRATEGY_MODE: 'test' } }))
  await assert.rejects(testJob.run({ ...options, env: { ...env, STRATEGY_AUTO_MATCH_TEST: 'true' } }))
})
test('live scheduled recovery rejects unpaid, wrong-account and wrong-amount attempts', async () => {
  for (const change of [{ status: 'pending' }, { status: 'completed', account_id: 'wrong' }, { status: 'completed', amount: 1 }]) {
    const f = fixture(); await f.store.insert({ booking_reference: reference, payment_environment: 'live' }); await f.ziina.create({}); await f.store.bindIntent('row-1', 'intent-1', 'account-1'); Object.assign(f.intent, change)
    const result = await liveJob.run({ env, now: () => Date.parse('2026-11-22T12:00:00Z'), storeFactory: () => f.store, ziinaFactory: () => f.ziina, readerFactory: () => { throw Error('must not read calendar') } })
    assert.equal(result.paymentRecovered, 0); assert.equal(f.records[0].payment_status, 'pending')
  }
})
test('live matching never assigns a duplicated appointment reference', async () => {
  const f = fixture(); await f.store.insert({ booking_reference: reference, payment_environment: 'live' }); await f.ziina.create({}); await f.store.bindIntent('row-1', 'intent-1', 'account-1'); f.intent.status = 'completed'
  const event = { id: 'event-1', status: 'confirmed', start: { dateTime: '2026-11-23T10:00:00Z' }, description: `Booking reference: ${reference}` }
  const result = await liveJob.run({ env, now: () => Date.parse('2026-11-22T12:00:00Z'), storeFactory: () => f.store, ziinaFactory: () => f.ziina, readerFactory: () => ({ list: async () => ({ items: [event, { ...event, id: 'event-2' }] }) }) })
  assert.equal(result.matched, 0); assert.equal(result.review, 1); assert.equal(f.records[0].booking_status, 'not_booked')
})
test('live adapters scope reads and writes and rotate bounded batches', async () => {
  const calls = []
  const store = createStore({ url: 'https://example.supabase.co', key: 'secret', environment: 'live', fetchImpl: async (url, options) => { calls.push({ url: new URL(url), options }); return { ok: true, json: async () => options.method === 'PATCH' ? [{ id: 'row' }] : [] } } })
  await store.byHash('abc'); await store.pendingLive(); await store.unmatchedLive(); await store.markCompleted({ id: 'row', intentId: 'intent-1', accountId: 'account-1' }); await store.touchLiveAttempt({ id: 'row', intentId: 'intent-1', accountId: 'account-1', paymentStatus: 'completed' })
  for (const call of calls) assert.equal(call.url.searchParams.get('payment_environment'), 'eq.live')
  assert.equal(calls[1].url.searchParams.get('limit'), '10'); assert.equal(calls[2].url.searchParams.get('order'), 'updated_at.asc,id.asc')
  assert.equal(calls[3].url.searchParams.get('ziina_intent_id'), 'eq.intent-1'); assert.equal(calls[4].url.searchParams.get('booking_status'), 'eq.not_booked')
  assert.throws(() => createStore({ url: 'https://example.supabase.co', key: 'secret', environment: 'invalid' }))
})
