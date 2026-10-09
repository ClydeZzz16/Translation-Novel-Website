import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { signInWithGoogle, isSupabaseConfigured } from '../../lib/supabase';

interface AdminLoginProps {
  onBackToSite: () => void;
  onDevBypass?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToSite, onDevBypass }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
      }
      const { error } = await signInWithGoogle('/admin');
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initiate Google Sign-In');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Back Link */}
        <div className="mb-6">
          <button
            onClick={onBackToSite}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Public Website</span>
          </button>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-violet-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Welcome Back</h1>
            <p className="text-xs text-slate-400 font-medium">AshTL Administrator Portal</p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center space-x-3 shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Only authorized administrators can access this area.
            </p>
          </div>

          {/* Dev / Test mode fallback helper */}
          {(Boolean(import.meta.env.DEV) || !isSupabaseConfigured) && onDevBypass && (
            <div className="pt-4 border-t border-slate-700/60 text-left space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Development Mode</span>
              <p className="text-[11px] text-slate-400">
                You can enter dev admin preview for local testing and interface inspection.
              </p>
              <button
                onClick={onDevBypass}
                className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Enter Dev Admin Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
