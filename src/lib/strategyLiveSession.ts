export type StrategyLiveSession =
  | { kind: 'new' }
  | { kind: 'paid'; reference: string; calendar: string }
  | { kind: 'pending' }
  | { kind: 'needs_review' }
  | { kind: 'error' }

// Only a server-confirmed absent session may offer a new checkout. Network
// errors, an invalid response and provider failures must not invite repaying.
export async function loadStrategyLiveSession(fetchImpl: typeof fetch = fetch): Promise<StrategyLiveSession> {
  try {
    const response = await fetchImpl('/api/strategy-live/status', { credentials: 'same-origin', cache: 'no-store' })
    const data = await response.json()
    if (response.status === 401 && data?.ok === false && data?.error === 'No booking session. Please contact us for help.') return { kind: 'new' }
    if (!response.ok || data?.ok !== true) return { kind: 'error' }
    if (data.status === 'pending' || data.status === 'needs_review') return { kind: data.status }
    if (data.status !== 'paid' || typeof data.reference !== 'string' || !/^[a-f0-9]{32}$/.test(data.reference) || typeof data.calendar !== 'string') return { kind: 'error' }
    const calendar = new URL(data.calendar)
    if (calendar.protocol !== 'https:' || calendar.hostname !== 'calendar.google.com' || calendar.port || calendar.username || calendar.password || !calendar.pathname.startsWith('/calendar/appointments/schedules/')) return { kind: 'error' }
    return { kind: 'paid', reference: data.reference, calendar: data.calendar }
  } catch { return { kind: 'error' } }
}
