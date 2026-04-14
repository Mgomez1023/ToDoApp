-- Pulse Board schema
-- This schema is safe to run in the Supabase SQL editor.
-- It creates the core tables, ownership constraints, indexes, trigger helpers,
-- and Row Level Security policies needed for anonymous guest users.

create extension if not exists "pgcrypto";

-- Keep all task timestamps current on writes.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Core task records owned by the authenticated guest user.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

-- Lightweight per-user collaborators for assignee avatars.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  avatar_color text not null check (char_length(trim(avatar_color)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists team_members_user_id_idx on public.team_members (user_id);

-- Many-to-many mapping between tasks and team members.
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  primary key (task_id, team_member_id)
);

alter table public.tasks enable row level security;
alter table public.team_members enable row level security;
alter table public.task_assignees enable row level security;

-- Tasks: each authenticated anonymous user can only touch rows they own.
drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
on public.tasks
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
on public.tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks
for delete
using (auth.uid() = user_id);

-- Team members: same ownership pattern as tasks.
drop policy if exists "Users can view their own team members" on public.team_members;
create policy "Users can view their own team members"
on public.team_members
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own team members" on public.team_members;
create policy "Users can insert their own team members"
on public.team_members
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own team members" on public.team_members;
create policy "Users can update their own team members"
on public.team_members
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own team members" on public.team_members;
create policy "Users can delete their own team members"
on public.team_members
for delete
using (auth.uid() = user_id);

-- Task assignees: access is derived from ownership of the parent task.
-- Inserts and updates also require the linked team member to belong to the same user.
drop policy if exists "Users can view assignees for their own tasks" on public.task_assignees;
create policy "Users can view assignees for their own tasks"
on public.task_assignees
for select
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert assignees for their own tasks" on public.task_assignees;
create policy "Users can insert assignees for their own tasks"
on public.task_assignees
for insert
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.team_members
    where team_members.id = task_assignees.team_member_id
      and team_members.user_id = auth.uid()
  )
);

drop policy if exists "Users can update assignees for their own tasks" on public.task_assignees;
create policy "Users can update assignees for their own tasks"
on public.task_assignees
for update
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.team_members
    where team_members.id = task_assignees.team_member_id
      and team_members.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete assignees for their own tasks" on public.task_assignees;
create policy "Users can delete assignees for their own tasks"
on public.task_assignees
for delete
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_assignees.task_id
      and tasks.user_id = auth.uid()
  )
);
