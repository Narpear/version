-- Cleanup script: remove books and sleep tracker data
-- Run this in your Supabase SQL editor.
-- WARNING: This is irreversible. Back up your data first if needed.

-- 1. Remove reading sessions (foreign key child of books)
DROP TABLE IF EXISTS reading_sessions;

-- 2. Remove books
DROP TABLE IF EXISTS books;

-- 3. Remove sleep logs
DROP TABLE IF EXISTS sleep_logs;

-- 4. Remove 'sleep' and 'books' from all users' selected_trackers arrays
UPDATE users
SET selected_trackers = array_remove(array_remove(selected_trackers, 'sleep'), 'books')
WHERE selected_trackers IS NOT NULL
  AND (selected_trackers @> ARRAY['sleep'] OR selected_trackers @> ARRAY['books']);
