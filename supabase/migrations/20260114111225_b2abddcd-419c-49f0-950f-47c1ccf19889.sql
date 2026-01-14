-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create associations table
CREATE TABLE public.associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    association_id UUID REFERENCES public.associations(id) ON DELETE SET NULL,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10,2),
    ticket_link TEXT,
    is_published BOOLEAN DEFAULT false,
    publish_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_event_subscriptions table (for calendar)
CREATE TABLE public.user_event_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, event_id)
);

-- Create home_content table (for home page content)
CREATE TABLE public.home_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
    content TEXT NOT NULL,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create information table
CREATE TABLE public.information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_event_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for associations (public read, admin write)
CREATE POLICY "Anyone can view associations"
ON public.associations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage associations"
ON public.associations FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Anyone can view published events"
ON public.events FOR SELECT
TO authenticated
USING (is_published = true OR (publish_at IS NOT NULL AND publish_at <= now()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_event_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_event_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subscriptions"
ON public.user_event_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.user_event_subscriptions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for home_content
CREATE POLICY "Anyone can view home content"
ON public.home_content FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage home content"
ON public.home_content FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for information
CREATE POLICY "Anyone can view information"
ON public.information FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage information"
ON public.information FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for interviews
CREATE POLICY "Anyone can view interviews"
ON public.interviews FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage interviews"
ON public.interviews FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.information;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interviews;

-- Insert default associations
INSERT INTO public.associations (name) VALUES 
('BDE'),
('BDA'),
('BDS'),
('Junior Entreprise'),
('Autre');