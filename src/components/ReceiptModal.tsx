import React, { useState } from 'react';
import { Settings, CartItem } from '../types';
import {
  Printer,
  MessageCircle,
  Copy,
  Check,
  X,
  CheckCircle2,
  FileDown,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  executeReceiptPrint,
  downloadReceiptPdf,
  buildReceiptPrintHtml,
  ReceiptData
} from '../utils/receiptPrinter';
import { SmkPgriLogo } from './SmkPgriLogo';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  settings: Settings;
}

function formatDisplayDate(val: string): string {
  if (!val) return '';
  const str = String(val).trim();
  const m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  const m2 = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m2) {
    return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  }
  if (str.includes('GMT') || str.includes('WIB') || str.length > 10) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return str.length > 10 ? str.substring(0, 10) : str;
}

function formatDisplayTime(val: string): string {
  if (!val) return '00:00';
  const str = String(val).trim();
  const m = str.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
  if (m) {
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  }
  return str.length > 8 ? str.substring(0, 5) : str;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  settings,
}) => {
  const [thermalMode, setThermalMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (!isOpen || !receiptData) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(receiptData.waText);
    setCopied(true);
    setActionStatus('Teks kwitansi berhasil disalin!');
    setTimeout(() => {
      setCopied(false);
      setActionStatus(null);
    }, 2500);
  };

  const handleSmartPrint = () => {
    setActionStatus('Membuka dialog pencetakan kwitansi...');
    try {
      const result = executeReceiptPrint(receiptData, settings, thermalMode);
      if (result.message) {
        setActionStatus(result.message);
      } else {
        setTimeout(() => setActionStatus(null), 3500);
      }
    } catch (e) {
      console.error('Print failed, falling back to PDF download:', e);
      downloadReceiptPdf(receiptData, settings);
      setActionStatus('Cetak langsung dibatasi browser. Dokumen PDF Kwitansi berhasil diunduh!');
      setTimeout(() => setActionStatus(null), 4500);
    }
  };

  const handleDownloadPdf = () => {
    setActionStatus('Membuat dokumen PDF resmi...');
    try {
      downloadReceiptPdf(receiptData, settings);
      setActionStatus('Dokumen PDF Kwitansi berhasil diunduh!');
    } catch (e) {
      console.error('PDF error:', e);
      setActionStatus('Gagal membuat PDF. Mengalihkan ke unduh HTML...');
      handleDownloadHtml();
    }
    setTimeout(() => setActionStatus(null), 3500);
  };

  const handleDownloadHtml = () => {
    try {
      const htmlContent = buildReceiptPrintHtml(receiptData, settings, thermalMode);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kwitansi_${receiptData.noKwitansi}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setActionStatus('File Dokumen Kwitansi (.html) berhasil diunduh!');
      setTimeout(() => setActionStatus(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="receipt-modal-card relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-sm">Transaksi Berhasil Diproses</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setThermalMode(!thermalMode)}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Mode: {thermalMode ? 'Thermal 80mm' : 'Standar A5'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Status Banner (if active) */}
        {actionStatus && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionStatus}</span>
          </div>
        )}

        {/* PRINTABLE RECEIPT CONTENT */}
        <div
          id="print-area"
          className={`p-6 sm:p-8 bg-white ${
            thermalMode ? 'max-w-sm mx-auto font-mono text-xs' : 'text-sm'
          }`}
        >
          {/* Header Kop Kwitansi */}
          <div className="text-center pb-4 mb-4 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-2">
              <SmkPgriLogo customLogoUrl={settings.LOGO_URL} className="w-14 h-14 object-contain mx-auto" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
              {settings.NAMA_SEKOLAH}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.ALAMAT_SEKOLAH} · Telp: {settings.NO_TELP_SEKOLAH}
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded bg-slate-100 font-semibold text-xs tracking-wider text-slate-700">
              KWITANSI PEMBAYARAN KEUANGAN
            </div>
          </div>

          {/* Metadata Kwitansi */}
          <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-400 block text-[11px]">No. Kwitansi</span>
              <strong className="font-mono text-slate-900 font-bold">{receiptData.noKwitansi}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Waktu Transaksi</span>
              <span className="text-slate-800">{formatDisplayDate(receiptData.tanggal)} {formatDisplayTime(receiptData.jam)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nama Siswa (NIS)</span>
              <span className="font-semibold text-slate-900">{receiptData.student.nama}</span>
              <span className="text-slate-500 font-mono text-[11px] ml-1">({receiptData.student.nis})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Kelas / Rombel</span>
              <span className="font-medium text-slate-800">{receiptData.student.kelas}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Metode Pembayaran</span>
              <span className="font-semibold text-emerald-700">{receiptData.metode}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Petugas Kasir</span>
              <span className="text-slate-800">{receiptData.kasir}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4">
            <div className="border-t border-b border-slate-200 py-1.5 flex justify-between font-semibold text-xs text-slate-700">
              <span>Pos Pembayaran</span>
              <span>Nominal</span>
            </div>
            <div className="divide-y divide-slate-100">
              {receiptData.items.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-900 block">{item.namaPos}</span>
                    {item.bulan && item.bulan !== '-' && (
                      <span className="text-[11px] text-emerald-600 font-medium">Bulan: {item.bulan}</span>
                    )}
                  </div>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    Rp {item.nominal.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center mb-6">
            <span className="font-bold text-sm text-slate-900">TOTAL DIBAYAR</span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 tabular-nums">
              Rp {receiptData.grandTotal.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 text-center text-xs text-slate-600 pt-3 border-t border-dashed border-slate-200">
            <div>
              <p className="text-[11px] text-slate-400 mb-10">Wali Murid / Penyetor,</p>
              <p className="font-medium text-slate-800 underline">({receiptData.student.nama})</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-10">Petugas Kasir Keuangan,</p>
              <p className="font-medium text-slate-800 underline">({receiptData.kasir})</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 mt-6 pt-2 border-t border-slate-100">
            *Simpan bukti kwitansi ini sebagai tanda pelunasan resmi keuangan sekolah.*
          </div>
        </div>

        {/* Modal Action Buttons (Hidden in Print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Salin rincian pembayaran untuk WhatsApp / SMS"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {receiptData.waLink ? (
              <a
                href={receiptData.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim WA</span>
              </a>
            ) : (
              <button
                disabled
                title="Nomor HP Wali Murid belum tersedia"
                className="px-3 py-2 text-xs font-medium bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
              >
                WA Belum Ada
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Unduh dokumen kwitansi dalam format PDF resmi"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={handleSmartPrint}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Cetak langsung kwitansi ke printer / simpan PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Kwitansi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
