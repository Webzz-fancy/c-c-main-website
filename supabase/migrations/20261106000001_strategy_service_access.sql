-- Server-only access; the public, anon and authenticated roles remain revoked.
grant select, insert, update on table public.strategy_bookings to service_role;
