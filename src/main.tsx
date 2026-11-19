import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import BookingPopup from './components/BookingPopup'
import StrategyPrivateTest from './components/StrategyPrivateTest'
import { trackBookingClicks } from './lib/track'

const query = new URLSearchParams(window.location.search)
const testPage = import.meta.env.VITE_STRATEGY_TEST_UI === 'true' && window.location.pathname === '/' && (query.get('strategy-test') === '1' || ['paid', 'cancelled'].includes(query.get('booking') || ''))
if (!testPage) trackBookingClicks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {testPage ? <StrategyPrivateTest /> : <><App /><BookingPopup /></>}
  </StrictMode>,
)
