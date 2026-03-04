
-- App settings table for customizable UI elements
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view app settings" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default for info tab
INSERT INTO public.app_settings (key, value) VALUES 
  ('info_tab', '{"name": "Infos", "icon": "Info"}'::jsonb);

-- Add layout_blocks column to information table for free-form article layouts
ALTER TABLE public.information ADD COLUMN layout_blocks jsonb DEFAULT NULL;

-- Add background_color column for article styling
ALTER TABLE public.information ADD COLUMN background_color text DEFAULT '#ffffff';
