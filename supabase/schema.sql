-- ==============================================================================
-- AshTL Modern Novel Translation Platform - Secure Database Schema & RLS
-- Execute this script in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    username TEXT NOT NULL DEFAULT 'AshReader',
    bio TEXT DEFAULT 'Asian web novel enthusiast & translation supporter',
    avatar_url TEXT DEFAULT '',
    reading_streak INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for rapid role lookups during authorization
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(id, role);

-- 2. Create Novels Table
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id TEXT PRIMARY KEY,
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    release_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(novel_id, chapter_number)
);

-- 4. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES public.chapters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL DEFAULT 'Reader',
    user_avatar TEXT DEFAULT '',
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    novel_id TEXT NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    last_read_chapter_id TEXT,
    last_read_chapter_num INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, novel_id)
);

-- 6. Create Reading History Table
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

-- 7. Define Server-Side Security Definer Function to Check Admin Role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_admin_email TEXT;
    jwt_email TEXT;
BEGIN
    -- Fast check: if profiles table already records role = 'admin'
    IF EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check authenticated user's email directly from JWT or auth.users
    jwt_email := auth.jwt()->>'email';
    IF jwt_email IS NULL OR jwt_email = '' THEN
        SELECT email INTO jwt_email FROM auth.users WHERE id = auth.uid();
    END IF;

    IF jwt_email IS NOT NULL AND jwt_email <> '' THEN
        -- Check configured admin_email in app_settings
        SELECT value INTO target_admin_email
        FROM public.app_settings
        WHERE key = 'admin_email'
        LIMIT 1;

        IF target_admin_email IS NULL OR target_admin_email = '' THEN
            BEGIN
                target_admin_email := current_setting('app.admin_email', true);
            EXCEPTION WHEN OTHERS THEN
                target_admin_email := '';
            END;
        END IF;

        IF target_admin_email IS NOT NULL AND target_admin_email <> '' AND lower(jwt_email) = lower(target_admin_email) THEN
            -- Ensure profile role is upgraded to 'admin'
            UPDATE public.profiles
            SET role = 'admin'
            WHERE id = auth.uid() AND role <> 'admin';
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- 8. Internal App Settings Table (Stores admin email and server-side config without requiring superuser GUC permissions)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security and lock down direct client access
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_settings FROM anon, authenticated;

