-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text not null,
  avatar_url text,
  streak_count integer default 0,
  last_daily_achievement timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security for profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create achievement type enum
create type achievement_type as enum ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- Create achievements table
create table public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  type achievement_type not null,
  emoji text not null,
  is_daily boolean default false,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security for achievements
alter table public.achievements enable row level security;

-- Create policies for achievements
create policy "Achievements are viewable by everyone." on public.achievements
  for select using (true);

create policy "Authenticated users can insert achievements." on public.achievements
  for insert with check (auth.role() = 'authenticated');

-- Create user_achievements table
create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles not null,
  achievement_id text references public.achievements not null,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

-- Set up Row Level Security for user_achievements
alter table public.user_achievements enable row level security;

-- Create policies for user_achievements
create policy "User achievements are viewable by everyone." on public.user_achievements
  for select using (true);

create policy "Users can insert their own achievements." on public.user_achievements
  for insert with check (auth.uid() = user_id);

-- Create function for leaderboard
create or replace function public.get_leaderboard_users(limit_count integer default 10)
returns table (
  id uuid,
  username text,
  avatar_url text,
  streak_count integer,
  created_at timestamp with time zone,
  achievementCount bigint
) language sql as $$
  select
    p.id,
    p.username,
    p.avatar_url,
    p.streak_count,
    p.created_at,
    count(ua.id) as achievementCount
  from
    profiles p
    left join user_achievements ua on p.id = ua.user_id
  group by
    p.id
  order by
    count(ua.id) desc,
    p.streak_count desc
  limit limit_count;
$$; 