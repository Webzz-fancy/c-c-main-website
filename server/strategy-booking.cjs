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
  // Accept the existing Hostinger names and the documented name. If more
  // than one is set differently, fail closed rather than choosing an account.
  const ziinaKeys = [env.Z_A_KEY, env.ZI_API, env.ZIINA_API_KEY].filter((value) => typeof value === 'string' && value.trim() !== '')
  if (!ziinaKeys.length || !ziinaKeys.every(present) || new Set(ziinaKeys).size !== 1) return null
  const keys = ['ZIINA_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'STRATEGY_ORIGIN', 'BOOKING_STRATEGY_EMBED']
  if (!keys.every((key) => present(env[key]))) return null
  const account = env.ZIINA_ACCOUNT_ID || null
  if (env.ZIINA_WEBHOOK_SECRET.length < 32 || (account !== null && (!present(account) || !ID.test(account)))) return null
  if (!safeUrl(env.SUPABASE_URL, /^[a-z0-9-]+\.supabase\.co$/)) return null
  const supabaseUrl = new URL(env.SUPABASE_URL)
  if (supabaseUrl.pathname !== '/' || supabaseUrl.search || supabaseUrl.hash) return null
  if (!safeUrl(env.BOOKING_STRATEGY_EMBED, /^calendar\.google\.com$/, /^\/calendar\/appointments\/schedules\//)) return null
  try {
    const url = new URL(env.STRATEGY_ORIGIN)
    if (url.protocol !== 'https:' || url.origin !== env.STRATEGY_ORIGIN || url.username || url.password) return null
  } catch { return null }
  return { ziinaKey: ziinaKeys[0], account, webhookSecret: env.ZIINA_WEBHOOK_SECRET, supabaseUrl: env.SUPABASE_URL.replace(/\/$/, ''), supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY, origin: env.STRATEGY_ORIGIN, calendar: env.BOOKING_STRATEGY_EMBED }
}

// Live is a separate, explicitly enabled configuration and store namespace.
function readLiveConfig(env) {
  if (env.STRATEGY_MODE !== 'live' || env.STRATEGY_LIVE_ENABLED !== 'true') return null
  const config = readConfig({ ...env, STRATEGY_MODE: 'test' })
  return config ? { ...config, mode: 'live' } : null
}

function sessionFrom(req, cookieName = COOKIE) {
  const cookie = req.get('cookie') || ''
  const items = cookie.split(';').map((x) => x.trim()).filter((x) => x.startsWith(`${cookieName}=`))
  if (items.length !== 1) return null
  const token = items[0].slice(cookieName.length + 1)
  return TOKEN.test(token) ? token : null
}
function validIntentCreation(intent, cfg) {
  if (!intent || typeof intent.id !== 'string' || !ID.test(intent.id) || typeof intent.account_id !== 'string' || !ID.test(intent.account_id) || (cfg.account && intent.account_id !== cfg.account) || intent.amount !== AMOUNT || intent.currency_code !== CURRENCY) return false
  try {
    const url = new URL(intent.redirect_url)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (url.hostname === 'ziina.com' || url.hostname.endsWith('.ziina.com'))
  } catch { return false }
}
function matchesStoredIntent(intent, record, cfg) {
  // The account from the authenticated creation response is bound to this
  // attempt. An independently configured account, when present, is an
  // additional check that the key belongs to the intended business.
  return !!intent && typeof record.ziina_account_id === 'string' && ID.test(record.ziina_account_id) && intent.id === record.ziina_intent_id && intent.account_id === record.ziina_account_id && (!cfg.account || record.ziina_account_id === cfg.account) && intent.amount === AMOUNT && intent.currency_code === CURRENCY
}

// Dependency injection lets tests exercise the real HTTP routes without keys.
function strategyRouter({ config, store, ziina, matchTestBooking = null, rateLimited = () => false }) {
  const router = express.Router()
  const mode = config?.mode === 'live' ? 'live' : 'test'
  const cookieName = mode === 'live' ? '__Host-strategy_live_session' : COOKIE
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
    if (sessionFrom(req, cookieName)) return res.status(409).json({ ok: false, error: 'An existing checkout is in progress. Check its status or contact us.' })
    const token = newRecoveryToken()
    try {
      const record = await store.insert({ booking_reference: newReference(), recovery_token_hash: hashRecoveryToken(token), customer_name: name, whatsapp_e164: phone, payment_environment: mode })
      if (!record || !record.id || record.payment_environment !== mode) throw new Error('database insert failed')
      // Set cookie as soon as the attempt is saved, so an interrupted response
      // cannot silently erase the visitor's only session.
      res.cookie(cookieName, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 })
      const intent = await ziina.create({ amount: AMOUNT, currency_code: CURRENCY, message: 'Strategic Consultation', success_url: `${config.origin}/?booking=${mode === 'live' ? 'live-paid' : 'paid'}`, cancel_url: `${config.origin}/?booking=${mode === 'live' ? 'live-cancelled' : 'cancelled'}`, failure_url: `${config.origin}/?booking=${mode === 'live' ? 'live-cancelled' : 'cancelled'}`, test: mode === 'test', allow_tips: false })
      if (!validIntentCreation(intent, config)) throw new Error('invalid payment intent')
      await store.bindIntent(record.id, intent.id, intent.account_id)
      return res.json({ ok: true, redirectUrl: intent.redirect_url })
    } catch {
      // Never log provider error bodies, tokens or customer details.
      console.error('[strategy] Checkout could not be created; review saved attempt')
      return res.status(503).json({ ok: false, error: 'Could not start checkout. Please contact us before trying again.' })
    }
  })
  router.get('/status', async (req, res) => {
    const token = sessionFrom(req, cookieName)
    // Opening the checkout now checks for an existing session automatically.
    // Requests with no session cannot reach providers and should not exhaust
    // the shared limit for real attempts behind a hosting proxy.
    if (!token) return res.status(401).json({ ok: false, error: 'No booking session. Please contact us for help.' })
    if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })
    try {
      const record = await store.byHash(hashRecoveryToken(token))
      if (!record || record.payment_environment !== mode) return res.status(404).json({ ok: false, error: 'Booking not found. Please contact us.' })
      if (record.payment_status === 'refunded' || record.payment_status === 'refund_review') return res.json({ ok: true, status: 'needs_review' })
      if (!record.ziina_intent_id) return res.json({ ok: true, status: 'needs_review' })
      const intent = await ziina.get(record.ziina_intent_id)
      if (!matchesStoredIntent(intent, record, config)) throw new Error('payment needs review')
      if (!completedPayment(intent, record, record.ziina_account_id)) {
        // The private test UI may show only a fixed provider-state category;
        // never expose raw provider responses, errors, IDs or payment data.
        const knownStatuses = ['requires_payment_instrument', 'requires_user_action', 'pending', 'failed']
        const providerStatus = knownStatuses.includes(intent.status) ? intent.status : 'other'
        return res.json({ ok: true, status: 'pending', providerStatus })
      }
      await store.markCompleted({ id: record.id, intentId: record.ziina_intent_id, accountId: record.ziina_account_id })
      return res.json({ ok: true, status: 'paid', reference: record.booking_reference, calendar: config.calendar })
    } catch {
      console.error('[strategy] Could not check payment; review saved attempt')
      return res.status(503).json({ ok: false, error: 'Payment could not be checked. Please contact us before paying again.' })
    }
  })
  // Team-only test route (the server mounts the team access gate before this
  // router). Each check is restricted to the caller's paid test session.
  router.post('/match-test-booking', async (req, res) => {
    if (mode !== 'test' || !matchTestBooking) return res.status(503).json({ ok: false, error: 'Test matching is not enabled' })
    if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests' })
    if (req.get('origin') !== config.origin) return res.status(403).json({ ok: false, error: 'Invalid origin' })
    const token = sessionFrom(req, cookieName)
    if (!token) return res.status(401).json({ ok: false, error: 'No booking session' })
    try {
      const record = await store.byHash(hashRecoveryToken(token))
      if (!record || record.payment_environment !== 'test' || record.payment_status !== 'completed' || !record.ziina_intent_id) return res.status(409).json({ ok: false, error: 'Test payment needs review' })
      const intent = await ziina.get(record.ziina_intent_id)
      if (!matchesStoredIntent(intent, record, config) || !completedPayment(intent, record, record.ziina_account_id)) return res.status(409).json({ ok: false, error: 'Test payment needs review' })
      if (record.booking_status === 'matched') return res.json({ ok: true, status: 'previously_matched' })
      if (record.booking_status !== 'not_booked') return res.json({ ok: true, status: 'needs_review' })
      const result = await matchTestBooking(record.booking_reference)
      if (result.errors || result.ambiguous) return res.json({ ok: true, status: 'needs_review' })
      if (result.matched === 1) return res.json({ ok: true, status: 'matched', ...(result.diagnostic?.referenceEvents === 1 ? { emailAvailable: result.diagnostic.attendeeEmailEvents === 1 } : {}) })
      // Missing a match is not evidence that no appointment exists. Provide
      // only aggregate test-reference presence, never event or personal data.
      const found = result.diagnostic?.referenceEvents === 1
      const details = found ? {
        emailAvailable: result.diagnostic.attendeeEmailEvents === 1,
        inDescription: result.diagnostic.descriptionEvents === 1,
        inExtendedProperties: result.diagnostic.extendedEvents === 1,
        hasHtml: result.diagnostic.htmlDescriptionEvents === 1,
        hasLabel: result.diagnostic.labelledDescriptionEvents === 1,
        layout: ['same_line', 'next_line', 'other', 'not_visible'].includes(result.diagnostic.layout) ? result.diagnostic.layout : 'not_visible',
        reason: result.unchanged ? 'record_changed' : 'format_not_recognized',
      } : {}
      return res.json({ ok: true, status: found ? 'reference_found_unmatched' : 'not_matched', ...details })
    } catch {
      console.error('[strategy] Test booking check failed')
      return res.status(503).json({ ok: false, error: 'Test booking check could not be completed' })
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
      if (completedPayment(intent, record, record.ziina_account_id)) await store.markCompleted({ id: record.id, intentId: record.ziina_intent_id, accountId: record.ziina_account_id })
      return res.status(200).end()
    } catch {
      console.error('[strategy] Webhook could not be reconciled')
      return res.status(503).end()
    }
  }
}

