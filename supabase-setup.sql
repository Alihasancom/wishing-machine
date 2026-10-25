-- Wishlight starter database setup
-- Run this whole file in Supabase Dashboard > SQL Editor > New query.
-- This starter allows anonymous visitors to create and read wishes.
-- Anyone with the public link can read the wish; do not store sensitive information.

create extension if not exists pgcrypto;

create table if not exists public.birthday_wishes (
  id uuid primary key,
  recipient_name text not null check (char_length(recipient_name) between 1 and 70),
  sender_name text not null default '' check (char_length(sender_name) <= 70),
  relationship text not null default 'Someone special',
  theme text not null default 'dreamy' check (theme in ('dreamy','gold','garden','galaxy')),
  message text not null check (char_length(message) between 1 and 5000),
  blessings text not null default '' check (char_length(blessings) <= 2500),
  final_letter text not null default '' check (char_length(final_letter) <= 2500),
  gift_enabled boolean not null default true,
  media jsonb not null default '{"photos":[],"video":null,"music":null}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.birthday_wishes enable row level security;

drop policy if exists "Anyone can create a birthday wish" on public.birthday_wishes;
create policy "Anyone can create a birthday wish"
on public.birthday_wishes for insert to anon, authenticated
with check (true);

drop policy if exists "Anyone can read wishes by link" on public.birthday_wishes;
create policy "Anyone can read wishes by link"
on public.birthday_wishes for select to anon, authenticated
using (true);

-- Create a public bucket for media attached to public share links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wish-media',
  'wish-media',
  true,
  36700160,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif',
        'video/mp4','video/webm','video/quicktime',
        'audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm']
)
on conflict (id) do update
set public = true,
    file_size_limit = 36700160,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload wish media" on storage.objects;
create policy "Anyone can upload wish media"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'wish-media');

-- Public bucket URLs are readable by anyone who has the URL.
-- There is intentionally no public update or delete policy.
