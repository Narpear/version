-- Disables Row Level Security on every app table.
--
-- This app enforces access control in its API routes (lib/auth.ts) using its
-- own bcrypt/session auth, not Supabase Auth — so RLS with anon-role
-- policies provides no real protection anyway, and Supabase enables RLS by
-- default on new projects/tables with no policies, which blocks all inserts
-- from the anon key (error 42501: "new row violates row-level security
-- policy").
--
-- Run this once, after schema.sql, on any fresh Supabase project.

alter table public.users disable row level security;
alter table public.goals disable row level security;
alter table public.daily_entries disable row level security;
alter table public.food_logs disable row level security;
alter table public.food_templates disable row level security;
alter table public.public_food_templates disable row level security;
alter table public.meal_templates disable row level security;
alter table public.gym_logs disable row level security;
alter table public.gym_log_sets disable row level security;
alter table public.workout_templates disable row level security;
alter table public.exercise_library disable row level security;
alter table public.steps_logs disable row level security;
alter table public.skincare_logs disable row level security;
alter table public.sleep_logs disable row level security;
alter table public.books disable row level security;
