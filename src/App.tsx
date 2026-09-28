import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, Bookmark, History, Settings, Sun, Moon, Sparkles, 
  ChevronLeft, ChevronRight, Menu, X, ArrowRight, Star, 
  Flame, Sliders, Shield, AlertTriangle, Play, Plus,
  Trash2, Layers, RefreshCw, Globe, CheckCircle2, BookPlus,
  User, Lock, Unlock, Key, Award, Clock, LogOut, Edit3, Cloud
} from 'lucide-react';
import { Novel, Chapter, ReadingSettings, BookmarkItem, HistoryItem, UserProfile } from './types/novel';
import { INITIAL_NOVELS, ALL_GENRES } from './data/initialNovels';
import { AdSlot } from './components/AdSlot';
import { supabase, isSupabaseConfigured, CREATOR_EMAIL } from './lib/supabase';

export { AdSlot };

export default function App() {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'home' | 'novels' | 'novel-detail' | 'reader' | 'bookmarks' | 'history' | 'admin' | 'privacy' | 'dmca' | 'about' | 'profile'>('home');
  const [previousPage, setPreviousPage] = useState<'home' | 'novels' | 'bookmarks' | 'history' | 'profile'>('home');
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'rating'>('popular');

  // Creator Authentication & Security State
  const DEFAULT_CREATOR_PASSCODE = 'creator123';
  const [isCreatorAuthenticated, setIsCreatorAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ashtl_creator_session') === 'true';
  });
  const [creatorEmailInput, setCreatorEmailInput] = useState('');
  const [creatorPasswordInput, setCreatorPasswordInput] = useState('');
  const [creatorPasscode, setCreatorPasscode] = useState<string>(() => {
    return localStorage.getItem('ashtl_creator_passcode') || DEFAULT_CREATOR_PASSCODE;
  });
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [newPasscodeSetting, setNewPasscodeSetting] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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

  // Admin Novel Creation State
  const [adminActiveTab, setAdminActiveTab] = useState<'create-novel' | 'add-chapter' | 'creator-settings'>('create-novel');
  const [newNovelTitle, setNewNovelTitle] = useState('');
  const [newNovelAuthor, setNewNovelAuthor] = useState('');
  const [newNovelTranslator, setNewNovelTranslator] = useState('');

  const [newNovelStatus, setNewNovelStatus] = useState<'Ongoing' | 'Completed' | 'Hiatus'>('Ongoing');
  const [newNovelGenres, setNewNovelGenres] = useState('Fantasy, Action');
  const [newNovelCoverData, setNewNovelCoverData] = useState('');
  const [newNovelSynopsis, setNewNovelSynopsis] = useState('');
  const [newNovelAltTitles, setNewNovelAltTitles] = useState('');
  const [newNovelNotes, setNewNovelNotes] = useState('');

  // Admin Chapter Upload State
  const [adminNovelId, setAdminNovelId] = useState<string>('');
  const [adminChapterTitle, setAdminChapterTitle] = useState('');
  const [adminChapterContent, setAdminChapterContent] = useState('');

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

  // Browser History API Integration (Popstate) to prevent exiting website on back click
  useEffect(() => {
    if (!window.history.state || !window.history.state.page) {
      window.history.replaceState({ page: 'home', sentinel: true }, '', '');
      window.history.pushState({ page: 'home' }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.sentinel) {
        window.history.pushState({ page: 'home' }, '', '');
        setCurrentPage('home');
      } else if (state && state.page) {
        setCurrentPage(state.page);
        if (state.slug) setSelectedNovelSlug(state.slug);
        if (state.chapterId) setSelectedChapterId(state.chapterId);
      } else {
        window.history.pushState({ page: 'home' }, '', '');
        setCurrentPage('home');
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen to Supabase Auth State and sync creator privileges
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase()) {
        setIsCreatorAuthenticated(true);
        localStorage.setItem('ashtl_creator_session', 'true');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase()) {
        setIsCreatorAuthenticated(true);
        localStorage.setItem('ashtl_creator_session', 'true');
      } else if (!session && localStorage.getItem('ashtl_auth_provider') === 'supabase') {
        setIsCreatorAuthenticated(false);
        localStorage.removeItem('ashtl_creator_session');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch novels from Supabase cloud database if configured
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    const fetchSupabaseNovels = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data: novelsData, error: novelsError } = await client
          .from('novels')
          .select('*, chapters(*)');

        if (!novelsError && novelsData && novelsData.length > 0) {
          const mappedNovels: Novel[] = novelsData.map(n => ({
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
            views: Number(n.views) || 0,
            bookmarksCount: Number(n.bookmarks_count) || 0,
            coverUrl: n.cover_url || '',
            synopsis: n.synopsis || '',
            latestChapter: Number(n.latest_chapter) || 0,
            chapters: (n.chapters || []).map((c: any) => ({
              id: c.id,
              chapterNumber: c.chapter_number,
              title: c.title,
              content: c.content,
              wordCount: c.word_count || 0,
              releaseDate: c.release_date || new Date().toISOString()
            }))
          }));
          setNovels(mappedNovels);
          localStorage.setItem('ashtl_novels', JSON.stringify(mappedNovels));
        }
      } catch (err) {
        console.error('Supabase fetch failed, continuing with local state', err);
      }
    };

    fetchSupabaseNovels();
  }, []);

  // Save novels to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('ashtl_novels', JSON.stringify(novels));
    if (novels.length > 0 && !adminNovelId) {
      setAdminNovelId(novels[0].id);
    }
  }, [novels, adminNovelId]);

  // Always reset scroll to top on view or chapter navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedChapterId, selectedNovelSlug]);

  const toggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('ashtl_theme', nextTheme);
  };

  const navigateTo = (page: typeof currentPage, preservePrevious: boolean = true, pushHistory: boolean = true) => {
    if (preservePrevious && (currentPage === 'home' || currentPage === 'novels' || currentPage === 'bookmarks' || currentPage === 'history' || currentPage === 'profile')) {
      setPreviousPage(currentPage);
    }
    setCurrentPage(page);
    if (pushHistory && page !== currentPage) {
      window.history.pushState({ page }, '', '');
    }
    window.scrollTo(0, 0);
  };

  const handleCreatorPasscodeLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcodeInput === creatorPasscode) {
      setIsCreatorAuthenticated(true);
      localStorage.setItem('ashtl_creator_session', 'true');
      setPasscodeError('');
      setPasscodeInput('');
      showToast('Creator Mode unlocked! Welcome back, Creator.');
    } else {
      setPasscodeError('Invalid creator passcode. Access denied.');
    }
  };

  const handleSupabaseCreatorLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!creatorEmailInput || !creatorPasswordInput) {
      setPasscodeError('Please enter both email and password.');
      return;
    }
    if (!supabase) {
      setPasscodeError('Supabase is not configured. Use passcode authentication or add .env keys.');
      return;
    }

    setAuthLoading(true);
    setPasscodeError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: creatorEmailInput.trim(),
        password: creatorPasswordInput
      });

      if (error) {
        setPasscodeError(error.message);
      } else if (data.user) {
        if (data.user.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase()) {
          setIsCreatorAuthenticated(true);
          localStorage.setItem('ashtl_creator_session', 'true');
          localStorage.setItem('ashtl_auth_provider', 'supabase');
          setCreatorEmailInput('');
          setCreatorPasswordInput('');
          showToast('Welcome back, Creator! Authenticated via Supabase.');
        } else {
          setPasscodeError(`Access restricted. Email ${data.user.email} is not authorized as creator.`);
        }
      }
    } catch (err: any) {
      setPasscodeError(err?.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreatorLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsCreatorAuthenticated(false);
    localStorage.removeItem('ashtl_creator_session');
    localStorage.removeItem('ashtl_auth_provider');
    showToast('Creator session locked.');
    navigateTo('home');
  };

  const handleUpdateCreatorPasscode = () => {
    if (!newPasscodeSetting.trim() || newPasscodeSetting.trim().length < 4) {
      showToast('Passcode must be at least 4 characters.');
      return;
    }
    setCreatorPasscode(newPasscodeSetting.trim());
    localStorage.setItem('ashtl_creator_passcode', newPasscodeSetting.trim());
    setNewPasscodeSetting('');
    showToast('Creator passcode successfully updated!');
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
    setUserProfile(updated);
    localStorage.setItem('ashtl_user_profile', JSON.stringify(updated));
    setIsEditingProfile(false);
    showToast('Profile updated successfully!');
  };

  const openNovelDetail = (slug: string) => {
    setSelectedNovelSlug(slug);
    if (currentPage === 'home' || currentPage === 'novels' || currentPage === 'bookmarks' || currentPage === 'history' || currentPage === 'profile') {
      setPreviousPage(currentPage);
    }
    setCurrentPage('novel-detail');
    window.history.pushState({ page: 'novel-detail', slug }, '', '');
    window.scrollTo(0, 0);
  };

  const openReader = (slug: string, chapterId?: string) => {
    const targetNovel = novels.find(n => n.slug === slug);
    if (!targetNovel || targetNovel.chapters.length === 0) {
      showToast('This novel does not have any translated chapters yet.');
      return;
    }
    const targetChapterId = chapterId || targetNovel.chapters[0].id;
    setSelectedNovelSlug(slug);
    setSelectedChapterId(targetChapterId);
    if (currentPage === 'home' || currentPage === 'novels' || currentPage === 'novel-detail' || currentPage === 'profile') {
      setPreviousPage(currentPage as any);
    }
    setCurrentPage('reader');
    window.history.pushState({ page: 'reader', slug, chapterId: targetChapterId }, '', '');
    window.scrollTo(0, 0);
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

  // Bookmark Toggle
  const toggleBookmark = (novel: Novel, chapterId?: string, chapterNum?: number) => {
    const existingIndex = bookmarks.findIndex(b => b.novelId === novel.id);
    let updated: BookmarkItem[];
    if (existingIndex >= 0) {
      updated = bookmarks.filter(b => b.novelId !== novel.id);
      showToast(`Removed "${novel.title}" from Bookmarks`);
    } else {
      const newItem: BookmarkItem = {
        novelId: novel.id,
        novelTitle: novel.title,
        novelCover: novel.coverUrl,
        lastReadChapterId: chapterId || novel.chapters[0]?.id || 'c1',
        lastReadChapterNum: chapterNum || 1,
        timestamp: Date.now()
      };
      updated = [newItem, ...bookmarks];
      showToast(`Added "${novel.title}" to Bookmarks`);
    }
    setBookmarks(updated);
    localStorage.setItem('ashtl_bookmarks', JSON.stringify(updated));
  };

  // History Helper
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
    localStorage.setItem('ashtl_history', JSON.stringify(updatedHistory));
  };

  // Admin: Create Novel Handler
  const handleCreateNovel = () => {
    if (!newNovelTitle.trim() || !newNovelAuthor.trim()) {
      showToast('Novel title and author are required.');
      return;
    }

    const slug = newNovelTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const genresArray = newNovelGenres.split(',').map(g => g.trim()).filter(Boolean);
    const altTitlesArray = newNovelAltTitles.split(',').map(t => t.trim()).filter(Boolean);
    const defaultCover = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" fill="%23312e81"><rect width="400" height="600"/><text x="200" y="300" text-anchor="middle" fill="%23e0e7ff" font-size="24" font-family="sans-serif">No Cover</text></svg>');

    const novelToAdd: Novel = {
      id: `novel_${Date.now()}`,
      slug: slug || `novel-${Date.now()}`,
      title: newNovelTitle.trim(),
      altTitles: altTitlesArray,
      author: newNovelAuthor.trim(),
      translator: newNovelTranslator.trim() || 'Staff Translator',
      status: newNovelStatus,
      originalLanguage: 'Chinese' as const,

      genres: genresArray.length > 0 ? genresArray : ['Fantasy'],
      rating: 5.0,
      views: 0,
      bookmarksCount: 0,
      coverUrl: newNovelCoverData || defaultCover,
      synopsis: newNovelSynopsis.trim() || 'No synopsis provided yet.',
      latestChapter: 0,
      chapters: [],
      translatorNotes: newNovelNotes.trim() || undefined
    };

    setNovels([novelToAdd, ...novels]);
    setAdminNovelId(novelToAdd.id);
    setNewNovelTitle('');
    setNewNovelAuthor('');
    setNewNovelTranslator('');
    setNewNovelGenres('Fantasy, Action');
    setNewNovelCoverData('');
    setNewNovelSynopsis('');
    setNewNovelAltTitles('');
    setNewNovelNotes('');
    showToast(`Novel "${novelToAdd.title}" created successfully!`);

    // Sync to Supabase cloud database if configured
    if (supabase && isSupabaseConfigured) {
      supabase.from('novels').insert({
        id: novelToAdd.id,
        slug: novelToAdd.slug,
        title: novelToAdd.title,
        alt_titles: novelToAdd.altTitles,
        author: novelToAdd.author,
        translator: novelToAdd.translator,
        status: novelToAdd.status,
        original_language: 'English',
        genres: novelToAdd.genres,
        rating: novelToAdd.rating,
        views: novelToAdd.views,
        bookmarks_count: novelToAdd.bookmarksCount,
        cover_url: novelToAdd.coverUrl,
        synopsis: novelToAdd.synopsis,
        latest_chapter: novelToAdd.latestChapter
      }).then(({ error }) => {
        if (error) console.error('Error inserting novel into Supabase', error);
      });
    }
  };

  // Admin: Publish Chapter Handler
  const handlePublishChapter = () => {
    if (!adminChapterTitle.trim() || !adminChapterContent.trim()) {
      showToast('Please provide both chapter title and content.');
      return;
    }
    const targetNovel = novels.find(n => n.id === adminNovelId);
    if (!targetNovel) {
      showToast('Please select or create a novel first.');
      return;
    }

    const newChapter: Chapter = {
      id: `c_${Date.now()}`,
      chapterNumber: targetNovel.chapters.length + 1,
      title: adminChapterTitle.trim(),
      content: adminChapterContent.trim(),
      releaseDate: new Date().toISOString().split('T')[0],
      wordCount: adminChapterContent.trim().split(/\s+/).filter(Boolean).length
    };

    setNovels(novels.map(n => n.id === adminNovelId ? {
      ...n,
      latestChapter: newChapter.chapterNumber,
      chapters: [...n.chapters, newChapter]
    } : n));

    setAdminChapterTitle('');
    setAdminChapterContent('');
    showToast(`Published Chapter ${newChapter.chapterNumber} to "${targetNovel.title}"!`);

    // Sync to Supabase cloud database if configured
    if (supabase && isSupabaseConfigured) {
      supabase.from('chapters').insert({
        id: newChapter.id,
        novel_id: adminNovelId,
        chapter_number: newChapter.chapterNumber,
        title: newChapter.title,
        content: newChapter.content,
        word_count: newChapter.wordCount,
        release_date: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.error('Error publishing chapter to Supabase', error);
      });

      supabase.from('novels').update({
        latest_chapter: newChapter.chapterNumber
      }).eq('id', adminNovelId).then(({ error }) => {
        if (error) console.error('Error updating novel latest chapter in Supabase', error);
      });
    }
  };

  // Selected Novel Reference
  const currentNovel = useMemo(() => {
    if (!selectedNovelSlug && novels.length > 0) return novels[0];
    return novels.find(n => n.slug === selectedNovelSlug) || novels[0] || null;
  }, [novels, selectedNovelSlug]);

  const currentChapter = useMemo(() => {
    if (!currentNovel || currentNovel.chapters.length === 0) return null;
    return currentNovel.chapters.find(c => c.id === selectedChapterId) || currentNovel.chapters[0] || null;
  }, [currentNovel, selectedChapterId]);

  // Track history when chapter opens
  useEffect(() => {
    if (currentPage === 'reader' && currentNovel && currentChapter) {
      trackReadingHistory(currentNovel, currentChapter, 100);
    }
  }, [currentPage, currentNovel, currentChapter]);

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
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.id.localeCompare(a.id);
    });
  }, [novels, searchQuery, selectedGenre, selectedStatus, sortBy]);

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
                {bookmarks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-violet-600 text-white text-[10px] rounded-full font-bold">
                    {bookmarks.length}
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
              {isCreatorAuthenticated ? (
                <button 
                  onClick={() => navigateTo('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${currentPage === 'admin' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'text-amber-700 dark:text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'}`}
                  title="Creator Admin Dashboard"
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Admin</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigateTo('admin')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  title="Creator Verification Entrance"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Creator</span>
                </button>
              )}
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3">
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
                {bookmarks.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">{bookmarks.length}</span>
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
              <button
                onClick={() => { navigateTo('admin'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2"
              >
                {isCreatorAuthenticated ? (
                  <>
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Admin Dashboard (Creator)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Creator Portal</span>
                  </>
                )}
              </button>
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
              {novels.length > 0 ? (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a20] shadow-xl p-6 sm:p-8 grid md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 lg:col-span-3 flex justify-center">
                    <img
                      src={novels[0].coverUrl}
                      alt={novels[0].title}
                      className="w-48 sm:w-56 md:w-full h-72 object-cover rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50"
                    />
                  </div>
                  <div className="md:col-span-8 lg:col-span-9 space-y-4 text-left">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span>Featured Spotlight Novel</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      {novels[0].title}
                    </h2>
                    <p className="text-sm text-slate-800 dark:text-slate-400 flex items-center space-x-3 font-medium">
                      <span>By {novels[0].author}</span>
                      <span>•</span>
                      <span>TL: {novels[0].translator}</span>
                      <span>•</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{novels[0].status}</span>
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {novels[0].synopsis}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {novels[0].genres.map(g => (
                        <span key={g} className="px-2.5 py-1 bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md text-xs font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="pt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => openReader(novels[0].slug, novels[0].chapters[0]?.id)}
                        disabled={novels[0].chapters.length === 0}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start Reading Ch. 1</span>
                      </button>
                      <button
                        onClick={() => openNovelDetail(novels[0].slug)}
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
                    The platform is set up with dual-language reading and customization features. Use the Admin Dashboard to publish your translated web novels and chapters.
                  </p>
                  <button
                    onClick={() => navigateTo('admin')}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Translated Novel in Admin</span>
                  </button>
                </div>
              )}
            </section>

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
                            <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              <span>{novel.rating}</span>
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
                  <option value="popular">Sort: Most Popular</option>
                  <option value="latest">Sort: Recently Added</option>
                  <option value="rating">Sort: Highest Rated</option>
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
                    ? 'No novels exist in the catalog yet. Use the Admin Dashboard to add new translated titles.'
                    : 'Try adjusting your filters or search keywords.'}
                </p>
                {novels.length === 0 ? (
                  <button
                    onClick={() => navigateTo('admin')}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                  >
                    Go to Admin Dashboard
                  </button>
                ) : (
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
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-0.5">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{novel.rating}</span>
                        </span>
                        <span className="text-slate-800 dark:text-slate-300 font-bold">Ch. {novel.latestChapter}</span>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-xs border border-slate-300/80 dark:border-slate-800">
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
                      <button
                        onClick={() => navigateTo('admin')}
                        className="text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
                      >
                        Upload chapters via Admin
                      </button>
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
                <span>My Saved Bookmarks ({bookmarks.length})</span>
              </h1>
            </div>

            {bookmarks.length === 0 ? (
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
                {bookmarks.map((b) => (
                  <div
                    key={b.novelId}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex space-x-4 items-center shadow-sm"
                  >
                    <img src={b.novelCover} alt={b.novelTitle} className="w-16 h-20 object-cover rounded-xl" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white">{b.novelTitle}</h4>
                      <p className="text-xs text-violet-800 dark:text-violet-400 font-bold">Ch. {b.lastReadChapterNum}</p>
                      <button
                        onClick={() => {
                          const target = novels.find(n => n.id === b.novelId);
                          if (target) {
                            openReader(target.slug, b.lastReadChapterId);
                          } else {
                            showToast('Novel no longer available');
                          }
                        }}
                        className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-md mt-1 cursor-pointer"
                      >
                        Continue Reading
                      </button>
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
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('ashtl_history');
                  }}
                  className="text-xs text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-slate-700 dark:text-slate-400 text-xs font-medium">
                <p>No reading history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.novelId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={item.novelCover} alt="" className="w-10 h-12 object-cover rounded-md" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.novelTitle}</h4>
                        <p className="text-xs text-slate-800 dark:text-slate-300 font-medium">Chapter {item.lastReadChapterNum}</p>
                      </div>
                    </div>
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
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
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
                        {isCreatorAuthenticated ? (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-extrabold rounded-full flex items-center space-x-1">
                            <Shield className="w-3 h-3 text-amber-500" />
                            <span>Creator / Translator</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 text-[11px] font-extrabold rounded-full flex items-center space-x-1">
                            <Award className="w-3 h-3 text-violet-500" />
                            <span>Reader</span>
                          </span>
                        )}
                      </h1>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl font-medium">
                        {userProfile.bio}
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer self-center sm:self-auto"
                    >
                      {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
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
                      <span>{history.length} Chapters Read</span>
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
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Avatar Image URL</label>
                      <input
                        type="text"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        placeholder="Avatar image URL"
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

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Saved Bookmarks</span>
                <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{bookmarks.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Chapters Read</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{history.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Reading Streak</span>
                <p className="text-2xl font-black text-amber-500">{userProfile.readingStreak} Days</p>
              </div>
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1 text-center sm:text-left">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Account Tier</span>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {isCreatorAuthenticated ? 'Creator' : 'Verified Reader'}
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
            {profileActiveTab === 'preferences' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-amber-500/30 bg-white dark:bg-[#16181d] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span>Creator & Administrator Portal</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Restricted zone for the site creator (Clyde) to manage translated web novel publications.
                      </p>
                    </div>
                    {isCreatorAuthenticated && (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
                        Authenticated
                      </span>
                    )}
                  </div>

                  {isCreatorAuthenticated ? (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => navigateTo('admin')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Open Admin Dashboard</span>
                      </button>
                      <button
                        onClick={handleCreatorLogout}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Lock Creator Session</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        Are you the creator of AshTL? Unlock your admin dashboard with your creator passcode or Supabase login.
                      </p>
                      <button
                        onClick={() => navigateTo('admin')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow"
                      >
                        <Key className="w-4 h-4" />
                        <span>Enter Creator Passcode / Login</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {currentPage === 'admin' && (
          !isCreatorAuthenticated ? (
            <div className="max-w-md mx-auto px-4 py-16 space-y-6 text-left">
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

              <div className="p-8 rounded-3xl border border-amber-500/30 bg-white dark:bg-[#16181d] shadow-2xl space-y-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Creator Verification</h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    The Admin Dashboard is strictly restricted to the site creator. Only the verified creator account or authorized passcode can manage novel publications and database settings.
                  </p>
                </div>

                {isSupabaseConfigured && (
                  <form onSubmit={handleSupabaseCreatorLogin} className="space-y-3 text-left border-b border-slate-200 dark:border-slate-800 pb-5">
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center space-x-1">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Supabase Creator Login</span>
                    </span>
                    <input
                      type="email"
                      value={creatorEmailInput}
                      onChange={(e) => setCreatorEmailInput(e.target.value)}
                      placeholder="Creator Email (e.g. ashtranslation123@gmail.com)"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    />
                    <input
                      type="password"
                      value={creatorPasswordInput}
                      onChange={(e) => setCreatorPasswordInput(e.target.value)}
                      placeholder="Password"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    />
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Verifying...' : 'Sign In as Creator'}
                    </button>
                  </form>
                )}

                <form onSubmit={handleCreatorPasscodeLogin} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                      {isSupabaseConfigured ? 'Or Direct Creator Passcode' : 'Enter Creator Passcode'}
                    </label>
                    <input
                      type="password"
                      value={passcodeInput}
                      onChange={(e) => {
                        setPasscodeInput(e.target.value);
                        setPasscodeError('');
                      }}
                      placeholder="Enter secret creator passcode..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                    />
                    {passcodeError && (
                      <p className="text-[11px] text-rose-500 font-semibold">{passcodeError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Key className="w-4 h-4" />
                    <span>Unlock Admin Dashboard</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">
                    Default developer passcode: <span className="font-mono text-amber-500">creator123</span>
                  </p>
                </form>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
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
                <div>
                  <h1 className="text-2xl font-extrabold flex items-center space-x-2 text-slate-900 dark:text-white">
                    <Shield className="w-6 h-6 text-amber-500" />
                    <span>AshTL Admin Dashboard</span>
                  </h1>
                  <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">Content translation management and publication controls</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full flex items-center space-x-1">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Creator Session Active</span>
                  </span>
                  <button
                    onClick={handleCreatorLogout}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                    title="Lock creator session"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Session</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Total Novels</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{novels.length}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Total Chapters</span>
                  <p className="text-2xl font-black text-violet-700 dark:text-violet-400">
                    {novels.reduce((acc, n) => acc + n.chapters.length, 0)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Bookmarked Count</span>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-500">{bookmarks.length}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-1">
                  <span className="text-xs text-slate-800 dark:text-slate-300 font-bold">Database Mode</span>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    {isSupabaseConfigured ? 'Supabase Cloud' : 'Local Storage'}
                  </p>
                </div>
              </div>

              {/* Admin Tabs */}
              <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  onClick={() => setAdminActiveTab('create-novel')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    adminActiveTab === 'create-novel'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <BookPlus className="w-4 h-4" />
                  <span>1. Create New Translated Novel</span>
                </button>
                <button
                  onClick={() => setAdminActiveTab('add-chapter')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    adminActiveTab === 'add-chapter'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>2. Upload Chapter to Novel</span>
                </button>
                <button
                  onClick={() => setAdminActiveTab('creator-settings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    adminActiveTab === 'creator-settings'
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>3. Creator Security Settings</span>
                </button>
              </div>

              {/* Tab 1: Create Novel Form */}
              {adminActiveTab === 'create-novel' && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-4">
                  <h3 className="font-bold text-base flex items-center space-x-2 text-slate-900 dark:text-white">
                    <BookPlus className="w-4 h-4 text-violet-500" />
                    <span>Create New Translated Web Novel</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <input
                      type="text"
                      value={newNovelTitle}
                      onChange={(e) => setNewNovelTitle(e.target.value)}
                      placeholder="Novel Title (e.g. Return of the Mount Hua Sect)"
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium"
                    />
                    <input
                      type="text"
                      value={newNovelAuthor}
                      onChange={(e) => setNewNovelAuthor(e.target.value)}
                      placeholder="Author (e.g. Biga)"
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium"
                    />
                    <input
                      type="text"
                      value={newNovelTranslator}
                      onChange={(e) => setNewNovelTranslator(e.target.value)}
                      placeholder="Translator / Group Name (e.g. ClydeTL)"
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-medium"
                    />
                    <select
                      value={newNovelStatus}
                      onChange={(e) => setNewNovelStatus(e.target.value as any)}
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold cursor-pointer"
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Hiatus">Hiatus</option>
                    </select>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300">Cover Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewNovelCoverData(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700 dark:file:bg-violet-950/40 dark:file:text-violet-300 hover:file:bg-violet-200 cursor-pointer"
                      />
                      {newNovelCoverData && (
                        <img src={newNovelCoverData} alt="Cover preview" className="w-20 h-28 object-cover rounded-lg border border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={newNovelGenres}
                      onChange={(e) => setNewNovelGenres(e.target.value)}
                      placeholder="Genres comma-separated (e.g. Fantasy, Martial Arts, Action)"
                      className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                    />
                    <input
                      type="text"
                      value={newNovelAltTitles}
                      onChange={(e) => setNewNovelAltTitles(e.target.value)}
                      placeholder="Alternative Titles comma-separated (e.g. 화산귀환, Return of Mount Hua)"
                      className="md:col-span-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                    />
                    <textarea
                      rows={3}
                      value={newNovelSynopsis}
                      onChange={(e) => setNewNovelSynopsis(e.target.value)}
                      placeholder="Synopsis / Summary description..."
                      className="md:col-span-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <button
                    onClick={handleCreateNovel}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Create Novel
                  </button>
                </div>
              )}

              {/* Tab 2: Upload Chapter Form */}
              {adminActiveTab === 'add-chapter' && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-4">
                  <h3 className="font-bold text-base flex items-center space-x-2 text-slate-900 dark:text-white">
                    <Plus className="w-4 h-4 text-violet-500" />
                    <span>Upload Translated Chapter</span>
                  </h3>
                  {novels.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      No novels exist yet! Please switch to tab "1. Create New Translated Novel" first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <input
                        type="text"
                        value={adminChapterTitle}
                        onChange={(e) => setAdminChapterTitle(e.target.value)}
                        placeholder="Chapter Title (e.g. Chapter 1: The Beginning of the Journey)"
                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 font-medium"
                      />
                      <select 
                        aria-label="Select novel to publish chapter to" 
                        value={adminNovelId}
                        onChange={(e) => setAdminNovelId(e.target.value)}
                        className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold cursor-pointer"
                      >
                        {novels.map(n => <option key={n.id} value={n.id}>{n.title} ({n.chapters.length} chaps)</option>)}
                      </select>
                      <textarea
                        rows={5}
                        value={adminChapterContent}
                        onChange={(e) => setAdminChapterContent(e.target.value)}
                        placeholder="Paste English translated chapter text here (paragraphs separated by blank lines)..."
                        className="md:col-span-2 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400"
                      />
                    </div>
                  )}
                  <button
                    disabled={novels.length === 0}
                    onClick={handlePublishChapter}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Publish Chapter
                  </button>
                </div>
              )}

              {/* Tab 3: Creator Security Settings */}
              {adminActiveTab === 'creator-settings' && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base flex items-center space-x-2 text-slate-900 dark:text-white">
                      <Key className="w-4 h-4 text-amber-500" />
                      <span>Creator Security & Database Credentials</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Manage your secret creator passcode and inspect database cloud synchronization.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Cloud Database Status (Supabase)</h4>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode (Offline / Dev)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Authorized Creator Email: <span className="font-mono font-bold text-violet-700 dark:text-violet-400">{CREATOR_EMAIL}</span>.
                      {isSupabaseConfigured 
                        ? ' All published novels and uploaded chapters are synced globally.' 
                        : ' To connect your Supabase project, create a project on supabase.com, execute the schema from supabase/schema.sql, and copy your credentials into .env.'}
                    </p>
                  </div>

                  <div className="space-y-3 max-w-md">
                    <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300">Update Creator Passcode</label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        value={newPasscodeSetting}
                        onChange={(e) => setNewPasscodeSetting(e.target.value)}
                        placeholder="Enter new 4+ character passcode..."
                        className="flex-1 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                      />
                      <button
                        onClick={handleUpdateCreatorPasscode}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Novels Directory in Admin */}
              {novels.length > 0 && (
                <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#16181d] space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Translated Novels ({novels.length})</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {novels.map(novel => (
                      <div key={novel.id} className="py-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{novel.title}</h4>
                          <p className="text-xs text-slate-700 dark:text-slate-400 font-medium">
                            {novel.chapters.length} chapters • Translator: {novel.translator}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openNovelDetail(novel.slug)}
                            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${novel.title}"?`)) {
                                setNovels(novels.filter(n => n.id !== novel.id));
                                showToast(`Deleted "${novel.title}"`);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                            title="Delete Novel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
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
            <p className="mt-2 sm:mt-0">Built for speed, mobile readability & clean translations.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
