
-- Notification templates (editable defaults per category)
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.notification_templates TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
ON public.notification_templates FOR SELECT
USING (true);

CREATE POLICY "Admins manage templates"
ON public.notification_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default templates
INSERT INTO public.notification_templates (category, title, message) VALUES
  ('event', '📅 Nouvel événement !', '{title} : ne loupe pas ça !'),
  ('interview', '🎬 Nouvelle interview !', '{title} est en ligne ! Découvre son interview'),
  ('information', '📰 Nouvel article EM''Book', '{title} — un nouvel article est disponible'),
  ('home', '✨ Nouvelle publication', '{title}');

CREATE OR REPLACE FUNCTION public.update_notif_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_notif_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.update_notif_templates_updated_at();

-- Store OneSignal player IDs on profiles for targeted sends
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT,
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT false;
