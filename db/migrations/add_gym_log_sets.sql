-- Migration: add gym_log_sets table for per-set tracking
-- Fully backward compatible — existing gym_logs data is preserved and migrated.

-- 1. Create the new table
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

-- 2. Index for fast per-log lookups
CREATE INDEX IF NOT EXISTS gym_log_sets_gym_log_id_idx
  ON public.gym_log_sets (gym_log_id);

-- 3. Migrate existing data
--    For every gym_log that has sets > 0, expand into N identical rows
--    (one per set), preserving the weight and reps from the parent row.
INSERT INTO public.gym_log_sets (gym_log_id, set_number, weight_kg, reps)
SELECT
  gl.id          AS gym_log_id,
  gs.set_number,
  gl.weight_kg,
  gl.reps
FROM public.gym_logs gl
CROSS JOIN LATERAL generate_series(1, gl.sets) AS gs(set_number)
WHERE gl.sets IS NOT NULL
  AND gl.sets > 0;
