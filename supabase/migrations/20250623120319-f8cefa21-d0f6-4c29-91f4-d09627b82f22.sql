
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create enum for quiz types
CREATE TYPE public.quiz_type AS ENUM ('multiple_choice', 'coding', 'true_false');

-- Create enum for credential status
CREATE TYPE public.credential_status AS ENUM ('pending', 'issued', 'verified', 'revoked');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  did TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'email',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_playlist_id TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  estimated_duration INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_video_id TEXT NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  duration INTEGER, -- in seconds
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, order_index)
);

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type quiz_type NOT NULL DEFAULT 'multiple_choice',
  questions JSONB NOT NULL, -- Store quiz questions as JSON
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit INTEGER, -- in seconds
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  is_video_completed BOOLEAN DEFAULT false,
  video_watch_time INTEGER DEFAULT 0, -- in seconds
  is_quiz_completed BOOLEAN DEFAULT false,
  quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
  quiz_attempts INTEGER DEFAULT 0,
  token_issued BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Learning tokens table
CREATE TABLE public.learning_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  credential_json JSONB NOT NULL,
  credential_hash TEXT NOT NULL,
  status credential_status DEFAULT 'issued',
  issuer_did TEXT NOT NULL,
  subject_did TEXT NOT NULL,
  verification_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Playlist enrollments table
CREATE TABLE public.playlist_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE(user_id, playlist_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_enrollments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, auth_provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'google'
      ELSE 'email'
    END
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for playlists table (public read, admin write)
CREATE POLICY "Anyone can view active playlists" ON public.playlists
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage playlists" ON public.playlists
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for videos table (public read, admin write)
CREATE POLICY "Anyone can view active videos" ON public.videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage videos" ON public.videos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quizzes table (public read, admin write)
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_progress table
CREATE POLICY "Users can view their own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own progress" ON public.user_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_progress
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for learning_tokens table
CREATE POLICY "Users can view their own tokens" ON public.learning_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert tokens" ON public.learning_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokens" ON public.learning_tokens
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for playlist_enrollments table
CREATE POLICY "Users can view their own enrollments" ON public.playlist_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.playlist_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.playlist_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_videos_playlist_id ON public.videos(playlist_id);
CREATE INDEX idx_videos_order_index ON public.videos(playlist_id, order_index);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_video_id ON public.user_progress(video_id);
CREATE INDEX idx_learning_tokens_user_id ON public.learning_tokens(user_id);
CREATE INDEX idx_playlist_enrollments_user_id ON public.playlist_enrollments(user_id);
CREATE INDEX idx_quizzes_video_id ON public.quizzes(video_id);

-- Insert sample data for development
INSERT INTO public.playlists (title, description, youtube_playlist_id, difficulty_level, estimated_duration) VALUES
('React Fundamentals', 'Learn the basics of React.js development', 'PLrAXtmRdnEQy9A9O3Tx2Mk2Vq2GWjPB0y', 2, 480),
('Advanced JavaScript', 'Master advanced JavaScript concepts and patterns', 'PLWKjhJtqVAbk2qRZtWSzCIN38JC_NdhW5', 3, 720),
('Web3 and Blockchain Basics', 'Introduction to blockchain technology and Web3 development', 'PLvfQp12V0hS0-3AjKWAve5QHy3W6lOfO8', 4, 600);

-- Insert sample videos for React Fundamentals playlist
INSERT INTO public.videos (title, youtube_video_id, playlist_id, order_index, duration) VALUES
('Introduction to React', 'Tn6-PIqc4UM', (SELECT id FROM public.playlists WHERE youtube_playlist_id = 'PLrAXtmRdnEQy9A9O3Tx2Mk2Vq2GWjPB0y'), 1, 1200),
('JSX and Components', 'DLX62G4lc44', (SELECT id FROM public.playlists WHERE youtube_playlist_id = 'PLrAXtmRdnEQy9A9O3Tx2Mk2Vq2GWjPB0y'), 2, 1500),
('State and Props', 'IYvD9oBCuJI', (SELECT id FROM public.playlists WHERE youtube_playlist_id = 'PLrAXtmRdnEQy9A9O3Tx2Mk2Vq2GWjPB0y'), 3, 1800);

-- Insert sample quizzes
INSERT INTO public.quizzes (video_id, title, quiz_type, questions) VALUES
(
  (SELECT id FROM public.videos WHERE youtube_video_id = 'Tn6-PIqc4UM'),
  'React Introduction Quiz',
  'multiple_choice',
  '[
    {
      "question": "What is React?",
      "options": ["A JavaScript library", "A database", "A server", "A CSS framework"],
      "correct": 0,
      "explanation": "React is a JavaScript library for building user interfaces."
    },
    {
      "question": "Who created React?",
      "options": ["Google", "Microsoft", "Facebook", "Apple"],
      "correct": 2,
      "explanation": "React was created by Facebook (now Meta)."
    }
  ]'::jsonb
),
(
  (SELECT id FROM public.videos WHERE youtube_video_id = 'DLX62G4lc44'),
  'JSX and Components Quiz',
  'multiple_choice',
  '[
    {
      "question": "What does JSX stand for?",
      "options": ["JavaScript XML", "JavaScript Extension", "Java Syntax Extension", "JavaScript Express"],
      "correct": 0,
      "explanation": "JSX stands for JavaScript XML, allowing us to write HTML-like syntax in JavaScript."
    }
  ]'::jsonb
);
