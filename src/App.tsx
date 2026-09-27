import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, Bookmark, History, Settings, Sun, Moon, Sparkles, 
  ChevronLeft, ChevronRight, Menu, X, ArrowRight, Star, 
  Flame, Sliders, Shield, AlertTriangle, Play, Plus,
  Trash2, Layers, RefreshCw, Globe, CheckCircle2
} from 'lucide-react';
import { Novel, Chapter, ReadingSettings, BookmarkItem, HistoryItem } from './types/novel';
import { INITIAL_NOVELS, ALL_GENRES } from './data/initialNovels';
import { AdSlot } from './components/AdSlot';

export { AdSlot };

export default function App() {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'home' | 'novels' | 'novel-detail' | 'reader' | 'bookmarks' | 'history' | 'admin' | 'privacy' | 'dmca' | 'about'>('home');
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string>('the-silent-moon');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('c1');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Novel Data & Dynamic Filtering
  const [novels, setNovels] = useState<Novel[]>(INITIAL_NOVELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedLang, setSelectedLang] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'latest' | 'rating'>('popular');

  // Admin Chapter Upload State
  const [adminNovelId, setAdminNovelId] = useState<string>(INITIAL_NOVELS[0]?.id || '1');
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

  // Admin Chapter Publishing Handler
  const handlePublishChapter = () => {
    if (!adminChapterTitle.trim() || !adminChapterContent.trim()) {
      showToast('Please provide both chapter title and content');
      return;
    }
    const targetNovel = novels.find(n => n.id === adminNovelId);
    if (!targetNovel) return;

    const newChapter: Chapter = {
      id: `c_${Date.now()}`,
      chapterNumber: targetNovel.chapters.length + 1,
      title: adminChapterTitle,
      content: adminChapterContent,
      releaseDate: new Date().toISOString().split('T')[0],
      wordCount: adminChapterContent.split(/\s+/).filter(Boolean).length
    };

    setNovels(novels.map(n => n.id === adminNovelId ? {
      ...n,
      latestChapter: newChapter.chapterNumber,
      chapters: [...n.chapters, newChapter]
    } : n));

    setAdminChapterTitle('');
    setAdminChapterContent('');
    showToast(`Published "${adminChapterTitle}"!`);
  };

  // Selected Novel Reference
  const currentNovel = useMemo(() => {
    return novels.find(n => n.slug === selectedNovelSlug) || novels[0];
  }, [novels, selectedNovelSlug]);

  const currentChapter = useMemo(() => {
    return currentNovel.chapters.find(c => c.id === selectedChapterId) || currentNovel.chapters[0];
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
      const matchesLang = selectedLang === 'All' || novel.originalLanguage === selectedLang;

      return matchesSearch && matchesGenre && matchesStatus && matchesLang;
    }).sort((a, b) => {
      if (sortBy === 'popular') return b.views - a.views;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.id.localeCompare(a.id);
    });
  }, [novels, searchQuery, selectedGenre, selectedStatus, selectedLang, sortBy]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      themeMode === 'dark' 
        ? 'bg-[#121316] text-ash-100 dark' 
        : 'bg-[#fcfbf9] text-ash-900'
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
        <header className="sticky top-0 z-40 border-b border-ash-200/80 dark:border-ash-800/80 bg-white/80 dark:bg-[#16181d]/80 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <button 
              onClick={() => setCurrentPage('home')} 
              className="flex items-center space-x-2.5 group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-ash-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                </div>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-ash-900 via-violet-700 to-indigo-600 dark:from-white dark:via-ash-100 dark:to-violet-400 bg-clip-text text-transparent">
                  AshTL
                </span>
                <span className="text-[10px] font-medium text-ash-400 tracking-wider -mt-1 hidden sm:inline">
                  Read • Translate • Discover
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-ash-600 dark:text-ash-300 hover:text-ash-900 dark:hover:text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentPage('novels')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === 'novels' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-ash-600 dark:text-ash-300 hover:text-ash-900 dark:hover:text-white'}`}
              >
                Novels
              </button>
              <button 
                onClick={() => setCurrentPage('bookmarks')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${currentPage === 'bookmarks' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-ash-600 dark:text-ash-300 hover:text-ash-900 dark:hover:text-white'}`}
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
                onClick={() => setCurrentPage('history')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${currentPage === 'history' ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40' : 'text-ash-600 dark:text-ash-300 hover:text-ash-900 dark:hover:text-white'}`}
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
              <button 
                onClick={() => setCurrentPage('admin')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${currentPage === 'admin' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' : 'text-ash-600 dark:text-ash-300 hover:text-ash-900 dark:hover:text-white'}`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg border border-ash-200 dark:border-ash-800 text-ash-600 dark:text-ash-300 hover:bg-ash-100 dark:hover:bg-ash-800 transition-colors"
                title="Toggle Light/Dark Theme"
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-ash-700" />}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg border border-ash-200 dark:border-ash-800 text-ash-600 dark:text-ash-300"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-b border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
              <button
                onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ash-700 dark:text-ash-200 hover:bg-ash-100 dark:hover:bg-ash-800"
              >
                Home
              </button>
              <button
                onClick={() => { setCurrentPage('novels'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ash-700 dark:text-ash-200 hover:bg-ash-100 dark:hover:bg-ash-800"
              >
                Browse Novels
              </button>
              <button
                onClick={() => { setCurrentPage('bookmarks'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ash-700 dark:text-ash-200 hover:bg-ash-100 dark:hover:bg-ash-800 flex items-center justify-between"
              >
                <span>Bookmarks</span>
                {bookmarks.length > 0 && (
                  <span className="px-2 py-0.5 bg-violet-600 text-white text-xs rounded-full">{bookmarks.length}</span>
                )}
              </button>
              <button
                onClick={() => { setCurrentPage('history'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ash-700 dark:text-ash-200 hover:bg-ash-100 dark:hover:bg-ash-800"
              >
                Reading History
              </button>
              <button
                onClick={() => { setCurrentPage('admin'); setIsMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-ash-100 dark:hover:bg-ash-800"
              >
                Admin Control Panel
              </button>
              <div className="pt-2 border-t border-ash-200 dark:border-ash-800 flex justify-around text-xs text-ash-500">
                <button onClick={() => { setCurrentPage('about'); setIsMobileMenuOpen(false); }}>About</button>
                <button onClick={() => { setCurrentPage('dmca'); setIsMobileMenuOpen(false); }}>DMCA</button>
                <button onClick={() => { setCurrentPage('privacy'); setIsMobileMenuOpen(false); }}>Privacy</button>
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
            <section className="relative overflow-hidden bg-gradient-to-b from-violet-900/20 via-transparent to-transparent pt-12 pb-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Human & High-Quality Translations</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ash-900 dark:text-white leading-tight">
                  Discover Your Next <span className="bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">Immersive Story</span>
                </h1>
                <p className="text-lg text-ash-600 dark:text-ash-300 max-w-2xl mx-auto font-normal">
                  Read translated Asian web novels with dual-language line alignment, customizable distraction-free readers, and daily chapter updates.
                </p>

                {/* Search Input Bar */}
                <div className="max-w-2xl mx-auto relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-ash-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setCurrentPage('novels'); }}
                    placeholder="Search novels, authors, or genres (e.g. Fantasy, Silent Moon)..."
                    className="w-full pl-12 pr-28 py-4 rounded-2xl border border-ash-200 dark:border-ash-700 bg-white dark:bg-ash-900 text-ash-900 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                  <button
                    onClick={() => setCurrentPage('novels')}
                    className="absolute right-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                  >
                    Explore
                  </button>
                </div>

                {/* Popular Tags Quick Search */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-ash-500">
                  <span className="font-semibold text-ash-400">Popular Genres:</span>
                  {['Fantasy', 'Martial Arts', 'Romance', 'Action', 'System'].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => { setSelectedGenre(genre); setCurrentPage('novels'); }}
                      className="px-2.5 py-1 rounded-md bg-ash-100 dark:bg-ash-800 text-ash-700 dark:text-ash-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
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

            {/* Featured Hero Novel Spotlight */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative rounded-3xl overflow-hidden border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#181a20] shadow-2xl p-6 sm:p-8 grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-4 lg:col-span-3 flex justify-center">
                  <img
                    src={novels[0].coverUrl}
                    alt={novels[0].title}
                    className="w-48 sm:w-56 md:w-full h-72 object-cover rounded-2xl shadow-xl border border-ash-700/30"
                  />
                </div>
                <div className="md:col-span-8 lg:col-span-9 space-y-4 text-left">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>Featured Spotlight Novel</span>
                  </div>
                  <h2 className="text-3xl font-bold text-ash-900 dark:text-white">
                    {novels[0].title}
                  </h2>
                  <p className="text-sm text-ash-500 dark:text-ash-400 flex items-center space-x-3">
                    <span>By {novels[0].author}</span>
                    <span>•</span>
                    <span>TL: {novels[0].translator}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold">{novels[0].status}</span>
                  </p>
                  <p className="text-sm text-ash-600 dark:text-ash-300 line-clamp-3 leading-relaxed">
                    {novels[0].synopsis}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {novels[0].genres.map(g => (
                      <span key={g} className="px-2.5 py-1 bg-ash-100 dark:bg-ash-800 text-ash-700 dark:text-ash-300 rounded-md text-xs font-medium">
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className="pt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setSelectedNovelSlug(novels[0].slug);
                        setSelectedChapterId(novels[0].chapters[0].id);
                        setCurrentPage('reader');
                      }}
                      className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-600/30 flex items-center space-x-2 transition-transform active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Reading Ch. 1</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNovelSlug(novels[0].slug);
                        setCurrentPage('novel-detail');
                      }}
                      className="px-5 py-3 border border-ash-300 dark:border-ash-700 text-ash-800 dark:text-ash-200 rounded-xl text-sm font-semibold hover:bg-ash-100 dark:hover:bg-ash-800 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Recently Updated Grid Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between border-b border-ash-200 dark:border-ash-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-ash-900 dark:text-white flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 text-violet-500" />
                    <span>Recently Updated</span>
                  </h3>
                  <p className="text-xs text-ash-500">Fresh chapters translated daily</p>
                </div>
                <button
                  onClick={() => setCurrentPage('novels')}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Novels Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {novels.map((novel) => (
                  <div
                    key={novel.id}
                    className="group rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#17191f] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div 
                        onClick={() => { setSelectedNovelSlug(novel.slug); setCurrentPage('novel-detail'); }}
                        className="relative h-56 sm:h-64 w-full overflow-hidden cursor-pointer bg-ash-800"
                      >
                        <img
                          src={novel.coverUrl}
                          alt={novel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold rounded-md flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-amber-400" />
                          <span>{novel.originalLanguage}</span>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-md">
                          Ch. {novel.latestChapter}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-3.5 space-y-2 text-left">
                        <h4 
                          onClick={() => { setSelectedNovelSlug(novel.slug); setCurrentPage('novel-detail'); }}
                          className="font-bold text-sm sm:text-base text-ash-900 dark:text-white line-clamp-1 cursor-pointer hover:text-violet-500 transition-colors"
                        >
                          {novel.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-ash-500">
                          <span className="flex items-center space-x-1 text-amber-500 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{novel.rating}</span>
                          </span>
                          <span className="text-[11px] text-emerald-500">{novel.status}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {novel.genres.slice(0, 2).map((g) => (
                            <span key={g} className="px-2 py-0.5 bg-ash-100 dark:bg-ash-800/80 text-ash-600 dark:text-ash-400 text-[10px] rounded-md">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 pt-0 flex items-center justify-between border-t border-ash-100 dark:border-ash-800/50 mt-2">
                      <button
                        onClick={() => {
                          setSelectedNovelSlug(novel.slug);
                          setSelectedChapterId(novel.chapters[0]?.id || 'c1');
                          setCurrentPage('reader');
                        }}
                        className="w-full py-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Chapter</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* NOVEL CATALOG VIEW */}
        {currentPage === 'novels' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
            {/* Header & Filter Controls */}
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold text-ash-900 dark:text-white">Novel Catalog</h1>
              <p className="text-sm text-ash-500">Filter through our collection of translated web novels.</p>

              {/* Filtering Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] shadow-sm">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-ash-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 text-ash-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Genre Selector */}
                <select
                  aria-label="Filter by genre"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 text-ash-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 text-ash-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Language Selector */}
                <select
                  aria-label="Filter by language"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 text-ash-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="All">All Languages</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Korean">Korean</option>
                  <option value="Japanese">Japanese</option>
                </select>

                {/* Sort Order */}
                <select
                  aria-label="Sort novels"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 text-ash-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
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
                <h3 className="text-lg font-bold">No Novels Found</h3>
                <p className="text-xs text-ash-500">Try adjusting your filters or search keywords.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All');
                    setSelectedStatus('All');
                    setSelectedLang('All');
                  }}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredNovels.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => { setSelectedNovelSlug(novel.slug); setCurrentPage('novel-detail'); }}
                    className="group rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#17191f] overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-60 w-full overflow-hidden bg-ash-800">
                      <img
                        src={novel.coverUrl}
                        alt={novel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded font-semibold">
                        {novel.originalLanguage}
                      </div>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="font-bold text-sm text-ash-900 dark:text-white line-clamp-1 group-hover:text-violet-500 transition-colors">
                        {novel.title}
                      </h4>
                      <p className="text-[11px] text-ash-500 line-clamp-1">{novel.author}</p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-amber-500 font-bold flex items-center space-x-0.5">
                          <Star className="w-3 h-3 fill-amber-500" />
                          <span>{novel.rating}</span>
                        </span>
                        <span className="text-ash-400">Ch. {novel.latestChapter}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOVEL DETAIL VIEW */}
        {currentPage === 'novel-detail' && currentNovel && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
            {/* Novel Overview Hero */}
            <div className="rounded-3xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] p-6 sm:p-8 shadow-xl grid md:grid-cols-12 gap-8">
              {/* Cover */}
              <div className="md:col-span-4 lg:col-span-3 space-y-4">
                <img
                  src={currentNovel.coverUrl}
                  alt={currentNovel.title}
                  className="w-full h-80 object-cover rounded-2xl shadow-lg border border-ash-700/30"
                />
                <button
                  onClick={() => toggleBookmark(currentNovel)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border transition-colors ${
                    bookmarks.some(b => b.novelId === currentNovel.id)
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                      : 'border-ash-300 dark:border-ash-700 text-ash-700 dark:text-ash-200 hover:bg-ash-100 dark:hover:bg-ash-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarks.some(b => b.novelId === currentNovel.id) ? 'fill-amber-500' : ''}`} />
                  <span>{bookmarks.some(b => b.novelId === currentNovel.id) ? 'Bookmarked' : 'Add to Bookmarks'}</span>
                </button>
              </div>

              {/* Info Details */}
              <div className="md:col-span-8 lg:col-span-9 space-y-5">
                <div>
                  <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 text-xs font-bold rounded-md">
                    {currentNovel.originalLanguage} → English
                  </span>
                  <h1 className="text-3xl font-black text-ash-900 dark:text-white mt-2">
                    {currentNovel.title}
                  </h1>
                  <p className="text-xs text-ash-400 mt-1">
                    Alt titles: {currentNovel.altTitles.join(', ')}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-ash-50 dark:bg-ash-900/50 text-xs">
                  <div>
                    <span className="text-ash-400 block">Author</span>
                    <span className="font-semibold text-ash-800 dark:text-ash-200">{currentNovel.author}</span>
                  </div>
                  <div>
                    <span className="text-ash-400 block">Translator</span>
                    <span className="font-semibold text-violet-500">{currentNovel.translator}</span>
                  </div>
                  <div>
                    <span className="text-ash-400 block">Status</span>
                    <span className="font-semibold text-emerald-500">{currentNovel.status}</span>
                  </div>
                  <div>
                    <span className="text-ash-400 block">Rating</span>
                    <span className="font-semibold text-amber-500 flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{currentNovel.rating} / 5.0</span>
                    </span>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {currentNovel.genres.map(g => (
                    <span key={g} className="px-3 py-1 bg-ash-100 dark:bg-ash-800 text-ash-700 dark:text-ash-300 rounded-lg text-xs font-medium">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedChapterId(currentNovel.chapters[0].id);
                      setCurrentPage('reader');
                    }}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-violet-600/30 flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Start Reading Ch. 1</span>
                  </button>
                  {currentNovel.chapters.length > 1 && (
                    <button
                      onClick={() => {
                        setSelectedChapterId(currentNovel.chapters[currentNovel.chapters.length - 1].id);
                        setCurrentPage('reader');
                      }}
                      className="px-5 py-3 border border-ash-300 dark:border-ash-700 text-ash-800 dark:text-ash-200 font-semibold rounded-xl text-sm hover:bg-ash-100 dark:hover:bg-ash-800"
                    >
                      Latest Chapter
                    </button>
                  )}
                </div>

                {/* Synopsis */}
                <div className="space-y-2 pt-2 border-t border-ash-200 dark:border-ash-800">
                  <h3 className="text-sm font-bold text-ash-900 dark:text-white uppercase tracking-wider">Synopsis</h3>
                  <p className="text-sm text-ash-600 dark:text-ash-300 leading-relaxed whitespace-pre-line">
                    {currentNovel.synopsis}
                  </p>
                </div>

                {/* Translator Note */}
                {currentNovel.translatorNotes && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-300">
                    {currentNovel.translatorNotes}
                  </div>
                )}
              </div>
            </div>

            {/* Ad Placement */}
            <AdSlot slotLocation="novel-sidebar" />

            {/* Chapter List Section */}
            <div className="rounded-3xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-ash-900 dark:text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-violet-500" />
                  <span>Chapter Directory</span>
                </h3>
                <span className="text-xs text-ash-400">{currentNovel.chapters.length} Chapters Available</span>
              </div>

              <div className="divide-y divide-ash-100 dark:divide-ash-800/60">
                {currentNovel.chapters.map((chap) => (
                  <div
                    key={chap.id}
                    onClick={() => {
                      setSelectedChapterId(chap.id);
                      setCurrentPage('reader');
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-ash-50 dark:hover:bg-ash-800/40 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-sm text-ash-900 dark:text-ash-100 hover:text-violet-500">
                        {chap.title}
                      </span>
                      <div className="flex items-center space-x-3 text-[11px] text-ash-400">
                        <span>{chap.wordCount} Words</span>
                        <span>•</span>
                        <span>Released: {chap.releaseDate}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ash-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* READER VIEW */}
        {currentPage === 'reader' && currentNovel && currentChapter && (
          <div className={`min-h-screen transition-colors duration-200 ${
            readerSettings.theme === 'light' ? 'bg-[#fdfbf7] text-[#2c2c2c]' :
            readerSettings.theme === 'sepia' ? 'bg-[#f4ecd8] text-[#3e3223]' :
            readerSettings.theme === 'pitch-black' ? 'bg-black text-[#d0d0d0]' :
            'bg-[#121316] text-[#e0e0e0]'
          }`}>
            {/* Reader Floating Header Bar */}
            <header className="sticky top-0 z-50 border-b border-ash-200/40 dark:border-ash-800/40 backdrop-blur-md bg-opacity-90 px-4 h-14 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setCurrentPage('novel-detail')}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title="Back to Novel Details"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-left max-w-xs sm:max-w-md truncate">
                  <h2 className="text-xs font-bold truncate opacity-80">{currentNovel.title}</h2>
                  <p className="text-[11px] truncate opacity-60">{currentChapter.title}</p>
                </div>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleBookmark(currentNovel, currentChapter.id, currentChapter.chapterNumber)}
                  className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
                  className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  title="Reading Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Reader Settings Slide-Down Panel */}
            <div id="reader-settings-panel" className="hidden border-b border-ash-200 dark:border-ash-800 bg-white dark:bg-ash-900 text-ash-900 dark:text-white p-6 max-w-2xl mx-auto shadow-2xl rounded-b-2xl animate-fadeIn space-y-6 text-left">
              <div className="flex items-center justify-between border-b pb-3 border-ash-200 dark:border-ash-800">
                <h3 className="font-bold text-sm flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-violet-500" />
                  <span>Reader Customizer</span>
                </h3>
                <button 
                  onClick={() => document.getElementById('reader-settings-panel')?.classList.add('hidden')}
                  className="text-xs text-ash-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Settings Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Font Size */}
                <div className="space-y-2">
                  <label className="font-semibold block text-ash-400">Font Size</label>
                  <div className="flex rounded-lg border border-ash-300 dark:border-ash-700 overflow-hidden">
                    {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => updateReaderSettings({ fontSize: size })}
                        className={`flex-1 py-1.5 uppercase font-bold transition-colors ${readerSettings.fontSize === size ? 'bg-violet-600 text-white' : 'hover:bg-ash-100 dark:hover:bg-ash-800'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reader Width */}
                <div className="space-y-2">
                  <label className="font-semibold block text-ash-400">Reading Area Width</label>
                  <div className="flex rounded-lg border border-ash-300 dark:border-ash-700 overflow-hidden">
                    {(['narrow', 'normal', 'wide'] as const).map(w => (
                      <button
                        key={w}
                        onClick={() => updateReaderSettings({ readerWidth: w })}
                        className={`flex-1 py-1.5 capitalize font-semibold transition-colors ${readerSettings.readerWidth === w ? 'bg-violet-600 text-white' : 'hover:bg-ash-100 dark:hover:bg-ash-800'}`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Palette */}
                <div className="space-y-2">
                  <label className="font-semibold block text-ash-400">Background Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'light', label: 'Light', bg: 'bg-[#fdfbf7] border-ash-300 text-black' },
                      { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8] border-amber-300 text-amber-900' },
                      { id: 'dark', label: 'Dark', bg: 'bg-[#121316] border-ash-700 text-white' },
                      { id: 'pitch-black', label: 'OLED', bg: 'bg-black border-ash-800 text-white' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateReaderSettings({ theme: t.id as any })}
                        className={`py-2 text-[11px] font-bold rounded-lg border ${t.bg} ${readerSettings.theme === t.id ? 'ring-2 ring-violet-500' : ''}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual-Language Translation View Toggle */}
                <div className="space-y-2">
                  <label className="font-semibold block text-ash-400">Translation Mode</label>
                  <select
                    value={readerSettings.translationView}
                    onChange={(e) => updateReaderSettings({ translationView: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-ash-300 dark:border-ash-700 bg-ash-50 dark:bg-ash-800 text-xs font-medium"
                  >
                    <option value="translation-only">English Translation Only</option>
                    <option value="dual-stacked">Dual Language (Original + Translation Stacked)</option>
                  </select>
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
              <div className="text-center space-y-2 mb-10 pb-6 border-b border-ash-500/20">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {currentChapter.title}
                </h1>
                <p className="text-xs opacity-60">
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
                  const rawParagraph = currentChapter.originalContent?.split('\n\n')[idx];
                  return (
                    <div key={idx} className="space-y-2">
                      {/* Optional Dual Language Original Paragraph Display */}
                      {readerSettings.translationView === 'dual-stacked' && rawParagraph && (
                        <p className="text-xs opacity-50 font-sans italic border-l-2 border-violet-500/40 pl-3">
                          {rawParagraph}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{paragraph}</p>
                    </div>
                  );
                })}
              </div>

              {/* Bottom In-Content Ad */}
              <AdSlot slotLocation="chapter-bottom" />

              {/* Chapter Bottom Navigation Bar */}
              <div className="mt-12 pt-8 border-t border-ash-500/20 flex items-center justify-between gap-4">
                {/* Previous Chapter */}
                <button
                  disabled={currentChapter.chapterNumber <= 1}
                  onClick={() => {
                    const prevCh = currentNovel.chapters.find(c => c.chapterNumber === currentChapter.chapterNumber - 1);
                    if (prevCh) {
                      setSelectedChapterId(prevCh.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl border border-ash-500/30 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 flex items-center space-x-1"
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3 py-2 rounded-xl border border-ash-500/30 bg-transparent text-xs font-bold focus:outline-none"
                >
                  {currentNovel.chapters.map(c => (
                    <option key={c.id} value={c.id} className="bg-ash-900 text-white">
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
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-700 flex items-center space-x-1"
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
            <div className="flex items-center justify-between border-b border-ash-200 dark:border-ash-800 pb-4">
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <Bookmark className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                <span>My Saved Bookmarks ({bookmarks.length})</span>
              </h1>
            </div>

            {bookmarks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-ash-400 mx-auto" />
                <h3 className="text-base font-bold">No Bookmarks Saved Yet</h3>
                <p className="text-xs text-ash-500">Click the bookmark icon on any novel to save it for quick access.</p>
                <button
                  onClick={() => setCurrentPage('novels')}
                  className="px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg"
                >
                  Explore Novels
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((b) => (
                  <div
                    key={b.novelId}
                    className="p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] flex space-x-4 items-center shadow-sm"
                  >
                    <img src={b.novelCover} alt={b.novelTitle} className="w-16 h-20 object-cover rounded-xl" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{b.novelTitle}</h4>
                      <p className="text-xs text-violet-500">Ch. {b.lastReadChapterNum}</p>
                      <button
                        onClick={() => {
                          setSelectedNovelSlug(novels.find(n => n.id === b.novelId)?.slug || 'the-silent-moon');
                          setSelectedChapterId(b.lastReadChapterId);
                          setCurrentPage('reader');
                        }}
                        className="px-3 py-1 bg-violet-600 text-white text-[11px] font-semibold rounded-md mt-1"
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
            <div className="flex items-center justify-between border-b border-ash-200 dark:border-ash-800 pb-4">
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <History className="w-6 h-6 text-violet-500" />
                <span>Reading History</span>
              </h1>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem('ashtl_history');
                  }}
                  className="text-xs text-rose-500 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-ash-500 text-xs">
                <p>No reading history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.novelId}
                    className="p-4 rounded-xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={item.novelCover} alt="" className="w-10 h-12 object-cover rounded-md" />
                      <div>
                        <h4 className="font-bold text-sm">{item.novelTitle}</h4>
                        <p className="text-xs text-ash-400">Chapter {item.lastReadChapterNum}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedNovelSlug(novels.find(n => n.id === item.novelId)?.slug || 'the-silent-moon');
                        setSelectedChapterId(item.lastReadChapterId);
                        setCurrentPage('reader');
                      }}
                      className="px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-semibold rounded-lg"
                    >
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {currentPage === 'admin' && (
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 text-left">
            <div className="flex items-center justify-between border-b border-ash-200 dark:border-ash-800 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-amber-500" />
                  <span>AshTL Admin Dashboard</span>
                </h1>
                <p className="text-xs text-ash-400">Content translation management and analytics</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold rounded-full">
                System Active
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] space-y-1">
                <span className="text-xs text-ash-400 font-semibold">Total Novels</span>
                <p className="text-2xl font-black text-ash-900 dark:text-white">{novels.length}</p>
              </div>
              <div className="p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] space-y-1">
                <span className="text-xs text-ash-400 font-semibold">Total Chapters</span>
                <p className="text-2xl font-black text-violet-500">
                  {novels.reduce((acc, n) => acc + n.chapters.length, 0)}
                </p>
              </div>
              <div className="p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] space-y-1">
                <span className="text-xs text-ash-400 font-semibold">Monthly Readers</span>
                <p className="text-2xl font-black text-amber-500">142.5K</p>
              </div>
              <div className="p-4 rounded-2xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] space-y-1">
                <span className="text-xs text-ash-400 font-semibold">Monetization Status</span>
                <p className="text-sm font-bold text-emerald-500">Montagem Active</p>
              </div>
            </div>

            {/* Quick Novel Creation Form */}
            <div className="p-6 rounded-3xl border border-ash-200 dark:border-ash-800 bg-white dark:bg-[#16181d] space-y-4">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Plus className="w-4 h-4 text-violet-500" />
                <span>Upload New Translated Chapter</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <input
                  type="text"
                  value={adminChapterTitle}
                  onChange={(e) => setAdminChapterTitle(e.target.value)}
                  placeholder="Chapter Title (e.g. Chapter 129: Unsealed Astral Gate)"
                  className="p-3 rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900"
                />
                <select 
                  aria-label="Select novel to publish chapter to" 
                  value={adminNovelId}
                  onChange={(e) => setAdminNovelId(e.target.value)}
                  className="p-3 rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900"
                >
                  {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                </select>
                <textarea
                  rows={4}
                  value={adminChapterContent}
                  onChange={(e) => setAdminChapterContent(e.target.value)}
                  placeholder="Paste translated chapter text here..."
                  className="md:col-span-2 p-3 rounded-xl border border-ash-200 dark:border-ash-700 bg-ash-50 dark:bg-ash-900 font-mono text-xs"
                />
              </div>
              <button
                onClick={handlePublishChapter}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Publish Chapter
              </button>
            </div>
          </div>
        )}

        {/* LEGAL & INFORMATION PAGES */}
        {currentPage === 'dmca' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <h1 className="text-3xl font-bold">DMCA Copyright Policy</h1>
            <p className="text-xs text-ash-400">Last updated: February 2026</p>
            <p className="text-sm text-ash-600 dark:text-ash-300">
              AshTL respects the intellectual property rights of authors and publishers. If you believe your copyrighted work has been infringed upon, please submit a formal takedown request to our copyright agent at <span className="text-violet-500 font-mono">dmca@ash-tl.com</span> including the URLs of the material in question.
            </p>
          </div>
        )}

        {currentPage === 'privacy' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-ash-600 dark:text-ash-300">
              AshTL uses browser LocalStorage to store reader customizations, reading progress, and saved bookmarks. We do not track personal identifying information without explicit consent.
            </p>
          </div>
        )}

        {currentPage === 'about' && (
          <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 text-left leading-relaxed">
            <h1 className="text-3xl font-bold">About AshTL</h1>
            <p className="text-sm text-ash-600 dark:text-ash-300">
              AshTL is a modern novel translation platform dedicated to delivering high-quality, human-translated Asian web novels with customizable reading modes and dual-language capabilities.
            </p>
          </div>
        )}
      </main>

      {/* Global Footer */}
      {currentPage !== 'reader' && (
        <footer className="border-t border-ash-200 dark:border-ash-800 bg-white dark:bg-[#0f1013] py-12 mt-16 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <span className="font-extrabold text-lg text-ash-900 dark:text-white">AshTL</span>
              </div>
              <p className="text-xs text-ash-400">
                Read. Translate. Discover. Bringing immersive translated web stories to global readers.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-ash-900 dark:text-white uppercase tracking-wider">Navigation</h4>
              <p onClick={() => setCurrentPage('home')} className="cursor-pointer text-ash-400 hover:text-violet-500">Home</p>
              <p onClick={() => setCurrentPage('novels')} className="cursor-pointer text-ash-400 hover:text-violet-500">Novel Catalog</p>
              <p onClick={() => setCurrentPage('bookmarks')} className="cursor-pointer text-ash-400 hover:text-violet-500">My Bookmarks</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-ash-900 dark:text-white uppercase tracking-wider">Legal & DMCA</h4>
              <p onClick={() => setCurrentPage('dmca')} className="cursor-pointer text-ash-400 hover:text-violet-500">DMCA Copyright Policy</p>
              <p onClick={() => setCurrentPage('privacy')} className="cursor-pointer text-ash-400 hover:text-violet-500">Privacy Policy</p>
              <p onClick={() => setCurrentPage('about')} className="cursor-pointer text-ash-400 hover:text-violet-500">About AshTL</p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-ash-900 dark:text-white uppercase tracking-wider">Monetization</h4>
              <p className="text-ash-400">Ad Provider: <span className="font-semibold text-amber-500">Montagem Ads</span></p>
              <p className="text-ash-400">AdSense Compatible Architecture Ready</p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-ash-200/50 dark:border-ash-800/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-ash-400">
            <p>© 2026 AshTL. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Built for speed, mobile readability & clean translations.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
