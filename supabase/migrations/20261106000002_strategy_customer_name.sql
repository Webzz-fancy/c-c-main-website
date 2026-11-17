-- Prepared only. The existing table may already contain records, so this
-- remains nullable for legacy rows; checkout validates new names server-side.
-- Apply only after review and before testing the updated prototype.
alter table public.strategy_bookings add column if not exists customer_name text;
