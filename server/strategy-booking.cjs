'use strict'

const express = require('express')
const { AMOUNT, CURRENCY, validPhone, newReference, newRecoveryToken, hashRecoveryToken, verifyWebhook, completedPayment } = require('./strategy-safety.cjs')
const { createZiina, createStore } = require('./strategy-adapters.cjs')

const COOKIE = '__Host-strategy_session'
const TOKEN = /^[A-Za-z0-9_-]{43}$/
const ID = /^[A-Za-z0-9-]{1,100}$/
const present = (s) => typeof s === 'string' && s.trim().length > 0 && !/^\.+$/.test(s.trim()) && !['placeholder', 'changeme'].includes(s.trim().toLowerCase())
function safeUrl(value, hostPattern, pathPattern = /^\//) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && hostPattern.test(url.hostname) && pathPattern.test(url.pathname)
  } catch { return false }
}

// Live payments are intentionally unavailable until a real integration review.
function readConfig(env) {
  if (env.STRATEGY_EXPERIMENTAL !== 'true' || env.STRATEGY_MODE !== 'test') return null
  // Accept the existing Hostinger name or the original documented name. If
  // both are set differently, fail closed rather than choosing an account.
  const ziinaKeys = [env.ZI_API, env.ZIINA_API_KEY].filter((value) => typeof value === 'string' && value.trim() !== '')
  if (!ziinaKeys.length || !ziinaKeys.every(present) || new Set(ziinaKeys).size !== 1) return null
  const keys = ['ZIINA_ACCOUNT_ID', 'ZIINA_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRATEGY_ORIGIN', 'BOOKING_STRATEGY_EMBED']
  if (!keys.every((key) => present(env[key]))) return null
  if (env.ZIINA_WEBHOOK_SECRET.length < 32 || !ID.test(env.ZIINA_ACCOUNT_ID)) return null
  if (!safeUrl(env.SUPABASE_URL, /^[a-z0-9-]+\.supabase\.co$/)) return null
  const supabaseUrl = new URL(env.SUPABASE_URL)
  if (supabaseUrl.pathname !== '/' || supabaseUrl.search || supabaseUrl.hash) return null
  if (!safeUrl(env.BOOKING_STRATEGY_EMBED, /^calendar\.google\.com$/, /^\/calendar\/appointments\/schedules\//)) return null
  try {
    const url = new URL(env.STRATEGY_ORIGIN)
    if (url.protocol !== 'https:' || url.origin !== env.STRATEGY_ORIGIN || url.username || url.password) return null
  } catch { return null }
  return { ziinaKey: ziinaKeys[0], account: env.ZIINA_ACCOUNT_ID, webhookSecret: env.ZIINA_WEBHOOK_SECRET, supabaseUrl: env.SUPABASE_URL.replace(/\/$/, ''), supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY, origin: env.STRATEGY_ORIGIN, calendar: env.BOOKING_STRATEGY_EMBED }
}

function sessionFrom(req) {
  const cookie = req.get('cookie') || ''
  const items = cookie.split(';').map((x) => x.trim()).filter((x) => x.startsWith(`${COOKIE}=`))
  if (items.length !== 1) return null
  const token = items[0].slice(COOKIE.length + 1)
  return TOKEN.test(token) ? token : null
}
function validIntentCreation(intent, cfg) {
  if (!intent || typeof intent.id !== 'string' || !ID.test(intent.id) || intent.account_id !== cfg.account || intent.amount !== AMOUNT || intent.currency_code !== CURRENCY) return false
  try {
    const url = new URL(intent.redirect_url)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (url.hostname === 'ziina.com' || url.hostname.endsWith('.ziina.com'))
  } catch { return false }
}
function matchesStoredIntent(intent, record, cfg) {
  return !!intent && intent.id === record.ziina_intent_id && intent.account_id === cfg.account && intent.amount === AMOUNT && intent.currency_code === CURRENCY
}

// Dependency injection lets tests exercise the real HTTP routes without keys.
function strategyRouter({ config, store, ziina, rateLimited = () => false }) {
  const router = express.Router()
  router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); if (!config) return res.status(503).json({ ok: false, error: 'Strategy checkout is not available' }); next() })
  router.post('/checkout', async (req, res) => {
    if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })
    if (req.get('origin') !== config.origin) return res.status(403).json({ ok: false, error: 'Invalid origin' })
    const phone = req.body && req.body.phone
    const name = req.body && typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!name || name.length > 120 || /[\p{Cc}]/u.test(name)) return res.status(400).json({ ok: false, error: 'Enter your name' })
    if (!validPhone(phone)) return res.status(400).json({ ok: false, error: 'Enter a WhatsApp number with country code' })
    // Do not silently replace an existing session: a previous payment may
    // still be completing. Support must help if a visitor lost access.
    if (sessionFrom(req)) return res.status(409).json({ ok: false, error: 'An existing checkout is in progress. Check its status or contact us.' })
    const token = newRecoveryToken()
    try {
      const record = await store.insert({ booking_reference: newReference(), recovery_token_hash: hashRecoveryToken(token), customer_name: name, whatsapp_e164: phone, payment_environment: 'test' })
      if (!record || !record.id) throw new Error('database insert failed')
      // Set cookie as soon as the attempt is saved, so an interrupted response
      // cannot silently erase the visitor's only session.
      res.cookie(COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 })
      const intent = await ziina.create({ amount: AMOUNT, currency_code: CURRENCY, message: 'Strategic Consultation', success_url: `${config.origin}/?booking=paid`, cancel_url: `${config.origin}/?booking=cancelled`, failure_url: `${config.origin}/?booking=cancelled`, test: true, allow_tips: false })
      if (!validIntentCreation(intent, config)) throw new Error('invalid payment intent')
      await store.bindIntent(record.id, intent.id)
      return res.json({ ok: true, redirectUrl: intent.redirect_url })
    } catch {
      // Never log provider error bodies, tokens or customer details.
      console.error('[strategy] Checkout could not be created; review saved attempt')
      return res.status(503).json({ ok: false, error: 'Could not start checkout. Please contact us before trying again.' })
    }
  })
  router.get('/status', async (req, res) => {
    if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })
    const token = sessionFrom(req)
    if (!token) return res.status(401).json({ ok: false, error: 'No booking session. Please contact us for help.' })
    try {
      const record = await store.byHash(hashRecoveryToken(token))
      if (!record) return res.status(404).json({ ok: false, error: 'Booking not found. Please contact us.' })
      if (record.payment_status === 'refunded' || record.payment_status === 'refund_review') return res.json({ ok: true, status: 'needs_review' })
      if (!record.ziina_intent_id) return res.json({ ok: true, status: 'needs_review' })
      const intent = await ziina.get(record.ziina_intent_id)
      if (!matchesStoredIntent(intent, record, config)) throw new Error('payment needs review')
      if (!completedPayment(intent, record, config.account)) return res.json({ ok: true, status: 'pending' })
      await store.markCompleted(record.id)
      return res.json({ ok: true, status: 'paid', reference: record.booking_reference, calendar: config.calendar })
    } catch {
      console.error('[strategy] Could not check payment; review saved attempt')
      return res.status(503).json({ ok: false, error: 'Payment could not be checked. Please contact us before paying again.' })
    }
  })
  return router
}

