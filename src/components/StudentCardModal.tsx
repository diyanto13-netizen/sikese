import React, { useState } from 'react';
import { Settings, StudentLedger } from '../types';
import {
  Printer,
  FileDown,
  MessageCircle,
  X,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import {
  downloadStudentCardPdf,
  executeStudentCardPrint
} from '../utils/studentCardPrinter';
import { SmkPgriLogo } from './SmkPgriLogo';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: StudentLedger | null;
  settings: Settings;
  onOpenWhatsApp: (ledger: StudentLedger) => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  isOpen,
  onClose,
  ledger,
  settings,
  onOpenWhatsApp
}) => {
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  if (!isOpen || !ledger) return null;

  const sppPos = ledger.posStatus.find((p) => p.idPos === 'POS-SPP');
  const otherPosList = ledger.posStatus.filter((p) => p.idPos !== 'POS-SPP');

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    setActionStatus('Membuka dialog pencetakan kartu siswa...');
    try {
      // 1. Direct window print if possible
      window.print();
      setActionStatus(null);
    } catch {
      // 2. Fallback to smart execution
      try {
        const res = executeStudentCardPrint(ledger, settings);
        if (res.message) {
          setActionStatus(res.message);
        } else {
          setTimeout(() => setActionStatus(null), 3000);
        }
      } catch (err) {
        downloadStudentCardPdf(ledger, settings);
        setActionStatus('Cetak langsung dibatasi. Dokumen PDF Kartu Siswa otomatis diunduh!');
        setTimeout(() => setActionStatus(null), 4500);
      }
    }
  };

  const handleDownloadPdf = () => {
    setActionStatus('Membuat file PDF Kartu Siswa...');
    try {
      downloadStudentCardPdf(ledger, settings);
      setActionStatus('Dokumen PDF Kartu Pembayaran Siswa berhasil diunduh!');
    } catch (err) {
      console.error(err);
      setActionStatus('Gagal membuat PDF.');
    }
    setTimeout(() => setActionStatus(null), 3500);
  };

  return (
    <div className="studentcard-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="studentcard-modal-card relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-sm">Pratinjau & Cetak Kartu Pembayaran Siswa</h3>
              <p className="text-[11px] text-slate-400">NIS: {ledger.siswa.nis} · {ledger.siswa.nama}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Status Banner */}
        {actionStatus && (
          <div className="no-print bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-medium text-emerald-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionStatus}</span>
          </div>
        )}

        {/* PRINTABLE CARD CONTENT */}
        <div id="print-area" className="p-6 sm:p-8 bg-white text-slate-900 max-w-2xl mx-auto space-y-6">
          
          {/* Header Kop Resmi */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="flex justify-center mb-2">
              <SmkPgriLogo customLogoUrl={settings.LOGO_URL} className="w-14 h-14 object-contain mx-auto" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-tight">
              {settings.NAMA_SEKOLAH}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings.ALAMAT_SEKOLAH} · Telp: {settings.NO_TELP_SEKOLAH}
            </p>
            <div className="mt-2 inline-block px-3.5 py-0.5 rounded bg-slate-100 font-bold text-xs tracking-wider text-slate-800 border border-slate-200">
              KARTU PEMBAYARAN KEUANGAN SISWA
            </div>
          </div>

          {/* Student Profile Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Nama Lengkap Siswa</span>
              <strong className="text-sm font-bold text-slate-900">{ledger.siswa.nama}</strong>
              <div className="text-slate-500 mt-1 font-mono text-[11px]">
                NIS: <strong className="text-slate-800">{ledger.siswa.nis}</strong> · Kelas: <strong className="text-slate-800">{ledger.siswa.kelas}</strong>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] text-slate-400 block">Tahun Ajaran / Jurusan</span>
              <span className="font-semibold text-slate-800">{settings.TAHUN_AJARAN || '2026/2027'}</span>
              <div className="text-slate-500 mt-1 text-[11px]">
                Jurusan: <span className="font-medium text-slate-800">{ledger.siswa.jurusan || '-'}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary 3 Boxes */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Kewajiban
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-900 block mt-1 tabular-nums">
                Rp {ledger.totalSemuaTagihan.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Sudah Dibayar
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-700 block mt-1 tabular-nums">
                Rp {ledger.totalSudahDibayar.toLocaleString('id-ID')}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${ledger.sisaSemuaTagihan > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider block ${ledger.sisaSemuaTagihan > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                Sisa Tunggakan
              </span>
              <span className={`text-sm sm:text-base font-bold font-mono block mt-1 tabular-nums ${ledger.sisaSemuaTagihan > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                Rp {ledger.sisaSemuaTagihan.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Matriks 12 Bulan SPP */}
          {sppPos && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Matriks Pembayaran SPP Bulanan
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  Tarif: Rp {(sppPos.nominalPerBulan || 300000).toLocaleString('id-ID')}/bln · {sppPos.bulanLunasCount}/12 Lunas
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2 px-3 text-left">Bulan</th>
                      <th className="py-2 px-3 text-left">Tarif</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-left">No. Kwitansi</th>
                      <th className="py-2 px-3 text-right">Tgl Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {sppPos.sppMonths?.map((m) => (
                      <tr key={m.bulan} className={m.isLunas ? 'bg-emerald-50/20' : ''}>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{m.bulan}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600">Rp {m.nominal.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 px-3 text-center">
                          {m.isLunas ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[10px]">
                              <Check className="w-3 h-3" /> LUNAS
                            </span>
                          ) : (
                            <span className="font-medium text-rose-600 text-[10px]">Belum Lunas</span>
                          )}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-slate-700">{m.noKwitansi || '-'}</td>
                        <td className="py-1.5 px-3 text-right text-slate-600">{m.tanggalBayar || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pos Biaya Sistem Cicilan */}
          {otherPosList.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                2. Status Pos Biaya Sistem Cicilan / Angsuran
              </h4>

              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2 px-3 text-left">Pos Biaya</th>
                      <th className="py-2 px-3 text-right">Target Biaya</th>
                      <th className="py-2 px-3 text-right">Sudah Dibayar</th>
                      <th className="py-2 px-3 text-right">Sisa Tagihan</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {otherPosList.map((pos) => (
                      <tr key={pos.idPos}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{pos.namaPos}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">Rp {pos.totalTarget.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-medium">Rp {pos.totalBayar.toLocaleString('id-ID')}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${pos.sisaTagihan > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          Rp {pos.sisaTagihan.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {pos.isLunas ? (
                            <span className="font-bold text-emerald-700 text-[10px]">LUNAS</span>
                          ) : (
                            <span className="font-medium text-slate-500 text-[10px]">Belum Lunas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kotak Rekening Resmi */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 leading-relaxed">
            <strong className="block font-bold mb-0.5">INFORMASI PEMBAYARAN RESMI SEKOLAH:</strong>
            <span>Nomor Rekening BRI : <strong className="font-mono text-slate-900">009201011149539</strong> A.N. <strong className="text-slate-900">SMK PGRI 1</strong> (Pembayaran juga dapat dilayani langsung di loket kasir bendahara sekolah).</span>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 text-center text-xs text-slate-600 pt-3 border-t border-dashed border-slate-200">
            <div>
              <p className="text-[11px] text-slate-400 mb-12">Mengetahui,<br />Kepala Sekolah,</p>
              <p className="font-bold text-slate-900 underline">({settings.NAMA_KEPSEK || 'Kepala Sekolah'})</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-12">Dicetak per {todayStr}<br />Petugas Kasir Keuangan,</p>
              <p className="font-bold text-slate-900 underline">({settings.NAMA_BENDAHARA || 'Petugas Kasir'})</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            *Kartu pembayaran ini adalah dokumen resmi riwayat administrasi keuangan sekolah.*
          </div>
        </div>

        {/* Modal Bottom Action Bar (Hidden in Print) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenWhatsApp(ledger)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Kirim rincian kewajiban ke WhatsApp Wali Murid"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim WA</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Unduh file PDF Kartu Siswa resmi"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Unduh PDF Kartu</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              title="Cetak langsung kartu siswa ke printer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
