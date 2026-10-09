import { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen, Search, Bookmark, History, Settings, Sun, Moon, Sparkles, 
  ChevronLeft, ChevronRight, Menu, X, ArrowRight, Eye, 
  Flame, Sliders, Shield, AlertTriangle, Play,
  Trash2, Layers, RefreshCw, Globe, CheckCircle2, BookPlus,
  User, Award, Clock, LogOut, Edit3
} from 'lucide-react';
import { Novel, Chapter, ReadingSettings, BookmarkItem, HistoryItem, UserProfile, Comment } from './types/novel';
import { INITIAL_NOVELS, ALL_GENRES } from './data/initialNovels';
import { AdSlot } from './components/AdSlot';
import { 
  supabase, isSupabaseConfigured, signInWithGoogle, signOutUser, 
  verifyAdminAuthorization, fetchUserProfile,
  fetchRemoteBookmarks, saveRemoteBookmark, deleteRemoteBookmark,
  fetchRemoteHistory, saveRemoteHistory, deleteRemoteHistory
} from './lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AdminLayout, AdminSection } from './components/admin/AdminLayout';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminNovels } from './components/admin/AdminNovels';
import { AdminChapters } from './components/admin/AdminChapters';
import { AdminComments } from './components/admin/AdminComments';
import { AdminSettings } from './components/admin/AdminSettings';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminAccessDenied } from './components/admin/AdminAccessDenied';

export { AdSlot };

export type PublicPage = 'home' | 'novels' | 'novel-detail' | 'reader' | 'bookmarks' | 'history' | 'privacy' | 'dmca' | 'about' | 'contact' | 'profile' | 'auth-callback';
export type AppRoute = 
  | { type: 'public'; page: PublicPage; slug?: string; chapterId?: string }
  | { type: 'admin'; section: AdminSection | 'login' };

function parseRouteFromUrl(): AppRoute {
  if (typeof window === 'undefined') return { type: 'public', page: 'home' };
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  
  if (pathname === '/admin/login') {
    return { type: 'admin', section: 'login' };
  }
  if (pathname === '/admin/novels') {
    return { type: 'admin', section: 'novels' };
  }
  if (pathname === '/admin/chapters') {
    return { type: 'admin', section: 'chapters' };
  }
  if (pathname === '/admin/comments') {
    return { type: 'admin', section: 'comments' };
  }
  if (pathname === '/admin/settings') {
    return { type: 'admin', section: 'settings' };
  }
  if (pathname === '/admin') {
    return { type: 'admin', section: 'dashboard' };
  }

  if (pathname === '/novels') {
    return { type: 'public', page: 'novels' };
  }
  const novelDetailMatch = pathname.match(/^\/novels\/([^/]+)$/);
  if (novelDetailMatch) {
    return { type: 'public', page: 'novel-detail', slug: novelDetailMatch[1] };
  }
  const readerMatch = pathname.match(/^\/reader\/([^/]+)\/([^/]+)$/);
  if (readerMatch) {
    return { type: 'public', page: 'reader', slug: readerMatch[1], chapterId: readerMatch[2] };
  }
  if (pathname === '/bookmarks') {
    return { type: 'public', page: 'bookmarks' };
  }
  if (pathname === '/history') {
    return { type: 'public', page: 'history' };
  }
  if (pathname === '/about') {
    return { type: 'public', page: 'about' };
  }
  if (pathname === '/contact') {
    return { type: 'public', page: 'contact' };
  }
  if (pathname === '/privacy') {
    return { type: 'public', page: 'privacy' };
  }
  if (pathname === '/dmca') {
    return { type: 'public', page: 'dmca' };
  }
  if (pathname === '/profile') {
    return { type: 'public', page: 'profile' };
  }
  if (pathname === '/auth/callback') {
    return { type: 'public', page: 'auth-callback' };
  }

  return { type: 'public', page: 'home' };
}