// The protected team-only match is created without contacting Google and
// constructs its reader only when requested. No scheduler or extra setting is
// needed; production/live mode remains disabled by readConfig.
function createSessionTestMatcher({ env, config, store, readerFactory, match, now = Date.now }) {
  if (!config || env.STRATEGY_EXPERIMENTAL !== 'true' || env.STRATEGY_MODE !== 'test') return null
  return (reference) => {
    const reader = readerFactory(env)
    const current = now()
    return match({ reader, store, onlyReference: reference, timeMin: new Date(current - 7 * 86400000).toISOString(), timeMax: new Date(current + 90 * 86400000).toISOString() })
  }
}

function createProductionStrategy(env, rateLimited) {
  const config = readConfig(env)
  const store = config ? createStore({ url: config.supabaseUrl, key: config.supabaseKey }) : null
  const ziina = config ? createZiina({ key: config.ziinaKey }) : null
  const matchTestBooking = createSessionTestMatcher({ env, config, store, readerFactory: (settings) => require('./strategy-calendar.cjs').createCalendarReaderFromEnv(settings), match: (options) => require('./strategy-matching.cjs').matchPaidTestBookings(options) })
  return { router: strategyRouter({ config, store, ziina, matchTestBooking, rateLimited }), webhook: webhookHandler({ config, store, ziina }) }
}

module.exports = { readConfig, readLiveConfig, strategyRouter, webhookHandler, createProductionStrategy, createSessionTestMatcher, matchesStoredIntent }
