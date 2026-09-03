-- ============================================================================
-- CRMO — Instagram handles
--
-- A client's Instagram is their portfolio: the fastest read on what they have
-- been putting out and what they will expect back. It sits on the record next
-- to the email and the phone number.
--
-- The handle is stored, never the URL. A pasted share link carries tracking
-- parameters and a session id, and rots; "somestudio" does not.
--
-- Nullable and with no default: an absent handle is absent, not an empty
-- string, so `fromRow` drops it and the client sees `undefined`.
-- ============================================================================

alter table public.contacts  add column if not exists instagram text;
alter table public.companies add column if not exists instagram text;
