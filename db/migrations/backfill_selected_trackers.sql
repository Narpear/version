-- Backfill selected_trackers for existing users based on their logged data.
-- Run AFTER add_selected_trackers.sql.
-- food, gym, progress are always included. Others are added only if the user has data.

UPDATE public.users u
SET selected_trackers = (
  SELECT ARRAY(
    SELECT DISTINCT tracker FROM (
      SELECT 'food'     AS tracker
      UNION ALL SELECT 'gym'
      UNION ALL SELECT 'progress'
      UNION ALL
      SELECT 'sleep'    WHERE EXISTS (SELECT 1 FROM public.sleep_logs    WHERE user_id = u.id)
      UNION ALL
      SELECT 'steps'    WHERE EXISTS (SELECT 1 FROM public.steps_logs    WHERE user_id = u.id)
      UNION ALL
      SELECT 'skincare' WHERE EXISTS (SELECT 1 FROM public.skincare_logs WHERE user_id = u.id)
      UNION ALL
      SELECT 'books'    WHERE EXISTS (SELECT 1 FROM public.books         WHERE user_id = u.id)
      UNION ALL
      SELECT 'water'    WHERE EXISTS (
        SELECT 1 FROM public.daily_entries
        WHERE user_id = u.id AND water_glasses > 0
      )
    ) AS trackers
  )
);
