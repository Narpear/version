-- Baseline schema for the "version" app (Supabase / Postgres)
--
-- Reconstructed from application code (lib/, app/**) and db/migrations/*.sql,
-- since no baseline schema file previously existed in this repo.
-- Verify against the live database (Supabase SQL editor -> Table editor,
-- or `supabase db dump --schema public`) and correct any drift before
-- treating this as the source of truth. Migrations in db/migrations/ are
-- already applied on top of an earlier version of this shape and are
-- reflected below (gym_log_sets, users.selected_trackers).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                   uuid NOT NULL DEFAULT uuid_generate_v4(),
  email                text NOT NULL,
  password_hash        text NOT NULL,
  name                 text NOT NULL,
  height_cm            numeric NOT NULL,
  age                  integer NOT NULL,
  gender               text NOT NULL DEFAULT 'female', -- 'male' | 'female' | 'non-binary'
  steps_goal           integer,
  selected_trackers    text[] NOT NULL DEFAULT '{food,gym,progress}',
  calc_bmr_multiplier  numeric,
  calc_include_gym     boolean,
  calc_include_steps   boolean,
  created_at           timestamp with time zone DEFAULT now(),
  updated_at           timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- ============================================================
-- goals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id                              uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id                         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  goal_type                       text NOT NULL, -- 'loss' | 'gain' | 'maintenance'
  start_date                      date NOT NULL,
  start_weight_kg                 numeric NOT NULL,
  current_weight_kg               numeric,
  goal_weight_kg                  numeric NOT NULL,
  total_energy_kcal_needed        numeric,
  daily_target_kcal               numeric NOT NULL,
  cumulative_apparent_deficit     numeric DEFAULT 0,
  cumulative_actual_deficit       numeric DEFAULT 0,
  is_active                       boolean NOT NULL DEFAULT true,
  created_at                      timestamp with time zone DEFAULT now(),
  updated_at                      timestamp with time zone DEFAULT now(),
  CONSTRAINT goals_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON public.goals (user_id);

-- ============================================================
-- daily_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_entries (
  id                  uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date                date NOT NULL,
  weight_kg           numeric,
  bmr                 numeric,
  total_calories_in   numeric NOT NULL DEFAULT 0,
  total_calories_out  numeric NOT NULL DEFAULT 0,
  net_intake          numeric,
  caloric_deficit     numeric, -- deprecated, kept for backwards compatibility
  apparent_deficit    numeric,
  actual_deficit      numeric,
  water_glasses       integer NOT NULL DEFAULT 0,
  created_at          timestamp with time zone DEFAULT now(),
  updated_at          timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_entries_pkey PRIMARY KEY (id),
  CONSTRAINT daily_entries_user_date_key UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_entries_user_id_idx ON public.daily_entries (user_id);

-- ============================================================
-- food_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.food_logs (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  meal_name   text NOT NULL,
  calories    numeric NOT NULL DEFAULT 0,
  protein_g   numeric NOT NULL DEFAULT 0,
  carbs_g     numeric NOT NULL DEFAULT 0,
  fats_g      numeric NOT NULL DEFAULT 0,
  is_healthy  boolean NOT NULL DEFAULT false,
  meal_type   text, -- 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack'
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT food_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS food_logs_user_id_idx ON public.food_logs (user_id);
CREATE INDEX IF NOT EXISTS food_logs_user_date_idx ON public.food_logs (user_id, date);

-- ============================================================
-- food_templates (per-user saved meals)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.food_templates (
  id             uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_name  text NOT NULL,
  meal_type      text, -- 'breakfast' | 'brunch' | 'lunch' | 'dinner' | 'snack'
  calories       numeric NOT NULL DEFAULT 0,
  protein_g      numeric NOT NULL DEFAULT 0,
  carbs_g        numeric NOT NULL DEFAULT 0,
  fats_g         numeric NOT NULL DEFAULT 0,
  is_healthy     boolean NOT NULL DEFAULT false,
  created_at     timestamp with time zone DEFAULT now(),
  CONSTRAINT food_templates_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS food_templates_user_id_idx ON public.food_templates (user_id);

-- ============================================================
-- public_food_templates (shared/global library, no owner)
-- Same shape as food_templates minus user_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.public_food_templates (
  id             uuid NOT NULL DEFAULT uuid_generate_v4(),
  template_name  text NOT NULL,
  meal_type      text,
  calories       numeric NOT NULL DEFAULT 0,
  protein_g      numeric NOT NULL DEFAULT 0,
  carbs_g        numeric NOT NULL DEFAULT 0,
  fats_g         numeric NOT NULL DEFAULT 0,
  is_healthy     boolean NOT NULL DEFAULT false,
  created_at     timestamp with time zone DEFAULT now(),
  CONSTRAINT public_food_templates_pkey PRIMARY KEY (id)
);

-- ============================================================
-- meal_templates (per-user saved multi-item meals)
-- `items` shape inferred from usage as a JSON array of food items.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meal_templates (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_name   text NOT NULL,
  items       jsonb NOT NULL DEFAULT '[]',
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT meal_templates_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS meal_templates_user_id_idx ON public.meal_templates (user_id);

-- ============================================================
-- gym_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gym_logs (
  id                uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date              date NOT NULL,
  exercise_name     text NOT NULL,
  sets              integer,
  reps              integer,
  weight_kg         numeric,
  calories_burned   numeric NOT NULL DEFAULT 0,
  warmup_done       boolean NOT NULL DEFAULT false,
  cooldown_done     boolean NOT NULL DEFAULT false,
  meditation_done   boolean NOT NULL DEFAULT false,
  notes             text,
  muscle_groups     text[] NOT NULL DEFAULT '{}',
  is_cardio         boolean NOT NULL DEFAULT false,
  created_at        timestamp with time zone DEFAULT now(),
  CONSTRAINT gym_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS gym_logs_user_id_idx ON public.gym_logs (user_id);
CREATE INDEX IF NOT EXISTS gym_logs_user_date_idx ON public.gym_logs (user_id, date);

-- ============================================================
-- gym_log_sets  (see db/migrations/add_gym_log_sets.sql)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gym_log_sets (
  id           uuid NOT NULL DEFAULT uuid_generate_v4(),
  gym_log_id   uuid NOT NULL REFERENCES public.gym_logs(id) ON DELETE CASCADE,
  set_number   integer NOT NULL,
  weight_kg    numeric,
  reps         integer,
  notes        text,
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT gym_log_sets_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS gym_log_sets_gym_log_id_idx ON public.gym_log_sets (gym_log_id);

-- ============================================================
-- workout_templates
-- `exercises` shape matches types/index.ts WorkoutTemplateExercise[].
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id             uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_name  text NOT NULL,
  exercises      jsonb NOT NULL DEFAULT '[]',
  created_at     timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_templates_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx ON public.workout_templates (user_id);

-- ============================================================
-- exercise_library (shared/global, no owner)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercise_library (
  id             uuid NOT NULL DEFAULT uuid_generate_v4(),
  exercise_name  text NOT NULL,
  muscle_groups  text[] NOT NULL DEFAULT '{}',
  is_cardio      boolean NOT NULL DEFAULT false,
  CONSTRAINT exercise_library_pkey PRIMARY KEY (id)
);

-- ============================================================
-- steps_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.steps_logs (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  steps       integer NOT NULL DEFAULT 0,
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT steps_logs_pkey PRIMARY KEY (id),
  CONSTRAINT steps_logs_user_date_key UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS steps_logs_user_id_idx ON public.steps_logs (user_id);

-- ============================================================
-- skincare_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skincare_logs (
  id                 uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date               date NOT NULL,
  time_of_day        text NOT NULL, -- 'pre_gym' | 'post_shower' | 'bedtime'
  cleansing_done     boolean NOT NULL DEFAULT false,
  moisturizer_done   boolean NOT NULL DEFAULT false,
  created_at         timestamp with time zone DEFAULT now(),
  CONSTRAINT skincare_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS skincare_logs_user_id_idx ON public.skincare_logs (user_id);

-- ============================================================
-- sleep_logs
-- Referenced by db/migrations/backfill_selected_trackers.sql but not
-- currently used elsewhere in the app code. Shape is a best guess —
-- confirm against the live DB (or drop this table if it's unused).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
  id           uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date         date NOT NULL,
  hours_slept  numeric,
  created_at   timestamp with time zone DEFAULT now(),
  CONSTRAINT sleep_logs_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS sleep_logs_user_id_idx ON public.sleep_logs (user_id);

-- ============================================================
-- books
-- Referenced by db/migrations/backfill_selected_trackers.sql but not
-- currently used elsewhere in the app code. Shape is a best guess —
-- confirm against the live DB (or drop this table if it's unused).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.books (
  id          uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  author      text,
  status      text, -- e.g. 'reading' | 'finished' | 'want_to_read'
  created_at  timestamp with time zone DEFAULT now(),
  CONSTRAINT books_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS books_user_id_idx ON public.books (user_id);
