import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Image as ImageIcon,
  Eye,
  EyeOff,
  X,
  Upload
} from 'lucide-react';
import { Novel } from '../../types/novel';

interface AdminNovelsProps {
  novels: Novel[];
  onSaveNovel: (novel: Novel, isNew: boolean) => void;
  onDeleteNovel: (id: string) => void;
  onTogglePublishNovel: (id: string) => void;
  onViewNovelOnSite: (slug: string) => void;
}

export const AdminNovels: React.FC<AdminNovelsProps> = ({
  novels,
  onSaveNovel,
  onDeleteNovel,
  onTogglePublishNovel,
  onViewNovelOnSite
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [author, setAuthor] = useState('');
  const [translator, setTranslator] = useState('AshTL');
  const [status, setStatus] = useState<'Ongoing' | 'Completed' | 'Hiatus'>('Ongoing');
  const [genres, setGenres] = useState('Fantasy, Action');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [altTitles, setAltTitles] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setAuthor('');
    setTranslator('AshTL');
    setStatus('Ongoing');
    setGenres('Fantasy, Action');
    setSynopsis('');
    setCoverUrl('');
    setAltTitles('');
    setIsPublished(true);
    setEditingNovelId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (novel: Novel) => {
    setEditingNovelId(novel.id);
    setTitle(novel.title);
    setSlug(novel.slug);
    setAuthor(novel.author);
    setTranslator(novel.translator || 'AshTL');
    setStatus(novel.status || 'Ongoing');
    setGenres(novel.genres ? novel.genres.join(', ') : '');
    setSynopsis(novel.synopsis || '');
    setCoverUrl(novel.coverUrl || '');
    setAltTitles(novel.altTitles ? novel.altTitles.join(', ') : '');
    setIsPublished(novel.isPublished !== false);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingNovelId) {
      // Auto-generate slug for new novel
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Novel title is required');
      return;
    }
    const novelSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const novelGenres = genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    const novelAltTitles = altTitles
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const existingNovel = novels.find((n) => n.id === editingNovelId);

    const novelToSave: Novel = {
      id: editingNovelId || `novel-${Date.now()}`,
      slug: novelSlug,
      title: title.trim(),
      altTitles: novelAltTitles,
      author: author.trim() || 'Unknown Author',
      translator: translator.trim() || 'AshTL',
      status,
      originalLanguage: 'English',
      genres: novelGenres.length > 0 ? novelGenres : ['Fantasy'],
      rating: existingNovel ? existingNovel.rating : 5.0,
      views: existingNovel ? existingNovel.views : 0,
      bookmarksCount: existingNovel ? existingNovel.bookmarksCount : 0,
      coverUrl: coverUrl.trim(),
      synopsis: synopsis.trim(),
      latestChapter: existingNovel ? existingNovel.latestChapter : 0,
      chapters: existingNovel ? existingNovel.chapters : [],
      isPublished
    };

    onSaveNovel(novelToSave, !editingNovelId);
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Novel Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, edit, organize metadata, and control publication status of your translated novels.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Novel</span>
        </button>
      </div>

      {/* Novels List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {novels.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No novels created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Get started by adding your first translated web novel series.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Add First Novel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Novel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-center">Chapters</th>
                  <th className="py-3.5 px-4 text-center">Views</th>
                  <th className="py-3.5 px-4 text-center">Bookmarks</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {novels.map((novel) => {
                  const isPub = novel.isPublished !== false;
                  return (
                    <tr key={novel.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          {novel.coverUrl ? (
                            <img
                              src={novel.coverUrl}
                              alt=""
                              className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-800"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate max-w-xs">{novel.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              Author: {novel.author} • Translator: {novel.translator}
                            </p>
                            <p className="text-[10px] text-violet-400 font-mono truncate">
                              /{novel.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                          {novel.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onTogglePublishNovel(novel.id)}
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
                      <td className="py-3 px-4 text-center font-bold text-slate-200">
                        {novel.chapters ? novel.chapters.length : 0}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-violet-400">
                        {(novel.views || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
                        {(novel.bookmarksCount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewNovelOnSite(novel.slug)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="View Public Novel Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(novel)}
                            className="p-1.5 text-violet-400 hover:text-white hover:bg-violet-600 rounded-lg cursor-pointer"
                            title="Edit Novel"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${novel.title}" and all its chapters?`)) {
                                onDeleteNovel(novel.id);
                              }
                            }}
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg cursor-pointer"
                            title="Delete Novel"
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

      {/* Add / Edit Novel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-violet-400" />
                <span>{editingNovelId ? 'Edit Translated Novel' : 'Create New Translated Novel'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Novel Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Return of the Mount Hua Sect"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. return-of-the-mount-hua-sect"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Author *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Original author name"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Translator</label>
                  <input
                    type="text"
                    value={translator}
                    onChange={(e) => setTranslator(e.target.value)}
                    placeholder="Translator / Group name"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Novel Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium cursor-pointer"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Hiatus">Hiatus</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Publication State</label>
                  <select
                    value={isPublished ? 'published' : 'draft'}
                    onChange={(e) => setIsPublished(e.target.value === 'published')}
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium cursor-pointer"
                  >
                    <option value="published">Published (Public)</option>
                    <option value="draft">Draft (Admin Only)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Fantasy, Martial Arts, Action"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Alternative Titles</label>
                  <input
                    type="text"
                    value={altTitles}
                    onChange={(e) => setAltTitles(e.target.value)}
                    placeholder="Comma separated alternative names"
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>

                {/* Cover Image Upload / Preview */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Cover Image</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {coverUrl && (
                      <img
                        src={coverUrl}
                        alt="Cover Preview"
                        className="w-20 h-28 object-cover rounded-xl border border-slate-700 shrink-0"
                      />
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-800/60 cursor-pointer text-slate-300 space-x-2">
                        <Upload className="w-4 h-4 text-violet-400" />
                        <span>Upload Local Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="Or paste external image URL..."
                        className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Synopsis / Description</label>
                  <textarea
                    rows={4}
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Describe the story and premise..."
                    className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-600/30 cursor-pointer"
                >
                  {editingNovelId ? 'Save Changes' : 'Create Novel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
