-- Create a generic categories table for organizing content
CREATE TABLE public.content_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  section text NOT NULL, -- 'interviews' or 'information'
  logo_url text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, section)
);

-- Enable RLS
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view content categories"
  ON public.content_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content categories"
  ON public.content_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id to interviews table
ALTER TABLE public.interviews ADD COLUMN category_id uuid REFERENCES public.content_categories(id) ON DELETE SET NULL;

-- Add category_id to information table
ALTER TABLE public.information ADD COLUMN category_id uuid REFERENCES public.content_categories(id) ON DELETE SET NULL;