'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createCalendarReaderFromEnv } = require('../server/strategy-calendar.cjs')

test('calendar settings are mapped without starting requests, and incomplete config fails', async () => {
  const env = { GOOGLE_CALENDAR_CLIENT_ID: 'id', GOOGLE_CALENDAR_CLIENT_SECRET: 'secret', GOOGLE_CALENDAR_REFRESH_TOKEN: 'refresh', GOOGLE_CALENDAR_ID: 'calendar@example.test' }
  const calls = []
  const fetchImpl = async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => calls.length === 1 ? { access_token: 'access' } : { items: [] } }
  }
  const reader = createCalendarReaderFromEnv(env, fetchImpl)
  assert.equal(calls.length, 0)
  await reader.list({ timeMin: '2026-11-01T00:00:00Z', timeMax: '2026-11-02T00:00:00Z' })
  const params = new URLSearchParams(calls[0].options.body)
  assert.equal(params.get('client_id'), 'id')
  assert.equal(params.get('client_secret'), 'secret')
  assert.equal(params.get('refresh_token'), 'refresh')
  assert.match(calls[1].url, /calendar%40example\.test\/events/)
  assert.throws(() => createCalendarReaderFromEnv({ ...env, GOOGLE_CALENDAR_REFRESH_TOKEN: '' }), /configuration missing/)
})
