'use strict'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { run } = require('../scripts/match-strategy-test.cjs')
const env = { STRATEGY_MODE: 'test', STRATEGY_MATCH_TEST_ONLY: 'true', SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-key' }

test('operator runner requires both explicit test settings and explicit apply', async () => {
  let calls = 0
  const deps = { readerFactory: () => { calls++; return {} }, storeFactory: () => { calls++; return {} }, match: async () => { calls++; return { matched: 1, unchanged: 0, ambiguous: 0, errors: 0 } } }
  const args = ['--apply', '2026-11-01T00:00:00Z', '2026-11-02T00:00:00Z']
  await assert.rejects(run({ env, args: args.slice(1), ...deps }))
  await assert.rejects(run({ env: { ...env, STRATEGY_MATCH_TEST_ONLY: '' }, args, ...deps }))
  await assert.rejects(run({ env: { ...env, STRATEGY_MODE: 'live' }, args, ...deps }))
  await assert.rejects(run({ env: { ...env, SUPABASE_URL: 'https://evil.test' }, args, ...deps }))
  await assert.rejects(run({ env: { ...env, SUPABASE_SERVICE_ROLE_KEY: '..' }, args, ...deps }))
  assert.equal(calls, 0)
  assert.equal((await run({ env, args, ...deps })).matched, 1)
  assert.equal(calls, 3)
})