-- Helper function to configure the administrator email safely
CREATE OR REPLACE FUNCTION public.set_admin_email(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.app_settings (key, value)
    VALUES ('admin_email', lower(trim(target_email)))
    ON CONFLICT (key) DO UPDATE 
    SET value = EXCLUDED.value, updated_at = timezone('utc'::text, now());

    -- Automatically elevate existing profile if the user already logged in earlier
    UPDATE public.profiles
    SET role = 'admin'
    WHERE lower(email) = lower(trim(target_email));
END;
$$;

-- Critical Security: Prevent clients from invoking set_admin_email via RPC
REVOKE EXECUTE ON FUNCTION public.set_admin_email(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_email(TEXT) TO postgres, service_role;

-- Seed default admin email for the platform (executed by postgres)
SELECT public.set_admin_email('ashtranslation123@gmail.com');

-- Helper RPC for frontend to verify and sync admin elevation for the authenticated caller
CREATE OR REPLACE FUNCTION public.sync_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_email TEXT;
    target_admin_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    current_user_email := auth.jwt()->>'email';
    IF current_user_email IS NULL OR current_user_email = '' THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
    END IF;

    SELECT value INTO target_admin_email
    FROM public.app_settings
    WHERE key = 'admin_email'
    LIMIT 1;

    -- Elevate only if authenticated caller's email strictly matches configured admin_email
    IF target_admin_email IS NOT NULL AND target_admin_email <> '' AND lower(current_user_email) = lower(target_admin_email) THEN
        UPDATE public.profiles
        SET role = 'admin'
        WHERE id = auth.uid();
        RETURN TRUE;
    END IF;

    RETURN public.is_admin();
END;
$$;

-- Restrict sync_admin_status to authenticated callers only (anon cannot call it)
REVOKE EXECUTE ON FUNCTION public.sync_admin_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sync_admin_status() TO authenticated, postgres, service_role;

-- 9. Auto-create user profile upon Supabase Auth sign-up / Google OAuth login
-- Automatically promotes matching admin email to 'admin' role on sign-in / profile creation.
-- Set your admin email anytime via SQL Editor: SELECT public.set_admin_email('your-admin@gmail.com');
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_email_setting TEXT;
    assigned_role TEXT := 'user';
BEGIN
    -- Read admin_email from app_settings
    SELECT value INTO admin_email_setting
    FROM public.app_settings
    WHERE key = 'admin_email'
    LIMIT 1;

    -- Fallback to custom GUC setting if configured
    IF admin_email_setting IS NULL OR admin_email_setting = '' THEN
        BEGIN
            admin_email_setting := current_setting('app.admin_email', true);
        EXCEPTION WHEN OTHERS THEN
            admin_email_setting := '';
        END;
    END IF;

    IF admin_email_setting IS NOT NULL
       AND admin_email_setting <> ''
       AND lower(NEW.email) = lower(admin_email_setting)
    THEN
        assigned_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, username, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'AshReader'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        role = CASE 
            WHEN admin_email_setting IS NOT NULL AND admin_email_setting <> '' AND lower(EXCLUDED.email) = lower(admin_email_setting) THEN 'admin'
            ELSE public.profiles.role 
        END,
        avatar_url = CASE WHEN public.profiles.avatar_url = '' THEN EXCLUDED.avatar_url ELSE public.profiles.avatar_url END,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies: Profiles
DROP POLICY IF EXISTS "Public can view basic profiles" ON public.profiles;
CREATE POLICY "Public can view basic profiles"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent self-elevation

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

-- 11. RLS Policies: Novels
DROP POLICY IF EXISTS "Public can view published novels" ON public.novels;
CREATE POLICY "Public can view published novels"
    ON public.novels FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert novels" ON public.novels;
CREATE POLICY "Admins can insert novels"
    ON public.novels FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update novels" ON public.novels;
CREATE POLICY "Admins can update novels"
    ON public.novels FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete novels" ON public.novels;
CREATE POLICY "Admins can delete novels"
    ON public.novels FOR DELETE
    USING (public.is_admin());

-- 12. RLS Policies: Chapters
DROP POLICY IF EXISTS "Public can view published chapters" ON public.chapters;
CREATE POLICY "Public can view published chapters"
    ON public.chapters FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert chapters" ON public.chapters;
CREATE POLICY "Admins can insert chapters"
    ON public.chapters FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update chapters" ON public.chapters;
CREATE POLICY "Admins can update chapters"
    ON public.chapters FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete chapters" ON public.chapters;
CREATE POLICY "Admins can delete chapters"
    ON public.chapters FOR DELETE
    USING (public.is_admin());

-- 13. RLS Policies: Comments
DROP POLICY IF EXISTS "Public can view approved comments" ON public.comments;
CREATE POLICY "Public can view approved comments"
    ON public.comments FOR SELECT
    USING (status = 'approved' OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.comments;
CREATE POLICY "Authenticated users can post comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND status = 'approved');

DROP POLICY IF EXISTS "Admins can update/moderate comments" ON public.comments;
CREATE POLICY "Admins can update/moderate comments"
    ON public.comments FOR UPDATE
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments"
    ON public.comments FOR DELETE
    USING (public.is_admin());

-- 14. RLS Policies: Bookmarks & History (User Owned)
DROP POLICY IF EXISTS "Users manage their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users manage their own bookmarks"
    ON public.bookmarks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their own reading history" ON public.reading_history;
CREATE POLICY "Users manage their own reading history"
    ON public.reading_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 15. View Counter RPC Function (Callable by all readers & visitors)
CREATE OR REPLACE FUNCTION public.increment_novel_view(novel_id TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_views BIGINT;
BEGIN
    UPDATE public.novels
    SET views = COALESCE(views, 0) + 1
    WHERE id = novel_id
    RETURNING views INTO new_views;
    
    RETURN new_views;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_novel_view(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_novel_view(TEXT) TO anon, authenticated, postgres, service_role;

-- 16. Bookmark Delta Count RPC Function
CREATE OR REPLACE FUNCTION public.sync_novel_bookmark_count(novel_id TEXT, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.novels
    SET bookmarks_count = GREATEST(0, COALESCE(bookmarks_count, 0) + delta)
    WHERE id = novel_id
    RETURNING bookmarks_count INTO new_count;
    
    RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_novel_bookmark_count(TEXT, INTEGER) FROM public;
GRANT EXECUTE ON FUNCTION public.sync_novel_bookmark_count(TEXT, INTEGER) TO anon, authenticated, postgres, service_role;

-- 17. Automatic Trigger: Keep public.novels.bookmarks_count perfectly in sync with public.bookmarks rows
CREATE OR REPLACE FUNCTION public.sync_novel_bookmarks_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.novels
        SET bookmarks_count = (
            SELECT count(*) FROM public.bookmarks WHERE novel_id = NEW.novel_id
        )
        WHERE id = NEW.novel_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.novels
        SET bookmarks_count = (
            SELECT count(*) FROM public.bookmarks WHERE novel_id = OLD.novel_id
        )
        WHERE id = OLD.novel_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_novel_bookmarks_count ON public.bookmarks;
CREATE TRIGGER trg_sync_novel_bookmarks_count
    AFTER INSERT OR DELETE ON public.bookmarks
    FOR EACH ROW EXECUTE FUNCTION public.sync_novel_bookmarks_count();

-- Backfill bookmarks_count for all existing novels
UPDATE public.novels n
SET bookmarks_count = (
    SELECT count(*) FROM public.bookmarks b WHERE b.novel_id = n.id
);

-- ==============================================================================
-- SETUP INSTRUCTIONS:
--
-- 1. Configure the admin email via SQL Editor:
--    SELECT public.set_admin_email('ashtranslation123@gmail.com');
--
-- 2. The handle_new_user() trigger will auto-promote matching emails to 'admin'
--    on first Google OAuth sign-in.
--
-- 3. To manually promote an existing user:
--    UPDATE public.profiles
--    SET role = 'admin'
--    WHERE email = 'ashtranslation123@gmail.com';
--
-- ==============================================================================
