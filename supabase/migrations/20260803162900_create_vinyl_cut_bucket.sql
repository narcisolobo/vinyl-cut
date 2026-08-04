-- Creates the "vinyl-cut" Storage bucket that Medusa's S3 file provider
-- uploads product cover art into (see apps/backend/medusa-config.ts).
--
-- The declarative `[storage.buckets.vinyl-cut]` block in config.toml does
-- NOT create this bucket on `supabase start`/`db reset` with the installed
-- CLI version (confirmed: it silently no-ops) -- this migration is the
-- reliable path, since `db reset` always replays supabase/migrations/.
--
-- public = true and allowed_mime_types are restricted to image/jpeg since
-- cover art is non-sensitive, publicly cacheable catalog content that
-- needs no signed URLs (matches notes/vinyl_cut_prd.html's File Storage
-- section).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vinyl-cut', 'vinyl-cut', true, 52428800, array['image/jpeg'])
on conflict (id) do nothing;
