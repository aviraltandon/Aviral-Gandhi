-- ============================================================
-- Aviral & Gandhi · Storage + Seed Migration 003
-- ============================================================

-- ---------- STORAGE BUCKETS ----------
-- Run these via Supabase Dashboard > Storage, or via SQL:
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('party-logos', 'party-logos', true)
  on conflict (id) do nothing;

-- Storage RLS: users can upload their own avatars
create policy "avatars_select" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_delete_own" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "logos_select" on storage.objects for select using (bucket_id = 'party-logos');
create policy "logos_insert_authed" on storage.objects for insert
  with check (bucket_id = 'party-logos' and auth.uid() is not null);
create policy "logos_update_own" on storage.objects for update
  using (bucket_id = 'party-logos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "logos_delete_own" on storage.objects for delete
  using (bucket_id = 'party-logos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED YOUR ADMIN ACCOUNT
-- ============================================================
-- After you sign up for the first time at /auth/signup with your
-- real email, run this in the Supabase SQL Editor (replace email):
--
--   update public.profiles set role = 'admin'
--   where email = 'YOUR_EMAIL_HERE@example.com';
--
-- That makes you the first admin. From there you can promote others
-- from inside the Admin Panel of the app.
