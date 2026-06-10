-- Create RSVP table for tracking confirmed attendances
create table if not exists rsvp (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  message     text,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table rsvp enable row level security;

-- Public can insert (guests confirming attendance)
create policy "public_insert_rsvp" on rsvp
  for insert to anon, authenticated with check (true);

-- Only authenticated admins can read all RSVPs
create policy "admin_read_rsvp" on rsvp
  for select to authenticated using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only authenticated admins can delete RSVPs
create policy "admin_delete_rsvp" on rsvp
  for delete to authenticated using (
    exists (
      select 1 from user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );
