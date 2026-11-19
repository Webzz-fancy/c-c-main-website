'use strict'

// Test-only matching prototype. The booking form's actual event format is
// still unverified. Never use this for live payments or infer non-booking.
const REFERENCE = /^[a-f0-9]{32}$/
const EVENT_ID = /^[A-Za-z0-9_-]{1,1024}$/

function bookingReferences(description) {
  if (typeof description !== 'string' || description.length > 100000) return []
  // This deliberately accepts only a labelled plain-text answer. If Google
  // formats the answer differently, we leave the record unmatched for review.
  const matches = [...description.matchAll(/(?:^|[\r\n])[ \t]*Booking reference[ \t]*:[ \t]*([a-f0-9]{32})[ \t]*(?=$|[\r\n])/gi)]
  return [...new Set(matches.map((match) => match[1].toLowerCase()).filter((ref) => REFERENCE.test(ref)))]
}

async function matchPaidTestBookings({ reader, store, timeMin, timeMax, maxPages = 10, onlyReference }) {
  if (onlyReference !== undefined && !REFERENCE.test(onlyReference)) throw new Error('Invalid test reference')
  const start = Date.parse(timeMin), end = Date.parse(timeMax)
  const maxDays = onlyReference === undefined ? 31 : 120
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > maxDays * 86400000) throw new Error('Invalid test window')
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 50) throw new Error('Invalid page limit')
  if (!reader || !store || typeof reader.list !== 'function' || typeof store.byPaidTestReference !== 'function' || typeof store.matchPaidTestBooking !== 'function') throw new Error('Test matching dependencies missing')

  const candidates = new Map()
  const ambiguousReferences = new Set()
  const seenEvents = new Set()
  let nextPageToken, pages = 0, ambiguous = 0
  // Read all pages first: a later duplicate must never cause an earlier write.
  do {
    if (++pages > maxPages) throw new Error('Calendar page limit exceeded; no records changed')
    const page = await reader.list({ timeMin, timeMax, pageToken: nextPageToken })
    if (!Array.isArray(page?.items)) throw new Error('Invalid calendar page; no records changed')
    for (const event of page.items) {
      if (event?.status !== 'confirmed' || !EVENT_ID.test(event.id || '') || typeof event.start?.dateTime !== 'string') continue
      const eventStart = Date.parse(event.start.dateTime)
      if (!Number.isFinite(eventStart) || eventStart < start || eventStart >= end) continue
      if (seenEvents.has(event.id)) throw new Error('Duplicate event returned; no records changed')
      seenEvents.add(event.id)
      const refs = bookingReferences(event.description)
      if (refs.length !== 1) {
        if (refs.length > 1) {
          if (onlyReference === undefined || refs.includes(onlyReference)) ambiguous++
          for (const ref of refs) ambiguousReferences.add(ref)
        }
        continue
      }
      const ref = refs[0]
      if (onlyReference !== undefined && ref !== onlyReference) continue
      const list = candidates.get(ref) || []
      list.push({ eventId: event.id, startsAt: event.start.dateTime })
      candidates.set(ref, list)
    }
    nextPageToken = page.nextPageToken
  } while (nextPageToken)

  let matched = 0, unchanged = 0, errors = 0
  for (const [reference, events] of candidates) {
    if (events.length !== 1 || ambiguousReferences.has(reference)) { ambiguous++; continue }
    try {
      const record = await store.byPaidTestReference(reference)
      if (!record || !record.id || record.payment_environment !== 'test' || record.payment_status !== 'completed' || record.booking_reference !== reference || record.booking_status !== 'not_booked' || record.google_event_id) { unchanged++; continue }
      const saved = await store.matchPaidTestBooking({ id: record.id, reference, ...events[0] })
      if (saved) matched++; else unchanged++
    } catch {
      // No provider error body, reference, customer or event details in logs.
      errors++
    }
  }
  return { matched, unchanged, ambiguous, errors }
}

module.exports = { bookingReferences, matchPaidTestBookings }
