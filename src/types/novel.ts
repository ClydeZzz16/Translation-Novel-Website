export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  originalContent?: string;
  releaseDate: string;
  wordCount: number;
}

export interface Novel {
  id: string;
  slug: string;
  title: string;
  altTitles: string[];
  author: string;
  translator: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  originalLanguage: 'Chinese' | 'Korean' | 'Japanese' | 'English';
  genres: string[];
  rating: number;
  views: number;
  bookmarksCount: number;
  coverUrl: string;
  synopsis: string;
  latestChapter: number;
  chapters: Chapter[];
  translatorNotes?: string;
}

export interface ReadingSettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontFamily: 'sans' | 'serif' | 'mono';
  lineHeight: 'compact' | 'normal' | 'comfortable';
  readerWidth: 'narrow' | 'normal' | 'wide';
  theme: 'light' | 'dark' | 'sepia' | 'pitch-black';
  translationView: 'translation-only' | 'dual-stacked' | 'dual-split';
}

export interface BookmarkItem {
  novelId: string;
  lastReadChapterId: string;
  lastReadChapterNum: number;
  timestamp: number;
  novelTitle: string;
  novelCover: string;
}

export interface HistoryItem extends BookmarkItem {
  progressPercentage: number;
}

export interface UserProfile {
  username: string;
  bio: string;
  avatarUrl: string;
  joinDate: string;
  readingStreak: number;
}
