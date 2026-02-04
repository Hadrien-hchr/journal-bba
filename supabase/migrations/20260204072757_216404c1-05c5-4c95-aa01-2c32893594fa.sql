-- Add profile fields to associations for banner display
ALTER TABLE public.associations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category field to events for filtering
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS category TEXT;