-- Create the user_progress table
create table if not exists public.user_progress (
  profile_key text primary key,
  display_name text not null,
  avatar_url text,
  total_hours numeric default 0,
  completed_hours numeric default 0,
  last_updated timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.user_progress enable row level security;

-- Create policy to allow all access (for development)
-- NOTE: In a production app, you should restrict this to authenticated users or specific logic.
create policy "Enable all access for now" on public.user_progress
  for all
  using (true)
  with check (true);

-- Create the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access control for the 'avatars' bucket
-- 1. Allow public to view avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Allow anyone to upload avatars (For development/testing)
-- In production, you might want to restrict this to authenticated users.
create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'avatars' );

-- 3. Allow anyone to update/overwrite avatars in the 'avatars' bucket
create policy "Public Update"
on storage.objects for update
using ( bucket_id = 'avatars' );

-- 21. Enable Realtime for this table
-- 1. Create the publication if it doesn't exist
-- 2. Add the table to the publication
begin;
  -- If you want to enable for ONLY specific tables:
  alter publication supabase_realtime add table public.user_progress;
commit;
