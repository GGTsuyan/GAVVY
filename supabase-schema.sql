-- ================================================
-- GAVVY Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- COUPLES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name1 TEXT NOT NULL,
    name2 TEXT NOT NULL,
    start_date DATE,
    user1_id UUID,
    user2_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================
-- EVENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    emoji TEXT,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON public.events(couple_id);

-- ================================================
-- MEMORIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    title TEXT NOT NULL,
    story TEXT,
    emoji TEXT,
    image_url TEXT,
    location TEXT,
    category TEXT DEFAULT 'photos',
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memories_couple_id ON public.memories(couple_id);

-- ================================================
-- NOTES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_couple_id ON public.notes(couple_id);

-- ================================================
-- LISTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    list_type TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lists_couple_id ON public.lists(couple_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_couple_type ON public.lists(couple_id, list_type);

-- ================================================
-- TRIPS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    name TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    checklist JSONB DEFAULT '[]',
    itinerary JSONB DEFAULT '[]',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trips_couple_id ON public.trips(couple_id);

-- ================================================
-- PERIOD ENTRIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.period_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    user_id UUID,
    date DATE NOT NULL,
    period_length INTEGER DEFAULT 5,
    flow TEXT DEFAULT 'normal',
    symptoms JSONB DEFAULT '[]',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_period_couple_id ON public.period_entries(couple_id);

-- ================================================
-- MOOD SETTINGS TABLE (with per-person moods)
-- ================================================
CREATE TABLE IF NOT EXISTS public.mood_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    custom_moods JSONB DEFAULT '["😊 Happy", "😌 Relaxed", "😴 Tired", "😔 Sad", "🤩 Excited"]',
    selected_person TEXT,
    mood_gab TEXT,
    mood_avi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mood_couple_id ON public.mood_settings(couple_id);

-- ================================================
-- QUESTIONS TABLE (shares current question index)
-- ================================================
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    current_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_couple_id ON public.questions(couple_id);

-- ================================================
-- ANSWERS TABLE (stores user responses with question text)
-- ================================================
CREATE TABLE IF NOT EXISTS public.answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES public.couples(id),
    question_id UUID,
    question_text TEXT,
    answer TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_answers_couple_id ON public.answers(couple_id);

-- ================================================
-- DISABLE ROW LEVEL SECURITY (for anon access)
-- ================================================
ALTER TABLE public.couples DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Insert default couple
INSERT INTO public.couples (id, name1, name2, start_date, user1_id, user2_id)
VALUES ('00000000-0000-0000-0000-000000000010', 'Gab', 'Avi', '2025-07-09', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Insert default question index
INSERT INTO public.questions (couple_id, current_index)
VALUES ('00000000-0000-0000-0000-000000000010', 0)
ON CONFLICT DO NOTHING;