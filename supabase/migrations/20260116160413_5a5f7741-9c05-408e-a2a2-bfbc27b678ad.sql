-- Add columns for custom association name and photo link for past events
ALTER TABLE public.events
ADD COLUMN custom_association_name text,
ADD COLUMN photo_link text;