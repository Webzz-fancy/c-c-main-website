-- Prepared only: apply in the approved Supabase project after review.
-- Server access only. No public/anon/authenticated table policies are created.
create table if not exists public.strategy_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  recovery_token_hash text not null unique,
  whatsapp_e164 text not null check (whatsapp_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  payment_environment text not null check (payment_environment in ('test', 'live')),
  ziina_intent_id text unique,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed', 'cancelled', 'refund_review', 'refunded')),
  booking_status text not null default 'not_booked' check (booking_status in ('not_booked', 'matched', 'needs_review', 'cancelled')),
  google_event_id text unique,
  booking_email text,
  booking_starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.strategy_bookings enable row level security;
revoke all on table public.strategy_bookings from public, anon, authenticated;
-- No matching or updates must be made directly from a visitor's browser.
