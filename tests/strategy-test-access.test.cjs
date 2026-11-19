'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')
const { createTestAccess } = require('../server/strategy-test-access.cjs')
const config = { origin: 'https://example.test' }
const password = 'a-long-unique-test-password-123456789'
async function withServer(options, run) {
  const app = express(); app.use(express.json())
  const access = createTestAccess(options)
  app.use('/access', access.router)
  app.use('/protected', access.requireAccess, (_req, res) => res.json({ ok: true }))
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  try { await run(`http://127.0.0.1:${server.address().port}`) } finally { await new Promise((resolve) => server.close(resolve)) }
}
const login = (base, pass = password, origin = config.origin) => fetch(`${base}/access/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ password: pass }) })
const get = (url, cookie) => fetch(url, { headers: cookie ? { Cookie: cookie } : {} })

test('test access fails closed for missing configuration, short password, or live mode disabled upstream', async () => {
  for (const options of [{ config, password: 'short' }, { config: null, password }, { config, password: undefined }]) {
    await withServer(options, async (base) => {
      assert.equal((await login(base)).status, 503)
      assert.equal((await get(`${base}/protected`)).status, 503)
    })
  }
})
test('only a valid test login unlocks strategy requests, with secure expiring cookie', async () => {
  let current = 1760000000000
  await withServer({ config, password, now: () => current }, async (base) => {
    assert.equal((await get(`${base}/protected`)).status, 401)
    assert.equal((await login(base, 'wrong')).status, 401)
    assert.equal((await login(base, password, 'https://evil.test')).status, 403)
    const response = await login(base); assert.equal(response.status, 200)
    const cookie = response.headers.get('set-cookie'); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/)
    const value = cookie.split(';')[0]
    assert.equal((await get(`${base}/access/session`, value)).status, 200)
    assert.equal((await get(`${base}/protected`, value)).status, 200)
    assert.equal((await get(`${base}/protected`, value + 'f')).status, 401)
    assert.equal((await get(`${base}/protected`, `${value}; ${value}`)).status, 401)
    current += 3600001
    assert.equal((await get(`${base}/protected`, value)).status, 401)
  })
})
test('login rate limiting is applied before checking password', async () => {
  await withServer({ config, password, rateLimited: () => true }, async (base) => assert.equal((await login(base)).status, 429))
})