export default function App() {
  // Navigation & Route State
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => parseRouteFromUrl());
  const currentPage = currentRoute.type === 'public' ? currentRoute.page : 'home';
  const [previousPage, setPreviousPage] = useState<PublicPage>('home');
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string>(() => {
    return currentRoute.type === 'public' && currentRoute.slug ? currentRoute.slug : '';
  });
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    return currentRoute.type === 'public' && currentRoute.chapterId ? currentRoute.chapterId : '';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('ashtl_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return 'dark';
  });

  // Novel Data & Dynamic Filtering
  const [novels, setNovels] = useState<Novel[]>(() => {
    const savedNovels = localStorage.getItem('ashtl_novels');
    if (savedNovels) {
      try {
        const parsed = JSON.parse(savedNovels);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse saved novels', e);
      }
    }
    return INITIAL_NOVELS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('ashtl_comments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'cmt-1',
        novelId: 'novel-1',
        novelTitle: 'Return of the Mount Hua Sect',
        chapterId: 'c_1',
        chapterTitle: 'Chapter 1: Plum Blossoms Fall',
        userName: 'SwordSaint',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
        content: 'The sword descriptions and martial arts terminology are translated so accurately. Looking forward to more chapters!',
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'cmt-2',
        novelId: 'novel-1',
        novelTitle: 'Return of the Mount Hua Sect',
        chapterId: 'c_1',
        chapterTitle: 'Chapter 1: Plum Blossoms Fall',
        userName: 'Reader99',
        content: 'Great translation pacing, clean reading layout too.',
        status: 'approved',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'bookmarks' | 'latest'>('popular');

  // Supabase & Admin Authentication State (Unified for Visitors, Readers, & Admin)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(() => {
    return localStorage.getItem('ashtl_admin_session') === 'true';
  });
  const [adminUnauthorizedEmail, setAdminUnauthorizedEmail] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Active Admin Novel ID Selection
  const [adminNovelId, setAdminNovelId] = useState<string>('');

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ashtl_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      username: 'AshReader',
      bio: 'Asian web novel enthusiast & translation supporter.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      joinDate: 'September 2026',
      readingStreak: 7
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(userProfile.username);
  const [editBio, setEditBio] = useState(userProfile.bio);
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatarUrl);
  const [profileActiveTab, setProfileActiveTab] = useState<'overview' | 'bookmarks' | 'history' | 'preferences'>('overview');

  // Reader Customizer Settings (Persisted in LocalStorage)
  const [readerSettings, setReaderSettings] = useState<ReadingSettings>({
    fontSize: 'md',
    fontFamily: 'sans',
    lineHeight: 'normal',
    readerWidth: 'normal',
    theme: 'dark',
    translationView: 'translation-only'
  });

  // Local Storage States
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getBookmarkStorageKey = (uid?: string | null) => (uid ? `ashtl_bookmarks_${uid}` : 'ashtl_bookmarks');
  const getHistoryStorageKey = (uid?: string | null) => (uid ? `ashtl_history_${uid}` : 'ashtl_history');

  // Initialize theme and load persisted reader preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('ashtl_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }

    const savedSettings = localStorage.getItem('ashtl_reader_settings');
    if (savedSettings) {
      try {
        setReaderSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse reader settings');
      }
    }

    const savedBookmarks = localStorage.getItem('ashtl_bookmarks');
    if (savedBookmarks) {
      try { setBookmarks(JSON.parse(savedBookmarks)); } catch (e) {}
    }

    const savedHistory = localStorage.getItem('ashtl_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }
  }, []);

  // Synchronize documentElement class with themeMode
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  // Browser History API Integration (Popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromUrl();
      setCurrentRoute(route);
      if (route.type === 'public') {
        if (route.slug) setSelectedNovelSlug(route.slug);
        if (route.chapterId) setSelectedChapterId(route.chapterId);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Supabase Authentication & Role Verification (Unified Google Sign-In)
  useEffect(() => {
    const client = supabase;
    if (!client) {
      setIsAuthChecking(false);
      return;
    }

    const processSession = async (session: any) => {
      if (session?.user) {
        setAuthUser(session.user);
        const email = session.user.email || null;
        const isAuthorized = await verifyAdminAuthorization(session.user.id, email);
        if (isAuthorized) {
          setIsAdminAuthorized(true);
          setAdminUser(session.user);
          setAdminUnauthorizedEmail(null);
          localStorage.setItem('ashtl_admin_session', 'true');
        } else {
          setIsAdminAuthorized(false);
          setAdminUser(null);
          setAdminUnauthorizedEmail(email);
          localStorage.removeItem('ashtl_admin_session');
        }

        try {
          const profile = await fetchUserProfile(session.user.id);
          const meta = session.user.user_metadata || {};
          const fallbackName = meta.full_name || meta.name || email?.split('@')[0] || 'AshReader';
          const fallbackAvatar = meta.avatar_url || meta.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';
          
          setUserProfile(prev => {
            const updated: UserProfile = {
              id: session.user.id,
              email: email || undefined,
              username: profile?.username || fallbackName,
              bio: profile?.bio || prev.bio,
              avatarUrl: profile?.avatar_url || fallbackAvatar,
              joinDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : prev.joinDate,
              readingStreak: profile?.reading_streak ?? prev.readingStreak,
              role: isAuthorized ? 'admin' : 'user'
            };
            try {
              localStorage.setItem('ashtl_user_profile', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        } catch (profileErr) {
          console.error('Failed to sync user profile:', profileErr);
        }
      } else {
        setAuthUser(null);
        setAdminUser(null);
        if (localStorage.getItem('ashtl_admin_session') !== 'true') {
          setIsAdminAuthorized(false);
        }
        setAdminUnauthorizedEmail(null);
      }
    };

    const verifySession = async () => {
      setIsAuthChecking(true);
      try {
        const { data: { session } } = await client.auth.getSession();
        await processSession(session);
      } catch (err) {
        console.error('Error verifying Supabase session:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifySession();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
      await processSession(session);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Synchronize Bookmarks & Reading History per account (Isolated per user, synced with Supabase)
  useEffect(() => {
    const uid = authUser?.id || null;
    const bKey = getBookmarkStorageKey(uid);
    const hKey = getHistoryStorageKey(uid);

    let localBm: BookmarkItem[] = [];
    const savedBookmarks = localStorage.getItem(bKey);
    if (savedBookmarks) {
      try { localBm = JSON.parse(savedBookmarks); } catch (e) {}
    }
    setBookmarks(localBm);

    let localHist: HistoryItem[] = [];
    const savedHistory = localStorage.getItem(hKey);
    if (savedHistory) {
      try { localHist = JSON.parse(savedHistory); } catch (e) {}
    }
    setHistory(localHist);

    // If authenticated and Supabase is configured, fetch remote bookmarks & history
    if (uid && supabase && isSupabaseConfigured) {
      fetchRemoteBookmarks(uid).then((remoteBms) => {
        if (remoteBms && remoteBms.length > 0) {
          setBookmarks((prev) => {
            const merged = [...prev];
            for (const rb of remoteBms) {
              const matchedNovel = novels.find(n => n.id === rb.novel_id);
              if (matchedNovel && !merged.some(b => b.novelId === rb.novel_id)) {
                merged.push({
                  novelId: rb.novel_id,
                  novelTitle: matchedNovel.title,
                  novelCover: matchedNovel.coverUrl,
                  lastReadChapterId: rb.last_read_chapter_id || matchedNovel.chapters[0]?.id || 'c1',
                  lastReadChapterNum: rb.last_read_chapter_num || 1,
                  timestamp: new Date(rb.created_at).getTime()
                });
              }
            }
            try { localStorage.setItem(bKey, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      });

      fetchRemoteHistory(uid).then((remoteHists) => {
        if (remoteHists && remoteHists.length > 0) {
          setHistory((prev) => {
            const merged = [...prev];
            for (const rh of remoteHists) {
              const matchedNovel = novels.find(n => n.id === rh.novel_id);
              if (matchedNovel && !merged.some(h => h.novelId === rh.novel_id)) {
                merged.push({
                  novelId: rh.novel_id,
                  novelTitle: matchedNovel.title,
                  novelCover: matchedNovel.coverUrl,
                  lastReadChapterId: rh.last_read_chapter_id || 'c1',
                  lastReadChapterNum: rh.last_read_chapter_num || 1,
                  timestamp: new Date(rh.updated_at).getTime(),
                  progressPercentage: rh.progress_percentage || 100
                });
              }
            }
            try { localStorage.setItem(hKey, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
      });
    }
  }, [authUser?.id]);

  // Automatically prune bookmarks and reading history for novels that no longer exist
  useEffect(() => {
    if (novels.length === 0) return;
    const existingNovelIds = new Set(novels.map(n => n.id));

    setBookmarks(prev => {
      const filtered = prev.filter(b => existingNovelIds.has(b.novelId));
      if (filtered.length !== prev.length) {
        const bKey = getBookmarkStorageKey(authUser?.id);
        try { localStorage.setItem(bKey, JSON.stringify(filtered)); } catch (e) {}
        if (!authUser) {
          try { localStorage.setItem('ashtl_bookmarks', JSON.stringify(filtered)); } catch (e) {}
        }
      }
      return filtered;
    });

    setHistory(prev => {
      const filtered = prev.filter(h => existingNovelIds.has(h.novelId));
      if (filtered.length !== prev.length) {
        const hKey = getHistoryStorageKey(authUser?.id);
        try { localStorage.setItem(hKey, JSON.stringify(filtered)); } catch (e) {}
        if (!authUser) {
          try { localStorage.setItem('ashtl_history', JSON.stringify(filtered)); } catch (e) {}
        }
      }
      return filtered;
    });
  }, [novels, authUser?.id]);

  // Fetch novels and comments from Supabase cloud database if configured
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const fetchSupabaseData = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data: novelsData } = await client
          .from('novels')
          .select('*, chapters(*)');

        if (novelsData && novelsData.length > 0) {
          const localNovelsRaw = localStorage.getItem('ashtl_novels');
          const localMap: Record<string, { views?: number; bookmarksCount?: number }> = {};
          if (localNovelsRaw) {
            try {
              const parsed = JSON.parse(localNovelsRaw);
              if (Array.isArray(parsed)) {
                for (const p of parsed) {
                  if (p && p.id) {
                    localMap[p.id] = { views: Number(p.views) || 0, bookmarksCount: Number(p.bookmarksCount) || 0 };
                  }
                }
              }
            } catch (e) {}
          }

          const mappedNovels: Novel[] = novelsData.map(n => {
            const local = localMap[n.id];
            const viewsFromDb = Number(n.views) || 0;
            const bmsFromDb = Number(n.bookmarks_count) || 0;
            const views = Math.max(viewsFromDb, local?.views || 0);
            const bookmarksCount = Math.max(bmsFromDb, local?.bookmarksCount || 0);

            return {
              id: n.id,
              slug: n.slug,
              title: n.title,
              altTitles: n.alt_titles || [],
              author: n.author,
              translator: n.translator || 'AshTL',
              status: n.status || 'Ongoing',
              originalLanguage: 'English',
              genres: n.genres || [],
              rating: Number(n.rating) || 5.0,
              views,
              bookmarksCount,
              coverUrl: n.cover_url || '',
              synopsis: n.synopsis || '',
              latestChapter: Number(n.latest_chapter) || 0,
              isPublished: n.is_published !== false,
              chapters: (n.chapters || []).map((c: any) => ({
                id: c.id,
                chapterNumber: c.chapter_number,
                title: c.title,
                content: c.content,
                wordCount: c.word_count || 0,
                isPublished: c.is_published !== false,
                releaseDate: c.release_date || new Date().toISOString()
              }))
            };
          });
          setNovels(mappedNovels);
          localStorage.setItem('ashtl_novels', JSON.stringify(mappedNovels));
        }

        const { data: commentsData } = await client
          .from('comments')
          .select('*, novels(title), chapters(title)');

        if (commentsData && commentsData.length > 0) {
          const mappedComments: Comment[] = commentsData.map((c: any) => ({
            id: c.id,
            novelId: c.novel_id,
            chapterId: c.chapter_id,
            novelTitle: c.novels?.title || '',
            chapterTitle: c.chapters?.title || '',
            userId: c.user_id,
            userName: c.user_name || 'Reader',
            userAvatar: c.user_avatar || '',
            content: c.content,
            status: c.status || 'approved',
            createdAt: c.created_at
          }));
          setComments(mappedComments);
          localStorage.setItem('ashtl_comments', JSON.stringify(mappedComments));
        }
      } catch (err) {
        console.error('Supabase fetch failed, continuing with local state', err);
      }
    };

    fetchSupabaseData();
  }, []);

  // Save novels & comments to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('ashtl_novels', JSON.stringify(novels));
    if (novels.length > 0 && !adminNovelId) {
      setAdminNovelId(novels[0].id);
    }
  }, [novels, adminNovelId]);

  useEffect(() => {
    localStorage.setItem('ashtl_comments', JSON.stringify(comments));
  }, [comments]);

  // Always reset scroll to top on view or chapter navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute, selectedChapterId, selectedNovelSlug]);

  // Route Protection Guard for Admin Subroutes
  useEffect(() => {
    if (isAuthChecking) return;
    if (currentRoute.type === 'admin') {
      if (currentRoute.section !== 'login') {
        if (!isAdminAuthorized && !adminUnauthorizedEmail) {
          navigateToAdmin('login', false);
        }
      } else if (isAdminAuthorized && !adminUnauthorizedEmail) {
        navigateToAdmin('dashboard', false);
      }
    }
  }, [currentRoute, isAdminAuthorized, adminUnauthorizedEmail, isAuthChecking]);

  // OAuth Callback Route Processing
  useEffect(() => {
    if (isAuthChecking) return;
    if (currentRoute.type === 'public' && currentRoute.page === 'auth-callback') {
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get('next') || '/';

      if (next === '/admin' || next.startsWith('/admin/')) {
        if (isAdminAuthorized) {
          navigateToAdmin('dashboard', false);
        } else if (adminUnauthorizedEmail) {
          navigateToAdmin('dashboard', false);
        } else {
          navigateToAdmin('login', false);
        }
      } else if (next === '/profile') {
        navigateTo('profile', false, false);
      } else {
        navigateTo('home', false, false);
      }
    }
  }, [currentRoute, isAuthChecking, isAdminAuthorized, adminUnauthorizedEmail]);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('ashtl_theme', nextTheme);
  };

  const navigateTo = (page: PublicPage, preservePrevious: boolean = true, pushHistory: boolean = true, slug?: string, chapterId?: string) => {
    if (preservePrevious && currentRoute.type === 'public' && (currentRoute.page === 'home' || currentRoute.page === 'novels' || currentRoute.page === 'bookmarks' || currentRoute.page === 'history' || currentRoute.page === 'profile')) {
      setPreviousPage(currentRoute.page);
    }
    
    let path = '/';
    if (page === 'novels') path = '/novels';
    else if (page === 'novel-detail' && (slug || selectedNovelSlug)) path = `/novels/${slug || selectedNovelSlug}`;
    else if (page === 'reader' && (slug || selectedNovelSlug) && (chapterId || selectedChapterId)) path = `/reader/${slug || selectedNovelSlug}/${chapterId || selectedChapterId}`;
    else if (page === 'bookmarks') path = '/bookmarks';
    else if (page === 'history') path = '/history';
    else if (page === 'about') path = '/about';
    else if (page === 'contact') path = '/contact';
    else if (page === 'privacy') path = '/privacy';
    else if (page === 'dmca') path = '/dmca';
    else if (page === 'profile') path = '/profile';
    else if (page === 'auth-callback') path = '/auth/callback';

    const targetSlug = slug !== undefined ? slug : selectedNovelSlug;
    const targetChapterId = chapterId !== undefined ? chapterId : selectedChapterId;

    const newRoute: AppRoute = { type: 'public', page, slug: targetSlug, chapterId: targetChapterId };
    setCurrentRoute(newRoute);
    if (targetSlug) setSelectedNovelSlug(targetSlug);
    if (targetChapterId) setSelectedChapterId(targetChapterId);

    if (pushHistory) {
      window.history.pushState(newRoute, '', path);
    }
    window.scrollTo(0, 0);
  };

  const navigateToAdmin = (section: AdminSection | 'login', pushHistory: boolean = true) => {
    const path = section === 'dashboard' ? '/admin' : `/admin/${section}`;
    const newRoute: AppRoute = { type: 'admin', section };
    setCurrentRoute(newRoute);
    if (pushHistory) {
      window.history.pushState(newRoute, '', path);
    }
    window.scrollTo(0, 0);
  };

  const handleAdminSignOut = async () => {
    await signOutUser();
    setIsAdminAuthorized(false);
    setAuthUser(null);
    setAdminUser(null);
    setAdminUnauthorizedEmail(null);
    localStorage.removeItem('ashtl_admin_session');
    showToast('Admin signed out.');
    navigateToAdmin('login', true);
  };

  const handleUserLogout = async () => {
    await signOutUser();
    setAuthUser(null);
    setAdminUser(null);
    setIsAdminAuthorized(false);
    setAdminUnauthorizedEmail(null);
    localStorage.removeItem('ashtl_admin_session');
    const resetProfile: UserProfile = {
      username: 'Guest Reader',
      bio: 'Asian web novel enthusiast & translation supporter.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      joinDate: 'October 2026',
      readingStreak: 0,
      role: 'user'
    };
    setUserProfile(resetProfile);
    localStorage.setItem('ashtl_user_profile', JSON.stringify(resetProfile));

    // Switch bookmarks & history back to guest storage
    try {
      const guestBm = localStorage.getItem('ashtl_bookmarks');
      setBookmarks(guestBm ? JSON.parse(guestBm) : []);
    } catch (e) {
      setBookmarks([]);
    }
    try {
      const guestHist = localStorage.getItem('ashtl_history');
      setHistory(guestHist ? JSON.parse(guestHist) : []);
    } catch (e) {
      setHistory([]);
    }

    showToast('You have been logged out.');
    navigateTo('home');
  };

  const handleSaveNovel = (novelToSave: Novel, isNew: boolean) => {
    if (isNew) {
      setNovels([novelToSave, ...novels]);
      setAdminNovelId(novelToSave.id);
      if (supabase && isSupabaseConfigured) {
        supabase.from('novels').insert({
          id: novelToSave.id,
          slug: novelToSave.slug,
          title: novelToSave.title,
          alt_titles: novelToSave.altTitles,
          author: novelToSave.author,
          translator: novelToSave.translator,
          status: novelToSave.status,
          original_language: 'English',
          genres: novelToSave.genres,
          rating: novelToSave.rating,
          views: novelToSave.views,
          bookmarks_count: novelToSave.bookmarksCount,
          cover_url: novelToSave.coverUrl,
          synopsis: novelToSave.synopsis,
          latest_chapter: novelToSave.latestChapter,
          is_published: novelToSave.isPublished !== false
        }).then(({ error }) => {
          if (error) {
            console.error('Error inserting novel into Supabase', error);
            showToast(`Database notice: ${error.message}`);
          }
        });
      }
      showToast(`Novel "${novelToSave.title}" created successfully!`);
    } else {
      setNovels(novels.map(n => n.id === novelToSave.id ? novelToSave : n));
      if (supabase && isSupabaseConfigured) {
        supabase.from('novels').update({
          slug: novelToSave.slug,
          title: novelToSave.title,
          alt_titles: novelToSave.altTitles,
          author: novelToSave.author,
          translator: novelToSave.translator,
          status: novelToSave.status,
          genres: novelToSave.genres,
          cover_url: novelToSave.coverUrl,
          synopsis: novelToSave.synopsis,
          is_published: novelToSave.isPublished !== false
        }).eq('id', novelToSave.id).then(({ error }) => {
          if (error) {
            console.error('Error updating novel in Supabase', error);
            showToast(`Database notice: ${error.message}`);
          }
        });
      }
      showToast(`Novel "${novelToSave.title}" updated successfully!`);
    }
  };

  const handleDeleteNovel = (novelId: string) => {
    const novelToDelete = novels.find(n => n.id === novelId);
    setNovels(novels.filter(n => n.id !== novelId));

    // Clean up bookmarks immediately
    setBookmarks(prev => {
      const updated = prev.filter(b => b.novelId !== novelId);
      const bKey = getBookmarkStorageKey(authUser?.id);
      localStorage.setItem(bKey, JSON.stringify(updated));
      if (!authUser) {
        localStorage.setItem('ashtl_bookmarks', JSON.stringify(updated));
      }
      return updated;
    });

    // Clean up reading history immediately
    setHistory(prev => {
      const updated = prev.filter(h => h.novelId !== novelId);
      const hKey = getHistoryStorageKey(authUser?.id);
      localStorage.setItem(hKey, JSON.stringify(updated));
      if (!authUser) {
        localStorage.setItem('ashtl_history', JSON.stringify(updated));
      }
      return updated;
    });

    if (supabase && isSupabaseConfigured) {
      supabase.from('novels').delete().eq('id', novelId).then(({ error }) => {
        if (error) {
          console.error('Error deleting novel from Supabase', error);
          showToast(`Database notice: ${error.message}`);
        }
      });
    }
    showToast(`Deleted "${novelToDelete?.title || 'Novel'}"`);
  };

  const handleTogglePublishNovel = (novelId: string) => {
    setNovels(novels.map(n => {
      if (n.id === novelId) {
        const nextState = n.isPublished === false;
        if (supabase && isSupabaseConfigured) {
          supabase.from('novels').update({ is_published: nextState }).eq('id', novelId).then(({ error }) => {
            if (error) console.error('Error updating publication status in Supabase', error);
          });
        }
        showToast(`Novel "${n.title}" is now ${nextState ? 'Published' : 'Draft'}`);
        return { ...n, isPublished: nextState };
      }
      return n;
    }));
  };

  const handleSaveChapter = (novelId: string, chapter: Chapter, isNew: boolean) => {
    setNovels(novels.map(n => {
      if (n.id === novelId) {
        let updatedChapters: Chapter[];
        if (isNew) {
          updatedChapters = [...n.chapters, chapter];
        } else {
          updatedChapters = n.chapters.map(c => c.id === chapter.id ? chapter : c);
        }
        const maxCh = Math.max(...updatedChapters.map(c => c.chapterNumber), 0);

        if (supabase && isSupabaseConfigured) {
          if (isNew) {
            supabase.from('chapters').insert({
              id: chapter.id,
              novel_id: novelId,
              chapter_number: chapter.chapterNumber,
              title: chapter.title,
              content: chapter.content,
              word_count: chapter.wordCount,
              is_published: chapter.isPublished !== false,
              release_date: chapter.releaseDate
            }).then(({ error }) => {
              if (error) console.error('Error publishing chapter to Supabase', error);
            });

            supabase.from('novels').update({ latest_chapter: maxCh }).eq('id', novelId).then(({ error }) => {
              if (error) console.error('Error updating novel latest chapter', error);
            });
          } else {
            supabase.from('chapters').update({
              chapter_number: chapter.chapterNumber,
              title: chapter.title,
              content: chapter.content,
              word_count: chapter.wordCount,
              is_published: chapter.isPublished !== false
            }).eq('id', chapter.id).then(({ error }) => {
              if (error) console.error('Error updating chapter in Supabase', error);
            });
          }
        }

        return {
          ...n,
          latestChapter: maxCh,
          chapters: updatedChapters
        };
      }
      return n;
    }));
    showToast(`Chapter ${chapter.chapterNumber} ${isNew ? 'published' : 'updated'} successfully!`);
  };

  const handleDeleteChapter = (novelId: string, chapterId: string) => {
    setNovels(novels.map(n => {
      if (n.id === novelId) {
        const updatedChapters = n.chapters.filter(c => c.id !== chapterId);
        const maxCh = updatedChapters.length > 0 ? Math.max(...updatedChapters.map(c => c.chapterNumber)) : 0;
        if (supabase && isSupabaseConfigured) {
          supabase.from('chapters').delete().eq('id', chapterId).then(({ error }) => {
            if (error) console.error('Error deleting chapter from Supabase', error);
          });
          supabase.from('novels').update({ latest_chapter: maxCh }).eq('id', novelId).then(({ error }) => {
            if (error) console.error('Error updating novel latest chapter', error);
          });
        }
        return { ...n, latestChapter: maxCh, chapters: updatedChapters };
      }
      return n;
    }));
    showToast('Chapter deleted.');
  };

  const handleTogglePublishChapter = (novelId: string, chapterId: string) => {
    setNovels(novels.map(n => {
      if (n.id === novelId) {
        const updatedChapters = n.chapters.map(c => {
          if (c.id === chapterId) {
            const nextPub = c.isPublished === false;
            if (supabase && isSupabaseConfigured) {
              supabase.from('chapters').update({ is_published: nextPub }).eq('id', chapterId).then(({ error }) => {
                if (error) console.error('Error toggling chapter publication in Supabase', error);
              });
            }
            showToast(`Chapter ${c.chapterNumber} is now ${nextPub ? 'Published' : 'Draft'}`);
            return { ...c, isPublished: nextPub };
          }
          return c;
        });
        return { ...n, chapters: updatedChapters };
      }
      return n;
    }));
  };

  const handleApproveComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    if (supabase && isSupabaseConfigured) {
      supabase.from('comments').update({ status: 'approved' }).eq('id', id).then(({ error }) => {
        if (error) console.error('Error approving comment in Supabase', error);
      });
    }
    showToast('Comment approved');
  };

  const handleFlagComment = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: 'flagged' } : c));
    if (supabase && isSupabaseConfigured) {
      supabase.from('comments').update({ status: 'flagged' }).eq('id', id).then(({ error }) => {
        if (error) console.error('Error flagging comment in Supabase', error);
      });
    }
    showToast('Comment flagged');
  };

  const handleDeleteComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
    if (supabase && isSupabaseConfigured) {
      supabase.from('comments').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting comment in Supabase', error);
      });
    }
    showToast('Comment deleted');
  };

  const handleSaveProfile = () => {
    if (!editUsername.trim()) {
      showToast('Username cannot be empty.');
      return;
    }
    const updated: UserProfile = {
      ...userProfile,
      username: editUsername.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatarUrl
    };
    try {
      localStorage.setItem('ashtl_user_profile', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e);
      showToast('Image file too large to save. Please choose a smaller image.');
      return;
    }
    setUserProfile(updated);
    setIsEditingProfile(false);

    if (supabase && isSupabaseConfigured && authUser) {
      supabase.from('profiles').update({
        username: updated.username,
        bio: updated.bio,
        avatar_url: updated.avatarUrl
      }).eq('id', authUser.id).then(({ error }) => {
        if (error) console.error('Failed to sync profile update to Supabase:', error);
      });
    }

    showToast('Profile updated successfully!');
  };

  const openNovelDetail = (slug: string) => {
    navigateTo('novel-detail', true, true, slug);
  };

  const openReader = (slug: string, chapterId?: string) => {
    const targetNovel = novels.find(n => n.slug === slug);
    if (!targetNovel || targetNovel.chapters.length === 0) {
      showToast('This novel does not have any translated chapters yet.');
      return;
    }
    const targetChapterId = chapterId || targetNovel.chapters[0].id;
    navigateTo('reader', true, true, slug, targetChapterId);
  };

  // Save Settings Helper
  const updateReaderSettings = (newSettings: Partial<ReadingSettings>) => {
    const updated = { ...readerSettings, ...newSettings };
    setReaderSettings(updated);
    localStorage.setItem('ashtl_reader_settings', JSON.stringify(updated));
    showToast('Reader settings updated');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateNovelBookmarksCount = (novelId: string, delta: number) => {
    setNovels(prev => {
      const updated = prev.map(n => {
        if (n.id === novelId) {
          const nextCount = Math.max(0, (n.bookmarksCount || 0) + delta);
          return { ...n, bookmarksCount: nextCount };
        }
        return n;
      });
      localStorage.setItem('ashtl_novels', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (client && isSupabaseConfigured) {
      client.rpc('sync_novel_bookmark_count', { novel_id: novelId, delta }).then(({ data, error }) => {
        if (error) {
          const target = novels.find(n => n.id === novelId);
          if (target) {
            const nextCount = Math.max(0, (target.bookmarksCount || 0) + delta);
            client.from('novels').update({ bookmarks_count: nextCount }).eq('id', novelId).then();
          }
        } else if (typeof data === 'number') {
          setNovels(prev => {
            const updated = prev.map(n => n.id === novelId ? { ...n, bookmarksCount: data } : n);
            localStorage.setItem('ashtl_novels', JSON.stringify(updated));
            return updated;
          });
        }
      });
    }
  };

  const incrementNovelView = (novelId: string) => {
    setNovels(prev => {
      const updated = prev.map(n => {
        if (n.id === novelId) {
          return { ...n, views: (n.views || 0) + 1 };
        }
        return n;
      });
      localStorage.setItem('ashtl_novels', JSON.stringify(updated));
      return updated;
    });

    const client = supabase;
    if (client && isSupabaseConfigured) {
      client.rpc('increment_novel_view', { novel_id: novelId }).then(({ data, error }) => {
        if (error) {
          const target = novels.find(n => n.id === novelId);
          if (target) {
            const nextViews = (target.views || 0) + 1;
            client.from('novels').update({ views: nextViews }).eq('id', novelId).then();
          }
        } else if (typeof data === 'number') {
          setNovels(prev => {
            const updated = prev.map(n => n.id === novelId ? { ...n, views: data } : n);
            localStorage.setItem('ashtl_novels', JSON.stringify(updated));
            return updated;
          });
        }
      });
    }
  };

  // Bookmark Management
  const toggleBookmark = (novel: Novel, chapterId?: string, chapterNum?: number) => {
    const existingIndex = bookmarks.findIndex(b => b.novelId === novel.id);
    let updated: BookmarkItem[];
    const bKey = getBookmarkStorageKey(authUser?.id);

    if (existingIndex >= 0) {
      updated = bookmarks.filter(b => b.novelId !== novel.id);
      showToast(`Removed "${novel.title}" from Bookmarks`);
      if (authUser && supabase && isSupabaseConfigured) {
        deleteRemoteBookmark(authUser.id, novel.id);
      }
      updateNovelBookmarksCount(novel.id, -1);
    } else {
      const chId = chapterId || novel.chapters[0]?.id || 'c1';
      const chNum = chapterNum || 1;
      const newItem: BookmarkItem = {
        novelId: novel.id,
        novelTitle: novel.title,
        novelCover: novel.coverUrl,
        lastReadChapterId: chId,
        lastReadChapterNum: chNum,
        timestamp: Date.now()
      };
      updated = [newItem, ...bookmarks];
      showToast(`Added "${novel.title}" to Bookmarks`);
      if (authUser && supabase && isSupabaseConfigured) {
        saveRemoteBookmark(authUser.id, novel.id, chId, chNum);
      }
      updateNovelBookmarksCount(novel.id, 1);
    }
    setBookmarks(updated);
    localStorage.setItem(bKey, JSON.stringify(updated));
    if (!authUser) {
      localStorage.setItem('ashtl_bookmarks', JSON.stringify(updated));
    }
  };

  const handleRemoveBookmark = (novelId: string) => {
    const bookmarkToRemove = bookmarks.find(b => b.novelId === novelId);
    const updated = bookmarks.filter(b => b.novelId !== novelId);
    setBookmarks(updated);
    const bKey = getBookmarkStorageKey(authUser?.id);
    localStorage.setItem(bKey, JSON.stringify(updated));
    if (!authUser) {
      localStorage.setItem('ashtl_bookmarks', JSON.stringify(updated));
    }
    if (authUser && supabase && isSupabaseConfigured) {
      deleteRemoteBookmark(authUser.id, novelId);
    }
    updateNovelBookmarksCount(novelId, -1);
    showToast(`Removed "${bookmarkToRemove?.novelTitle || 'Novel'}" from Bookmarks`);
  };

  // Reading History Management
  const trackReadingHistory = (novel: Novel, chapter: Chapter, progressPct: number) => {
    const filtered = history.filter(h => h.novelId !== novel.id);
    const updatedHistory: HistoryItem[] = [
      {
        novelId: novel.id,
        novelTitle: novel.title,
        novelCover: novel.coverUrl,
        lastReadChapterId: chapter.id,
        lastReadChapterNum: chapter.chapterNumber,
        timestamp: Date.now(),
        progressPercentage: Math.round(progressPct)
      },
      ...filtered
    ];
    setHistory(updatedHistory);
    const hKey = getHistoryStorageKey(authUser?.id);
    localStorage.setItem(hKey, JSON.stringify(updatedHistory));
    if (!authUser) {
      localStorage.setItem('ashtl_history', JSON.stringify(updatedHistory));
    }
    if (authUser && supabase && isSupabaseConfigured) {
      saveRemoteHistory(authUser.id, novel.id, chapter.id, chapter.chapterNumber, Math.round(progressPct));
    }
  };

  const handleRemoveHistoryItem = (novelId: string) => {
    const itemToRemove = history.find(h => h.novelId === novelId);
    const updated = history.filter(h => h.novelId !== novelId);
    setHistory(updated);
    const hKey = getHistoryStorageKey(authUser?.id);
    localStorage.setItem(hKey, JSON.stringify(updated));
    if (!authUser) {
      localStorage.setItem('ashtl_history', JSON.stringify(updated));
    }
    if (authUser && supabase && isSupabaseConfigured) {
      deleteRemoteHistory(authUser.id, novelId);
    }
    showToast(`Removed "${itemToRemove?.novelTitle || 'Novel'}" from History`);
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    const hKey = getHistoryStorageKey(authUser?.id);
    localStorage.removeItem(hKey);
    if (!authUser) {
      localStorage.removeItem('ashtl_history');
    }
    if (authUser && supabase && isSupabaseConfigured) {
      deleteRemoteHistory(authUser.id);
    }
    showToast('Reading history cleared');
  };

  // Filtered views ensuring deleted novels never linger
  const visibleBookmarks = useMemo(() => {
    if (novels.length === 0) return bookmarks;
    return bookmarks.filter(b => novels.some(n => n.id === b.novelId));
  }, [bookmarks, novels]);

  const visibleHistory = useMemo(() => {
    if (novels.length === 0) return history;
    return history.filter(h => novels.some(n => n.id === h.novelId));
  }, [history, novels]);

  // Selected Novel Reference
  const currentNovel = useMemo(() => {
    if (!selectedNovelSlug && novels.length > 0) return novels[0];
    return novels.find(n => n.slug === selectedNovelSlug) || novels[0] || null;
  }, [novels, selectedNovelSlug]);

  const currentChapter = useMemo(() => {
    if (!currentNovel || currentNovel.chapters.length === 0) return null;
    return currentNovel.chapters.find(c => c.id === selectedChapterId) || currentNovel.chapters[0] || null;
  }, [currentNovel, selectedChapterId]);

  const viewedChaptersRef = useRef<Set<string>>(new Set());

  // Track history and views when chapter opens
  useEffect(() => {
    if (currentPage === 'reader' && currentNovel && currentChapter) {
      trackReadingHistory(currentNovel, currentChapter, 100);
      const viewKey = `${currentNovel.id}_${currentChapter.id}`;
      if (!viewedChaptersRef.current.has(viewKey)) {
        viewedChaptersRef.current.add(viewKey);
        incrementNovelView(currentNovel.id);
      }
    }
  }, [currentPage, currentNovel, currentChapter]);

  // Spotlight Novel: Highest Views among published novels
  const spotlightNovel = useMemo(() => {
    const published = novels.filter(n => n.isPublished !== false);
    if (published.length === 0) return null;
    return [...published].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  }, [novels]);

  // Most Popular Novels: Ranked by Views descending
  const mostPopularNovels = useMemo(() => {
    const published = novels.filter(n => n.isPublished !== false);
    return [...published].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 8);
  }, [novels]);

  // Filtered Novels Computation
  const filteredNovels = useMemo(() => {
    return novels.filter(novel => {
      const matchesSearch = searchQuery === '' || 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.altTitles.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesGenre = selectedGenre === 'All' || novel.genres.includes(selectedGenre);
      const matchesStatus = selectedStatus === 'All' || novel.status === selectedStatus;

      return matchesSearch && matchesGenre && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'bookmarks') return (b.bookmarksCount || 0) - (a.bookmarksCount || 0);
      if (sortBy === 'latest') return (b.latestChapter || 0) - (a.latestChapter || 0);
      return b.title.localeCompare(a.title);
    });
  }, [novels, searchQuery, selectedGenre, selectedStatus, sortBy]);

  // Dedicated Secure Admin Route Rendering
  if (currentRoute.type === 'admin') {
    if (adminUnauthorizedEmail) {
      return (
        <AdminAccessDenied
          userEmail={adminUnauthorizedEmail}
          onSignOut={handleAdminSignOut}
          onBackToSite={() => navigateTo('home')}
        />
      );
    }

    if (currentRoute.section === 'login') {
      return (
        <AdminLogin
          onBackToSite={() => navigateTo('home')}
          onDevBypass={() => {
            setIsAdminAuthorized(true);
            localStorage.setItem('ashtl_admin_session', 'true');
            showToast('Dev Admin Mode Activated');
            navigateToAdmin('dashboard');
          }}
        />
      );
    }

    if (isAdminAuthorized) {
      return (
        <AdminLayout
          currentSection={currentRoute.section as AdminSection}
          onNavigateSection={(sec) => navigateToAdmin(sec)}
          onSignOut={handleAdminSignOut}
          onViewPublicSite={() => navigateTo('home')}
          adminEmail={adminUser?.email || 'admin@ashtl.com'}
          adminAvatar={adminUser?.user_metadata?.avatar_url || adminUser?.user_metadata?.picture}
        >
          {currentRoute.section === 'dashboard' && (
            <AdminDashboard
              novels={novels}
              comments={comments}
              onNavigateSection={(sec) => navigateToAdmin(sec)}
              onOpenCreateNovel={() => navigateToAdmin('novels')}
              onOpenCreateChapter={() => navigateToAdmin('chapters')}
            />
          )}
          {currentRoute.section === 'novels' && (
            <AdminNovels
              novels={novels}
              onSaveNovel={handleSaveNovel}
              onDeleteNovel={handleDeleteNovel}
              onTogglePublishNovel={handleTogglePublishNovel}
              onViewNovelOnSite={(slug) => navigateTo('novel-detail', true, true, slug)}
            />
          )}
          {currentRoute.section === 'chapters' && (
            <AdminChapters
              novels={novels}
              selectedNovelId={adminNovelId}
              onSaveChapter={handleSaveChapter}
              onDeleteChapter={handleDeleteChapter}
              onTogglePublishChapter={handleTogglePublishChapter}
              onReadChapterOnSite={(slug, chId) => navigateTo('reader', true, true, slug, chId)}
            />
          )}
          {currentRoute.section === 'comments' && (
            <AdminComments
              comments={comments}
              onApproveComment={handleApproveComment}
              onFlagComment={handleFlagComment}
              onDeleteComment={handleDeleteComment}
            />
          )}
          {currentRoute.section === 'settings' && (
            <AdminSettings
              adminEmail={adminUser?.email || 'admin@ashtl.com'}
              adminName={adminUser?.user_metadata?.full_name || adminUser?.user_metadata?.name || 'Administrator'}
              adminAvatar={adminUser?.user_metadata?.avatar_url || adminUser?.user_metadata?.picture}
              userId={adminUser?.id || 'admin-local'}
              createdAt={adminUser?.created_at}
              onSignOut={handleAdminSignOut}
            />
          )}
        </AdminLayout>
      );
    }

    return (
      <AdminLogin
        onBackToSite={() => navigateTo('home')}
        onDevBypass={() => {
          setIsAdminAuthorized(true);
          localStorage.setItem('ashtl_admin_session', 'true');
          showToast('Dev Admin Mode Activated');
          navigateToAdmin('dashboard');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      themeMode === 'dark' 
        ? 'bg-[#121316] text-slate-100 dark' 
        : 'bg-[#f5f6f8] text-slate-950'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-violet-600 text-white px-4 py-3 rounded-lg shadow-xl animate-bounce text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-violet-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      {currentPage !== 'reader' && (
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#16181d]/90 backdrop-blur-md transition-colors shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <button 
              onClick={() => navigateTo('home')} 
              className="flex items-center space-x-2.5 group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-violet-700 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-violet-400 bg-clip-text text-transparent">
                  AshTL
                </span>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 tracking-wider -mt-1 hidden sm:inline">
                  Read • Translate • Discover
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button 
                onClick={() => navigateTo('home')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${currentPage === 'home' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                Home
              </button>
              <button 
                onClick={() => navigateTo('novels')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${currentPage === 'novels' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                Novels
              </button>
              <button 
                onClick={() => navigateTo('bookmarks')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${currentPage === 'bookmarks' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Bookmarks</span>
                {visibleBookmarks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-violet-600 text-white text-[10px] rounded-full font-bold">
                    {visibleBookmarks.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigateTo('history')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${currentPage === 'history' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button 
                onClick={() => navigateTo('profile')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${currentPage === 'profile' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
              >
                <img src={userProfile.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-violet-500/40" />
                <span>Profile</span>
              </button>
              {isAdminAuthorized && (
                <button 
                  onClick={() => navigateToAdmin('dashboard')}
                  className="px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer shadow-xs"
                  title="Open Admin Portal"
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Admin Tools</span>
                </button>
              )}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Google Sign In Button for Guests */}
              {!authUser && (
                <button
                  onClick={() => signInWithGoogle(window.location.pathname)}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors cursor-pointer shadow-sm shadow-violet-600/20"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Light/Dark Theme"
                aria-label="Toggle Light/Dark Theme"
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
              <button
                onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Home
              </button>
              <button
                onClick={() => { navigateTo('novels'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Browse Novels
              </button>
              <button
                onClick={() => { navigateTo('bookmarks'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Bookmarks</span>
                {visibleBookmarks.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">{visibleBookmarks.length}</span>
                )}
              </button>
              <button
                onClick={() => { navigateTo('history'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Reading History
              </button>
              <button
                onClick={() => { navigateTo('profile'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-violet-500" />
                <span>My Profile</span>
              </button>
              {isAdminAuthorized && (
                <button
                  onClick={() => { navigateToAdmin('dashboard'); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 flex items-center space-x-2 border border-amber-500/20"
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Admin Tools & Dashboard</span>
                </button>
              )}
              {!authUser ? (
                <button
                  onClick={() => { signInWithGoogle(window.location.pathname); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 flex items-center space-x-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              ) : (
                <button
                  onClick={() => { handleUserLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-around text-xs text-slate-700 dark:text-slate-400 font-medium">
                <button onClick={() => { navigateTo('about'); setIsMobileMenuOpen(false); }}>About</button>
                <button onClick={() => { navigateTo('dmca'); setIsMobileMenuOpen(false); }}>DMCA</button>
                <button onClick={() => { navigateTo('privacy'); setIsMobileMenuOpen(false); }}>Privacy</button>
              </div>
            </div>
          )}
        </header>
      )}

      <main className="min-h-[calc(100vh-16rem)]">
        {/* AUTH CALLBACK VIEW */}
        {currentPage === 'auth-callback' && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center animate-spin">
              <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Connecting with Google...</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Verifying your authentication credentials and redirecting...</p>
            </div>
          </div>
        )}

        {/* HOMEPAGE VIEW */}
        {currentPage === 'home' && (
          <div className="space-y-12 pb-16">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-violet-900/10 via-transparent to-transparent pt-12 pb-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
                  <span>Verified Human & High-Quality Translations</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Discover Your Next <span className="bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">Immersive Story</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-800 dark:text-slate-300 max-w-2xl mx-auto font-medium">
                  Read translated Asian web novels with dual-language line alignment, customizable distraction-free readers, and daily chapter updates.
                </p>

                {/* Search Input Bar */}
                <div className="max-w-2xl mx-auto relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigateTo('novels'); }}
                    placeholder="Search novels, authors, or genres..."
                    className="w-full pl-12 pr-28 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                  />
                  <button
                    onClick={() => navigateTo('novels')}
                    className="absolute right-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                  >
                    Explore
                  </button>
                </div>

                {/* Popular Tags Quick Search */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-300">Popular Genres:</span>
                  {['Fantasy', 'Martial Arts', 'Romance', 'Action', 'System'].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => { setSelectedGenre(genre); navigateTo('novels'); }}
                      className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 transition-colors font-semibold cursor-pointer border border-slate-300/60 dark:border-transparent"
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Sponsored Homepage Ad Slot */}
            <div className="max-w-7xl mx-auto px-4">
              <AdSlot slotLocation="homepage-banner" />
            </div>

            {/* Featured Hero Novel Spotlight / Empty State */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {spotlightNovel ? (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a20] shadow-xl p-6 sm:p-8 grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 lg:col-span-3 flex justify-center">
                    <img
                      src={spotlightNovel.coverUrl}
                      alt={spotlightNovel.title}
                      className="w-48 sm:w-56 md:w-full h-72 object-cover rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50"
                    />
                  </div>
                  <div className="md:col-span-8 lg:col-span-9 space-y-4 text-left">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>Featured Spotlight Novel • Most Viewed</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {spotlightNovel.title}
                    </h2>
                    <p className="text-sm text-slate-800 dark:text-slate-400 flex items-center space-x-3 font-medium">
                      <span>By {spotlightNovel.author}</span>
                      <span>•</span>
                      <span>TL: {spotlightNovel.translator}</span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{spotlightNovel.status}</span>
                    </p>
                    <div className="flex items-center space-x-4 text-xs font-bold">
                      <span className="flex items-center space-x-1.5 text-violet-600 dark:text-violet-400">
                        <Eye className="w-4 h-4" />
                        <span>{(spotlightNovel.views || 0).toLocaleString()} views</span>
                      </span>
                      <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
                        <Bookmark className="w-4 h-4 fill-amber-500/20" />
                        <span>{(spotlightNovel.bookmarksCount || 0).toLocaleString()} bookmarks</span>
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {spotlightNovel.synopsis}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {spotlightNovel.genres.map(g => (
                        <span key={g} className="px-2.5 py-1 bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => openReader(spotlightNovel.slug, spotlightNovel.chapters[0]?.id)}
                        disabled={spotlightNovel.chapters.length === 0}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Reading Ch. 1</span>
                      </button>
                      <button
                        onClick={() => openNovelDetail(spotlightNovel.slug)}
                        className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#181a20] p-8 sm:p-12 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50 flex items-center justify-center text-violet-600">
                    <BookPlus className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready for Your Translated Novels</h2>
                  <p className="text-sm text-slate-800 dark:text-slate-300 max-w-xl mx-auto font-medium">
                    The platform is set up with high-quality English reading and customization features. Check back soon for newly published chapters!
                  </p>
                  <button
                    onClick={() => navigateTo('novels')}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Browse Catalog</span>
                  </button>
                </div>
              )}
            </section>

            {/* Most Popular Novels Section (Ranked by Views) */}
            {mostPopularNovels.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span>Most Popular</span>
                    </h3>
                    <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Top read web novels ranked by reader views</p>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy('popular');
                      navigateTo('novels');
                    }}
                    className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                  {mostPopularNovels.map((novel, idx) => (
                    <div
                      key={novel.id}
                      className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17191f] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative"
                    >
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-amber-500 text-slate-950 text-[11px] font-black rounded-md shadow-md flex items-center space-x-1">
                        <span>#{idx + 1}</span>
                      </div>

                      <div>
                        <div 
                          onClick={() => openNovelDetail(novel.slug)}
                          className="relative h-56 sm:h-64 w-full overflow-hidden cursor-pointer bg-slate-800"
                        >
                          <img
                            src={novel.coverUrl}
                            alt={novel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-md">
                            Ch. {novel.latestChapter}
                          </div>
                        </div>

                        <div className="p-3.5 space-y-2 text-left">
                          <h4 
                            onClick={() => openNovelDetail(novel.slug)}
                            className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-violet-600 transition-colors"
                          >
                            {novel.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400">
                            <span className="flex items-center space-x-1 text-violet-600 dark:text-violet-400 font-bold">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{(novel.views || 0).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              <Bookmark className="w-3 h-3" />
                              <span>{novel.bookmarksCount || 0}</span>
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{novel.status}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {novel.genres.slice(0, 2).map((g) => (
                              <span key={g} className="px-2 py-0.5 bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] rounded-md font-semibold">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 mt-2">
                        <button
                          onClick={() => openReader(novel.slug, novel.chapters[0]?.id)}
                          className="w-full py-2 bg-violet-100 hover:bg-violet-600 text-violet-800 hover:text-white dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{novel.chapters.length > 0 ? 'Read Chapter' : 'View Novel'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recently Updated Grid Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 text-violet-500" />
                    <span>Recently Updated</span>
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Fresh chapters translated daily</p>
                </div>
                <button
                  onClick={() => navigateTo('novels')}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Novels Cards Grid */}
              {novels.length === 0 ? (
                <div className="py-10 text-center text-slate-700 dark:text-slate-400 text-xs font-medium">
                  No recently published chapters yet. New translations will appear here once published.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                  {novels.map((novel) => (
                    <div
                      key={novel.id}
                      className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17191f] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Thumbnail */}
                        <div 
                          onClick={() => openNovelDetail(novel.slug)}
                          className="relative h-56 sm:h-64 w-full overflow-hidden cursor-pointer bg-slate-800"
                        >
                          <img
                            src={novel.coverUrl}
                            alt={novel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold rounded-md flex items-center space-x-1">
                            <Globe className="w-3 h-3 text-amber-400" />
                            <span>EN</span>
                          </div>
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-md">
                            Ch. {novel.latestChapter}
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="p-3.5 space-y-2 text-left">
                          <h4 
                            onClick={() => openNovelDetail(novel.slug)}
                            className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-violet-600 transition-colors"
                          >
                            {novel.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400">
                            <span className="flex items-center space-x-1 text-violet-600 dark:text-violet-400 font-bold">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{(novel.views || 0).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              <Bookmark className="w-3 h-3" />
                              <span>{novel.bookmarksCount || 0}</span>
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">{novel.status}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {novel.genres.slice(0, 2).map((g) => (
                              <span key={g} className="px-2 py-0.5 bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] rounded-md font-semibold">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-3 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 mt-2">
                        <button
                          onClick={() => openReader(novel.slug, novel.chapters[0]?.id)}
                          className="w-full py-2 bg-violet-100 hover:bg-violet-600 text-violet-800 hover:text-white dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{novel.chapters.length > 0 ? 'Read Chapter' : 'View Novel'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* NOVEL CATALOG VIEW */}
        {currentPage === 'novels' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
            {/* Back to Home Button */}
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Header & Filter Controls */}
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Novel Catalog</h1>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Filter through our collection of translated web novels.</p>

              {/* Filtering Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] shadow-sm">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                  />
                </div>

                {/* Genre Selector */}
                <select
                  aria-label="Filter by genre"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold cursor-pointer"
                >
                  <option value="All">All Genres</option>
                  {ALL_GENRES.filter(g => g !== 'All').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {/* Status Selector */}
                <select
                  aria-label="Filter by status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Sort Order */}
                <select
                  aria-label="Sort novels"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold cursor-pointer"
                >
                  <option value="popular">Sort: Most Popular (Views)</option>
                  <option value="bookmarks">Sort: Most Bookmarked</option>
                  <option value="latest">Sort: Recently Added</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredNovels.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Novels Found</h3>
                <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">
                  {novels.length === 0 
                    ? 'No novels have been published in the catalog yet. Please check back soon!'
                    : 'Try adjusting your filters or search keywords.'}
                </p>
                {novels.length > 0 && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGenre('All');
                      setSelectedStatus('All');
                    }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredNovels.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => openNovelDetail(novel.slug)}
                    className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#17191f] overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-60 w-full overflow-hidden bg-slate-800">
                      <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded font-semibold">
                        EN
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-violet-600 transition-colors">
                        {novel.title}
                      </h4>
                      <p className="text-[11px] text-slate-800 dark:text-slate-300 line-clamp-1 font-semibold">{novel.author}</p>
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-700 dark:text-slate-300">
                        <span className="text-violet-600 dark:text-violet-400 font-bold flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{(novel.views || 0).toLocaleString()}</span>
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-0.5">
                          <Bookmark className="w-3 h-3" />
                          <span>{novel.bookmarksCount || 0}</span>
                        </span>
                        <span className="font-bold">Ch. {novel.latestChapter}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOVEL DETAIL VIEW */}
        {currentPage === 'novel-detail' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
            {/* Back Navigation Button */}
            <div>
              <button
                onClick={() => navigateTo(previousPage === 'novels' ? 'novels' : 'home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to {previousPage === 'novels' ? 'Novel Catalog' : 'Home'}</span>
              </button>
            </div>

            {currentNovel ? (
              <>
                {/* Novel Overview Hero */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] p-6 sm:p-8 shadow-xl grid md:grid-cols-12 gap-8">
                  {/* Cover */}
                  <div className="md:col-span-4 lg:col-span-3 space-y-4">
                    <img
                      src={currentNovel.coverUrl}
                      alt={currentNovel.title}
                      className="w-full h-80 object-cover rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50"
                    />
                    <button
                      onClick={() => toggleBookmark(currentNovel)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-colors cursor-pointer ${
                        bookmarks.some(b => b.novelId === currentNovel.id)
                          ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarks.some(b => b.novelId === currentNovel.id) ? 'fill-amber-500' : ''}`} />
                      <span>{bookmarks.some(b => b.novelId === currentNovel.id) ? 'Bookmarked' : 'Add to Bookmarks'}</span>
                    </button>
                  </div>

                  {/* Info Details */}
                  <div className="md:col-span-8 lg:col-span-9 space-y-5">
                    <div>
                      <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 text-xs font-bold rounded-md">
                        English Translation
                      </span>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2">
                        {currentNovel.title}
                      </h1>
                      {currentNovel.altTitles.length > 0 && (
                        <p className="text-xs text-slate-700 dark:text-slate-400 mt-1 font-medium">
                          Alt titles: {currentNovel.altTitles.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-xs border border-slate-300/80 dark:border-slate-800">
                      <div>
                        <span className="text-slate-800 dark:text-slate-400 block font-semibold">Author</span>
                        <span className="font-bold text-slate-950 dark:text-slate-200">{currentNovel.author}</span>
                      </div>
                      <div>
                        <span className="text-slate-800 dark:text-slate-400 block font-semibold">Translator</span>
                        <span className="font-bold text-violet-700 dark:text-violet-400">{currentNovel.translator}</span>
                      </div>
                      <div>
                        <span className="text-slate-800 dark:text-slate-400 block font-semibold">Status</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{currentNovel.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-800 dark:text-slate-400 block font-semibold">Total Views</span>
                        <span className="font-bold text-violet-700 dark:text-violet-400 flex items-center space-x-1">
                          <Eye className="w-3.5 h-3.5 inline" />
                          <span>{(currentNovel.views || 0).toLocaleString()}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-800 dark:text-slate-400 block font-semibold">Bookmarks</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                          <Bookmark className="w-3.5 h-3.5 inline" />
                          <span>{(currentNovel.bookmarksCount || 0).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2">
                      {currentNovel.genres.map(g => (
                        <span key={g} className="px-3 py-1 bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => openReader(currentNovel.slug, currentNovel.chapters[0]?.id)}
                        disabled={currentNovel.chapters.length === 0}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm shadow-lg shadow-violet-600/30 flex items-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Reading Ch. 1</span>
                      </button>
                      {currentNovel.chapters.length > 1 && (
                        <button
                          onClick={() => openReader(currentNovel.slug, currentNovel.chapters[currentNovel.chapters.length - 1].id)}
                          className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Latest Chapter
                        </button>
                      )}
                    </div>

                    {/* Synopsis */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Synopsis</h3>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                        {currentNovel.synopsis}
                      </p>
                    </div>

                    {/* Translator Note */}
                    {currentNovel.translatorNotes && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 font-medium">
                        {currentNovel.translatorNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ad Placement */}
                <AdSlot slotLocation="novel-sidebar" />

                {/* Chapter List Section */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-violet-500" />
                      <span>Chapter Directory</span>
                    </h3>
                    <span className="text-xs text-slate-700 dark:text-slate-400 font-semibold">
                      {currentNovel.chapters.length} Chapters Available
                    </span>
                  </div>

                  {currentNovel.chapters.length === 0 ? (
                    <div className="py-8 text-center text-slate-700 dark:text-slate-400 text-xs space-y-2 font-medium">
                      <p>No chapters released yet for this novel.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {currentNovel.chapters.map((chap) => (
                        <div
                          key={chap.id}
                          onClick={() => openReader(currentNovel.slug, chap.id)}
                          className="py-3 px-2 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800/40 rounded-xl cursor-pointer transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-violet-600">
                              {chap.title}
                            </span>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-700 dark:text-slate-400 font-medium">
                              <span>{chap.wordCount} Words</span>
                              <span>•</span>
                              <span>Released: {chap.releaseDate}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h2 className="text-xl font-bold">Novel Not Found</h2>
                <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">The requested novel was not found or may have been removed.</p>
                <button
                  onClick={() => navigateTo('home')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* READER VIEW */}
        {currentPage === 'reader' && currentNovel && currentChapter && (
          <div className={`min-h-screen transition-colors duration-200 ${
            readerSettings.theme === 'light' ? 'bg-[#faf8f5] text-[#1a1a1c]' :
            readerSettings.theme === 'sepia' ? 'bg-[#f5ebd7] text-[#2c2214]' :
            readerSettings.theme === 'pitch-black' ? 'bg-black text-[#d0d0d0]' :
            'bg-[#121316] text-[#e0e0e0]'
          }`}>
            {/* Reader Floating Header Bar */}
            <header className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md bg-white/90 dark:bg-[#121316]/90 px-4 h-14 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigateTo('novel-detail')}
                  className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                  title="Back to Novel Details"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-left max-w-xs sm:max-w-md truncate">
                  <h2 className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{currentNovel.title}</h2>
                  <p className="text-[11px] truncate text-slate-700 dark:text-slate-400 font-medium">{currentChapter.title}</p>
                </div>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleBookmark(currentNovel, currentChapter.id, currentChapter.chapterNumber)}
                  className="p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                  title="Bookmark Chapter"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarks.some(b => b.novelId === currentNovel.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                {/* Reader Settings Modal Trigger */}
                <button
                  onClick={() => {
                    const el = document.getElementById('reader-settings-panel');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="p-2 rounded-lg hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                  title="Reading Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Reader Settings Slide-Down Panel */}
            <div id="reader-settings-panel" className="hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 max-w-2xl mx-auto shadow-2xl rounded-b-2xl animate-fadeIn space-y-6 text-left">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-violet-500" />
                  <span>Reader Customizer</span>
                </h3>
                <button 
                  onClick={() => document.getElementById('reader-settings-panel')?.classList.add('hidden')}
                  className="text-xs text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Settings Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Font Size */}
                <div className="space-y-2">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Font Size</label>
                  <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                    {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => updateReaderSettings({ fontSize: size })}
                        className={`flex-1 py-1.5 uppercase font-bold transition-colors cursor-pointer ${readerSettings.fontSize === size ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reader Width */}
                <div className="space-y-2">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Reading Area Width</label>
                  <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                    {(['narrow', 'normal', 'wide'] as const).map(w => (
                      <button
                        key={w}
                        onClick={() => updateReaderSettings({ readerWidth: w })}
                        className={`flex-1 py-1.5 capitalize font-semibold transition-colors cursor-pointer ${readerSettings.readerWidth === w ? 'bg-violet-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Palette */}
                <div className="space-y-2">
                  <label className="font-semibold block text-slate-700 dark:text-slate-300">Background Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'light', label: 'Light', bg: 'bg-[#faf8f5] border-slate-300 text-slate-900' },
                      { id: 'sepia', label: 'Sepia', bg: 'bg-[#f5ebd7] border-amber-300 text-amber-950' },
                      { id: 'dark', label: 'Dark', bg: 'bg-[#121316] border-slate-700 text-white' },
                      { id: 'pitch-black', label: 'OLED', bg: 'bg-black border-slate-800 text-white' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateReaderSettings({ theme: t.id as any })}
                        className={`py-2 text-[11px] font-bold rounded-lg border cursor-pointer ${t.bg} ${readerSettings.theme === t.id ? 'ring-2 ring-violet-500' : ''}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* In-Reader Ad Slot */}
            <div className="pt-4">
              <AdSlot slotLocation="chapter-top" />
            </div>

            {/* Chapter Content Main Reader Body */}
            <article className={`mx-auto px-4 py-8 transition-all duration-200 text-left ${
              readerSettings.readerWidth === 'narrow' ? 'max-w-xl' :
              readerSettings.readerWidth === 'wide' ? 'max-w-4xl' : 'max-w-2xl'
            }`}>
              {/* Title Header */}
              <div className="text-center space-y-2 mb-10 pb-6 border-b border-slate-300/40 dark:border-slate-800">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentChapter.title}
                </h1>
                <p className="text-xs opacity-75 font-medium">
                  {currentNovel.title} • Translated by {currentNovel.translator}
                </p>
              </div>

              {/* Text Paragraph Rendering */}
              <div className={`space-y-6 ${
                readerSettings.fontFamily === 'serif' ? 'font-serif' :
                readerSettings.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
              } ${
                readerSettings.fontSize === 'sm' ? 'text-sm' :
                readerSettings.fontSize === 'lg' ? 'text-lg' :
                readerSettings.fontSize === 'xl' ? 'text-xl' : 'text-base'
              } ${
                readerSettings.lineHeight === 'compact' ? 'leading-normal' :
                readerSettings.lineHeight === 'comfortable' ? 'leading-loose' : 'leading-relaxed'
              }`}>
                {currentChapter.content.split('\n\n').map((paragraph, idx) => {
                  return (
                    <div key={idx} className="space-y-2">
                      <p className="whitespace-pre-line">{paragraph}</p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom In-Content Ad */}
              <AdSlot slotLocation="chapter-bottom" />

              {/* Chapter Bottom Navigation Bar */}
              <div className="mt-12 pt-8 border-t border-slate-300/40 dark:border-slate-800 flex items-center justify-between gap-4">
                {/* Previous Chapter */}
                <button
                  disabled={currentChapter.chapterNumber <= 1}
                  onClick={() => {
                    const prevCh = currentNovel.chapters.find(c => c.chapterNumber === currentChapter.chapterNumber - 1);
                    if (prevCh) {
                      setSelectedChapterId(prevCh.id);
                      window.scrollTo(0, 0);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Chapter Selector Dropdown */}
                <select
                  aria-label="Select chapter"
                  value={currentChapter.id}
                  onChange={(e) => {
                    setSelectedChapterId(e.target.value);
                    window.scrollTo(0, 0);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {currentNovel.chapters.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      Ch. {c.chapterNumber}
                    </option>
                  ))}
                </select>

                {/* Next Chapter */}
                <button
                  disabled={currentChapter.chapterNumber >= currentNovel.chapters.length}
                  onClick={() => {
                    const nextCh = currentNovel.chapters.find(c => c.chapterNumber === currentChapter.chapterNumber + 1);
                    if (nextCh) {
                      setSelectedChapterId(nextCh.id);
                      window.scrollTo(0, 0);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-700 flex items-center space-x-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          </div>
        )}

        {/* BOOKMARKS VIEW */}
        {currentPage === 'bookmarks' && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-left">
            {/* Back to Home Button */}
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
                <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                <span>My Saved Bookmarks ({visibleBookmarks.length})</span>
              </h1>
            </div>

            {visibleBookmarks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Bookmarks Saved Yet</h3>
                <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Click the bookmark icon on any novel to save it for quick access.</p>
                <button
                  onClick={() => navigateTo('novels')}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Explore Novels
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleBookmarks.map((b) => (
                  <div
                    key={b.novelId}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex space-x-4 items-center shadow-sm relative group"
                  >
                    <img src={b.novelCover} alt={b.novelTitle} className="w-16 h-20 object-cover rounded-xl shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{b.novelTitle}</h4>
                      <p className="text-xs text-violet-800 dark:text-violet-400 font-bold">Ch. {b.lastReadChapterNum}</p>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            const target = novels.find(n => n.id === b.novelId);
                            if (target) {
                              openReader(target.slug, b.lastReadChapterId);
                            } else {
                              showToast('Novel no longer available');
                            }
                          }}
                          className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-md cursor-pointer"
                        >
                          Continue Reading
                        </button>
                        <button
                          onClick={() => handleRemoveBookmark(b.novelId)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Remove from Bookmarks"
                          aria-label={`Remove ${b.novelTitle} from bookmarks`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* READING HISTORY VIEW */}
        {currentPage === 'history' && (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
            {/* Back to Home Button */}
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h1 className="text-2xl font-bold flex items-center space-x-2 text-slate-900 dark:text-white">
                <History className="w-6 h-6 text-violet-500" />
                <span>Reading History</span>
              </h1>
              {visibleHistory.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="text-xs text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {visibleHistory.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-700 dark:text-slate-400 text-xs font-medium">
                <p>No reading history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleHistory.map((item) => (
                  <div
                    key={item.novelId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img src={item.novelCover} alt="" className="w-10 h-12 object-cover rounded-md shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.novelTitle}</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Chapter {item.lastReadChapterNum}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          const target = novels.find(n => n.id === item.novelId);
                          if (target) {
                            openReader(target.slug, item.lastReadChapterId);
                          } else {
                            showToast('Novel no longer available');
                          }
                        }}
                        className="px-3 py-1.5 bg-violet-100 hover:bg-violet-600 text-violet-800 hover:text-white dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-600 dark:hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleRemoveHistoryItem(item.novelId)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remove from history"
                        aria-label={`Remove ${item.novelTitle} from history`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USER PROFILE VIEW */}
        {currentPage === 'profile' && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-left">
            {/* Back to Home Button */}
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>

            {/* Google Sign In Callout for Guests */}
            {!authUser && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-amber-500/10 border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Sync with Google Account</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sign in to preserve your reading streak, sync bookmarks, and personalize your translation experience across devices.
                  </p>
                </div>
                <button
                  onClick={() => signInWithGoogle('/profile')}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-2 shrink-0 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}

            {/* Profile Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                {/* Avatar with edit badge */}
                <div className="relative group shrink-0">
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-violet-500/50 shadow-md"
                  />
                  <button
                    onClick={() => {
                      if (!isEditingProfile) {
                        setEditUsername(userProfile.username);
                        setEditBio(userProfile.bio);
                        setEditAvatarUrl(userProfile.avatarUrl);
                      }
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="absolute -bottom-2 -right-2 p-1.5 bg-violet-600 text-white rounded-lg shadow hover:bg-violet-700 transition-colors cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
                        <span>{userProfile.username}</span>
                        {userProfile.role === 'admin' ? (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-extrabold rounded-full flex items-center space-x-1">
                            <Shield className="w-3 h-3 text-amber-500" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-[11px] font-extrabold rounded-full flex items-center space-x-1">
                            <Award className="w-3 h-3 text-violet-500" />
                            <span>Reader</span>
                          </span>
                        )}
                      </h1>
                      {authUser?.email && (
                        <p className="text-[11px] font-mono text-violet-600 dark:text-violet-400 font-semibold">
                          {authUser.email}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl font-medium">
                        {userProfile.bio}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-center sm:self-auto">
                      <button
                        onClick={() => {
                          if (!isEditingProfile) {
                            setEditUsername(userProfile.username);
                            setEditBio(userProfile.bio);
                            setEditAvatarUrl(userProfile.avatarUrl);
                          }
                          setIsEditingProfile(!isEditingProfile);
                        }}
                        className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                      {(isAdminAuthorized || userProfile.role === 'admin') && (
                        <button
                          onClick={() => navigateToAdmin('dashboard')}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center space-x-1.5"
                          title="Access Admin Management Portal"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Portal</span>
                        </button>
                      )}
                      <button
                        onClick={handleUserLogout}
                        className="px-3.5 py-1.5 border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                        title="Log Out of AshTL"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Meta Badges */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-700 dark:text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-semibold text-slate-900 dark:text-white">{userProfile.readingStreak} Day Reading Streak</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-violet-500" />
                      <span>Joined {userProfile.joinDate}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{visibleHistory.length} Chapters Read</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline Profile Editor */}
              {isEditingProfile && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Customize Reader Profile</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        placeholder="Your reader name"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-slate-700 dark:text-slate-300">Profile Picture</label>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Max 2MB (JPG, PNG, WebP)</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {editAvatarUrl && (
                          <img
                            src={editAvatarUrl}
                            alt="Avatar preview"
                            className="w-10 h-10 rounded-xl object-cover border-2 border-violet-500/40 shrink-0 shadow-sm"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          aria-label="Upload profile picture"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                showToast('Image file too large. Please select an image under 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditAvatarUrl(reader.result as string);
                                showToast('Profile picture loaded from file!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700 dark:file:bg-violet-950/40 dark:file:text-violet-300 hover:file:bg-violet-200 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={editAvatarUrl.startsWith('data:') ? '' : editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-[11px]"
                        placeholder={editAvatarUrl.startsWith('data:') ? 'Image uploaded from file (or enter image URL)' : 'Or enter image URL here'}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Bio</label>
                      <textarea
                        rows={2}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        placeholder="Tell other readers about your favorite web novels..."
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save Profile
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Management Tools Portal for Administrator */}
            {(isAdminAuthorized || userProfile.role === 'admin') && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start space-x-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Administrator Management Tools</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    You are signed in with administrator privileges. You have access to tools for adding novels, editing chapters, deleting content, and moderating reader comments.
                  </p>
                </div>
                <button
                  onClick={() => navigateToAdmin('dashboard')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-2 shrink-0 cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Open Admin Tools</span>
                </button>
              </div>
            )}

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Saved Bookmarks</span>
                <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{visibleBookmarks.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Chapters Read</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{visibleHistory.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Reading Streak</span>
                <p className="text-2xl font-black text-amber-500">{userProfile.readingStreak} Days</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Account Tier</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {userProfile.role === 'admin' ? 'Administrator' : 'Verified Reader'}
                </p>
              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 pb-2">
              <button
                onClick={() => setProfileActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  profileActiveTab === 'overview'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setProfileActiveTab('bookmarks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  profileActiveTab === 'bookmarks'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                My Bookmarks ({bookmarks.length})
              </button>
              <button
                onClick={() => setProfileActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  profileActiveTab === 'history'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                Reading History ({history.length})
              </button>
              <button
                onClick={() => setProfileActiveTab('preferences')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  profileActiveTab === 'preferences'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                Creator & Settings
              </button>
            </div>

            {/* Tab 1: Overview */}
            {profileActiveTab === 'overview' && (
              <div className="space-y-6">
                {history.length > 0 ? (
                  <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-4">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span>Continue Reading</span>
                    </h3>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-3">
                        <img src={history[0].novelCover} alt="" className="w-12 h-16 object-cover rounded-lg shadow" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{history[0].novelTitle}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Chapter {history[0].lastReadChapterNum}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const target = novels.find(n => n.id === history[0].novelId);
                          if (target) openReader(target.slug, history[0].lastReadChapterId);
                        }}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Resume Reading
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] text-center space-y-3">
                    <BookOpen className="w-8 h-8 text-violet-400 mx-auto" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Ready for your reading journey</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                      Explore our catalog of human-translated Asian web novels and start bookmarking your favorite stories.
                    </p>
                    <button
                      onClick={() => navigateTo('novels')}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Browse Novels
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Bookmarks */}
            {profileActiveTab === 'bookmarks' && (
              <div className="space-y-4">
                {bookmarks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400">No bookmarks saved yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {bookmarks.map((bm) => (
                      <div key={bm.novelId} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex space-x-3 items-center justify-between">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <img src={bm.novelCover} alt="" className="w-12 h-16 object-cover rounded-lg shrink-0" />
                          <div className="truncate">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{bm.novelTitle}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Last read: Ch. {bm.lastReadChapterNum}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const target = novels.find(n => n.id === bm.novelId);
                            if (target) openReader(target.slug, bm.lastReadChapterId);
                          }}
                          className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 cursor-pointer transition-colors shrink-0"
                        >
                          Read
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: History */}
            {profileActiveTab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-600 dark:text-slate-400">No reading history recorded.</div>
                ) : (
                  history.map((item) => (
                    <div key={item.novelId} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={item.novelCover} alt="" className="w-10 h-14 object-cover rounded-md" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.novelTitle}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Chapter {item.lastReadChapterNum}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const target = novels.find(n => n.id === item.novelId);
                          if (target) openReader(target.slug, item.lastReadChapterId);
                        }}
                        className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 cursor-pointer transition-colors"
                      >
                        Resume
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: Preferences & Creator Portal */}
            {/* Tab 4: Preferences & Settings */}
            {profileActiveTab === 'preferences' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Account Settings</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Manage your profile and reading session settings.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={handleUserLogout}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEGAL & INFORMATION PAGES */}
        {currentPage === 'dmca' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">DMCA Copyright Policy</h1>
            <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Last updated: February 2026</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              AshTL respects the intellectual property rights of authors and publishers. If you believe your copyrighted work has been infringed upon, please submit a formal takedown request to our copyright agent at <span className="text-violet-700 dark:text-violet-400 font-mono font-bold">ashtranslation123@gmail.com</span> including the URLs of the material in question.
            </p>
          </div>
        )}

        {currentPage === 'privacy' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              AshTL uses browser LocalStorage to store reader customizations, reading progress, and saved bookmarks. We do not track personal identifying information without explicit consent.
            </p>
          </div>
        )}

        {currentPage === 'about' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <div>
              <button
                onClick={() => navigateTo('home')}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors p-2 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer mb-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About AshTL</h1>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              AshTL is a modern novel translation platform dedicated to delivering high-quality, human-translated Asian web novels with customizable reading modes and dual-language capabilities.
            </p>
          </div>
        )}
      </main>

      {/* Global Footer */}
      {currentPage !== 'reader' && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d10] py-12 mt-16 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <span className="font-extrabold text-lg text-slate-900 dark:text-white">AshTL</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-400 font-medium">
                Read. Translate. Discover. Bringing immersive translated web stories to global readers.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Navigation</h4>
              <p onClick={() => navigateTo('home')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">Home</p>
              <p onClick={() => navigateTo('novels')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">Novel Catalog</p>
              <p onClick={() => navigateTo('bookmarks')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">My Bookmarks</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Legal & DMCA</h4>
              <p onClick={() => navigateTo('dmca')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">DMCA Copyright Policy</p>
              <p onClick={() => navigateTo('privacy')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">Privacy Policy</p>
              <p onClick={() => navigateTo('about')} className="cursor-pointer text-slate-800 dark:text-slate-400 hover:text-violet-600 font-medium">About AshTL</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Monetization</h4>
              <p className="text-slate-800 dark:text-slate-400 font-medium">Ad Provider: <span className="font-bold text-amber-700 dark:text-amber-500">Montagem Ads</span></p>
              <p className="text-slate-800 dark:text-slate-400 font-medium">AdSense Compatible Architecture Ready</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-700 dark:text-slate-400 font-medium">
            <p>© 2026 AshTL. All rights reserved.</p>
            <div className="mt-2 sm:mt-0 flex items-center space-x-3">
              <span>Built for speed, mobile readability & clean translations.</span>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}
