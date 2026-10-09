import React from 'react';
import { ShieldX, LogOut, ArrowLeft, AlertCircle } from 'lucide-react';

interface AdminAccessDeniedProps {
  userEmail?: string | null;
  onSignOut: () => void;
  onBackToSite: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  userEmail,
  onSignOut,
  onBackToSite
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 text-center space-y-6">
        <div className="bg-slate-800/90 border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <ShieldX className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-4xl font-black text-rose-500 tracking-wider">403</span>
            <h1 className="text-2xl font-black text-white">Access Denied</h1>
            <p className="text-sm text-slate-300 font-medium">
              You do not have permission to access the admin dashboard.
            </p>
          </div>

          {userEmail && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-xs text-left space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Authenticated Account:</span>
              </div>
              <p className="font-mono text-slate-200 truncate">{userEmail}</p>
              <p className="text-[11px] text-slate-400 pt-1">
                This Google account is authenticated with Supabase, but has not been granted the <span className="font-mono text-amber-400 font-bold">admin</span> role in the database.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={onSignOut}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Try Another Account</span>
            </button>

            <button
              onClick={onBackToSite}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-2xl text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
