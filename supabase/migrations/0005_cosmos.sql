-- ============================================================================
-- CRMO — Cosmos boards
--
-- A moodboard is often built on cosmos.so before it is a shoot. The cluster
-- link lives on the board so the shoot can open or embed it in place.
--
-- Only the link is stored. Cosmos has no public API, and their terms forbid
-- downloading content from the service with anything other than a browser, so
-- there is no import: the references come across by hand and each one keeps a
-- `sourceUrl` inside its payload jsonb pointing back here. No column needed
-- for that — mood_items.payload already carries it.
--
-- `cosmos_url` is validated client-side to the cosmos.so host before it is
-- ever put in an iframe. Anything written straight into this column by other
-- means is not trusted by the app.
-- ============================================================================

alter table public.moodboards add column if not exists cosmos_url   text;
alter table public.moodboards add column if not exists cosmos_title text;
