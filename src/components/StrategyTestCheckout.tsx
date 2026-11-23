import { useCallback, useEffect, useState } from 'react'
import { site } from '../config/site'

type Status = { ok?: boolean; status?: string; providerStatus?: string; reference?: string; calendar?: string; error?: string; emailAvailable?: boolean; inDescription?: boolean; inExtendedProperties?: boolean; hasHtml?: boolean; hasLabel?: boolean; layout?: string; reason?: string }

// This is deliberately opt-in at build time AND the backend is test-only.
// Never enable this build flag on the public site for real customers.
export default function StrategyTestCheckout({ returned }: { returned: boolean }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Status | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')

  const checkStatus = useCallback(async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/strategy/status', { credentials: 'same-origin', cache: 'no-store' })
      const data: Status = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to check payment.')
      if (data.status === 'paid') {
        const calendar = new URL(data.calendar || '')
        if (calendar.protocol !== 'https:' || calendar.hostname !== 'calendar.google.com' || calendar.port || calendar.username || calendar.password || !calendar.pathname.startsWith('/calendar/appointments/schedules/') || !/^[a-f0-9]{32}$/.test(data.reference || '')) throw new Error('Booking details could not be verified.')
      }
      setResult(data)
    } catch {
      setMessage('We couldn’t check the payment. Please contact the team before attempting another payment.')
    } finally { setBusy(false) }
  }, [])

  useEffect(() => { if (returned) void checkStatus() }, [returned, checkStatus])

  const checkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/strategy/checkout', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok || typeof data.redirectUrl !== 'string') {
        setMessage(typeof data.error === 'string' ? data.error : 'Could not start checkout. Please contact the team before trying again.')
        return
      }
      const url = new URL(data.redirectUrl)
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !(url.hostname === 'ziina.com' || url.hostname.endsWith('.ziina.com'))) throw new Error('Invalid checkout URL')
      window.location.assign(url.href)
    } catch {
      setMessage('Could not start checkout. Please contact the team before trying again.')
    } finally { setBusy(false) }
  }

  const checkTestBooking = async () => {
    setBusy(true); setBookingMessage('')
    try {
      const response = await fetch('/api/strategy/match-test-booking', { method: 'POST', credentials: 'same-origin', cache: 'no-store' })
      const data: Status = await response.json()
      if (!response.ok || !data.ok) throw new Error('check failed')
      if (data.status === 'matched') setBookingMessage('A matching test reference was found and saved to this payment record. Confirm the appointment in Google as well.' + (data.emailAvailable ? ' An attendee email is present, but has not been saved or verified as the customer’s.' : ''))
      else if (data.status === 'previously_matched') setBookingMessage('A match was saved earlier. Please check Google for any changes or cancellations.')
      else if (data.status === 'needs_review') setBookingMessage('The test match needs a private review. Do not assume the appointment is missing.')
      else if (data.status === 'reference_found_unmatched') setBookingMessage(`The reference appeared in Google, but no match was saved. ${data.reason === 'record_changed' ? 'The payment record changed or could not be matched safely.' : 'The answer format was not recognized for a safe match.'} Format check: description ${data.inDescription ? 'yes' : 'no'}, extra properties ${data.inExtendedProperties ? 'yes' : 'no'}, HTML ${data.hasHtml ? 'yes' : 'no'}, label ${data.hasLabel ? 'yes' : 'no'}, layout ${data.layout || 'not_visible'}.` + (data.emailAvailable ? ' An attendee email is present, but has not been saved or verified as the customer’s.' : ''))
      else setBookingMessage('No match was found yet. This does not mean the appointment was not booked; check Google and the reference.')
    } catch { setBookingMessage('The test booking could not be checked. Check the test settings and Google connection.') }
    finally { setBusy(false) }
  }

  return (
    <div className="mx-2 flex-1 overflow-y-auto rounded-[20px] border border-black/[0.06] bg-white p-6 sm:mx-5 sm:p-10">
      <p className="rounded-xl bg-brand-50 p-3 text-sm font-semibold text-ink">Private test only. Do not enter real customer or payment details.</p>
      {result?.status === 'paid' && result.reference && result.calendar ? (
        <div className="mt-5">
          <h3 className="font-display text-2xl text-ink">Test payment verified</h3>
          <p className="mt-3 text-sm text-ink-soft">Use this reference in the Google booking form if it has been configured to request one:</p>
          <p className="mt-2 break-all font-mono text-sm text-ink">{result.reference}</p>
          <button type="button" className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold" onClick={() => { void navigator.clipboard?.writeText(result.reference || '').then(() => setCopied(true)).catch(() => setCopied(false)) }}>{copied ? 'Copied' : 'Copy reference'}</button>
          <p className="mt-4 text-sm text-ink-soft">Google confirms the appointment in its own form. After booking, you can check the reference match for this test.</p>
          {!showCalendar ? <button type="button" onClick={() => setShowCalendar(true)} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold">Open test calendar</button> : <iframe src={result.calendar} title="Test strategy appointment calendar" className="mt-4 h-[500px] w-full rounded-xl border border-black/10" />}
          <div><button type="button" onClick={() => void checkTestBooking()} disabled={busy} className="mt-4 text-sm font-semibold text-glass underline disabled:opacity-50">Check test booking match</button></div>
          {bookingMessage && <p aria-live="polite" className="mt-3 text-sm text-ink-soft">{bookingMessage}</p>}
        </div>
      ) : (
        <div className="mt-5">
          {result?.status === 'pending' && <p className="text-sm text-ink-soft">{result.providerStatus === 'requires_payment_instrument' ? 'Ziina reports that the payment method is still required.' : result.providerStatus === 'requires_user_action' ? 'Ziina reports that another action is required on its payment page.' : result.providerStatus === 'failed' ? 'Ziina reports that this test payment failed.' : result.providerStatus === 'pending' ? 'Ziina reports that the test payment is processing.' : 'Ziina has not confirmed this test payment.'} Do not start a second payment; check again or contact the team.</p>}
          {result?.status === 'needs_review' && <p className="text-sm text-ink-soft">This attempt needs review. Contact the team before paying again.</p>}
          {!returned && !result && <form onSubmit={checkout} className="grid max-w-lg gap-4">
            <label className="grid gap-1 text-sm font-semibold">Name<input required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-black/20 px-3 py-2 font-normal" /></label>
            <label className="grid gap-1 text-sm font-semibold">WhatsApp number (include country code)<input required type="tel" autoComplete="tel" placeholder="+971501234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-black/20 px-3 py-2 font-normal" /></label>
            <button type="submit" disabled={busy} className="w-fit rounded-full bg-brand px-5 py-3 text-sm font-semibold disabled:opacity-50">Continue to test payment</button>
          </form>}
          <button type="button" onClick={() => void checkStatus()} disabled={busy} className="mt-4 text-sm font-semibold text-glass underline disabled:opacity-50">Check existing test payment</button>
        </div>
      )}
      {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
      <p className="mt-5 text-sm text-ink-soft">Need help with a test payment or booking? <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-glass underline">Message us on WhatsApp</a> or <a href={`mailto:${site.contact.email}`} className="font-semibold text-glass underline">email us</a>. Please don’t send card details. If you have a booking reference, you can share it privately with the team.</p>
      {busy && <p aria-live="polite" className="mt-4 text-sm text-ink-soft">Checking…</p>}
    </div>
  )
}
