import React from 'react';
import {
  BookOpen,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  FileEdit,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Novel, Comment } from '../../types/novel';

interface AdminDashboardProps {
  novels: Novel[];
  comments: Comment[];
  onNavigateSection: (section: 'novels' | 'chapters' | 'comments' | 'settings') => void;
  onOpenCreateNovel: () => void;
  onOpenCreateChapter: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  novels,
  comments,
  onNavigateSection,
  onOpenCreateNovel,
  onOpenCreateChapter
}) => {
  const totalNovels = novels.length;
  const publishedNovels = novels.filter((n) => n.isPublished !== false).length;
  const draftNovels = totalNovels - publishedNovels;

  const totalChapters = novels.reduce((acc, n) => acc + (n.chapters ? n.chapters.length : 0), 0);
  const totalComments = comments.length;

  // Flatten chapters and sort by releaseDate descending
  const recentChapters = novels
    .flatMap((novel) =>
      (novel.chapters || []).map((ch) => ({
        novelTitle: novel.title,
        novelSlug: novel.slug,
        chapterNumber: ch.chapterNumber,
        title: ch.title,
        releaseDate: ch.releaseDate,
        isPublished: ch.isPublished !== false
      }))
    )
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 text-left">
      {/* Title & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time statistics and publication telemetry for AshTL.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenCreateNovel}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Novel</span>
          </button>
          <button
            onClick={onOpenCreateChapter}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Statistics Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Novels */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Novels</span>
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{totalNovels}</p>
          <div className="text-[11px] text-slate-400 font-medium">
            Active catalog series
          </div>
        </div>

        {/* Published Novels */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Published</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400">{publishedNovels}</p>
          <div className="text-[11px] text-slate-400 font-medium">
            Visible to public visitors
          </div>
        </div>

        {/* Draft Novels */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Draft Novels</span>
            <FileEdit className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400">{draftNovels}</p>
          <div className="text-[11px] text-slate-400 font-medium">
            Unpublished works in progress
          </div>
        </div>

        {/* Total Chapters */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Chapters</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-300">{totalChapters}</p>
          <div className="text-[11px] text-slate-400 font-medium">
            Translated releases
          </div>
        </div>

        {/* Total Comments */}
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Comments</span>
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400">{totalComments}</p>
          <div className="text-[11px] text-slate-400 font-medium">
            Reader feedback entries
          </div>
        </div>
      </div>

      {/* Main Grid: Recently Added Chapters + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Chapters Table (2 cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white">Recently Added Chapters</h2>
            </div>
            <button
              onClick={() => onNavigateSection('chapters')}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentChapters.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No translated chapters have been uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentChapters.map((ch, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      Ch. {ch.chapterNumber}: {ch.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {ch.novelTitle}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        ch.isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {ch.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      {new Date(ch.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Panel (1 col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Admin Shortcuts</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use these shortcuts to manage translated novels, author chapters, and moderate comments.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigateSection('novels')}
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Novel Catalog Management</p>
                  <p className="text-[11px] text-slate-400">Add, edit, or publish novel entries</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateSection('chapters')}
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Chapter Editor</p>
                  <p className="text-[11px] text-slate-400">Write, edit, and organize chapters</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigateSection('comments')}
                className="w-full text-left p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">Comment Moderation</p>
                  <p className="text-[11px] text-slate-400">Review feedback & moderate comments</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-violet-950/30 border border-violet-800/40 text-[11px] text-violet-300 mt-4">
            Security Status: Row Level Security is enforced in PostgreSQL. Non-admin Google users cannot execute mutations.
          </div>
        </div>
      </div>
    </div>
  );
};
