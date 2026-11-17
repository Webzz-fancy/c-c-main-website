'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createCalendarReader } = require('../server/strategy-calendar.cjs')
const args = { clientId: 'test-id', clientSecret: 'test-secret', refreshToken: 'test-refresh', calendarId: 'paid@example.test' }
const range = { timeMin: '2026-11-01T00:00:00Z', timeMax: '2026-12-01T00:00:00Z' }

test('calendar adapter refreshes credentials and reads the selected calendar only', async () => {
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => calls.length === 1 ? { access_token: 'temporary-token' } : { items: [{ id: 'event-1' }], nextPageToken: 'next-page' } }
  }
  const result = await createCalendarReader({ ...args, fetchImpl }).list(range)
  assert.deepEqual(result, { items: [{ id: 'event-1' }], nextPageToken: 'next-page' })
  assert.equal(calls[0].url, 'https://oauth2.googleapis.com/token')
  assert.ok(calls[1].url.startsWith('https://www.googleapis.com/calendar/v3/calendars/paid%40example.test/events?'))
  assert.equal(calls[1].options.headers.Authorization, 'Bearer temporary-token')
  assert.equal(calls[1].options.redirect, 'error')
  assert.ok(!calls[1].url.includes('test-refresh'))
})
test('calendar adapter rejects invalid input and sanitizes provider failures', async () => {
  assert.throws(() => createCalendarReader({ ...args, refreshToken: '...' }))
  let calls = 0
  const reader = createCalendarReader({ ...args, fetchImpl: async () => { calls++; return { ok: false } } })
  await assert.rejects(() => reader.list({ timeMin: 'bad', timeMax: 'bad' }), /Valid calendar time range/)
  assert.equal(calls, 0)
  await assert.rejects(() => reader.list(range), /Calendar authorization failed/)
})
