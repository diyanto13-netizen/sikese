import React from 'react';
import { UserSession } from '../types';
import { LogOut, User, Landmark, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  user: UserSession;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  schoolName: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onLogout,
  schoolName,
  isDark,
  onToggleTheme
}) => {
  const tabs = [
    { id: 'transaksi', label: 'Kasir & Transaksi', icon: '💳', hidden: !user.permissions.canTransaction },
    { id: 'dashboard', label: 'Dashboard & Grafik', icon: '📊' },
    { id: 'bukuKas', label: 'Buku Kas & Rekap', icon: '📑' },
    { id: 'tabungan', label: 'Buku Siswa', icon: '🎓' },
    { id: 'pengaturan', label: 'Pengaturan & Backup', icon: '⚙️' },
    { id: 'tutorial', label: 'Panduan & Tutorial', icon: '📖' },
    { id: 'codeGas', label: 'Kode GAS (Script)', icon: '📋' }
  ].filter((t) => !t.hidden);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Single Brand Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm shadow-sm">
              <Landmark className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                SiKeSe
              </span>
              <span className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-xs block leading-none">
                {schoolName}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: User Role & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Mode Terang / Mode Gelap Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={isDark ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs cursor-pointer shadow-xs"
              aria-label="Ganti tema tampilan"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs font-medium">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-sky-300" />
                  <span className="hidden xl:inline text-xs font-medium">Gelap</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-white flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                {user.nama}
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                {user.role === 'KASIR' ? 'Peran: Kasir' : 'Peran: Kepala Sekolah'}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Keluar dari sesi"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'text-slate-300 bg-slate-800/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
