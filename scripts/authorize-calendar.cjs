'use strict'

// One-time local setup helper, not a public web endpoint. Run on the Windows
// computer whose browser will be used for the calendar owner's consent.
const http = require('node:http')
const crypto = require('node:crypto')
const readline = require('node:readline/promises')
const { stdin, stdout } = require('node:process')

const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly'
const random = () => crypto.randomBytes(32).toString('base64url')
const challengeFor = (verifier) => crypto.createHash('sha256').update(verifier).digest('base64url')

function authorizationUrl({ clientId, redirectUri, state, verifier }) {
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: 'code',
    scope: SCOPE, state, code_challenge: challengeFor(verifier),
    code_challenge_method: 'S256', access_type: 'offline', prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

function callbackResult(requestPath, expectedState) {
  let url
  try { url = new URL(requestPath, 'http://127.0.0.1') } catch { return null }
  if (url.pathname !== '/oauth2callback' || url.searchParams.getAll('state').length !== 1 || url.searchParams.get('state') !== expectedState) return null
  if (url.searchParams.getAll('error').length === 1) return { error: true }
  const codes = url.searchParams.getAll('code')
  return codes.length === 1 && codes[0] ? { code: codes[0] } : null
}

async function exchange({ code, clientId, clientSecret, redirectUri, verifier, fetchImpl = fetch }) {
  const body = new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code_verifier: verifier, grant_type: 'authorization_code' })
  const response = await fetchImpl('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Google could not exchange the authorization. Check the client credentials and try again.')
  const tokens = await response.json()
  if (typeof tokens.access_token !== 'string' || !tokens.access_token || typeof tokens.refresh_token !== 'string' || !tokens.refresh_token) throw new Error('Google did not return a refresh token. Check the consent screen and try again.')
  return tokens
}

async function checkCalendar({ accessToken, calendarId, fetchImpl = fetch }) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`)
  url.searchParams.set('maxResults', '1')
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${accessToken}` }, redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Google did not allow reading this calendar. Check the calendar ID, signed-in account, permissions and Calendar API.')
  const data = await response.json()
  if (!Array.isArray(data.items)) throw new Error('Unexpected response from Google Calendar.')
  // Never print event details or customer data.
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Run this interactively in a private terminal, not in a log or automated process.')
  console.log('\nCalendar setup: use a private screen. Do not send credentials, the consent link or terminal output in chat.\n')
  const rl = readline.createInterface({ input: stdin, output: stdout })
  let clientId, clientSecret, calendarId
  try {
    clientId = (await rl.question('Google Desktop OAuth client ID: ')).trim()
    clientSecret = (await rl.question('Google Desktop OAuth client secret (visible while typing): ')).trim()
    calendarId = (await rl.question('Calendar ID (press Enter for the signed-in account\'s primary calendar): ')).trim() || 'primary'
  } finally { rl.close() }
  if (!clientId || !clientSecret || !calendarId || /[\r\n]/.test(calendarId)) throw new Error('Client ID, client secret and calendar ID are required.')

  const state = random(), verifier = random()
  let finish
  const result = new Promise((resolve, reject) => { finish = { resolve, reject } })
  const server = http.createServer((req, res) => {
    const match = req.method === 'GET' && callbackResult(req.url, state)
    if (!match) { res.writeHead(400, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); res.end('Invalid request.'); return }
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' })
    res.end(match.error ? 'Authorization was declined. You may close this tab.' : 'Authorization received. Return to your terminal for the result.')
    if (match.error) finish.reject(new Error('Authorization was declined or blocked by Google.'))
    else finish.resolve(match.code)
  })
  server.requestTimeout = 10000
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const redirectUri = `http://127.0.0.1:${server.address().port}/oauth2callback`
  const timer = setTimeout(() => finish.reject(new Error('Authorization timed out. Run the helper again.')), 10 * 60 * 1000)
  try {
    console.log('\nOpen this link in a browser ON THIS COMPUTER. Your boss should sign in as the calendar owner and review the permission:\n')
    console.log(authorizationUrl({ clientId, redirectUri, state, verifier }))
    console.log('\nWaiting for Google...')
    const code = await result
    server.close()
    const tokens = await exchange({ code, clientId, clientSecret, redirectUri, verifier })
    await checkCalendar({ accessToken: tokens.access_token, calendarId })
    console.log('\nGoogle accepted consent and the selected calendar can be read. No event details were displayed.')
    console.log('PRIVATE: copy the following refresh token into the server settings only when instructed. Do not share it in chat:')
    console.log(tokens.refresh_token)
    console.log('\nThis checks access only. It does not deploy the backend, connect Supabase, enable payments, or match bookings.')
  } finally {
    clearTimeout(timer)
    server.close()
  }
}

if (require.main === module) main().catch((error) => { console.error(`\nCalendar setup failed: ${error.message}`); process.exitCode = 1 })
module.exports = { SCOPE, challengeFor, authorizationUrl, callbackResult, exchange, checkCalendar }
