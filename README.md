# Pointless Achievements

A fun, quirky web application for unlocking and sharing hilariously pointless achievements that celebrate the mundane moments of your digital life.

## Features

- **Try Before You Sign Up**: Users can claim achievements without creating an account
- **Achievement System**: Randomly generates humorous and absurd achievements with varying rarity levels
- **User Accounts**: Supabase authentication for user registration and login to track achievements
- **Daily Achievements**: Return daily to unlock new achievements and build your streak
- **Dashboard**: Filter, sort, and view your growing collection of pointless achievements  
- **Social Sharing**: Share your achievements on social media platforms
- **Leaderboard**: Compete with others to see who has the most achievements

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication & Database**: Supabase
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Hooks (useState, useEffect)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Supabase account (free tier works great)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd achievements
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Create the following tables:
     - `profiles`: To store user information
     - `achievements`: To store achievement details
     - `user_achievements`: To track which users have unlocked which achievements
   - Use the SQL in the `database/schema.sql` file to set up your database

4. Configure environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Supabase URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Schema

Create the following tables in your Supabase project:

### profiles
```sql
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text not null,
  avatar_url text,
  streak_count integer default 0,
  last_daily_achievement timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);
```

### achievements
```sql
create type achievement_type as enum ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

create table public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  type achievement_type not null,
  emoji text not null,
  is_daily boolean default false,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security
alter table public.achievements enable row level security;

-- Create policies
create policy "Achievements are viewable by everyone." on public.achievements
  for select using (true);

create policy "Authenticated users can insert achievements." on public.achievements
  for insert with check (auth.role() = 'authenticated');
```

### user_achievements
```sql
create table public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles not null,
  achievement_id text references public.achievements not null,
  unlocked_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

-- Set up Row Level Security
alter table public.user_achievements enable row level security;

-- Create policies
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
```

## Customization

- Modify the achievement pools in `src/lib/achievement-generator.ts` to add your own humorous achievements
- Customize the UI colors in `tailwind.config.ts`
- Add more animations to the confetti effect in `src/components/unlock-achievement.tsx`

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue if you have ideas for improvements or find any bugs.

## License

This project is licensed under the MIT License.
