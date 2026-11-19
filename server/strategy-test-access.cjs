'use strict'

// Explicit, temporary team-only access for the test integration. This is not
// a customer account system and must never be used for live payments.
const crypto = require('node:crypto')
const express = require('express')
const NAME = '__Host-strategy_test_access'
const MAX_AGE = 60 * 60
const digest = (value) => crypto.createHash('sha256').update(value).digest()

function createTestAccess({ config, password, rateLimited = () => false, now = () => Date.now() }) {
  const router = express.Router()
  const enabled = !!config && typeof password === 'string' && password.length >= 32 && password.length <= 256 && !/^\.+$/.test(password) && password.trim() === password
  const sign = (payload) => crypto.createHmac('sha256', password).update(`strategy-test:${payload}`).digest('hex')
  const validCookie = (req) => {
    if (!enabled) return false
    const parts = (req.get('cookie') || '').split(';').map((s) => s.trim()).filter((s) => s.startsWith(`${NAME}=`))
    if (parts.length !== 1) return false
    const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(parts[0].slice(NAME.length + 1))
    if (!match) return false
    const expiry = Number(match[1]), current = Math.floor(now() / 1000)
    if (expiry <= current || expiry > current + MAX_AGE) return false
    return crypto.timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(sign(match[1]), 'hex'))
  }
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex, nofollow'); next() })
  router.post('/login', (req, res) => {
    if (!enabled) return res.status(503).json({ ok: false, error: 'Test access is unavailable' })
    if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many attempts' })
    if (req.get('origin') !== config.origin) return res.status(403).json({ ok: false, error: 'Invalid origin' })
    const supplied = req.body?.password
    if (typeof supplied !== 'string' || supplied.length > 256 || !crypto.timingSafeEqual(digest(supplied), digest(password))) return res.status(401).json({ ok: false, error: 'Incorrect test password' })
    const expiry = String(Math.floor(now() / 1000) + MAX_AGE)
    res.cookie(NAME, `${expiry}.${sign(expiry)}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE * 1000 })
    return res.json({ ok: true })
  })
  router.get('/session', (req, res) => res.status(validCookie(req) ? 200 : 401).json({ ok: validCookie(req) }))
  const requireAccess = (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    if (!enabled) return res.status(503).json({ ok: false, error: 'Test access is unavailable' })
    if (!validCookie(req)) return res.status(401).json({ ok: false, error: 'Test access required' })
    next()
  }
  return { router, requireAccess }
}

module.exports = { createTestAccess }
