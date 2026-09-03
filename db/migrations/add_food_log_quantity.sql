-- Store the number of servings represented by each food log.
ALTER TABLE public.food_logs
  ADD COLUMN IF NOT EXISTS quantity numeric NOT NULL DEFAULT 1;