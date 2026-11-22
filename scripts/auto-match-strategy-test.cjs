'use strict'

// Scheduled, bounded test-only job. Run by a host scheduler, not a web worker.
// Never print customer data, references, Google events, provider responses or keys.
const { readConfig, matchesStoredIntent } = require('../server/strategy-booking.cjs')
const { completedPayment } = require('../server/strategy-safety.cjs')
const { createZiina, createStore } = require('../server/strategy-adapters.cjs')
const { createCalendarReaderFromEnv } = require('../server/strategy-calendar.cjs')
const { matchPaidTestBookings } = require('../server/strategy-matching.cjs')

async function run({ env, now = Date.now, storeFactory = createStore, ziinaFactory = createZiina, readerFactory = createCalendarReaderFromEnv }) {
  const config = readConfig(env)
  if (!config || env.STRATEGY_AUTO_MATCH_TEST !== 'true') throw new Error('Automatic test matching disabled')
  const current = now()
  if (!Number.isFinite(current)) throw new Error('Invalid clock')
  const since = new Date(current - 7 * 86400000).toISOString()
  const timeMin = since
  const timeMax = new Date(current + 90 * 86400000).toISOString()
  const store = storeFactory({ url: config.supabaseUrl, key: config.supabaseKey })
  const rows = await store.recentUnmatchedPaidTests(since)
  if (!Array.isArray(rows) || rows.length > 25) throw new Error('Invalid test batch')
  if (!rows.length) return { checked: 0, matched: 0, review: 0, errors: 0 }

  // Read every page before writing anything. Reuse the bounded snapshot for
  // each reference, retaining the target-specific duplicate safeguards.
  const reader = readerFactory(env), events = []
  let token, pages = 0
  do {
    if (++pages > 10) throw new Error('Calendar page limit exceeded')
    const page = await reader.list({ timeMin, timeMax, pageToken: token })
    if (!Array.isArray(page?.items) || page.items.length > 100) throw new Error('Invalid calendar page')
    events.push(...page.items)
    token = page.nextPageToken
  } while (token)
  const snapshot = { list: async () => ({ items: events }) }
  const ziina = ziinaFactory({ key: config.ziinaKey })
  const result = { checked: 0, matched: 0, review: 0, errors: 0 }
  for (const record of rows) {
    result.checked++
    // Do not rely solely on the database selection; and recheck the provider
    // on every run before linking an appointment to the payment.
    if (!record || record.payment_environment !== 'test' || record.payment_status !== 'completed' || record.booking_status !== 'not_booked' || record.google_event_id || !/^[a-f0-9]{32}$/.test(record.booking_reference || '') || !/^[A-Za-z0-9-]{1,100}$/.test(record.ziina_intent_id || '')) { result.review++; continue }
    try {
      const intent = await ziina.get(record.ziina_intent_id)
      if (!matchesStoredIntent(intent, record, config) || !completedPayment(intent, record, record.ziina_account_id)) { result.review++; continue }
      const match = await matchPaidTestBookings({ reader: snapshot, store, timeMin, timeMax, onlyReference: record.booking_reference })
      result.matched += match.matched
      if (match.errors) result.errors += match.errors
      else if (match.ambiguous || (match.diagnostic.referenceEvents && !match.matched)) result.review++
    } catch { result.errors++ }
  }
  return result
}

if (require.main === module) {
  run({ env: process.env }).then((result) => {
    console.log(`Test matching: checked ${result.checked}, matched ${result.matched}, review ${result.review}, errors ${result.errors}.`)
    if (result.review || result.errors) process.exitCode = 1
  }).catch(() => {
    console.error('Scheduled test matching did not complete; check private settings, provider access and test batch limits.')
    process.exitCode = 1
  })
}
module.exports = { run }
