alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

create policy "profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users can view their own or assigned tasks"
  on public.tasks for select
  using (auth.uid() = created_by or auth.uid() = assigned_to);

create policy "users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = created_by);

create policy "creator or assignee can update task"
  on public.tasks for update
  using (auth.uid() = created_by or auth.uid() = assigned_to);