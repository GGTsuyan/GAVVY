-- Supabase Database Schema for Love Website Generator
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- COUPLES TABLE
-- ============================================
CREATE TABLE public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name1 TEXT NOT NULL,
    name2 TEXT NOT NULL,
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user1_id, user2_id)
);

-- ============================================
-- MEMORIES TABLE
-- ============================================
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    story TEXT,
    emoji TEXT DEFAULT '📸',
    image_url TEXT,
    location TEXT,
    date DATE NOT NULL,
    category TEXT DEFAULT 'photos' CHECK (category IN ('photos', 'trips', 'dates')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- EVENTS TABLE (Calendar events)
-- ============================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    emoji TEXT DEFAULT '🍽️',
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- GOALS TABLE
-- ============================================
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('savings', 'count', 'list')),
    progress NUMERIC DEFAULT 0 NOT NULL,
    target NUMERIC NOT NULL,
    deadline DATE,
    milestones JSONB, -- Array of {value, label, reward}
    items JSONB, -- For 'list' type: Array of {id, name, completed, date}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- LISTS TABLE (Travel, Movies, Restaurants, etc.)
-- ============================================
CREATE TABLE public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    list_type TEXT NOT NULL CHECK (list_type IN ('dateIdeas', 'travelList', 'movies', 'restaurants', 'giftIdeas')),
    items JSONB NOT NULL, -- Array of {text, checked}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(couple_id, list_type)
);

-- ============================================
-- MOOD TABLE
-- ============================================
CREATE TABLE public.moods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    mood TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create index for latest mood per user
CREATE INDEX idx_moods_couple_user_latest ON public.moods(couple_id, user_id, created_at DESC);

-- ============================================
-- MOOD SETTINGS TABLE (Custom moods)
-- ============================================
CREATE TABLE public.mood_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    custom_moods JSONB NOT NULL, -- Array of custom mood strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(couple_id)
);

-- ============================================
-- PERIOD TRACKER TABLE
-- ============================================
CREATE TABLE public.period_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    period_length INTEGER,
    flow TEXT, -- 'light', 'normal', 'heavy'
    symptoms JSONB, -- Array of symptoms
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- QUESTIONS/ANSWERS TABLE
-- ============================================
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- SURPRISE MESSAGES TABLE
-- ============================================
CREATE TABLE public.surprises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE NOT NULL,
    recipient_name TEXT NOT NULL,
    preview TEXT,
    message TEXT NOT NULL,
    unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surprises ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Couples policies (users can see couples they're part of)
CREATE POLICY "Users can view their couples" ON public.couples
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can update their couples" ON public.couples
    FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can insert couples" ON public.couples
    FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Memories policies
CREATE POLICY "Users can view memories of their couples" ON public.memories
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify memories of their couples" ON public.memories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Events policies
CREATE POLICY "Users can view events of their couples" ON public.events
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify events of their couples" ON public.events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Goals policies
CREATE POLICY "Users can view goals of their couples" ON public.goals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify goals of their couples" ON public.goals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Notes policies
CREATE POLICY "Users can view notes of their couples" ON public.notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify notes of their couples" ON public.notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Lists policies
CREATE POLICY "Users can view lists of their couples" ON public.lists
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify lists of their couples" ON public.lists
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Moods policies
CREATE POLICY "Users can view moods of their couples" ON public.moods
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can insert their own moods" ON public.moods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mood settings policies
CREATE POLICY "Users can view mood settings of their couples" ON public.mood_settings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify mood settings of their couples" ON public.mood_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Period entries policies
CREATE POLICY "Users can view period entries of their couples" ON public.period_entries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify their own period entries" ON public.period_entries
    FOR ALL USING (auth.uid() = user_id);

-- Questions policies
CREATE POLICY "Users can view questions of their couples" ON public.questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify questions of their couples" ON public.questions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- Answers policies
CREATE POLICY "Users can view answers of their couples" ON public.answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.couples c ON q.couple_id = c.id
            WHERE q.id = question_id AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
        )
    );
CREATE POLICY "Users can insert their own answers" ON public.answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Surprises policies
CREATE POLICY "Users can view surprises of their couples" ON public.surprises
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );
CREATE POLICY "Users can modify surprises of their couples" ON public.surprises
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.couples WHERE id = couple_id AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_couples_updated_at BEFORE UPDATE ON public.couples
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON public.lists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_period_entries_updated_at BEFORE UPDATE ON public.period_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_mood_settings_updated_at BEFORE UPDATE ON public.mood_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_surprises_updated_at BEFORE UPDATE ON public.surprises
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX idx_memories_couple_id ON public.memories(couple_id);
CREATE INDEX idx_memories_date ON public.memories(date);
CREATE INDEX idx_events_couple_id ON public.events(couple_id);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_goals_couple_id ON public.goals(couple_id);
CREATE INDEX idx_notes_couple_id ON public.notes(couple_id);
CREATE INDEX idx_lists_couple_id ON public.lists(couple_id);
CREATE INDEX idx_period_entries_user_id ON public.period_entries(user_id);
CREATE INDEX idx_period_entries_date ON public.period_entries(date);
CREATE INDEX idx_questions_couple_id ON public.questions(couple_id);
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_surprises_couple_id ON public.surprises(couple_id);

-- ============================================
-- STORAGE BUCKETS (for images)
-- ============================================
-- Note: Run this separately in Supabase Dashboard > Storage or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memory-photos', 'memory-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true);

-- Storage RLS policies
-- CREATE POLICY "Anyone can view memory photos" ON storage.objects
--     FOR SELECT USING (bucket_id = 'memory-photos');
-- CREATE POLICY "Authenticated users can upload memory photos" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'memory-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete their own memory photos" ON storage.objects
--     FOR DELETE USING (bucket_id = 'memory-photos' AND auth.role() = 'authenticated');