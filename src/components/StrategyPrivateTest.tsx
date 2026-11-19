import { useEffect, useState } from 'react'
import StrategyTestCheckout from './StrategyTestCheckout'

// Test-only page. The server independently checks the access cookie on every
// checkout/status request; hiding this page is not the security boundary.
export default function StrategyPrivateTest() {
  const [access, setAccess] = useState<'checking' | 'login' | 'allowed'>('checking')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const returned = ['paid', 'cancelled'].includes(new URLSearchParams(window.location.search).get('booking') || '')

  useEffect(() => {
    document.getElementById('prerender')?.remove()
    document.title = 'Private strategy checkout test'
    const meta = document.createElement('meta')
    meta.name = 'robots'; meta.content = 'noindex, nofollow'; document.head.appendChild(meta)
    void fetch('/api/strategy-test/session', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => setAccess(response.ok ? 'allowed' : 'login'))
      .catch(() => setAccess('login'))
    return () => { meta.remove() }
  }, [])

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/strategy-test/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      setPassword('')
      if (!response.ok) { setMessage(response.status === 429 ? 'Too many attempts. Please wait and try again.' : 'Test access could not be opened. Check the password and test setup.'); return }
      setAccess('allowed')
    } catch { setPassword(''); setMessage('Test access could not be opened. Please try again.') }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-cream px-4 py-10 text-ink">
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl">Private strategy checkout test</h1>
      <p className="mt-2 text-sm text-ink-soft">Team testing only. Do not enter real customer or payment details.</p>
      {access === 'checking' ? <p className="mt-6">Checking test access…</p> : access === 'allowed' ? <div className="mt-6"><StrategyTestCheckout returned={returned} /></div> : <form onSubmit={login} className="mt-6 grid max-w-md gap-3 rounded-2xl bg-white p-6">
        <label className="grid gap-2 text-sm font-semibold">Test password<input type="password" required maxLength={256} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-black/20 px-3 py-2 font-normal" /></label>
        <button disabled={busy} className="w-fit rounded-full bg-brand px-5 py-3 text-sm font-semibold disabled:opacity-50">Open test</button>
        {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      </form>}
    </div>
  </main>
}
