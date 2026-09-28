-- AshTL Translation Novel Platform Database Schema for Supabase
-- Execute this script in your Supabase Dashboard -> SQL Editor

-- 1. Create Novels Table
CREATE TABLE IF NOT EXISTS public.novels (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    alt_titles TEXT[] DEFAULT '{}',
    author TEXT NOT NULL,
    translator TEXT NOT NULL DEFAULT 'AshTL',
    status TEXT NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Ongoing', 'Completed', 'Hiatus')),
    original_language TEXT DEFAULT 'English',
    genres TEXT[] DEFAULT '{}',
    rating NUMERIC(3, 2) DEFAULT 5.00,
    views BIGINT DEFAULT 0,
    bookmarks_count INTEGER DEFAULT 0,
    cover_url TEXT DEFAULT '',
    synopsis TEXT DEFAULT '',
    latest_chapter INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    release_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(novel_id, chapter_number)
);

-- 3. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT 'AshReader',
    bio TEXT DEFAULT 'Asian web novel enthusiast',
    avatar_url TEXT DEFAULT '',
    reading_streak INTEGER DEFAULT 1,
    is_creator BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    last_read_chapter_id TEXT,
    last_read_chapter_num INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, novel_id)
);

-- 5. Create Reading History Table
CREATE TABLE IF NOT EXISTS public.reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    last_read_chapter_id TEXT,
    last_read_chapter_num INTEGER DEFAULT 1,
    progress_percentage INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, novel_id)
);

-- 6. Configure Row Level Security (RLS)
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
-- Novels & Chapters: Public read access
CREATE POLICY "Public readers can view novels" 
    ON public.novels FOR SELECT 
    USING (true);

CREATE POLICY "Public readers can view chapters" 
    ON public.chapters FOR SELECT 
    USING (true);

-- Creator-only write access to novels & chapters
CREATE POLICY "Only creator can insert novels" 
    ON public.novels FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

CREATE POLICY "Only creator can update novels" 
    ON public.novels FOR UPDATE 
    USING (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

CREATE POLICY "Only creator can delete novels" 
    ON public.novels FOR DELETE 
    USING (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

CREATE POLICY "Only creator can insert chapters" 
    ON public.chapters FOR INSERT 
    WITH CHECK (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

CREATE POLICY "Only creator can update chapters" 
    ON public.chapters FOR UPDATE 
    USING (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

CREATE POLICY "Only creator can delete chapters" 
    ON public.chapters FOR DELETE 
    USING (auth.jwt() ->> 'email' = 'ashtranslation123@gmail.com');

-- User Profiles: Anyone can view, users can only update their own
CREATE POLICY "Profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Bookmarks: Users can only see and modify their own bookmarks
CREATE POLICY "Users manage their own bookmarks" 
    ON public.bookmarks FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Reading History: Users can only see and modify their own history
CREATE POLICY "Users manage their own reading history" 
    ON public.reading_history FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