function webhookHandler({ config, store, ziina }) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store')
    if (!config) return res.status(503).end()
    if (!verifyWebhook(req.body, req.get('X-Hmac-Signature'), config.webhookSecret)) return res.status(401).end()
    let event
    try { event = JSON.parse(req.body.toString('utf8')) } catch { return res.status(400).end() }
    if (!event || typeof event !== 'object' || Array.isArray(event)) return res.status(400).end()
    if (event.event !== 'payment_intent.status.updated') return res.status(503).end() // Do not silently discard refunds.
    const id = event?.data?.id
    if (typeof id !== 'string' || !ID.test(id)) return res.status(400).end()
    try {
      const record = await store.byIntent(id)
      if (!record) return res.status(503).end() // Could arrive before intent binding.
      const intent = await ziina.get(id)
      if (!matchesStoredIntent(intent, record, config)) throw new Error('payment needs review')
      if (completedPayment(intent, record, config.account)) await store.markCompleted(record.id)
      return res.status(200).end()
    } catch {
      console.error('[strategy] Webhook could not be reconciled')
      return res.status(503).end()
    }
  }
}

function createProductionStrategy(env, rateLimited) {
  const config = readConfig(env)
  const store = config ? createStore({ url: config.supabaseUrl, key: config.supabaseKey }) : null
  const ziina = config ? createZiina({ key: config.ziinaKey }) : null
  return { router: strategyRouter({ config, store, ziina, rateLimited }), webhook: webhookHandler({ config, store, ziina }) }
}

module.exports = { readConfig, strategyRouter, webhookHandler, createProductionStrategy }
