import React, { useState } from 'react';
import { FinanceEngine } from '../services/storage';
import { Student, StudentLedger, Settings } from '../types';
import {
  Search,
  User,
  MessageCircle,
  Printer,
  CheckCircle2,
  Clock,
  Check,
  AlertCircle,
  CreditCard,
  FileDown,
  Calendar
} from 'lucide-react';
import {
  executeStudentCardPrint,
  downloadStudentCardPdf
} from '../utils/studentCardPrinter';

interface StudentLedgerTabProps {
  settings: Settings;
  onOpenWhatsAppBilling: (ledger: StudentLedger) => void;
  onOpenPrintCard?: (ledger: StudentLedger) => void;
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

export const StudentLedgerTab: React.FC<StudentLedgerTabProps> = ({
  settings,
  onOpenWhatsAppBilling,
  onOpenPrintCard
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sppYear, setSppYear] = useState('2026');
  const [currentLedger, setCurrentLedger] = useState<StudentLedger | null>(() => {
    try {
      const students = FinanceEngine.getStudents();
      if (students.length > 0) {
        return FinanceEngine.getStudentLedger(students[0].nis, '2026');
      }
    } catch {
      // fallback
    }
    return null;
  });
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const searchResults = searchQuery.trim().length >= 1
    ? FinanceEngine.searchStudent(searchQuery)
    : [];

  const handleSelectStudent = (student: Student) => {
    try {
      const ledger = FinanceEngine.getStudentLedger(student.nis, sppYear);
      setCurrentLedger(ledger);
      setSearchQuery('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSppYearChange = (year: string) => {
    setSppYear(year);
    if (currentLedger) {
      try {
        const updated = FinanceEngine.getStudentLedger(currentLedger.siswa.nis, year);
        setCurrentLedger(updated);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePrintCard = () => {
    if (!currentLedger) return;
    if (onOpenPrintCard) {
      onOpenPrintCard(currentLedger);
      return;
    }
    setActionNotice('Membuka dialog pencetakan kartu pembayaran siswa...');
    try {
      const res = executeStudentCardPrint(currentLedger, settings);
      if (res.message) {
        setActionNotice(res.message);
      } else {
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (e) {
      downloadStudentCardPdf(currentLedger, settings);
      setActionNotice('Cetak langsung dibatasi. Dokumen PDF Kartu Siswa berhasil diunduh!');
      setTimeout(() => setActionNotice(null), 4500);
    }
  };

  const handleDownloadCardPdf = () => {
    if (!currentLedger) return;
    setActionNotice('Membuat dokumen PDF Kartu Siswa...');
    try {
      downloadStudentCardPdf(currentLedger, settings);
      setActionNotice('Dokumen PDF Kartu Siswa berhasil diunduh!');
    } catch (e) {
      console.error(e);
      setActionNotice('Gagal membuat PDF kartu.');
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  const sppPos = currentLedger?.posStatus.find((p) => p.idPos === 'POS-SPP');
  const otherPosList = currentLedger?.posStatus.filter((p) => p.idPos !== 'POS-SPP') || [];

  return (
    <div className="space-y-6">
      
      {/* SEARCH CARD */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600" />
          Pencarian Buku Bayar & Rekening Siswa
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Ketik NIS atau Nama Siswa untuk melihat rincian kelunasan SPP, sisa tunggakan, dan riwayat setoran
        </p>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa (NIS atau Nama)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((s) => (
                <div
                  key={s.nis}
                  onClick={() => handleSelectStudent(s)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                      {s.nama.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-slate-900 block text-sm">{s.nama}</strong>
                      <span className="text-slate-500 font-mono">NIS: {s.nis} · Kelas: {s.kelas}</span>
                    </div>
                  </div>
                  <span className="text-emerald-600 font-semibold text-xs">Buka Buku Bayar →</span>
                </div>
              ))}
            </div>
          )}

          {searchQuery.trim().length >= 1 && searchResults.length === 0 && (
            <div className="mt-2 p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
              Tidak ditemukan siswa dengan kata kunci "{searchQuery}"
            </div>
          )}

          {FinanceEngine.getStudents().length === 0 && (
            <div className="mt-3 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-700">Database Siswa Masih Kosong</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Belum ada data siswa riil. Silakan tambahkan data siswa di menu <strong>Pengaturan & Backup</strong> atau hubungkan ke Google Sheets.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* LEDGER DETAILS (Printable) */}
      {currentLedger ? (
        <div id="print-area" className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          
          {/* Header Kop Cetak */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase">{settings.NAMA_SEKOLAH}</h2>
            <p className="text-xs text-slate-500">{settings.ALAMAT_SEKOLAH} · Telp: {settings.NO_TELP_SEKOLAH}</p>
            <div className="mt-2 inline-block px-3 py-0.5 rounded bg-slate-100 font-semibold text-xs tracking-wider text-slate-700">
              KARTU PEMBAYARAN KEUANGAN SISWA
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                {currentLedger.siswa.nama.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{currentLedger.siswa.nama}</h3>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-0.5 font-mono">
                  <span>NIS: <strong className="text-slate-800">{currentLedger.siswa.nis}</strong></span>
                  <span>·</span>
                  <span>Kelas: <strong className="text-slate-800 font-sans">{currentLedger.siswa.kelas}</strong></span>
                  <span>·</span>
                  <span>Jurusan: {currentLedger.siswa.jurusan}</span>
                </div>
                {currentLedger.siswa.noHpWali && (
                  <p className="text-xs text-slate-500 mt-1">
                    No. WhatsApp Wali: <span className="font-mono text-slate-700">{currentLedger.siswa.noHpWali}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions (Hidden in Print) */}
            <div className="no-print flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => onOpenWhatsAppBilling(currentLedger)}
                className="px-3.5 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Kirim rincian kewajiban sekolah ke WhatsApp Wali Murid"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Rincian Tagihan ke WA</span>
              </button>

              <button
                onClick={handleDownloadCardPdf}
                className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Unduh Kartu Riwayat Pembayaran Siswa dalam format PDF"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Unduh PDF Kartu</span>
              </button>

              <button
                onClick={handlePrintCard}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Cetak kartu pembayaran siswa ke printer fisik / print preview"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Kartu</span>
              </button>
            </div>
          </div>

          {/* Action Notice Banner */}
          {actionNotice && (
            <div className="no-print p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* 3 Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Kewajiban
              </span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block mt-1">
                Rp {currentLedger.totalSemuaTagihan.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sudah Dibayar
              </span>
              <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums block mt-1">
                Rp {currentLedger.totalSudahDibayar.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Sisa Tunggakan
              </span>
              <span className={`text-xl font-bold font-mono tabular-nums block mt-1 ${currentLedger.sisaSemuaTagihan > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Rp {currentLedger.sisaSemuaTagihan.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* MATRIKS SPP 12 BULAN */}
          {sppPos && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {sppPos.namaPos}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Sistem: Bulanan (Tarif Rp {sppPos.nominalPerBulan?.toLocaleString('id-ID')}/bln)
                  </span>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="no-print flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Tahun SPP:
                    </span>
                    <select
                      value={sppYear}
                      onChange={(e) => handleSppYearChange(e.target.value)}
                      className="text-xs font-bold border border-slate-300 rounded bg-white text-slate-900 px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      title="Filter tahun tagihan SPP bagi siswa yang memiliki tunggakan tahun sebelumnya"
                    >
                      <option value="2024">Tahun 2024</option>
                      <option value="2025">Tahun 2025</option>
                      <option value="2026">Tahun 2026</option>
                      <option value="2027">Tahun 2027</option>
                      <option value="2028">Tahun 2028</option>
                      <option value="2029">Tahun 2029</option>
                      <option value="2030">Tahun 2030</option>
                    </select>
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    {sppPos.bulanLunasCount} / 12 Bulan Lunas ({sppYear})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {sppPos.sppMonths?.map((m) => (
                  <div
                    key={m.bulan}
                    className={`p-3 rounded-xl border text-center ${
                      m.isLunas
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>{m.bulan}</span>
                      {m.isLunas ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono">
                      {m.isLunas ? (
                        <div>
                          <span className="text-emerald-700 font-bold block">✓ Lunas</span>
                          <span className="text-[10px] text-slate-500 font-sans block">{m.noKwitansi}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-rose-600 block">Belum Lunas</span>
                          <span className="text-[10px] text-slate-400 block">Rp {m.nominal.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POS SISTEM CICILAN PROGRESS */}
          {otherPosList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-bold text-slate-900">Status Pos Biaya Sistem Cicilan</h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Sistem: Cicilan / Angsuran
                </span>
              </div>
              <div className="space-y-3">
                {otherPosList.map((pos) => {
                  const percent = pos.totalTarget > 0 ? Math.min(100, Math.round((pos.totalBayar / pos.totalTarget) * 100)) : 0;
                  return (
                    <div key={pos.idPos} className="p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-slate-900 text-xs">{pos.namaPos}</h5>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Target: Rp {pos.totalTarget.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            Rp {pos.totalBayar.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">({percent}%)</span>
                          {pos.sisaTagihan > 0 && (
                            <span className="block text-[11px] text-rose-600 font-mono font-semibold">
                              Sisa: Rp {pos.sisaTagihan.toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RIWAYAT TRANSAKSI SISWA */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">Riwayat Transaksi Siswa Ini</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">No Kwitansi</th>
                    <th className="py-2.5 px-3 font-semibold">Waktu</th>
                    <th className="py-2.5 px-3 font-semibold">Pos Biaya / Bulan</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Nominal</th>
                    <th className="py-2.5 px-3 font-semibold">Metode</th>
                    <th className="py-2.5 px-3 font-semibold">Kasir</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLedger.history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Belum ada riwayat transaksi untuk siswa ini.
                      </td>
                    </tr>
                  ) : (
                    currentLedger.history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{h.noKwitansi}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatDisplayDate(h.tanggal)} <span className="text-[10px] text-slate-400 font-mono">{formatDisplayTime(h.jam)}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {h.namaPos} {h.bulan && h.bulan !== '-' && `(${h.bulan})`}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right tabular-nums text-slate-900">
                          Rp {h.nominal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{h.metode}</td>
                        <td className="py-2.5 px-3 text-slate-500">{h.kasir}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            h.status === 'Batal' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Print Signatures */}
          <div className="hidden print:grid grid-cols-2 text-center text-xs pt-10 mt-8 border-t border-slate-300">
            <div>
              <p className="mb-14">Mengetahui,<br />Orang Tua / Wali Murid</p>
              <p className="font-bold underline">({currentLedger.siswa.nama})</p>
            </div>
            <div>
              <p className="mb-14">Petugas Keuangan Sekolah</p>
              <p className="font-bold underline">{settings.NAMA_BENDAHARA}</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Silakan Cari & Pilih Siswa Terlebih Dahulu</p>
          <p className="text-xs text-slate-400 mt-1">
            Gunakan kolom pencarian di atas untuk membuka buku tagihan dan riwayat transaksi siswa.
          </p>
        </div>
      )}

    </div>
  );
};
