'use strict'

// Private, manual diagnostic. It never changes bookings or prints event data.
// It is not mounted as an HTTP route or run by the website automatically.
const { createCalendarReaderFromEnv } = require('../server/strategy-calendar.cjs')

function inspectEvent(event, reference) {
  if (!event || typeof event !== 'object' || !/^[a-f0-9]{32}$/.test(reference)) return null
  const fields = []
  if (typeof event.description === 'string') fields.push(['description', event.description])
  for (const part of ['private', 'shared']) {
    const properties = event.extendedProperties?.[part]
    if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
      for (const value of Object.values(properties)) if (typeof value === 'string') fields.push([`extendedProperties.${part}`, value])
    }
  }
  // A test reference must appear as a distinct value, not part of another ID.
  const found = fields.filter(([, text]) => {
    let offset = 0
    while ((offset = text.indexOf(reference, offset)) !== -1) {
      const before = text[offset - 1] || '', after = text[offset + reference.length] || ''
      if (!/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after)) return true
      offset += reference.length
    }
    return false
  }).map(([field]) => field)
  if (!found.length) return null
  return {
    fields: [...new Set(found)],
    hasAttendeeEmail: Array.isArray(event.attendees) && event.attendees.some((a) => typeof a?.email === 'string' && a.email.length > 0 && !a.organizer && !a.self),
    hasStartTime: typeof event.start?.dateTime === 'string',
    status: ['confirmed', 'tentative', 'cancelled'].includes(event.status) ? event.status : 'unknown',
  }
}

async function inspectCalendar({ reader, timeMin, timeMax, reference, maxPages = 10 }) {
  const start = Date.parse(timeMin), end = Date.parse(timeMax)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 31 * 86400000) throw new Error('Use a valid time window of at most 31 days.')
  if (!/^[a-f0-9]{32}$/.test(reference)) throw new Error('Use the 32-character lowercase test reference.')
  const matches = []
  let pageToken, pages = 0
  do {
    if (++pages > maxPages) throw new Error('Too many calendar pages; use a smaller time window.')
    const data = await reader.list({ timeMin, timeMax, pageToken })
    for (const event of data.items) {
      const result = inspectEvent(event, reference)
      if (result) matches.push(result)
    }
    pageToken = data.nextPageToken
  } while (pageToken)
  return { matchCount: matches.length, matches }
}

async function main() {
  const [, , timeMin, timeMax, reference, ...extra] = process.argv
  if (!timeMin || !timeMax || !reference || extra.length) throw new Error('Usage: node scripts/check-strategy-calendar.cjs START_ISO END_ISO TEST_REFERENCE')
  const result = await inspectCalendar({ reader: createCalendarReaderFromEnv(process.env), timeMin, timeMax, reference })
  console.log(`Matching events found: ${result.matchCount}`)
  if (result.matchCount === 1) {
    const match = result.matches[0]
    console.log(`Reference found in: ${match.fields.join(', ')}`)
    console.log(`Attendee email present: ${match.hasAttendeeEmail ? 'yes' : 'no'}`)
    console.log(`Start time present: ${match.hasStartTime ? 'yes' : 'no'}`)
    console.log(`Event status: ${match.status}`)
  } else console.log('No unique match. Review privately; no booking records were changed.')
}

if (require.main === module) main().catch(() => { console.error('Calendar check failed. Check settings and use a valid test window; do not share credentials or event data.') ; process.exitCode = 1 })
module.exports = { inspectEvent, inspectCalendar }
