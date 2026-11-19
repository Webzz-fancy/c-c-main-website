'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { bookingReferences, matchPaidTestBookings } = require('../server/strategy-matching.cjs')
const { createStore } = require('../server/strategy-adapters.cjs')
const ref = '0123456789abcdef0123456789abcdef'
const other = 'abcdef0123456789abcdef0123456789'
const window = { timeMin: '2026-11-01T00:00:00Z', timeMax: '2026-11-02T00:00:00Z' }
const event = (id, reference = ref) => ({ id, status: 'confirmed', start: { dateTime: '2026-11-01T09:30:00Z' }, description: `Appointment\nBooking reference: ${reference}\nThank you` })
function fixture(events, overrides = {}) {
  const row = { id: 'row-1', customer_name: 'Test Client', whatsapp_e164: '+971501234567', booking_reference: ref, payment_environment: 'test', payment_status: 'completed', booking_status: 'not_booked', google_event_id: null, ...overrides }
  const store = {
    byPaidTestReference: async (r) => r === row.booking_reference ? { ...row } : null,
    matchPaidTestBooking: async ({ id, reference, eventId, startsAt }) => {
      if (id !== row.id || reference !== row.booking_reference || row.payment_environment !== 'test' || row.payment_status !== 'completed' || row.booking_status !== 'not_booked' || row.google_event_id) return false
      Object.assign(row, { booking_status: 'matched', google_event_id: eventId, booking_starts_at: startsAt })
      return true
    },
  }
  return { row, store, reader: { list: async () => ({ items: events }) } }
}

test('only labelled standalone booking references are considered', () => {
  assert.deepEqual(bookingReferences(event('event1').description), [ref])
  assert.deepEqual(bookingReferences(`Booking reference: ${ref}x`), [])
  assert.deepEqual(bookingReferences(`Unrelated: ${ref}`), [])
  assert.deepEqual(bookingReferences(`Booking reference: ${ref}\nBooking reference: ${other}`), [ref, other])
})

test('confirmed test event updates the same paid row, preserving name and WhatsApp', async () => {
  const f = fixture([event('google-event-1')])
  const result = await matchPaidTestBookings({ ...f, ...window })
  assert.deepEqual(result, { matched: 1, unchanged: 0, ambiguous: 0, errors: 0 })
  assert.equal(f.row.id, 'row-1')
  assert.equal(f.row.customer_name, 'Test Client')
  assert.equal(f.row.whatsapp_e164, '+971501234567')
  assert.equal(f.row.booking_status, 'matched')
  assert.equal(f.row.google_event_id, 'google-event-1')
  assert.equal(f.row.booking_starts_at, '2026-11-01T09:30:00Z')
  assert.equal((await matchPaidTestBookings({ ...f, ...window })).matched, 0)
})

test('no update for unpaid, live, cancelled, ambiguous or missing matches', async () => {
  for (const [events, row] of [
    [[event('e1')], { payment_status: 'pending' }],
    [[event('e1')], { payment_environment: 'live' }],
    [[{ ...event('e1'), status: 'cancelled' }], {}],
    [[event('e1'), event('e2')], {}],
    [[event('e1', other)], {}],
    [[{ ...event('e1'), description: `Booking reference: ${ref}\nBooking reference: ${other}` }, event('e2')], {}],
  ]) {
    const f = fixture(events, row)
    assert.equal((await matchPaidTestBookings({ ...f, ...window })).matched, 0)
    assert.equal(f.row.booking_status, 'not_booked')
  }
})

test('reads all pages before any write; errors fail safely', async () => {
  const f = fixture([])
  let calls = 0
  f.reader.list = async () => { calls++; return { items: [event('same')], nextPageToken: calls === 1 ? 'next' : null } }
  await assert.rejects(matchPaidTestBookings({ ...f, ...window }), /Duplicate event/)
  assert.equal(f.row.booking_status, 'not_booked')
  const f2 = fixture([event('e1')]); f2.store.matchPaidTestBooking = async () => { throw new Error('private provider error') }
  assert.deepEqual(await matchPaidTestBookings({ ...f2, ...window }), { matched: 0, unchanged: 0, ambiguous: 0, errors: 1 })
})

test('session-targeted matching never updates other paid test references', async () => {
  const f = fixture([event('event-other', other), event('event-target', ref)])
  const lookedUp = []
  const original = f.store.byPaidTestReference
  f.store.byPaidTestReference = async (reference) => { lookedUp.push(reference); return original(reference) }
  const result = await matchPaidTestBookings({ ...f, ...window, onlyReference: ref })
  assert.equal(result.matched, 1)
  assert.deepEqual(lookedUp, [ref])
  assert.equal(f.row.google_event_id, 'event-target')
  await assert.rejects(matchPaidTestBookings({ ...f, ...window, onlyReference: 'bad' }), /Invalid test reference/)
})
test('session-targeted matching detects duplicate and multi-reference events without writing', async () => {
  for (const events of [[event('e1'), event('e2')], [{ ...event('e1'), description: `Booking reference: ${ref}\nBooking reference: ${other}` }, event('e2')]]) {
    const f = fixture(events)
    const result = await matchPaidTestBookings({ ...f, ...window, onlyReference: ref })
    assert.ok(result.ambiguous > 0)
    assert.equal(f.row.booking_status, 'not_booked')
  }
  const unrelated = fixture([{ ...event('e1'), description: `Booking reference: ${other}\nBooking reference: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` }, event('e2')])
  assert.equal((await matchPaidTestBookings({ ...unrelated, ...window, onlyReference: ref })).matched, 1)
})
test('database update includes test-only, paid, unmatched compare-and-set conditions', async () => {
  let req
  const store = createStore({ url: 'https://test.supabase.co', key: 'secret', fetchImpl: async (url, opts) => { req = { url: new URL(url), opts }; return { ok: true, json: async () => [{ id: 'row-1' }] } } })
  assert.equal(await store.matchPaidTestBooking({ id: 'row-1', reference: ref, eventId: 'event1', startsAt: '2026-11-01T09:30:00Z' }), true)
  assert.equal(req.url.searchParams.get('id'), 'eq.row-1')
  assert.equal(req.url.searchParams.get('booking_reference'), `eq.${ref}`)
  assert.equal(req.url.searchParams.get('payment_environment'), 'eq.test')
  assert.equal(req.url.searchParams.get('payment_status'), 'eq.completed')
  assert.equal(req.url.searchParams.get('booking_status'), 'eq.not_booked')
  assert.equal(req.url.searchParams.get('google_event_id'), 'is.null')
  assert.deepEqual(Object.keys(JSON.parse(req.opts.body)).sort(), ['booking_starts_at', 'booking_status', 'google_event_id', 'updated_at'])
})
