import React from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Calendar,
  Key,
  LogOut,
  Database,
  Lock
} from 'lucide-react';

interface AdminSettingsProps {
  adminEmail?: string | null;
  adminName?: string | null;
  adminAvatar?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  onSignOut: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  adminEmail,
  adminName,
  adminAvatar,
  userId,
  createdAt,
  onSignOut
}) => {
  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Admin Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your authorized administrator credentials, active session parameters, and database security status.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {adminAvatar ? (
              <img
                src={adminAvatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-violet-500 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md">
                {(adminName || 'Admin').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{adminName || 'AshTL Administrator'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{adminEmail || 'admin@ashtl.com'}</p>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin Session</span>
          </button>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-violet-400" />
              <span>Google Account Email</span>
            </span>
            <p className="font-mono text-white text-sm truncate">{adminEmail || 'N/A'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Authorization Role</span>
            </span>
            <p className="font-mono text-emerald-400 font-bold text-sm">role: admin</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Supabase User UUID</span>
            </span>
            <p className="font-mono text-slate-300 text-xs truncate">{userId || 'local-admin-uuid'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Account Provisioned Date</span>
            </span>
            <p className="font-mono text-slate-300 text-xs">
              {createdAt ? new Date(createdAt).toLocaleString() : 'September 2026'}
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture & Database Telemetry */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl text-xs">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Lock className="w-4 h-4 text-violet-400" />
          <span>Security & Authorization Architecture</span>
        </h3>

        <div className="space-y-3 text-slate-300 leading-relaxed">
          <p>
            This portal enforces strict multi-tier security. Google OAuth identity is verified by Supabase Auth, and administrator privileges are validated server-side against the <span className="font-mono text-violet-400 font-bold">public.profiles</span> table with the <span className="font-mono text-emerald-400 font-bold">is_admin()</span> security definer routine.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Database Row Level Security (RLS) Status</span>
            </div>
            <p className="text-slate-400">
              RLS policies protect all tables (<code className="text-violet-300">novels</code>, <code className="text-violet-300">chapters</code>, <code className="text-violet-300">comments</code>, <code className="text-violet-300">profiles</code>). Unauthenticated users or non-admin authenticated users are completely blocked from executing mutation queries.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
            <span className="font-bold">Administrative Safeguard:</span>
            <p className="text-[11px] text-amber-200/90">
              For security reasons, changing roles or credentials must be executed directly in the Supabase PostgreSQL console. No client-side endpoints allow escalating user privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
