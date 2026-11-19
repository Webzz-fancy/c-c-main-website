-- Bind the account Ziina returned at test intent creation to that attempt.
-- Nullable for older attempts; records without an account require review.
alter table public.strategy_bookings add column if not exists ziina_account_id text;
