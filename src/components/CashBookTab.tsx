import React, { useState } from 'react';
import { FinanceEngine } from '../services/storage';
import { Transaction, Settings, UserSession } from '../types';
import {
  FileText,
  RotateCcw,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface CashBookTabProps {
  user: UserSession;
  settings: Settings;
  onRefreshData: () => void;
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

function formatCleanMonth(monthVal: string): string {
  if (!monthVal || monthVal === '-') return '-';
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const str = String(monthVal).trim();
  if (str.includes('GMT') || str.includes('WIB') || /^[A-Za-z]{3}\s[A-Za-z]{3}\s\d{1,2}\s\d{4}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${indonesianMonths[d.getMonth()]} ${d.getFullYear()}`;
    }
  }
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const imIdx = parseInt(isoMatch[2], 10) - 1;
    if (imIdx >= 0 && imIdx < 12) {
      return `${indonesianMonths[imIdx]} ${isoMatch[1]}`;
    }
  }
  return str;
}

function formatCleanPosBiaya(namaPos: string, bulan?: string): string {
  const np = String(namaPos || '').trim();
  const bln = formatCleanMonth(bulan || '');
  if (np.includes('Bulan') || np.includes('(')) {
    return np;
  }
  if (bln && bln !== '-') {
    if (np === 'SPP' || np === 'POS-SPP' || np === 'SPP Bulanan') {
      return `SPP Bulan ${bln}`;
    }
    return `${np} (${bln})`;
  }
  return np;
}

export const CashBookTab: React.FC<CashBookTabProps> = ({
  user,
  settings,
  onRefreshData
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPos, setSelectedPos] = useState('SEMUA');
  const [undoModal, setUndoModal] = useState<{
    isOpen: boolean;
    noKwitansi: string;
    nama: string;
    nominal: number;
  }>({
    isOpen: false,
    noKwitansi: '',
    nama: '',
    nominal: 0
  });

  const [undoPin, setUndoPin] = useState('');
  const [undoReason, setUndoReason] = useState('');
  const [undoError, setUndoError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const posList = FinanceEngine.getPosBiaya();
  const report = FinanceEngine.getFinancialReport(startDate, endDate, selectedPos);

  const handleOpenUndoModal = (t: Transaction) => {
    setUndoModal({
      isOpen: true,
      noKwitansi: t.noKwitansi,
      nama: t.nama,
      nominal: t.nominal
    });
    setUndoPin('');
    setUndoReason('');
    setUndoError('');
  };

  const handleExecuteUndo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!undoPin) {
      setUndoError('PIN Otorisasi wajib diisi!');
      return;
    }

    try {
      const res = FinanceEngine.cancelTransaction(
        undoModal.noKwitansi,
        undoPin,
        undoReason || 'Pembatalan transaksi oleh kasir'
      );
      setUndoModal({ isOpen: false, noKwitansi: '', nama: '', nominal: 0 });
      setActionSuccessMsg(res.message);
      onRefreshData();
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err: any) {
      setUndoError(err.message || 'Pembatalan transaksi gagal');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Sukses Pembatalan */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* FILTER BOX */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              Filter Rekapitulasi Buku Kas
            </h2>
            <p className="text-xs text-slate-500">Pilih rentang tanggal dan kategori pos untuk melihat rekapitulasi pembukuan</p>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap Buku Kas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Pos Biaya
            </label>
            <select
              value={selectedPos}
              onChange={(e) => setSelectedPos(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            >
              <option value="SEMUA">Semua Pos Biaya</option>
              {posList.map((p) => (
                <option key={p.idPos} value={p.idPos}>
                  {p.namaPos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(startDate || endDate || selectedPos !== 'SEMUA') && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedPos('SEMUA');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* SUMMARY STATS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Pemasukan
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums block mt-1">
            Rp {report.totalMasuk.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400">{report.transactions.length} baris transaksi</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Penerimaan Tunai
          </span>
          <span className="text-xl font-bold font-mono text-slate-800 tabular-nums block mt-1">
            Rp {report.totalTunai.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400">Cash loket</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Penerimaan Transfer
          </span>
          <span className="text-xl font-bold font-mono text-slate-800 tabular-nums block mt-1">
            Rp {report.totalTransfer.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400">Bank / QRIS</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Transaksi Dibatalkan
          </span>
          <span className="text-xl font-bold font-mono text-rose-600 tabular-nums block mt-1">
            Rp {report.totalBatal.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-slate-400">Void / Reversal</span>
        </div>
      </div>

      {/* TABLE BUKU KAS (Printable) */}
      <div id="print-area" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6">
        
        {/* Printable Header */}
        <div className="text-center pb-4 mb-4 border-b border-slate-200 hidden print:block">
          <h2 className="text-lg font-bold text-slate-900 uppercase">{settings.NAMA_SEKOLAH}</h2>
          <p className="text-xs text-slate-500">{settings.ALAMAT_SEKOLAH} · Telp: {settings.NO_TELP_SEKOLAH}</p>
          <h3 className="text-sm font-semibold mt-2 text-slate-800">REKAPITULASI BUKU KAS TRANSAKSI KEUANGAN</h3>
          <p className="text-xs text-slate-400">
            {startDate || endDate ? `Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}` : 'Seluruh Riwayat Transaksi'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-3 font-semibold whitespace-nowrap">No Kwitansi</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Tanggal & Jam</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">NIS</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Nama Siswa</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Kelas</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Pos Biaya / Bulan</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Nominal</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Metode</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Kasir</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Status</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.transactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                report.transactions.map((t, idx) => {
                  const isBatal = t.status === 'Batal';
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition-colors ${
                        isBatal ? 'opacity-60 bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {t.noKwitansi}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {formatDisplayDate(t.tanggal)} <span className="text-[10px] text-slate-400 font-mono">{formatDisplayTime(t.jam)}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{t.nis}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{t.nama}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{t.kelas}</td>
                      <td className="py-3 px-3 text-slate-800 whitespace-nowrap">
                        <span>{formatCleanPosBiaya(t.namaPos, t.bulan)}</span>
                      </td>
                      <td className={`py-3 px-3 font-mono font-semibold text-right tabular-nums whitespace-nowrap ${isBatal ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        Rp {t.nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{t.metode}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{t.kasir}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isBatal ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> Batal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Sukses
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center no-print whitespace-nowrap">
                        {!isBatal && (
                          <button
                            onClick={() => handleOpenUndoModal(t)}
                            title="Batalkan transaksi ini dan pulihkan saldo"
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-md transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Print Signatures */}
        <div className="hidden print:grid grid-cols-2 text-center text-xs pt-12 mt-8 border-t border-slate-300">
          <div>
            <p className="mb-14">Mengetahui,<br />Kepala Sekolah</p>
            <p className="font-bold underline">{settings.NAMA_KEPSEK}</p>
          </div>
          <div>
            <p className="mb-14">Petugas Keuangan / Bendahara</p>
            <p className="font-bold underline">{settings.NAMA_BENDAHARA}</p>
          </div>
        </div>

      </div>

      {/* MODAL UNDO / BATAL TRANSAKSI */}
      {undoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Batalkan Transaksi (Undo)</h3>
                <p className="text-xs text-slate-500">Konfirmasi pembatalan kwitansi pembayaran</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">No Kwitansi:</span>
                <strong className="text-slate-900">{undoModal.noKwitansi}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Siswa:</span>
                <span className="text-slate-800 font-sans">{undoModal.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Nominal:</span>
                <strong className="text-rose-600">Rp {undoModal.nominal.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Perhatian: Pembatalan ini akan mengembalikan status transaksi menjadi 'Batal' dan saldo tunggakan siswa akan otomatis dipulihkan.
            </p>

            {undoError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {undoError}
              </div>
            )}

            <form onSubmit={handleExecuteUndo} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Masukkan PIN Otorisasi Anda
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={undoPin}
                  onChange={(e) => setUndoPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan
                </label>
                <input
                  type="text"
                  value={undoReason}
                  onChange={(e) => setUndoReason(e.target.value)}
                  placeholder="Misal: Salah input nominal, dibatalkan wali murid..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUndoModal({ isOpen: false, noKwitansi: '', nama: '', nominal: 0 })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Konfirmasi Batalkan</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
