'use strict'

// Helpers for the future strategy checkout. This file does not register any
// routes or enable payments; do not expose it until the complete flow is tested.
const crypto = require('node:crypto')

const AMOUNT = 120000
const CURRENCY = 'AED'
const validPhone = (phone) => typeof phone === 'string' && /^\+[1-9]\d{6,14}$/.test(phone)
const newReference = () => crypto.randomBytes(16).toString('hex')
const newRecoveryToken = () => crypto.randomBytes(32).toString('base64url')
const hashRecoveryToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

// Ziina signs the exact request bytes, not the JSON re-serialized by Express.
function verifyWebhook(rawBody, signature, secret) {
  if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature) || typeof secret !== 'string' || secret.length < 32) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest()
  const actual = Buffer.from(signature, 'hex')
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

// A redirect or webhook alone is never proof. Compare a fresh API response to
// our own stored intent and account, rather than trusting any browser values.
function completedPayment(intent, record, accountId) {
  return !!intent && !!record && typeof accountId === 'string' && accountId.length > 0 &&
    typeof record.ziina_intent_id === 'string' && record.ziina_intent_id.length > 0 &&
    intent.id === record.ziina_intent_id && intent.account_id === accountId &&
    intent.status === 'completed' && intent.amount === AMOUNT && intent.currency_code === CURRENCY
}

module.exports = { AMOUNT, CURRENCY, validPhone, newReference, newRecoveryToken, hashRecoveryToken, verifyWebhook, completedPayment }
