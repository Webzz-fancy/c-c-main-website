import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import BookingPopup from './components/BookingPopup'
import { trackBookingClicks } from './lib/track'

trackBookingClicks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <BookingPopup />
  </StrictMode>,
)
