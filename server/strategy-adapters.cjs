'use strict'

// Fixed provider endpoints: never derive a network destination from a request.
const ZIINA_API = 'https://api-v2.ziina.com/api'

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(10000), redirect: 'error' })
  if (!response.ok) throw new Error('provider request failed')
  return response.json()
}

function createZiina({ key, fetchImpl = fetch }) {
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  return {
    create: (body) => requestJson(fetchImpl, `${ZIINA_API}/payment_intent`, { method: 'POST', headers, body: JSON.stringify(body) }),
    get: (id) => requestJson(fetchImpl, `${ZIINA_API}/payment_intent/${encodeURIComponent(id)}`, { headers }),
  }
}

function createStore({ url, key, fetchImpl = fetch, environment = 'test' }) {
  if (!['test', 'live'].includes(environment)) throw new Error('Invalid payment environment')
  const base = `${url}/rest/v1/strategy_bookings`
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }
  const one = async (query) => {
    const rows = await requestJson(fetchImpl, `${base}?${query}&limit=1`, { headers })
    if (!Array.isArray(rows)) throw new Error('invalid database response')
    return rows[0] || null
  }
  return {
    insert: async (record) => {
      const rows = await requestJson(fetchImpl, base, { method: 'POST', headers, body: JSON.stringify(record) })
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('invalid database response')
      return rows[0]
    },
    byHash: (hash) => one(`recovery_token_hash=eq.${encodeURIComponent(hash)}&payment_environment=eq.${environment}`),
    byIntent: (id) => one(`ziina_intent_id=eq.${encodeURIComponent(id)}&payment_environment=eq.${environment}`),
    byPaidTestReference: (reference) => one(`booking_reference=eq.${encodeURIComponent(reference)}&payment_environment=eq.${environment}&payment_status=eq.completed`),
    // Live batches rotate by updated_at so old unpaid or unmatched attempts
    // cannot permanently starve later records. This does not infer non-booking.
    pendingLive: async () => {
      if (environment !== 'live') throw new Error('Live store required')
      const query = new URLSearchParams({ select: 'id,payment_environment,payment_status,ziina_intent_id,ziina_account_id', payment_environment: 'eq.live', payment_status: 'eq.pending', ziina_intent_id: 'not.is.null', ziina_account_id: 'not.is.null', order: 'updated_at.asc,id.asc', limit: '10' })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { headers })
      if (!Array.isArray(rows) || rows.length > 10) throw new Error('Invalid live batch')
      return rows
    },
    unmatchedLive: async () => {
      if (environment !== 'live') throw new Error('Live store required')
      const query = new URLSearchParams({ select: 'id,booking_reference,payment_environment,payment_status,booking_status,google_event_id,ziina_intent_id,ziina_account_id', payment_environment: 'eq.live', payment_status: 'eq.completed', booking_status: 'eq.not_booked', google_event_id: 'is.null', order: 'updated_at.asc,id.asc', limit: '10' })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { headers })
      if (!Array.isArray(rows) || rows.length > 10) throw new Error('Invalid live batch')
      return rows
    },
    touchLiveAttempt: async ({ id, intentId, accountId, paymentStatus }) => {
      if (environment !== 'live' || !['pending', 'completed'].includes(paymentStatus)) throw new Error('Invalid live attempt')
      const query = new URLSearchParams({ id: `eq.${id}`, payment_environment: 'eq.live', payment_status: `eq.${paymentStatus}`, ziina_intent_id: `eq.${intentId}`, ziina_account_id: `eq.${accountId}` })
      if (paymentStatus === 'completed') { query.set('booking_status', 'eq.not_booked'); query.set('google_event_id', 'is.null') }
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { method: 'PATCH', headers, body: JSON.stringify({ updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('Live rotation failed')
      return rows.length === 1
    },
    // Test scheduler: only bound, recent test intents qualify. Older or
    // unbound attempts need manual review; never guess an intent.
    recentPendingTestPayments: async (since, limit = 10) => {
      if (!Number.isInteger(limit) || limit < 1 || limit > 10 || !Number.isFinite(Date.parse(since))) throw new Error('Invalid test batch')
      const query = new URLSearchParams({ select: 'id,payment_environment,payment_status,ziina_intent_id,ziina_account_id', payment_environment: `eq.${environment}`, payment_status: 'eq.pending', ziina_intent_id: 'not.is.null', ziina_account_id: 'not.is.null', created_at: `gte.${since}`, order: 'created_at.asc', limit: String(limit + 1) })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { headers })
      if (!Array.isArray(rows) || rows.length > limit) throw new Error('Test batch limit exceeded')
      return rows
    },
    markCompletedTestIntent: async ({ id, intentId, accountId }) => {
      const query = new URLSearchParams({ id: `eq.${id}`, payment_environment: `eq.${environment}`, payment_status: 'eq.pending', ziina_intent_id: `eq.${intentId}`, ziina_account_id: `eq.${accountId}` })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { method: 'PATCH', headers, body: JSON.stringify({ payment_status: 'completed', updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('Payment recovery failed')
      return rows.length === 1
    },
    // The scheduled test job is deliberately bounded and refuses to write if
    // the batch overflows, rather than silently starving older attempts.
    recentUnmatchedPaidTests: async (since, limit = 10) => {
      if (!Number.isInteger(limit) || limit < 1 || limit > 10 || !Number.isFinite(Date.parse(since))) throw new Error('Invalid test batch')
      const query = new URLSearchParams({ select: 'id,booking_reference,payment_environment,payment_status,booking_status,google_event_id,ziina_intent_id,ziina_account_id', payment_environment: `eq.${environment}`, payment_status: 'eq.completed', booking_status: 'eq.not_booked', google_event_id: 'is.null', created_at: `gte.${since}`, order: 'created_at.asc', limit: String(limit + 1) })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { headers })
      if (!Array.isArray(rows) || rows.length > limit) throw new Error('Test batch limit exceeded')
      return rows
    },
    // Compare-and-set protects existing matches, refunds and other environments.
    matchPaidTestBooking: async ({ id, reference, eventId, startsAt }) => {
      const query = new URLSearchParams({ id: `eq.${id}`, booking_reference: `eq.${reference}`, payment_environment: `eq.${environment}`, payment_status: 'eq.completed', booking_status: 'eq.not_booked', google_event_id: 'is.null' })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { method: 'PATCH', headers, body: JSON.stringify({ booking_status: 'matched', google_event_id: eventId, booking_starts_at: startsAt, updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('booking match could not be saved')
      return rows.length === 1
    },
    bindIntent: async (id, intentId, accountId) => {
      const rows = await requestJson(fetchImpl, `${base}?id=eq.${encodeURIComponent(id)}&payment_environment=eq.${environment}&ziina_intent_id=is.null&payment_status=eq.pending`, { method: 'PATCH', headers, body: JSON.stringify({ ziina_intent_id: intentId, ziina_account_id: accountId, updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('could not persist payment intent')
      return rows[0]
    },
    markCompleted: async ({ id, intentId, accountId }) => {
      // Bind the write to the verified intent, account and environment: a
      // stale status check must not complete a changed or refunded row.
      const query = new URLSearchParams({ id: `eq.${id}`, payment_environment: `eq.${environment}`, payment_status: 'in.(pending,completed)', ziina_intent_id: `eq.${intentId}`, ziina_account_id: `eq.${accountId}` })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { method: 'PATCH', headers, body: JSON.stringify({ payment_status: 'completed', updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('payment needs review')
      return rows[0]
    },
  }
}

module.exports = { createZiina, createStore }
