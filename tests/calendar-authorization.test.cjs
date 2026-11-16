'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { SCOPE, challengeFor, authorizationUrl, callbackResult, exchange, checkCalendar } = require('../scripts/authorize-calendar.cjs')

test('authorization uses read-only scope, PKCE and offline access', () => {
  const url = new URL(authorizationUrl({ clientId: 'client', redirectUri: 'http://127.0.0.1:1234/oauth2callback', state: 'expected', verifier: 'verifier' }))
  assert.equal(url.origin, 'https://accounts.google.com')
  assert.equal(url.searchParams.get('scope'), SCOPE)
  assert.equal(url.searchParams.get('state'), 'expected')
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  assert.equal(url.searchParams.get('code_challenge'), challengeFor('verifier'))
  assert.equal(url.searchParams.get('access_type'), 'offline')
})

test('callback rejects incorrect state, path and duplicate codes', () => {
  assert.equal(callbackResult('/oauth2callback?state=wrong&code=x', 'expected'), null)
  assert.equal(callbackResult('/wrong?state=expected&code=x', 'expected'), null)
  assert.equal(callbackResult('/oauth2callback?state=expected&code=x&code=y', 'expected'), null)
  assert.deepEqual(callbackResult('/oauth2callback?state=expected&code=x', 'expected'), { code: 'x' })
  assert.deepEqual(callbackResult('/oauth2callback?state=expected&error=access_denied', 'expected'), { error: true })
})

test('token exchange includes verifier and requires a refresh token', async () => {
  const options = { code: 'code', clientId: 'id', clientSecret: 'secret', redirectUri: 'http://127.0.0.1:9999/oauth2callback', verifier: 'verifier' }
  const fetchImpl = async (url, request) => {
    assert.equal(url, 'https://oauth2.googleapis.com/token')
    assert.equal(request.body.get('code_verifier'), 'verifier')
    return { ok: true, json: async () => ({ access_token: 'access', refresh_token: 'refresh' }) }
  }
  assert.equal((await exchange({ ...options, fetchImpl })).refresh_token, 'refresh')
  await assert.rejects(exchange({ ...options, fetchImpl: async () => ({ ok: true, json: async () => ({ access_token: 'access' }) }) }), /refresh token/)
})

test('calendar access checks the specified calendar without exposing events', async () => {
  let requested
  await checkCalendar({ accessToken: 'token', calendarId: 'name@example.com', fetchImpl: async (url, request) => {
    requested = url.toString()
    assert.equal(request.headers.Authorization, 'Bearer token')
    return { ok: true, json: async () => ({ items: [{ summary: 'private' }] }) }
  } })
  assert.match(requested, /name%40example\.com\/events/)
  await assert.rejects(checkCalendar({ accessToken: 'token', calendarId: 'primary', fetchImpl: async () => ({ ok: false }) }), /did not allow/)
})
