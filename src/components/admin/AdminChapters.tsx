import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  X,
  Layers,
  BookOpen
} from 'lucide-react';
import { Novel, Chapter } from '../../types/novel';

interface AdminChaptersProps {
  novels: Novel[];
  selectedNovelId?: string;
  onSaveChapter: (novelId: string, chapter: Chapter, isNew: boolean) => void;
  onDeleteChapter: (novelId: string, chapterId: string) => void;
  onTogglePublishChapter: (novelId: string, chapterId: string) => void;
  onReadChapterOnSite: (novelSlug: string, chapterId: string) => void;
}

export const AdminChapters: React.FC<AdminChaptersProps> = ({
  novels,
  selectedNovelId: initialNovelId,
  onSaveChapter,
  onDeleteChapter,
  onTogglePublishChapter,
  onReadChapterOnSite
}) => {
  const [selectedNovelId, setSelectedNovelId] = useState<string>(() => {
    if (initialNovelId && novels.some((n) => n.id === initialNovelId)) return initialNovelId;
    return novels.length > 0 ? novels[0].id : '';
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Chapter Form State
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');

  // Sync selected novel if novels array changes and selectedNovelId is empty
  useEffect(() => {
    if (!selectedNovelId && novels.length > 0) {
      setSelectedNovelId(novels[0].id);
    }
  }, [novels, selectedNovelId]);

  const currentNovel = novels.find((n) => n.id === selectedNovelId);
  const chapters = currentNovel?.chapters || [];

  const wordCount = chapterContent
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const resetForm = () => {
    const nextNum = chapters.length > 0 ? Math.max(...chapters.map((c) => c.chapterNumber)) + 1 : 1;
    setChapterNumber(nextNum);
    setChapterTitle(`Chapter ${nextNum}`);
    setChapterContent('');
    setEditingChapterId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setChapterNumber(ch.chapterNumber);
    setChapterTitle(ch.title);
    setChapterContent(ch.content);
    setIsEditorOpen(true);
  };

  const handleSubmit = (publishStatus: boolean) => {
    if (!currentNovel) return;
    if (!chapterTitle.trim()) {
      alert('Chapter title is required');
      return;
    }

    const chapterToSave: Chapter = {
      id: editingChapterId || `ch-${Date.now()}`,
      chapterNumber: Number(chapterNumber) || 1,
      title: chapterTitle.trim(),
      content: chapterContent.trim(),
      wordCount,
      releaseDate: new Date().toISOString(),
      isPublished: publishStatus
    };

    onSaveChapter(currentNovel.id, chapterToSave, !editingChapterId);
    setIsEditorOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Chapter Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Author translated releases, organize chapter sequence, and control publication visibility.
          </p>
        </div>
        <button
          disabled={novels.length === 0}
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chapter</span>
        </button>
      </div>

      {novels.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No novels available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please create a novel in the Novels section first before authoring chapters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Novel Selector Filter Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <label htmlFor="novel-selector" className="text-xs font-bold text-slate-300">
                Active Novel Series:
              </label>
            </div>
            <select
              id="novel-selector"
              value={selectedNovelId}
              onChange={(e) => setSelectedNovelId(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-bold sm:min-w-[280px] cursor-pointer"
            >
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.chapters ? n.chapters.length : 0} chapters)
                </option>
              ))}
            </select>
          </div>

          {/* Chapters Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {chapters.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No chapters uploaded yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add the first chapter for "{currentNovel?.title}".
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Upload Chapter 1
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 sm:px-6">Ch #</th>
                      <th className="py-3.5 px-4">Title</th>
                      <th className="py-3.5 px-4">Word Count</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Release Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {chapters
                      .slice()
                      .sort((a, b) => a.chapterNumber - b.chapterNumber)
                      .map((chapter) => {
                        const isPub = chapter.isPublished !== false;
                        return (
                          <tr key={chapter.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 sm:px-6 font-mono font-bold text-violet-400">
                              #{chapter.chapterNumber}
                            </td>
                            <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                              {chapter.title}
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono">
                              {chapter.wordCount || 0} words
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => currentNovel && onTogglePublishChapter(currentNovel.id, chapter.id)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                  isPub
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                }`}
                              >
                                {isPub ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{isPub ? 'Published' : 'Draft'}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(chapter.releaseDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => currentNovel && onReadChapterOnSite(currentNovel.slug, chapter.id)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                                  title="Read in Reader"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(chapter)}
                                  className="p-1.5 text-violet-400 hover:text-white hover:bg-violet-600 rounded-lg cursor-pointer"
                                  title="Edit Chapter"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete "${chapter.title}"?`)) {
                                      if (currentNovel) onDeleteChapter(currentNovel.id, chapter.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg cursor-pointer"
                                  title="Delete Chapter"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chapter Authoring & Editing Modal / Drawer */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-violet-400" />
                  <span>{editingChapterId ? 'Edit Translated Chapter' : 'Author New Chapter'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Target Series: <span className="text-violet-400 font-semibold">{currentNovel?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Editor */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Chapter Number *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Chapter Title *</label>
                  <input
                    type="text"
                    required
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: The Dragon's Awakening"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium"
                  />
                </div>
              </div>

              {/* Translation Content Area with Comfortable Reading/Writing Typography */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <label className="font-semibold text-slate-300">Translated Chapter Content (English)</label>
                  <span className="font-mono text-[11px] text-violet-400">
                    {wordCount} words
                  </span>
                </div>
                <textarea
                  rows={16}
                  required
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  placeholder="Paste or write English translated text here... Paragraphs separated by blank lines will be rendered cleanly in the reader."
                  className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-950 font-serif text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
                />
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Word count: <strong className="text-white font-mono">{wordCount}</strong>
              </span>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold cursor-pointer text-xs"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-600/30 cursor-pointer text-xs"
                >
                  Publish Chapter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
