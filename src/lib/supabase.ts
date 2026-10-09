/// <reference types="vite/client" />
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || (import.meta.env as any).ADMIN_EMAIL || '').trim();

export interface AdminAuthState {
  user: User | null;
  email: string | null;
  role: 'admin' | 'user' | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export interface SupabaseProfile {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  username: string;
  bio: string;
  avatar_url: string;
  reading_streak: number;
  created_at: string;
  updated_at: string;
}

export async function signInWithGoogle(redirectPath: string = '/') {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  }

  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account'
      }
    }
  });
}

export async function verifyAdminAuthorization(userId: string, email?: string | null): Promise<boolean> {
  const normalizedUserEmail = email?.trim().toLowerCase() || '';
  const normalizedAdminEmail = ADMIN_EMAIL.trim().toLowerCase();

  // If ADMIN_EMAIL is configured and provided email does not match it, reject immediately
  if (normalizedAdminEmail && normalizedUserEmail && normalizedUserEmail !== normalizedAdminEmail) {
    return false;
  }

  if (!supabase) {
    // If Supabase client is not available, check email directly against ADMIN_EMAIL
    return Boolean(normalizedAdminEmail && normalizedUserEmail && normalizedUserEmail === normalizedAdminEmail);
  }

  try {
    // Proactively synchronize admin status at the database layer if this is the admin account
    if (normalizedAdminEmail && normalizedUserEmail === normalizedAdminEmail) {
      try {
        await supabase.rpc('sync_admin_status');
      } catch (rpcErr) {
        console.warn('sync_admin_status RPC notice:', rpcErr);
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profiles table check query returned:', error.message);
      // Fallback: If query fails but user matches ADMIN_EMAIL
      if (normalizedAdminEmail && normalizedUserEmail && normalizedUserEmail === normalizedAdminEmail) {
        return true;
      }
      return false;
    }

    if (data?.role === 'admin') {
      if (normalizedAdminEmail && normalizedUserEmail) {
        return normalizedUserEmail === normalizedAdminEmail;
      }
      return true;
    }

    // If profile role isn't 'admin' in DB yet, but email matches ADMIN_EMAIL
    if (normalizedAdminEmail && normalizedUserEmail && normalizedUserEmail === normalizedAdminEmail) {
      // Also attempt direct profile update if role was left as user
      try {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
      } catch (e) {}
      return true;
    }

    return false;
  } catch (err) {
    console.error('Unexpected error checking admin authorization:', err);
    if (normalizedAdminEmail && normalizedUserEmail && normalizedUserEmail === normalizedAdminEmail) {
      return true;
    }
    return false;
  }
}

export async function fetchUserProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return data as SupabaseProfile | null;
  } catch (err) {
    console.error('Unexpected error fetching user profile:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut().catch((err) => console.error('Sign out error:', err));
  }
  localStorage.removeItem('ashtl_admin_session');
}

export const signOutAdmin = signOutUser;

// Remote Bookmarks API Helpers
export async function fetchRemoteBookmarks(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('novel_id, last_read_chapter_id, last_read_chapter_num, created_at')
      .eq('user_id', userId);
    if (error) {
      console.warn('Failed to fetch remote bookmarks:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function saveRemoteBookmark(userId: string, novelId: string, chapterId: string, chapterNum: number) {
  if (!supabase) return;
  try {
    await supabase.from('bookmarks').upsert({
      user_id: userId,
      novel_id: novelId,
      last_read_chapter_id: chapterId,
      last_read_chapter_num: chapterNum
    }, { onConflict: 'user_id,novel_id' });
  } catch (e) {}
}

export async function deleteRemoteBookmark(userId: string, novelId: string) {
  if (!supabase) return;
  try {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('novel_id', novelId);
  } catch (e) {}
}

// Remote Reading History API Helpers
export async function fetchRemoteHistory(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select('novel_id, last_read_chapter_id, last_read_chapter_num, progress_percentage, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) {
      console.warn('Failed to fetch remote history:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function saveRemoteHistory(userId: string, novelId: string, chapterId: string, chapterNum: number, progressPct: number) {
  if (!supabase) return;
  try {
    await supabase.from('reading_history').upsert({
      user_id: userId,
      novel_id: novelId,
      last_read_chapter_id: chapterId,
      last_read_chapter_num: chapterNum,
      progress_percentage: progressPct,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,novel_id' });
  } catch (e) {}
}

export async function deleteRemoteHistory(userId: string, novelId?: string) {
  if (!supabase) return;
  try {
    let query = supabase.from('reading_history').delete().eq('user_id', userId);
    if (novelId) {
      query = query.eq('novel_id', novelId);
    }
    await query;
  } catch (e) {}
}

