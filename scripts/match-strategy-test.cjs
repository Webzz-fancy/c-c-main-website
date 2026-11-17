'use strict'

// Explicit, operator-run test only; never a public route or background job.
// It updates only completed test rows. Do not use until the reference format
// has been checked against a consented Google test booking.
const { createStore } = require('../server/strategy-adapters.cjs')
const { createCalendarReaderFromEnv } = require('../server/strategy-calendar.cjs')
const { matchPaidTestBookings } = require('../server/strategy-matching.cjs')

function testSettings(env) {
  if (env.STRATEGY_MODE !== 'test' || env.STRATEGY_MATCH_TEST_ONLY !== 'true') throw new Error('Test matching is not explicitly enabled')
  const url = new URL(env.SUPABASE_URL || '')
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid Supabase URL')
  const key = typeof env.SUPABASE_SERVICE_ROLE_KEY === 'string' ? env.SUPABASE_SERVICE_ROLE_KEY.trim() : ''
  if (!key || /^\.+$/.test(key) || ['placeholder', 'changeme'].includes(key.toLowerCase())) throw new Error('Supabase key missing')
  return { url: url.origin, key: env.SUPABASE_SERVICE_ROLE_KEY }
}

async function run({ env, args, readerFactory = createCalendarReaderFromEnv, storeFactory = createStore, match = matchPaidTestBookings }) {
  if (args.length !== 3 || args[0] !== '--apply') throw new Error('Explicit test run and time range required')
  const config = testSettings(env)
  return match({ reader: readerFactory(env), store: storeFactory(config), timeMin: args[1], timeMax: args[2] })
}

if (require.main === module) {
  run({ env: process.env, args: process.argv.slice(2) }).then((result) => {
    console.log(`Test rows matched: ${result.matched}; unchanged: ${result.unchanged}; ambiguous: ${result.ambiguous}; errors: ${result.errors}.`)
    if (result.errors || result.ambiguous) process.exitCode = 1
  }).catch(() => {
    // Do not print provider responses, secrets, references or customer data.
    console.error('Test matching did not run. Check the private test setup and time window.')
    process.exitCode = 1
  })
}
module.exports = { run, testSettings }
