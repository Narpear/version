-- Migration: add selected_trackers column to users table
-- Food, gym, and progress are always included by default.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS selected_trackers TEXT[]
  NOT NULL DEFAULT '{food,gym,progress}';
