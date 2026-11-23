'use strict'

// Matching links a reference, not identity or proof of non-booking. Google can
// change event formats, so unfamiliar or ambiguous entries need human review.
const { inspectEvent } = require('../scripts/check-strategy-calendar.cjs')
const { visibleCalendarText, referenceLayout } = require('./strategy-calendar-html.cjs')
const REFERENCE = /^[a-f0-9]{32}$/
const EVENT_ID = /^[A-Za-z0-9_-]{1,1024}$/

function bookingReferences(description) {
  if (typeof description !== 'string' || description.length > 100000) return []
  // Accept an exact labelled line. For HTML only, also accept a label and a
  // standalone answer on the next line; unknown formats remain unmatched.
  const isHtml = /<\/?[a-z][^>]*>/i.test(description)
  const text = isHtml ? visibleCalendarText(description) : description
  const matches = [...text.matchAll(/(?:^|[\r\n])[ \t]*Booking reference[ \t]*:[ \t]*([a-f0-9]{32})[ \t]*(?=$|[\r\n])/gi)]
  if (isHtml) matches.push(...text.matchAll(/(?:^|[\r\n])[ \t]*Booking reference[ \t]*:?[ \t]*\r?\n(?:[ \t]*\r?\n){0,3}[ \t]*([a-f0-9]{32})[ \t]*(?=$|[\r\n])/gi))
  return [...new Set(matches.map((match) => match[1].toLowerCase()).filter((ref) => REFERENCE.test(ref)))]
}

async function matchPaidTestBookings({ reader, store, timeMin, timeMax, maxPages = 10, onlyReference, paymentEnvironment = 'test' }) {
  if (!['test', 'live'].includes(paymentEnvironment)) throw new Error('Invalid payment environment')
  if (onlyReference !== undefined && !REFERENCE.test(onlyReference)) throw new Error('Invalid test reference')
  const start = Date.parse(timeMin), end = Date.parse(timeMax)
  const maxDays = onlyReference === undefined ? 31 : 120
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > maxDays * 86400000) throw new Error('Invalid test window')
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 50) throw new Error('Invalid page limit')
  if (!reader || !store || typeof reader.list !== 'function' || typeof store.byPaidTestReference !== 'function' || typeof store.matchPaidTestBooking !== 'function') throw new Error('Test matching dependencies missing')

  const candidates = new Map()
  const ambiguousReferences = new Set()
  const seenEvents = new Set()
  // Only aggregate presence for this session's reference; never return raw
  // event content, emails, or other calendar data to the test page.
  const diagnostic = { referenceEvents: 0, descriptionEvents: 0, extendedEvents: 0, htmlDescriptionEvents: 0, labelledDescriptionEvents: 0, attendeeEmailEvents: 0, layout: 'not_visible' }
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
      if (onlyReference !== undefined) {
        const inspection = inspectEvent(event, onlyReference)
        if (inspection) {
          diagnostic.referenceEvents++
          if (inspection.fields.includes('description')) {
            diagnostic.descriptionEvents++
            if (/<\/?[a-z][^>]*>/i.test(event.description)) diagnostic.htmlDescriptionEvents++
            if (/booking\s+reference/i.test(event.description)) diagnostic.labelledDescriptionEvents++
            diagnostic.layout = referenceLayout(event.description, onlyReference)
          }
          if (inspection.fields.some((field) => field.startsWith('extendedProperties.'))) diagnostic.extendedEvents++
          if (inspection.hasAttendeeEmail) diagnostic.attendeeEmailEvents++
        }
      }
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
  // Count references in all supported fields, not only parseable descriptions:
  // a duplicate in an unfamiliar format must prevent a potentially false write.
  if (onlyReference !== undefined && diagnostic.referenceEvents > 1) {
    return { matched, unchanged, ambiguous: Math.max(ambiguous, 1), errors, diagnostic }
  }
  for (const [reference, events] of candidates) {
    if (events.length !== 1 || ambiguousReferences.has(reference)) { ambiguous++; continue }
    try {
      const record = await store.byPaidTestReference(reference)
      if (!record || !record.id || record.payment_environment !== paymentEnvironment || record.payment_status !== 'completed' || record.booking_reference !== reference || record.booking_status !== 'not_booked' || record.google_event_id) { unchanged++; continue }
      const saved = await store.matchPaidTestBooking({ id: record.id, reference, ...events[0] })
      if (saved) matched++; else unchanged++
    } catch {
      // No provider error body, reference, customer or event details in logs.
      errors++
    }
  }
  const result = { matched, unchanged, ambiguous, errors }
  return onlyReference === undefined ? result : { ...result, diagnostic }
}

module.exports = { bookingReferences, matchPaidTestBookings }
