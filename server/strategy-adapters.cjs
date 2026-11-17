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

function createStore({ url, key, fetchImpl = fetch }) {
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
    byHash: (hash) => one(`recovery_token_hash=eq.${encodeURIComponent(hash)}&payment_environment=eq.test`),
    byIntent: (id) => one(`ziina_intent_id=eq.${encodeURIComponent(id)}&payment_environment=eq.test`),
    byPaidTestReference: (reference) => one(`booking_reference=eq.${encodeURIComponent(reference)}&payment_environment=eq.test&payment_status=eq.completed`),
    // Compare-and-set protects existing matches, refunds and non-test records.
    matchPaidTestBooking: async ({ id, reference, eventId, startsAt }) => {
      const query = new URLSearchParams({ id: `eq.${id}`, booking_reference: `eq.${reference}`, payment_environment: 'eq.test', payment_status: 'eq.completed', booking_status: 'eq.not_booked', google_event_id: 'is.null' })
      const rows = await requestJson(fetchImpl, `${base}?${query}`, { method: 'PATCH', headers, body: JSON.stringify({ booking_status: 'matched', google_event_id: eventId, booking_starts_at: startsAt, updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('booking match could not be saved')
      return rows.length === 1
    },
    bindIntent: async (id, intentId) => {
      const rows = await requestJson(fetchImpl, `${base}?id=eq.${encodeURIComponent(id)}&ziina_intent_id=is.null&payment_status=eq.pending`, { method: 'PATCH', headers, body: JSON.stringify({ ziina_intent_id: intentId, updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('could not persist payment intent')
      return rows[0]
    },
    markCompleted: async (id) => {
      // A duplicate/out-of-order notification may never undo a refund state.
      const rows = await requestJson(fetchImpl, `${base}?id=eq.${encodeURIComponent(id)}&payment_status=in.(pending,completed)`, { method: 'PATCH', headers, body: JSON.stringify({ payment_status: 'completed', updated_at: new Date().toISOString() }) })
      if (!Array.isArray(rows) || rows.length !== 1) throw new Error('payment needs review')
      return rows[0]
    },
  }
}

module.exports = { createZiina, createStore }
