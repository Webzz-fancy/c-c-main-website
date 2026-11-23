import { useEffect, useRef, useState } from 'react'
import { site } from '../config/site'
import { loadStrategyLiveSession, type StrategyLiveSession } from '../lib/strategyLiveSession'

export default function StrategyLiveCheckout({ returned }: { returned: boolean }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [session, setSession] = useState<StrategyLiveSession | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [copied, setCopied] = useState(false)
  const checkoutInFlight = useRef(false)
  const statusRequest = useRef<Promise<StrategyLiveSession> | null>(null)

  useEffect(() => {
    let active = true
    // Reuse the request on React's development strict-mode remount as well.
    statusRequest.current ||= loadStrategyLiveSession()
    void statusRequest.current.then((result) => {
      if (!active) return
      setSession(result)
      if (result.kind === 'error') setMessage('We couldn’t check your payment. Please contact us before trying to pay again.')
      else if (returned && result.kind === 'new') setMessage('We couldn’t find your booking session. Please contact us before trying to pay again.')
    })
    return () => { active = false }
  }, [returned])

  const checkout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (checkoutInFlight.current || session?.kind !== 'new') return
    checkoutInFlight.current = true; setBusy(true); setMessage('')
    let handedOff = false
    try {
      const response = await fetch('/api/strategy-live/checkout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), phone: phone.trim() }) })
      const data = await response.json()
      if (!response.ok || !data.ok || typeof data.redirectUrl !== 'string') {
        if (response.status !== 400) setSession({ kind: 'error' })
        setMessage(response.status === 400 && typeof data.error === 'string' ? data.error : 'Could not start checkout. Please contact us before trying again.')
        return
      }
      const url = new URL(data.redirectUrl)
      if (url.protocol !== 'https:' || url.username || url.password || url.port || !(url.hostname === 'ziina.com' || url.hostname.endsWith('.ziina.com'))) throw new Error('invalid redirect')
      window.location.assign(url.href)
      handedOff = true
    } catch { setSession({ kind: 'error' }); setMessage('Could not start checkout. Please contact us before trying again.') }
    finally { if (!handedOff) { checkoutInFlight.current = false; setBusy(false) } }
  }

  return <div className="mx-2 flex-1 overflow-y-auto rounded-[20px] border border-black/[0.06] bg-white p-6 sm:mx-5 sm:p-10">
    {session?.kind === 'paid' ? <div>
      <h3 className="font-display text-2xl text-ink">Your payment is confirmed</h3>
      <p className="mt-3 text-sm text-ink-soft">Copy your booking reference and enter it in the Google booking form. Keep it in case you need help.</p>
      <p className="mt-2 break-all font-mono text-sm text-ink">{session.reference}</p>
      <button type="button" className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold" onClick={() => { void navigator.clipboard?.writeText(session.reference).then(() => setCopied(true)).catch(() => setCopied(false)) }}>{copied ? 'Copied' : 'Copy reference'}</button>
      <p className="mt-4 text-sm text-ink-soft">Choose a time and complete the Google form to confirm your appointment.</p>
      {!showCalendar ? <button type="button" onClick={() => setShowCalendar(true)} className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold">Choose a time</button> : <iframe src={session.calendar} title="Book your strategic consultation" className="mt-4 h-[500px] w-full rounded-xl border border-black/10" />}
    </div> : <div>
      {session?.kind === 'pending' && <p className="text-sm text-ink-soft">Your payment hasn’t been confirmed yet. You can reopen this page in the same browser to check again, or contact us before paying again.</p>}
      {session?.kind === 'needs_review' && <p className="text-sm text-ink-soft">This payment needs a review. Please contact us before paying again.</p>}
      {!returned && session?.kind === 'new' && <form onSubmit={checkout} className="grid max-w-lg gap-4">
        <p className="text-sm text-ink-soft">Pay AED 1,200 securely with Ziina, then choose a time for your 90-minute consultation.</p>
        <label className="grid gap-1 text-sm font-semibold">Name<input required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-black/20 px-3 py-2 font-normal" /></label>
        <label className="grid gap-1 text-sm font-semibold">WhatsApp number (include country code)<input required type="tel" autoComplete="tel" placeholder="+971501234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-black/20 px-3 py-2 font-normal" /></label>
        <button type="submit" disabled={busy} className="w-fit rounded-full bg-brand px-5 py-3 text-sm font-semibold disabled:opacity-50">Continue to secure payment</button>
      </form>}
    </div>}
    {message && <p role="alert" className="mt-4 text-sm text-red-700">{message}</p>}
    <div className="mt-5 text-sm text-ink-soft">
      <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-black/20 px-4 py-2 font-semibold text-glass">Having trouble? Contact us on WhatsApp</a>
      <p className="mt-2">Please don’t send card details. If you have a booking reference, you can share it privately with the team.</p>
    </div>
    {(busy || !session) && <p aria-live="polite" className="mt-4 text-sm text-ink-soft">Checking…</p>}
  </div>
}
