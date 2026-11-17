'use strict'

// Read-only Google Calendar adapter. This is deliberately not exposed through
// an HTTP endpoint or scheduler until authorization and event format are tested.
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/'

function createCalendarReader({ clientId, clientSecret, refreshToken, calendarId, fetchImpl = fetch }) {
  if (![clientId, clientSecret, refreshToken, calendarId].every((v) => typeof v === 'string' && v.trim() && !/^\.+$/.test(v.trim()))) throw new Error('Google Calendar configuration missing')
  return {
    async list({ timeMin, timeMax, pageToken } = {}) {
      if (!timeMin || !timeMax || !Number.isFinite(Date.parse(timeMin)) || !Number.isFinite(Date.parse(timeMax)) || Date.parse(timeMax) <= Date.parse(timeMin)) throw new Error('Valid calendar time range required')
      if (pageToken !== undefined && (typeof pageToken !== 'string' || pageToken.length > 2048)) throw new Error('Invalid page token')
      const tokenResponse = await fetchImpl(TOKEN_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }).toString(),
        signal: AbortSignal.timeout(10000), redirect: 'error',
      })
      if (!tokenResponse.ok) throw new Error('Calendar authorization failed')
      const token = await tokenResponse.json()
      if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Calendar authorization failed')
      const query = new URLSearchParams({ timeMin, timeMax, singleEvents: 'true', showDeleted: 'false', maxResults: '100' })
      if (pageToken) query.set('pageToken', pageToken)
      const response = await fetchImpl(`${CALENDAR_BASE}${encodeURIComponent(calendarId)}/events?${query}`, {
        headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(10000), redirect: 'error',
      })
      if (!response.ok) throw new Error('Calendar read failed')
      const data = await response.json()
      if (!Array.isArray(data.items)) throw new Error('Invalid calendar response')
      // Do not log or expose these private events to an unauthenticated client.
      return { items: data.items, nextPageToken: typeof data.nextPageToken === 'string' ? data.nextPageToken : null }
    },
  }
}
// These are server-only settings prepared in hPanel. Constructing a reader does
// not make a request, start a scheduler, or enable booking reconciliation.
function createCalendarReaderFromEnv(env, fetchImpl = fetch) {
  return createCalendarReader({
    clientId: env.GOOGLE_CALENDAR_CLIENT_ID,
    clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
    refreshToken: env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    calendarId: env.GOOGLE_CALENDAR_ID,
    fetchImpl,
  })
}

module.exports = { createCalendarReader, createCalendarReaderFromEnv }
