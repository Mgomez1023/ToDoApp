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

-- Keep task ownership stable even when assignees can update shared tasks.
create or replace function public.prevent_task_owner_change()
returns trigger
language plpgsql
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'Task owner cannot be changed.';
  end if;

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

drop trigger if exists prevent_task_owner_change on public.tasks;
create trigger prevent_task_owner_change
before update on public.tasks
for each row
execute function public.prevent_task_owner_change();

-- Searchable guest workspace profiles for linking collaborators by guest code.
create table if not exists public.workspace_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  guest_code text not null unique,
  avatar_color text not null check (char_length(trim(avatar_color)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

-- Lightweight per-user collaborators for assignee avatars.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  linked_user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  avatar_color text not null check (char_length(trim(avatar_color)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.team_members
add column if not exists linked_user_id uuid references auth.users (id) on delete set null;

create index if not exists team_members_user_id_idx on public.team_members (user_id);
create index if not exists team_members_linked_user_id_idx on public.team_members (linked_user_id);
create unique index if not exists team_members_user_linked_user_idx
on public.team_members (user_id, linked_user_id)
where linked_user_id is not null;

-- Lookup helpers used by RLS and guest linking.
create or replace function public.is_task_owner(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks
    where tasks.id = target_task_id
      and tasks.user_id = auth.uid()
  );
$$;

create or replace function public.is_task_assignee(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.task_assignees
    join public.team_members
      on team_members.id = task_assignees.team_member_id
    where task_assignees.task_id = target_task_id
      and team_members.linked_user_id = auth.uid()
  );
$$;

create or replace function public.can_read_task(target_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_task_owner(target_task_id)
      or public.is_task_assignee(target_task_id);
$$;

-- Many-to-many mapping between tasks and team members.
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  primary key (task_id, team_member_id)
);

create index if not exists task_assignees_team_member_id_idx
on public.task_assignees (team_member_id);

-- Reusable owner-scoped labels that can be attached to many tasks.
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  color text not null check (char_length(trim(color)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists labels_user_id_idx on public.labels (user_id);
create unique index if not exists labels_user_name_idx
on public.labels (user_id, lower(name));

-- Many-to-many label assignments for tasks.
create table if not exists public.task_labels (
  task_id uuid not null references public.tasks (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  position integer not null default 0,
  primary key (task_id, label_id)
);

alter table public.task_labels
add column if not exists position integer;

update public.task_labels as task_labels
set position = ranked.position
from (
  select
    task_id,
    label_id,
    row_number() over (
      partition by task_id
      order by label_id
    ) - 1 as position
  from public.task_labels
) as ranked
where task_labels.task_id = ranked.task_id
  and task_labels.label_id = ranked.label_id
  and task_labels.position is null;

alter table public.task_labels
alter column position set default 0;

update public.task_labels
set position = 0
where position is null;

alter table public.task_labels
alter column position set not null;

create index if not exists task_labels_label_id_idx on public.task_labels (label_id);
create index if not exists task_labels_task_id_idx on public.task_labels (task_id);
create index if not exists task_labels_task_id_position_idx
on public.task_labels (task_id, position);

-- Compact task comments shown inside the task detail experience.
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comments_task_id_created_at_idx
on public.comments (task_id, created_at);
create index if not exists comments_user_id_idx on public.comments (user_id);

-- Lightweight activity feed for high-signal task changes.
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (char_length(trim(event_type)) > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists task_activity_task_id_created_at_idx
on public.task_activity (task_id, created_at);
create index if not exists task_activity_actor_user_id_idx
on public.task_activity (actor_user_id);

alter table public.tasks enable row level security;
alter table public.workspace_profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.task_assignees enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;
alter table public.task_activity enable row level security;

-- Tasks: owners can insert and delete their own rows. Reads and updates use the
-- row's user_id directly for owners so INSERT ... RETURNING remains readable.
drop policy if exists "Users can view their own tasks" on public.tasks;
create policy "Users can view their own tasks"
on public.tasks
for select
using (auth.uid() = user_id or public.is_task_assignee(id));

drop policy if exists "Users can insert their own tasks" on public.tasks;
create policy "Users can insert their own tasks"
on public.tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tasks" on public.tasks;
create policy "Users can update their own tasks"
on public.tasks
for update
using (auth.uid() = user_id or public.is_task_assignee(id))
with check (auth.uid() = user_id or public.is_task_assignee(id));

drop policy if exists "Users can delete their own tasks" on public.tasks;
create policy "Users can delete their own tasks"
on public.tasks
for delete
using (public.is_task_owner(id));

-- Workspace profiles: each guest can maintain their own public lookup profile.
drop policy if exists "Users can view their own workspace profile" on public.workspace_profiles;
create policy "Users can view their own workspace profile"
on public.workspace_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own workspace profile" on public.workspace_profiles;
create policy "Users can insert their own workspace profile"
on public.workspace_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own workspace profile" on public.workspace_profiles;
create policy "Users can update their own workspace profile"
on public.workspace_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own workspace profile" on public.workspace_profiles;
create policy "Users can delete their own workspace profile"
on public.workspace_profiles
for delete
using (auth.uid() = user_id);

create or replace function public.find_workspace_profile(lookup_guest_code text)
returns table (
  user_id uuid,
  guest_code text,
  avatar_color text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    workspace_profiles.user_id,
    workspace_profiles.guest_code,
    workspace_profiles.avatar_color,
    workspace_profiles.created_at
  from public.workspace_profiles
  where workspace_profiles.guest_code = upper(trim(lookup_guest_code))
  limit 1;
$$;

grant execute on function public.find_workspace_profile(text) to authenticated;

-- Team members: same ownership pattern as tasks.
drop policy if exists "Users can view their own team members" on public.team_members;
create policy "Users can view their own team members"
on public.team_members
for select
using (auth.uid() = user_id or linked_user_id = auth.uid());

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
-- Inserts and updates require the linked team member to belong to the task owner.
drop policy if exists "Users can view assignees for their own tasks" on public.task_assignees;
create policy "Users can view assignees for their own tasks"
on public.task_assignees
for select
using (public.can_read_task(task_id));

drop policy if exists "Users can insert assignees for their own tasks" on public.task_assignees;
create policy "Users can insert assignees for their own tasks"
on public.task_assignees
for insert
with check (
  public.is_task_owner(task_id)
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
using (public.is_task_owner(task_id))
with check (
  public.is_task_owner(task_id)
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
using (public.is_task_owner(task_id));

-- Labels stay scoped to the task owner's workspace, but linked assignees can read
-- only the labels attached to tasks they already have access to.
drop policy if exists "Users can view labels they can access" on public.labels;
create policy "Users can view labels they can access"
on public.labels
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.task_labels
    where task_labels.label_id = id
      and public.can_read_task(task_labels.task_id)
  )
);

drop policy if exists "Users can insert their own labels" on public.labels;
create policy "Users can insert their own labels"
on public.labels
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own labels" on public.labels;
create policy "Users can update their own labels"
on public.labels
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own labels" on public.labels;
create policy "Users can delete their own labels"
on public.labels
for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view task labels for readable tasks" on public.task_labels;
create policy "Users can view task labels for readable tasks"
on public.task_labels
for select
using (public.can_read_task(task_id));

drop policy if exists "Users can insert task labels for their own tasks" on public.task_labels;
create policy "Users can insert task labels for their own tasks"
on public.task_labels
for insert
with check (
  public.is_task_owner(task_id)
  and exists (
    select 1
    from public.labels
    where labels.id = task_labels.label_id
      and labels.user_id = auth.uid()
  )
);

drop policy if exists "Users can update task labels for their own tasks" on public.task_labels;
create policy "Users can update task labels for their own tasks"
on public.task_labels
for update
using (public.is_task_owner(task_id))
with check (
  public.is_task_owner(task_id)
  and exists (
    select 1
    from public.labels
    where labels.id = task_labels.label_id
      and labels.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete task labels for their own tasks" on public.task_labels;
create policy "Users can delete task labels for their own tasks"
on public.task_labels
for delete
using (
  public.is_task_owner(task_id)
  and exists (
    select 1
    from public.labels
    where labels.id = task_labels.label_id
      and labels.user_id = auth.uid()
  )
);

drop policy if exists "Users can view comments for readable tasks" on public.comments;
create policy "Users can view comments for readable tasks"
on public.comments
for select
using (public.can_read_task(task_id));

drop policy if exists "Users can insert comments for readable tasks" on public.comments;
create policy "Users can insert comments for readable tasks"
on public.comments
for insert
with check (
  public.can_read_task(task_id)
  and auth.uid() = user_id
);

drop policy if exists "Users can view activity for readable tasks" on public.task_activity;
create policy "Users can view activity for readable tasks"
on public.task_activity
for select
using (public.can_read_task(task_id));

drop policy if exists "Users can insert activity for readable tasks" on public.task_activity;
create policy "Users can insert activity for readable tasks"
on public.task_activity
for insert
with check (
  public.can_read_task(task_id)
  and (actor_user_id is null or actor_user_id = auth.uid())
);
