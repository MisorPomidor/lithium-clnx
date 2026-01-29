-- Create enum for ranks
CREATE TYPE public.member_rank AS ENUM ('Newbie', 'Test', 'Main');

-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for promotion request status  
CREATE TYPE public.promotion_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for report type
CREATE TYPE public.report_type AS ENUM ('video', 'screenshot');

-- Create profiles table for Discord user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT UNIQUE,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  highest_role TEXT DEFAULT 'Newbie',
  rank member_rank DEFAULT 'Newbie',
  is_high_staff BOOLEAN DEFAULT FALSE,
  has_access BOOLEAN DEFAULT FALSE,
  days_until_next_rank INTEGER DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type report_type NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  reviewer_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create promotion requests table
CREATE TABLE public.promotion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  current_rank member_rank NOT NULL,
  target_rank member_rank NOT NULL,
  status promotion_status DEFAULT 'pending',
  reviewer_id UUID REFERENCES public.profiles(id),
  reviewer_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "High staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_high_staff = true
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "High staff can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_high_staff = true
    )
  );

CREATE POLICY "Users can insert their own reports"
  ON public.reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "High staff can update any report"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_high_staff = true
    )
  );

-- Promotion requests policies
CREATE POLICY "Users can view their own promotion requests"
  ON public.promotion_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "High staff can view all promotion requests"
  ON public.promotion_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_high_staff = true
    )
  );

CREATE POLICY "Users can insert their own promotion requests"
  ON public.promotion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "High staff can update any promotion request"
  ON public.promotion_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_high_staff = true
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    discord_id,
    username,
    display_name,
    avatar_url,
    highest_role,
    rank,
    is_high_staff,
    has_access
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'provider_id',
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'name', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    'Newbie',
    'Newbie',
    false,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();