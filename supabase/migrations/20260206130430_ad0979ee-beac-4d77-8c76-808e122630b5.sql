-- Add image_size column to events table
-- Values: 'small', 'medium', 'large' (default: 'medium')
ALTER TABLE public.events 
ADD COLUMN image_size TEXT DEFAULT 'medium';