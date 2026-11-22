'use strict'

// Scheduled, bounded test-only job. Run by a host scheduler, not a web worker.
// Never print customer data, references, Google events, provider responses or keys.
const { readConfig, matchesStoredIntent } = require('../server/strategy-booking.cjs')
const { completedPayment } = require('../server/strategy-safety.cjs')
const { createZiina, createStore } = require('../server/strategy-adapters.cjs')
const { createCalendarReaderFromEnv } = require('../server/strategy-calendar.cjs')
const { matchPaidTestBookings } = require('../server/strategy-matching.cjs')

// Expose only fixed categories in private cron output. Never print exceptions:
// provider errors and environment values can contain sensitive information.
class JobFailure extends Error {
  constructor(code) { super(code); this.code = code }
}
const hasValue = (v) => typeof v === 'string' && v.trim() !== '' && !/^\.+$/.test(v.trim()) && !['placeholder', 'changeme'].includes(v.trim().toLowerCase())
function configIssue(env) {
  if (env.STRATEGY_AUTO_MATCH_TEST !== 'true') return 'auto_flag_not_enabled'
  if (env.STRATEGY_EXPERIMENTAL !== 'true' || env.STRATEGY_MODE !== 'test') return 'test_mode_not_enabled'
  if (!['Z_A_KEY', 'ZI_API', 'ZIINA_API_KEY'].some((key) => hasValue(env[key]))) return 'ziina_key_missing'
  if (!hasValue(env.SUPABASE_URL) || !hasValue(env.SUPABASE_SERVICE_ROLE_KEY)) return 'supabase_settings_missing'
  if (!hasValue(env.ZIINA_WEBHOOK_SECRET)) return 'webhook_secret_missing'
  if (!hasValue(env.STRATEGY_ORIGIN) || !hasValue(env.BOOKING_STRATEGY_EMBED)) return 'site_or_booking_settings_missing'
  return 'settings_invalid_or_conflicting'
}

async function run({ env, now = Date.now, storeFactory = createStore, ziinaFactory = createZiina, readerFactory = createCalendarReaderFromEnv }) {
  const config = readConfig(env)
  if (!config || env.STRATEGY_AUTO_MATCH_TEST !== 'true') throw new JobFailure(configIssue(env))
  const current = now()
  if (!Number.isFinite(current)) throw new JobFailure('clock_invalid')
  const since = new Date(current - 7 * 86400000).toISOString()
  const timeMin = since
  const timeMax = new Date(current + 90 * 86400000).toISOString()
  let store, rows
  try {
    store = storeFactory({ url: config.supabaseUrl, key: config.supabaseKey })
    rows = await store.recentUnmatchedPaidTests(since)
  } catch (error) {
    throw new JobFailure(error?.message === 'Test batch limit exceeded' ? 'test_batch_limit' : 'database_read_failed')
  }
  if (!Array.isArray(rows) || rows.length > 25) throw new JobFailure('test_batch_limit')
  if (!rows.length) return { checked: 0, matched: 0, review: 0, errors: 0 }

  // Read every page before writing anything. Reuse the bounded snapshot for
  // each reference, retaining the target-specific duplicate safeguards.
  let reader
  try { reader = readerFactory(env) } catch { throw new JobFailure('calendar_settings_missing') }
  const events = []
  let token, pages = 0
  do {
    if (++pages > 10) throw new JobFailure('calendar_page_limit')
    let page
    try { page = await reader.list({ timeMin, timeMax, pageToken: token }) } catch (error) {
      throw new JobFailure(error?.message === 'Calendar authorization failed' ? 'calendar_authorization_failed' : 'calendar_read_failed')
    }
    if (!Array.isArray(page?.items) || page.items.length > 100) throw new JobFailure('calendar_invalid_response')
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
  }).catch((error) => {
    const safeCodes = new Set(['auto_flag_not_enabled', 'test_mode_not_enabled', 'ziina_key_missing', 'supabase_settings_missing', 'webhook_secret_missing', 'site_or_booking_settings_missing', 'settings_invalid_or_conflicting', 'clock_invalid', 'database_read_failed', 'test_batch_limit', 'calendar_settings_missing', 'calendar_page_limit', 'calendar_authorization_failed', 'calendar_read_failed', 'calendar_invalid_response'])
    const code = error instanceof JobFailure && safeCodes.has(error.code) ? error.code : 'unexpected_failure'
    console.error(`Scheduled test matching did not complete. Reason: ${code}. No secrets or provider details are shown.`)
    process.exitCode = 1
  })
}
module.exports = { run, configIssue }
