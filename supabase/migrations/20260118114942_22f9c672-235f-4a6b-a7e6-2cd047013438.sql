-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'media' AND has_role(auth.uid(), 'admin'));

-- Create push subscriptions table for notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can view their own push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create home_posts table for mixed content posts
CREATE TABLE public.home_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  text_content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view home posts" 
ON public.home_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage home posts" 
ON public.home_posts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add realtime for home_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_posts;

-- Add image_url column to information table for optional image
ALTER TABLE public.information ADD COLUMN IF NOT EXISTS image_url TEXT;