import React, { useState } from 'react';
import {
  MessageSquare,
  Trash2,
  CheckCircle,
  Flag,
  Filter,
  Search,
  BookOpen
} from 'lucide-react';
import { Comment } from '../../types/novel';

interface AdminCommentsProps {
  comments: Comment[];
  onApproveComment: (id: string) => void;
  onFlagComment: (id: string) => void;
  onDeleteComment: (id: string) => void;
}

export const AdminComments: React.FC<AdminCommentsProps> = ({
  comments,
  onApproveComment,
  onFlagComment,
  onDeleteComment
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComments = comments.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.content.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        (c.novelTitle && c.novelTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Comment Moderation</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review reader discussion, moderate comments, and remove spam or abusive content.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword, author, or novel..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            <option value="all">All Statuses ({comments.length})</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No comments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no reader comments matching your current search or filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center text-xs shrink-0">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white">{comment.userName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      comment.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : comment.status === 'flagged'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>

                {/* Target context (Novel / Chapter) */}
                <div className="flex items-center space-x-2 text-[11px] text-violet-400 font-semibold bg-violet-950/20 border border-violet-900/30 p-2 rounded-xl">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    Novel: {comment.novelTitle || 'AshTL Novel'}{' '}
                    {comment.chapterTitle ? `• Chapter: ${comment.chapterTitle}` : ''}
                  </span>
                </div>

                {/* Comment Body */}
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {comment.content}
                </p>

                {/* Moderation Actions */}
                <div className="flex items-center justify-end space-x-2 pt-1">
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => onApproveComment(comment.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold cursor-pointer border border-emerald-500/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  {comment.status !== 'flagged' && (
                    <button
                      onClick={() => onFlagComment(comment.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold cursor-pointer border border-amber-500/30"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Flag</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to permanently delete this comment?')) {
                        onDeleteComment(comment.id);
                      }
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold cursor-pointer border border-rose-500/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
