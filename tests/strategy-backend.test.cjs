'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const express = require('express')
const { readConfig, strategyRouter, webhookHandler, createSessionTestMatcher } = require('../server/strategy-booking.cjs')
const { createZiina, createStore } = require('../server/strategy-adapters.cjs')

const secret = 'test-secret-'.repeat(4)
const config = { origin: 'https://example.test', account: 'account-123', webhookSecret: secret, calendar: 'https://calendar.google.com/calendar/appointments/schedules/example' }
const env = { STRATEGY_EXPERIMENTAL: 'true', STRATEGY_MODE: 'test', ZIINA_API_KEY: 'test-key', ZIINA_ACCOUNT_ID: 'account-123', ZIINA_WEBHOOK_SECRET: secret, SUPABASE_URL: 'https://myproject.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-server-key', STRATEGY_ORIGIN: 'https://example.test', BOOKING_STRATEGY_EMBED: config.calendar }
function fixtures() {
  let records = [], intent = null, payload = null, failStore = false
  const store = {
    insert: async (data) => { if (failStore) throw Error('private') ; const r = { id: 'record-1', payment_status: 'pending', booking_status: 'not_booked', ...data }; records.push(r); return r },
    byHash: async (hash) => records.find((r) => r.recovery_token_hash === hash) || null,
    byIntent: async (id) => records.find((r) => r.ziina_intent_id === id) || null,
    bindIntent: async (id, pi, account) => { const r = records.find((r) => r.id === id); r.ziina_intent_id = pi; r.ziina_account_id = account; return r },
    markCompleted: async (id) => { const r = records.find((r) => r.id === id); if (!['pending', 'completed'].includes(r.payment_status)) throw Error('needs review'); r.payment_status = 'completed'; return r },
  }
  const ziina = {
    create: async (body) => { payload = body; intent = { id: 'intent-1', account_id: config.account, amount: 120000, currency_code: 'AED', status: 'pending', redirect_url: 'https://pay.ziina.com/pay' }; return intent },
    get: async () => intent,
  }
  return { store, ziina, records, get intent() { return intent }, get payload() { return payload }, failStore() { failStore = true } }
}
async function withServer(f, run, configured = config) {
  const app = express()
  app.use('/api/ziina/webhook', express.raw({ type: 'application/json', limit: '16kb', inflate: false }))
  app.use(express.json({ limit: '16kb' }))
  app.use('/api/strategy', strategyRouter({ config: configured, ...f }))
  app.post('/api/ziina/webhook', webhookHandler({ config: configured, ...f }))
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  try { await run(`http://127.0.0.1:${server.address().port}`) } finally { await new Promise((resolve) => server.close(resolve)) }
}
const checkout = (base, body = { name: 'Sample Client', phone: '+971501234567' }, origin = config.origin, cookie) => fetch(`${base}/api/strategy/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) })
const status = (base, cookie) => fetch(`${base}/api/strategy/status`, { headers: { ...(cookie ? { Cookie: cookie } : {}) } })
function signed(body, key = secret) { return crypto.createHmac('sha256', key).update(body).digest('hex') }

// Only the test mode is ever accepted by this implementation.
test('explicit safe test config required; placeholders, invalid URLs and live mode fail closed', () => {
  assert.ok(readConfig(env))
  for (const change of [{ STRATEGY_EXPERIMENTAL: '' }, { STRATEGY_MODE: 'live' }, { STRATEGY_MODE: '...' }, { ZIINA_API_KEY: '...' }, { ZIINA_API_KEY: '..' }, { ZIINA_WEBHOOK_SECRET: 'short' }, { SUPABASE_URL: 'https://evil.example/' }, { STRATEGY_ORIGIN: 'http://example.test' }, { BOOKING_STRATEGY_EMBED: 'https://evil.example/' }]) assert.equal(readConfig({ ...env, ...change }), null)
})
test('Ziina key supports all private variable names and rejects conflicting keys', () => {
  const byNewName = { ...env, ZIINA_API_KEY: '', ZI_API: 'private-key' }
  const byBossName = { ...env, ZIINA_API_KEY: '', Z_A_KEY: 'private-key' }
  assert.equal(readConfig(byNewName).ziinaKey, 'private-key')
  assert.equal(readConfig(byBossName).ziinaKey, 'private-key')
  assert.equal(readConfig({ ...env, ZI_API: env.ZIINA_API_KEY, Z_A_KEY: env.ZIINA_API_KEY }).ziinaKey, env.ZIINA_API_KEY)
  assert.equal(readConfig({ ...env, ZI_API: 'different-key' }), null)
  assert.equal(readConfig({ ...env, Z_A_KEY: 'different-key' }), null)
  assert.equal(readConfig({ ...env, Z_A_KEY: '..' }), null)
  assert.equal(readConfig({ ...env, ZI_API: '..' }), null)
  assert.equal(readConfig({ ...byNewName, ZI_API: '..' }), null)
})
test('account setting is optional for test, but invalid configured values fail closed', () => {
  assert.equal(readConfig({ ...env, ZIINA_ACCOUNT_ID: '' }).account, null)
  assert.equal(readConfig({ ...env, ZIINA_ACCOUNT_ID: undefined }).account, null)
  assert.equal(readConfig({ ...env, ZIINA_ACCOUNT_ID: '..' }), null)
  assert.equal(readConfig({ ...env, ZIINA_ACCOUNT_ID: 'other' }).account, 'other')
})
test('account returned on creation is bound and checked even without a configured account', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    const response = await checkout(base)
    assert.equal(response.status, 200)
    const cookie = response.headers.get('set-cookie').split(';')[0]
    assert.equal(f.records[0].ziina_account_id, config.account)
    f.intent.status = 'completed'; f.intent.account_id = 'other'
    assert.equal((await status(base, cookie)).status, 503)
    f.intent.account_id = config.account
    assert.equal((await (await status(base, cookie)).json()).status, 'paid')
    f.records[0].ziina_account_id = null
    assert.equal((await status(base, cookie)).status, 503)
  }, { ...config, account: null })
})
test('configured account rejects checkout for another account', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    assert.equal((await checkout(base)).status, 503)
    assert.equal(f.records[0].ziina_intent_id, undefined)
  }, { ...config, account: 'different-account' })
})
test('disabled configuration rejects checkout and webhook before external calls', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    assert.equal((await checkout(base)).status, 503)
    assert.equal((await fetch(`${base}/api/ziina/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503)
    assert.equal(f.records.length, 0)
  }, null)
})
test('test checkout records name and phone and redirects, with a private secure cookie', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    assert.equal((await checkout(base, { name: 'Sample Client', phone: '123' })).status, 400)
    assert.equal((await checkout(base, { name: '', phone: '+971501234567' })).status, 400)
    assert.equal((await checkout(base, { name: 'A'.repeat(121), phone: '+971501234567' })).status, 400)
    assert.equal((await checkout(base, { name: 'Bad\nName', phone: '+971501234567' })).status, 400)
    assert.equal((await checkout(base, undefined, 'https://attacker.test')).status, 403)
    const response = await checkout(base)
    assert.equal(response.status, 200)
    const data = await response.json(), setCookie = response.headers.get('set-cookie')
    assert.deepEqual(data, { ok: true, redirectUrl: 'https://pay.ziina.com/pay' })
    assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /Secure/); assert.match(setCookie, /SameSite=Lax/)
    assert.equal(f.records[0].customer_name, 'Sample Client')
    assert.equal(f.records[0].whatsapp_e164, '+971501234567')
    assert.equal(f.records[0].payment_environment, 'test')
    assert.equal(f.records[0].ziina_intent_id, 'intent-1')
    assert.equal(f.records[0].ziina_account_id, config.account)
    assert.equal(f.payload.test, true); assert.equal(f.payload.amount, 120000); assert.equal(f.payload.currency_code, 'AED')
    assert.equal(JSON.stringify(f.payload).includes('+971501234567'), false)
    assert.equal((await checkout(base, undefined, config.origin, setCookie.split(';')[0])).status, 409)
  })
})
test('checkout rejects a provider redirect outside Ziina and does not expose it', async () => {
  const f = fixtures()
  const original = f.ziina.create
  f.ziina.create = async (body) => ({ ...await original(body), redirect_url: 'https://ziina.com.attacker.test/pay' })
  await withServer(f, async (base) => {
    const response = await checkout(base)
    assert.equal(response.status, 503)
    assert.equal((await response.json()).redirectUrl, undefined)
    assert.equal(f.records[0].ziina_intent_id, undefined)
  })
})
test('checkout rejects an intent without a valid account before exposing redirect', async () => {
  const f = fixtures(); const original = f.ziina.create
  f.ziina.create = async (body) => ({ ...await original(body), account_id: '' })
  await withServer(f, async (base) => {
    assert.equal((await checkout(base)).status, 503)
    assert.equal(f.records[0].ziina_intent_id, undefined)
  }, { ...config, account: null })
})
test('database failure stops checkout before any payment intent is created', async () => {
  const f = fixtures(); f.failStore()
  await withServer(f, async (base) => {
    const response = await checkout(base)
    assert.equal(response.status, 503)
    assert.equal(f.payload, null)
    assert.equal(response.headers.get('set-cookie'), null)
  })
})
test('only an authenticated session and a fresh verified completed payment unlock calendar', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    assert.equal((await status(base)).status, 401)
    let data = await (await status(base, cookie)).json(); assert.deepEqual(data, { ok: true, status: 'pending', providerStatus: 'pending' })
    for (const providerStatus of ['requires_payment_instrument', 'requires_user_action', 'failed']) {
      f.intent.status = providerStatus; f.intent.latest_error = { message: 'private provider error' }
      data = await (await status(base, cookie)).json()
      assert.deepEqual(data, { ok: true, status: 'pending', providerStatus })
      assert.equal(JSON.stringify(data).includes('private provider error'), false)
    }
    f.intent.status = 'private-provider-value'
    data = await (await status(base, cookie)).json(); assert.deepEqual(data, { ok: true, status: 'pending', providerStatus: 'other' })
    f.intent.status = 'completed'; f.intent.amount = 1
    let mismatch = await status(base, cookie); data = await mismatch.json(); assert.equal(mismatch.status, 503); assert.equal(data.calendar, undefined)
    f.intent.amount = 120000; f.intent.account_id = 'other'
    mismatch = await status(base, cookie); data = await mismatch.json(); assert.equal(mismatch.status, 503); assert.equal(data.calendar, undefined)
    f.intent.account_id = config.account
    const verified = await status(base, cookie); data = await verified.json()
    assert.equal(data.status, 'paid'); assert.equal(data.calendar, config.calendar); assert.match(data.reference, /^[a-f0-9]{32}$/)
    assert.equal(verified.headers.get('cache-control'), 'no-store')
    assert.equal(f.records[0].payment_status, 'completed')
    f.records[0].payment_status = 'refunded'
    data = await (await status(base, cookie)).json(); assert.deepEqual(data, { ok: true, status: 'needs_review' })
  })
})
test('test matcher initializes calendar lazily, requires test mode and no extra flag', async () => {
  let readerCalls = 0, parameters
  const options = { env: { STRATEGY_EXPERIMENTAL: 'true', STRATEGY_MODE: 'test' }, config, store: {}, readerFactory: () => { readerCalls++; return {} }, match: async (args) => { parameters = args; return { matched: 0 } }, now: () => Date.parse('2026-11-15T00:00:00Z') }
  const matcher = createSessionTestMatcher(options)
  assert.equal(readerCalls, 0)
  await matcher('0123456789abcdef0123456789abcdef')
  assert.equal(readerCalls, 1)
  assert.equal(parameters.onlyReference, '0123456789abcdef0123456789abcdef')
  assert.equal(parameters.timeMin, '2026-11-08T00:00:00.000Z')
  assert.equal(parameters.timeMax, '2027-02-13T00:00:00.000Z')
  assert.equal(createSessionTestMatcher({ ...options, env: { ...options.env, STRATEGY_MODE: 'live' } }), null)
  assert.equal(createSessionTestMatcher({ ...options, config: null }), null)
  const broken = createSessionTestMatcher({ ...options, readerFactory: () => { throw Error('missing config') } })
  assert.throws(() => broken('0123456789abcdef0123456789abcdef'), /missing config/)
})
test('test booking match requires a verified paid session and checks only its reference', async () => {
  const f = fixtures(); let checked = []
  f.matchTestBooking = async (reference) => { checked.push(reference); return { matched: 1, ambiguous: 0, errors: 0 } }
  const check = (base, cookie, origin = config.origin) => fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST', headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}) } })
  await withServer(f, async (base) => {
    assert.equal((await check(base)).status, 401)
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    assert.equal((await check(base, cookie, 'https://evil.test')).status, 403)
    assert.equal((await check(base, cookie)).status, 409)
    f.intent.status = 'completed'; await status(base, cookie)
    f.intent.account_id = 'other'; assert.equal((await check(base, cookie)).status, 409)
    f.intent.account_id = config.account
    assert.deepEqual(await (await check(base, cookie)).json(), { ok: true, status: 'matched' })
    assert.deepEqual(checked, [f.records[0].booking_reference])
    f.records[0].payment_environment = 'live'; assert.equal((await check(base, cookie)).status, 409)
    f.records[0].payment_environment = 'test'; f.records[0].payment_status = 'refund_review'; assert.equal((await check(base, cookie)).status, 409)
  })
})
test('test matching disabled or ambiguous does not claim a booking', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    assert.equal((await fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST' })).status, 503)
  })
  const f2 = fixtures(); f2.matchTestBooking = async () => ({ matched: 0, ambiguous: 1, errors: 0 })
  await withServer(f2, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f2.intent.status = 'completed'; await status(base, cookie)
    const r = await fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST', headers: { Origin: config.origin, Cookie: cookie } })
    assert.deepEqual(await r.json(), { ok: true, status: 'needs_review' })
  })
})
test('integrated paid test session matches a fake Google event to the original row', async () => {
  const { matchPaidTestBookings } = require('../server/strategy-matching.cjs')
  const f = fixtures(); const date = '2026-11-15T10:00:00Z'
  f.store.byPaidTestReference = async (ref) => f.records.find((r) => r.booking_reference === ref && r.payment_environment === 'test' && r.payment_status === 'completed') || null
  f.store.matchPaidTestBooking = async ({ id, reference, eventId, startsAt }) => {
    const row = f.records.find((r) => r.id === id && r.booking_reference === reference && r.payment_status === 'completed' && r.payment_environment === 'test' && r.booking_status === 'not_booked')
    if (!row) return false
    Object.assign(row, { google_event_id: eventId, booking_starts_at: startsAt, booking_status: 'matched' }); return true
  }
  f.matchTestBooking = (reference) => matchPaidTestBookings({ store: f.store, reader: { list: async () => ({ items: [{ id: 'event-123', status: 'confirmed', start: { dateTime: date }, description: `<div><b>Booking reference:</b><br>${reference}</div>` }] }) }, timeMin: '2026-11-15T00:00:00Z', timeMax: '2026-11-16T00:00:00Z', onlyReference: reference })
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'completed'; await status(base, cookie)
    const matched = await fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST', headers: { Origin: config.origin, Cookie: cookie } })
    assert.equal((await matched.json()).status, 'matched')
    assert.equal(f.records.length, 1); assert.equal(f.records[0].id, 'record-1'); assert.equal(f.records[0].booking_status, 'matched')
    assert.equal(f.records[0].customer_name, 'Sample Client'); assert.equal(f.records[0].whatsapp_e164, '+971501234567')
  })
})
test('test diagnostic reports only reference and attendee-email presence', async () => {
  const f = fixtures()
  f.matchTestBooking = async () => ({ matched: 0, ambiguous: 0, errors: 0, diagnostic: { referenceEvents: 1, attendeeEmailEvents: 1 } })
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'completed'; await status(base, cookie)
    const r = await fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST', headers: { Origin: config.origin, Cookie: cookie } })
    assert.deepEqual(await r.json(), { ok: true, status: 'reference_found_unmatched', emailAvailable: true, inDescription: false, inExtendedProperties: false, hasHtml: false, hasLabel: false, layout: 'not_visible', reason: 'format_not_recognized' })
  })
})
test('test diagnostic distinguishes a guarded row conflict from an unrecognized format', async () => {
  const f = fixtures()
  f.matchTestBooking = async () => ({ matched: 0, unchanged: 1, ambiguous: 0, errors: 0, diagnostic: { referenceEvents: 1, attendeeEmailEvents: 0 } })
  await withServer(f, async (base) => {
    const response = await checkout(base), cookie = response.headers.get('set-cookie').split(';')[0]
    f.intent.status = 'completed'; await status(base, cookie)
    const r = await fetch(`${base}/api/strategy/match-test-booking`, { method: 'POST', headers: { Origin: config.origin, Cookie: cookie } })
    const result = await r.json()
    assert.equal(result.status, 'reference_found_unmatched')
    assert.equal(result.reason, 'record_changed')
  })
})
test('signed webhooks use raw bytes, independently verify intent and are safe on repeats', async () => {
  const f = fixtures()
  await withServer(f, async (base) => {
    await checkout(base)
    const data = JSON.stringify({ event: 'payment_intent.status.updated', data: { id: 'intent-1', status: 'completed' } })
    const send = (body, signature) => fetch(`${base}/api/ziina/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hmac-Signature': signature }, body })
    assert.equal((await send(data, signed(data, 'wrong-secret'))).status, 401)
    assert.equal((await send(data + ' ', signed(data))).status, 401)
    assert.equal((await send('null', signed('null'))).status, 400)
    assert.equal((await send(data, signed(data))).status, 200)
    assert.equal(f.records[0].payment_status, 'pending') // forged completed event isn't enough
    f.intent.status = 'completed'
    assert.equal((await send(data, signed(data))).status, 200)
    assert.equal((await send(data, signed(data))).status, 200)
    assert.equal(f.records[0].payment_status, 'completed')
    f.records[0].payment_status = 'refunded'
    assert.equal((await send(data, signed(data))).status, 503)
    assert.equal(f.records[0].payment_status, 'refunded')
    const refund = JSON.stringify({ event: 'refund.status.updated', data: { id: 'intent-1' } })
    assert.equal((await send(refund, signed(refund))).status, 503)
  })
})
test('provider adapters use fixed URLs and server credentials, without exposing raw errors', async () => {
  let calls = []
  const mock = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => url.includes('payment_intent') ? { id: 'intent-1' } : [{ id: 'db-1' }] } }
  const ziina = createZiina({ key: 'test-key', fetchImpl: mock }), store = createStore({ url: 'https://myproject.supabase.co', key: 'service-key', fetchImpl: mock })
  await ziina.create({ test: true }); await ziina.get('intent-1'); await store.insert({ payment_environment: 'test' }); await store.byIntent('intent-1')
  assert.equal(calls.length, 4); assert.ok(calls[0].url.startsWith('https://api-v2.ziina.com/api/')); assert.equal(calls[0].options.headers.Authorization, 'Bearer test-key'); assert.ok(calls[2].url.startsWith('https://myproject.supabase.co/rest/v1/')); assert.equal(calls[2].options.headers.Authorization, 'Bearer service-key')
  await store.bindIntent('db-1', 'intent-1', 'account-123')
  assert.equal(JSON.parse(calls[4].options.body).ziina_account_id, 'account-123')
})
