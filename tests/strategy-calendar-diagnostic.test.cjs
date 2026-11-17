'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { inspectEvent, inspectCalendar } = require('../scripts/check-strategy-calendar.cjs')
const ref = '0123456789abcdef0123456789abcdef'
const range = { timeMin: '2026-11-01T00:00:00Z', timeMax: '2026-11-02T00:00:00Z', reference: ref }

test('diagnostic locates only standalone test references without returning private content', () => {
  const event = { description: `Booking reference: ${ref}\nPrivate customer details`, status: 'confirmed', start: { dateTime: '2026-11-01T09:00:00Z' }, attendees: [{ email: 'private@example.test' }] }
  assert.deepEqual(inspectEvent(event, ref), { fields: ['description'], hasAttendeeEmail: true, hasStartTime: true, status: 'confirmed' })
  assert.equal(inspectEvent({ description: `x${ref}z` }, ref), null)
  assert.equal(inspectEvent({ description: ref }, 'bad'), null)
  assert.equal(inspectEvent({ summary: ref }, ref), null)
})

test('diagnostic scans pages and reports ambiguity; it does not update records', async () => {
  let calls = 0
  const reader = { list: async () => { calls++; return calls === 1 ? { items: [{ description: ref }], nextPageToken: 'next' } : { items: [{ extendedProperties: { private: { answer: ref } } }] } } }
  const result = await inspectCalendar({ reader, ...range })
  assert.equal(calls, 2)
  assert.equal(result.matchCount, 2)
  assert.deepEqual(result.matches.map((m) => m.fields), [['description'], ['extendedProperties.private']])
  await assert.rejects(inspectCalendar({ reader, ...range, timeMax: '2027-01-01T00:00:00Z' }), /31 days/)
  await assert.rejects(inspectCalendar({ reader: { list: async () => ({ items: [], nextPageToken: 'loop' }) }, ...range, maxPages: 2 }), /Too many/)
})
