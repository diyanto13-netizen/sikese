import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, ExternalLink, HelpCircle } from 'lucide-react';

interface CodeExportTabProps {
  codeGsContent: string;
  indexHtmlContent: string;
}

export const CodeExportTab: React.FC<CodeExportTabProps> = ({
  codeGsContent,
  indexHtmlContent
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'codegs' | 'indexhtml'>('codegs');
  const [copiedGs, setCopiedGs] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopy = (type: 'codegs' | 'indexhtml') => {
    const text = type === 'codegs' ? codeGsContent : indexHtmlContent;
    navigator.clipboard.writeText(text);
    if (type === 'codegs') {
      setCopiedGs(true);
      setTimeout(() => setCopiedGs(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* PANDUAN DEPLOYMENT */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5 mb-3 text-emerald-400">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base font-bold tracking-tight">
            Panduan Pemasangan di Google Sheets & Google Apps Script
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Aplikasi <strong>SiKeSe (Sistem Keuangan Sekolah)</strong> dirancang agar 100% siap dijalankan secara gratis di Google Cloud menggunakan Google Sheets sebagai basis data dan Google Apps Script sebagai mesin backend.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold inline-flex items-center justify-center text-[11px] mb-2">1</span>
            <strong className="block text-white mb-1">Buat Spreadsheet Baru</strong>
            <p className="text-slate-400 text-[11px]">
              Buka <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">sheets.new</a> di browser dan beri nama spreadsheet misal <em>"Database SiKeSe 2024"</em>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold inline-flex items-center justify-center text-[11px] mb-2">2</span>
            <strong className="block text-white mb-1">Buka Apps Script</strong>
            <p className="text-slate-400 text-[11px]">
              Klik menu <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold inline-flex items-center justify-center text-[11px] mb-2">3</span>
            <strong className="block text-white mb-1">Salin 2 File Kode</strong>
            <p className="text-slate-400 text-[11px]">
              Tempel kode <code>Code.gs</code> di editor script. Kemudian buat file baru bertipe HTML beri nama <code>Index.html</code> dan tempel kodenya.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold inline-flex items-center justify-center text-[11px] mb-2">4</span>
            <strong className="block text-white mb-1">Terapkan (Deploy)</strong>
            <p className="text-slate-400 text-[11px]">
              Klik <strong>Terapkan (Deploy)</strong> &gt; <strong>Deployment Baru</strong> &gt; Pilih <strong>Aplikasi Web</strong> (Jalankan sebagai: Saya, Akses: Siapa saja).
            </p>
          </div>
        </div>
      </div>

      {/* CODE VIEWER BOX */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Tab Switcher & Buttons */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveCodeTab('codegs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCodeTab === 'codegs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Backend (Code.gs)</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('indexhtml')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCodeTab === 'indexhtml'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Frontend (Index.html)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeCodeTab)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {(activeCodeTab === 'codegs' ? copiedGs : copiedHtml) ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kode Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin {activeCodeTab === 'codegs' ? 'Code.gs' : 'Index.html'}</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                handleDownload(
                  activeCodeTab === 'codegs' ? 'Code.gs' : 'Index.html',
                  activeCodeTab === 'codegs' ? codeGsContent : indexHtmlContent
                )
              }
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File</span>
            </button>
          </div>
        </div>

        {/* Code Content Display */}
        <div className="relative">
          <pre className="p-5 text-xs font-mono bg-slate-950 text-slate-200 max-h-[520px] overflow-auto leading-relaxed scrollbar-thin">
            <code>{activeCodeTab === 'codegs' ? codeGsContent : indexHtmlContent}</code>
          </pre>
        </div>

      </div>

    </div>
  );
};
