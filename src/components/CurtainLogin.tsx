import React, { useState, useRef } from 'react';
import { FinanceEngine } from '../services/storage';
import { UserSession } from '../types';
import { ArrowRight, KeyRound, AlertCircle, Sun, Moon, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { SmkPgriLogo } from './SmkPgriLogo';

interface CurtainLoginProps {
  onLoginSuccess: (session: UserSession) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const CurtainLogin: React.FC<CurtainLoginProps> = ({ onLoginSuccess, isDark, onToggleTheme }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(() => FinanceEngine.getSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError('Silakan masukkan PIN otorisasi.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const session = FinanceEngine.loginWithPin(pin);
        onLoginSuccess(session);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('PIN yang Anda masukkan salah!');
        }
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = FinanceEngine.updateSettings({ LOGO_URL: dataUrl });
      setSettings(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = FinanceEngine.updateSettings({ LOGO_URL: '' });
    setSettings(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 transition-all">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 text-center relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        )}

        {/* School Emblem Logo Section (Preserves Exact Aspect Ratio & Form) */}
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="relative group p-1">
            <div className="w-28 sm:w-32 h-28 sm:h-32 flex items-center justify-center overflow-hidden">
              <SmkPgriLogo
                customLogoUrl={settings.LOGO_URL}
                className="max-h-full max-w-full object-contain drop-shadow-md mx-auto"
              />
            </div>

            {/* Quick Upload / Change Logo Overlay */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah / ganti dengan berkas logo sekolah asli Anda"
              className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-slate-900/70 text-white rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-opacity duration-200 cursor-pointer backdrop-blur-xs"
            >
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span>Ganti Logo</span>
            </button>
          </div>

          {/* If Custom Logo is uploaded, offer reset button */}
          {settings.LOGO_URL && (
            <button
              type="button"
              onClick={handleResetLogo}
              className="mt-1 text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
              title="Kembalikan ke logo standar"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Gunakan Logo Standar</span>
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SiKeSe</h1>
        <p className="text-sm font-medium text-slate-500 mt-1 mb-6">
          Sistem Keuangan Sekolah {settings.NAMA_SEKOLAH || 'SMKS PGRI 1 Kota Sukabumi'}
        </p>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              PIN Otorisasi Masuk
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                placeholder="••••"
                className="w-full px-4 py-3.5 text-center text-2xl font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
