import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FinanceEngine } from '../services/storage';
import { StudentLedger } from '../types';
import { Chart, registerables } from 'chart.js';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  GraduationCap,
  Wallet,
  CreditCard
} from 'lucide-react';

Chart.register(...registerables);

interface DashboardTabProps {
  onOpenWhatsAppBilling?: (ledger: StudentLedger) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onOpenWhatsAppBilling }) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Stats calculation
  const transactions = FinanceEngine.getTransactions();
  const students = FinanceEngine.getStudents();
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const thisMonthStr = `${yyyy}-${mm}`;

  // List of unique classes
  const classList = useMemo(() => {
    const set = new Set(students.map((s) => s.kelas));
    return Array.from(set).sort();
  }, [students]);

  const [selectedClass, setSelectedClass] = useState<string>(() => classList[0] || '');
  const [filterArrearsStatus, setFilterArrearsStatus] = useState<'SEMUA' | 'MENUNGGAK' | 'LUNAS'>('SEMUA');
  const [searchStudentInClass, setSearchStudentInClass] = useState('');

  // Auto-select first class if empty
  useEffect(() => {
    if (!selectedClass && classList.length > 0) {
      setSelectedClass(classList[0]);
    }
  }, [classList, selectedClass]);

  let totalHariIni = 0;
  let totalBulanIni = 0;
  let totalSuksesCount = 0;
  let totalTransfer = 0;
  let totalTunai = 0;
  let totalTransferBulanIni = 0;
  let totalTunaiBulanIni = 0;
  let totalTransferHariIni = 0;
  let totalTunaiHariIni = 0;

  transactions.forEach((t) => {
    if (t.status !== 'Batal') {
      const isToday = t.tanggal === todayStr;
      const isThisMonth = t.tanggal.startsWith(thisMonthStr);
      const isTransfer = t.metode === 'Transfer';

      if (isToday) {
        totalHariIni += t.nominal;
        if (isTransfer) totalTransferHariIni += t.nominal;
        else totalTunaiHariIni += t.nominal;
      }
      if (isThisMonth) {
        totalBulanIni += t.nominal;
        if (isTransfer) totalTransferBulanIni += t.nominal;
        else totalTunaiBulanIni += t.nominal;
      }
      if (isTransfer) {
        totalTransfer += t.nominal;
      } else {
        totalTunai += t.nominal;
      }
      totalSuksesCount++;
    }
  });

  const chartDataSummary = useMemo(() => {
    return FinanceEngine.getMonthlyChartData(selectedYear);
  }, [selectedYear, transactions.length]);

  // Render Chart.js
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    const data = chartDataSummary;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'SPP Bulanan',
            data: data.sppMonthly,
            backgroundColor: '#059669', // Emerald
            borderRadius: 6
          },
          {
            label: 'DSP & Pos Lainnya',
            data: data.nonSppMonthly,
            backgroundColor: '#0284c7', // Sky blue
            borderRadius: 6
          },
          {
            label: 'Total Penerimaan Riil',
            data: data.totalMonthly,
            type: 'line' as any,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            borderWidth: 2,
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: {
                family: 'Plus Jakarta Sans',
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const val = (context.raw as number) || 0;
                return ` ${context.dataset.label}: Rp ${val.toLocaleString('id-ID')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val: any) => `Rp ${(Number(val) / 1000).toLocaleString('id-ID')}k`
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartDataSummary]);

  // Students in selected class with their ledgers
  const classStudentsWithLedgers = useMemo(() => {
    if (!selectedClass) return [];
    const classStudents = students.filter((s) => s.kelas === selectedClass);
    return classStudents.map((s) => {
      try {
        const ledger = FinanceEngine.getStudentLedger(s.nis, selectedYear);
        return {
          student: s,
          ledger
        };
      } catch {
        return null;
      }
    }).filter((item): item is { student: (typeof students)[0]; ledger: StudentLedger } => item !== null);
  }, [students, selectedClass, selectedYear, transactions.length]);

  // Summary statistics for the selected class
  const totalClassStudents = classStudentsWithLedgers.length;
  const countMenunggak = classStudentsWithLedgers.filter((item) => item.ledger.sisaSemuaTagihan > 0).length;
  const countLunas = classStudentsWithLedgers.filter((item) => item.ledger.sisaSemuaTagihan === 0).length;
  const totalTunggakanKelas = classStudentsWithLedgers.reduce((acc, item) => acc + item.ledger.sisaSemuaTagihan, 0);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return classStudentsWithLedgers.filter((item) => {
      if (filterArrearsStatus === 'MENUNGGAK' && item.ledger.sisaSemuaTagihan === 0) return false;
      if (filterArrearsStatus === 'LUNAS' && item.ledger.sisaSemuaTagihan > 0) return false;
      if (searchStudentInClass.trim()) {
        const q = searchStudentInClass.toLowerCase().trim();
        const matchesName = item.student.nama.toLowerCase().includes(q);
        const matchesNis = item.student.nis.toLowerCase().includes(q);
        if (!matchesName && !matchesNis) return false;
      }
      return true;
    });
  }, [classStudentsWithLedgers, filterArrearsStatus, searchStudentInClass]);

  return (
    <div className="space-y-6">
      
      {/* 6 Stat Cards Termasuk Pembayaran Tunai & Non-Tunai / Transfer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penerimaan Hari Ini
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
            Rp {totalHariIni.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tunai: Rp {totalTunaiHariIni.toLocaleString('id-ID')} · Non-Tunai: Rp {totalTransferHariIni.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penerimaan Bulan Ini
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            Rp {totalBulanIni.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tunai: Rp {totalTunaiBulanIni.toLocaleString('id-ID')} · Non-Tunai: Rp {totalTransferBulanIni.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Total Pembayaran Tunai (Cash) */}
        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Total Pembayaran Tunai (Cash)</span>
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            Rp {totalTunai.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-slate-500">Akumulasi uang fisik loket kasir / brankas</span>
            <span className="font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
              KAS FISIK
            </span>
          </div>
        </div>

        {/* Total Pembayaran Non-Tunai / Transfer */}
        <div className="bg-white p-5 rounded-xl border border-sky-200 shadow-sm border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Total Non-Tunai / Transfer</span>
            </span>
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 tabular-nums">
            Rp {totalTransfer.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-slate-500">Mutasi rekening bank & QRIS resmi sekolah</span>
            <span className="font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px]">
              BANK / QRIS
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kwitansi Terbit
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {totalSuksesCount} Kwitansi
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Transaksi loket sah dan terverifikasi</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Terdaftar
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {students.length} Siswa
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Siswa aktif di database resmi</p>
        </div>

      </div>

      {/* Chart.js Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Grafik Penerimaan Bulanan (Chart.js)
            </h2>
            <div className="text-xs font-semibold text-emerald-600 mt-0.5">
              Total Penerimaan Riil Tahun {selectedYear}: Rp {chartDataSummary.totalYearRevenue.toLocaleString('id-ID')} ({chartDataSummary.totalYearTransactions} Transaksi)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filter Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        </div>

        <div className="h-80 w-full relative">
          <canvas ref={chartCanvasRef} />
        </div>
      </div>

      {/* Breakdown Metode Pembayaran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pembayaran Tunai (Cash)
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block mt-1">
              Rp {totalTunai.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400">Diterima langsung di loket kasir</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            💵
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pembayaran Non-Tunai / Transfer
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums block mt-1">
              Rp {totalTransfer.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-slate-400">Rekening BSI / Bank / QRIS Sekolah</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            🏦
          </div>
        </div>

      </div>

      {/* ============================================================
          FITUR: MONITORING TUNGGAKAN SISWA PER KELAS & KIRIM WA
          ============================================================ */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Monitoring Tunggakan Siswa per Kelas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kelas untuk memeriksa detail tunggakan per siswa dan kirim rincian tagihan resmi langsung ke WhatsApp wali murid
            </p>
          </div>

          {/* Dropdown Pilihan Kelas */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Pilih Kelas:
            </span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              {classList.length === 0 ? (
                <option value="">Tidak ada data kelas</option>
              ) : (
                classList.map((cls) => {
                  const countInCls = students.filter((s) => s.kelas === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({countInCls} Siswa)
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>

        {/* Ringkasan Statistik Kelas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Siswa Terdaftar
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
              {totalClassStudents} Siswa
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              Ada Tunggakan
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 block mt-0.5">
              {countMenunggak} Siswa
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Bebas Tunggakan / Lunas
            </span>
            <span className="text-lg font-bold font-mono text-emerald-600 block mt-0.5">
              {countLunas} Siswa
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Tunggakan Kelas
            </span>
            <span className="text-lg font-bold font-mono text-rose-600 block mt-0.5 tabular-nums">
              Rp {totalTunggakanKelas.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Filter Status & Pencarian Nama Siswa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterArrearsStatus('SEMUA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterArrearsStatus === 'SEMUA'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalClassStudents})
            </button>
            <button
              onClick={() => setFilterArrearsStatus('MENUNGGAK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterArrearsStatus === 'MENUNGGAK'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Menunggak ({countMenunggak})
            </button>
            <button
              onClick={() => setFilterArrearsStatus('LUNAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterArrearsStatus === 'LUNAS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Lunas ({countLunas})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchStudentInClass}
              onChange={(e) => setSearchStudentInClass(e.target.value)}
              placeholder="Cari nama / NIS siswa..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Grid Daftar Siswa & Rincian Tunggakan */}
        {students.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Database Siswa Masih Kosong</p>
            <p className="text-xs text-slate-400 mt-1">
              Belum ada data siswa riil yang tersimpan. Silakan masukkan data siswa di menu <strong>Pengaturan & Backup</strong> atau hubungkan ke Google Sheets.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500">
              Tidak ada siswa yang sesuai dengan filter pencarian pada kelas {selectedClass}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((item) => {
              const isLunas = item.ledger.sisaSemuaTagihan === 0;

              return (
                <div
                  key={item.student.nis}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between transition-all hover:border-slate-300"
                >
                  {/* Top: Student Profile Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shadow-xs">
                          {item.student.nama.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {item.student.nama}
                          </h4>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            NIS: <strong className="text-slate-600">{item.student.nis}</strong> · Kelas: <span className="font-sans font-medium text-slate-700">{item.student.kelas}</span>
                          </div>
                          {item.student.noHpWali && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <span>📱 WA: {item.student.noHpWali}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5" /> Menunggak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Detail Tunggakan (Rincian per Pos Biaya) */}
                    <div className="my-3 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Detail Pos Tunggakan:
                      </span>

                      {isLunas ? (
                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Seluruh kewajiban pembayaran telah diselesaikan dengan LUNAS.</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {item.ledger.posStatus.filter((p) => p.sisaTagihan > 0).map((pos) => {
                            const isSpp = pos.idPos === 'POS-SPP';
                            const unpaidSppMonths = isSpp && pos.sppMonths
                              ? pos.sppMonths.filter((m) => !m.isLunas).map((m) => m.bulan)
                              : [];

                            return (
                              <div
                                key={pos.idPos}
                                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                              >
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="text-slate-800">{pos.namaPos}</span>
                                  <span className="font-mono text-rose-600">
                                    Rp {pos.sisaTagihan.toLocaleString('id-ID')}
                                  </span>
                                </div>

                                {isSpp && unpaidSppMonths.length > 0 && (
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    <span className="font-medium text-amber-700">
                                      {unpaidSppMonths.length} Bulan Belum Lunas:
                                    </span>{' '}
                                    <span className="text-slate-600">
                                      {unpaidSppMonths.join(', ')}
                                    </span>
                                  </div>
                                )}

                                {!isSpp && (
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Tarif: Rp {pos.totalTarget.toLocaleString('id-ID')} · Sudah Masuk: Rp {pos.totalBayar.toLocaleString('id-ID')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Total Tunggakan & Tombol WA tepat di bawahnya */}
                  <div className="pt-3 border-t border-slate-100 mt-2 space-y-2.5">
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-semibold text-slate-600">
                        Total Tunggakan:
                      </span>
                      <span className={`text-base font-bold font-mono ${isLunas ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Rp {item.ledger.sisaSemuaTagihan.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Tombol Kirim rincian Tagihan ke WA tepat di bawah jumlah total tunggakan */}
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppBilling && onOpenWhatsAppBilling(item.ledger)}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      title={`Kirim rincian tagihan resmi siswa ${item.student.nama} ke nomor WhatsApp wali murid`}
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-100" />
                      <span>Kirim rincian Tagihan ke WA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
