'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const s = require('../server/strategy-safety.cjs')

test('phone uses international E.164 format', () => {
  assert.equal(s.validPhone('+971501234567'), true)
  for (const x of ['0501234567', '+01234567', '+1', '+971 50 1234567', '', null]) assert.equal(s.validPhone(x), false)
})
test('references and recovery tokens are random and hashes do not expose tokens', () => {
  const a = s.newReference(), b = s.newReference(), t = s.newRecoveryToken()
  assert.notEqual(a, b)
  assert.match(a, /^[0-9a-f]{32}$/)
  assert.equal(s.hashRecoveryToken(t), s.hashRecoveryToken(t))
  assert.notEqual(s.hashRecoveryToken(t), t)
})
test('webhook signature checks exact raw bytes and fails closed', () => {
  const secret = 'a'.repeat(40), body = Buffer.from('{"event":"payment_intent.status.updated"}')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
  assert.equal(s.verifyWebhook(body, sig, secret), true)
  assert.equal(s.verifyWebhook(Buffer.from(body.toString() + ' '), sig, secret), false)
  assert.equal(s.verifyWebhook(body, '0'.repeat(64), secret), false)
  assert.equal(s.verifyWebhook(body, sig, '...'), false)
  assert.equal(s.verifyWebhook({}, sig, secret), false)
})
test('only the stored completed correct-account payment with exact amount and currency qualifies', () => {
  const record = { ziina_intent_id: 'intent-123' }, account = 'account-1'
  const intent = { id: 'intent-123', account_id: account, status: 'completed', amount: 120000, currency_code: 'AED' }
  assert.equal(s.completedPayment(intent, record, account), true)
  for (const change of [{ id: 'other' }, { account_id: 'other' }, { status: 'pending' }, { status: 'failed' }, { amount: 1 }, { currency_code: 'USD' }]) assert.equal(s.completedPayment({ ...intent, ...change }, record, account), false)
  assert.equal(s.completedPayment(intent, record, ''), false)
  assert.equal(s.completedPayment(intent, {}, account), false)
})
