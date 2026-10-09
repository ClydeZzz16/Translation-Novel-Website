import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export type AdminSection = 'dashboard' | 'novels' | 'chapters' | 'comments' | 'settings';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  onSignOut: () => void;
  onViewPublicSite: () => void;
  adminEmail?: string | null;
  adminAvatar?: string | null;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigateSection,
  onSignOut,
  onViewPublicSite,
  adminEmail,
  adminAvatar,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'novels' as AdminSection, label: 'Novels', icon: BookOpen },
    { id: 'chapters' as AdminSection, label: 'Chapters', icon: FileText },
    { id: 'comments' as AdminSection, label: 'Comments', icon: MessageSquare },
    { id: 'settings' as AdminSection, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (section: AdminSection) => {
    onNavigateSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle admin sidebar"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-amber-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-black text-xs text-amber-400">
                AT
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-violet-400 bg-clip-text text-transparent">
                ASH TRANSLATION
              </span>
            </div>
          </div>
        </div>

        {/* Header Right: Admin Badge & Public Site */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onViewPublicSite}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {adminAvatar ? (
              <img src={adminAvatar} alt="Admin" className="w-7 h-7 rounded-full object-cover border border-violet-500/50" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center text-xs font-bold">
                A
              </div>
            )}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white flex items-center space-x-1">
                <span>Admin</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
                {adminEmail || 'admin@ashtl.com'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col justify-between border-r border-slate-800 bg-slate-900/60 p-4 shrink-0">
          <div className="space-y-6">
            <div className="px-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Management
              </span>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Sign Out */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={onSignOut}
              className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-sm flex">
            <div className="w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="font-extrabold text-sm text-white">ASH TRANSLATION</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-violet-600 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  onClick={onViewPublicSite}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Public Website</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
