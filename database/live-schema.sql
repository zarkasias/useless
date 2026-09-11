-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  username text NOT NULL,
  avatar_url text,
  streak_count smallint NOT NULL DEFAULT '0'::smallint,
  last_daily_achievement timestamp with time zone,
  timezone text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  emoji text NOT NULL,
  is_daily boolean NOT NULL DEFAULT false,
  slug text UNIQUE,
  icon_path text,
  pack_id uuid,
  status text NOT NULL DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'review'::text, 'published'::text, 'archived'::text])),
  generated_by text NOT NULL DEFAULT 'manual'::text CHECK (generated_by = ANY (ARRAY['manual'::text, 'ai'::text])),
  trigger_type text,
  trigger_config jsonb,
  image_prompt text,
  icon_concept text,
  category text,
  CONSTRAINT achievements_pkey PRIMARY KEY (id),
  CONSTRAINT achievements_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.achievement_packs(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  achievement_date date,
  claim_timezone text,
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id),
  CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.anonymous_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anonymous_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  linked_user_id uuid,
  timezone text,
  CONSTRAINT anonymous_users_pkey PRIMARY KEY (id),
  CONSTRAINT anonymous_users_linked_user_id_fkey FOREIGN KEY (linked_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.anonymous_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  anonymous_user_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  achievement_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  claim_timezone text,
  CONSTRAINT anonymous_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT anonymous_achievements_anonymous_user_id_fkey FOREIGN KEY (anonymous_user_id) REFERENCES public.anonymous_users(id),
  CONSTRAINT anonymous_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  provider text NOT NULL,
  provider_customer_id text UNIQUE,
  provider_subscription_id text UNIQUE,
  provider_price_id text,
  status text NOT NULL DEFAULT 'inactive'::text,
  billing_interval text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.achievement_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  pack_type text NOT NULL DEFAULT 'seasonal'::text CHECK (pack_type = ANY (ARRAY['core'::text, 'seasonal'::text, 'event'::text, 'special'::text])),
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_product_id text,
  stripe_price_id text,
  price_cents integer,
  currency text DEFAULT 'usd'::text,
  cover_image_path text,
  theme_key text,
  CONSTRAINT achievement_packs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_achievement_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pack_id uuid NOT NULL,
  purchase_status text NOT NULL DEFAULT 'owned'::text CHECK (purchase_status = ANY (ARRAY['owned'::text, 'refunded'::text, 'revoked'::text])),
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_achievement_packs_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievement_packs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_achievement_packs_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.achievement_packs(id)
);