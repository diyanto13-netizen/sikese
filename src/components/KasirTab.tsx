import React, { useState } from 'react';
import { Student, StudentLedger, CartItem, UserSession, Settings } from '../types';
import { FinanceEngine, getGradeLevel } from '../services/storage';
import {
  Search,
  ShoppingCart,
  Trash2,
  Calendar,
  Check,
  User,
  CreditCard,
  PlusCircle,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

interface KasirTabProps {
  user: UserSession;
  settings: Settings;
  onPaymentComplete: (receipt: any) => void;
}

export const KasirTab: React.FC<KasirTabProps> = ({
  user,
  settings,
  onPaymentComplete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentLedger | null>(null);
  const [selectedSppYear, setSelectedSppYear] = useState('2026');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metode, setMetode] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [keterangan, setKeterangan] = useState('');
  const [customNominalInput, setCustomNominalInput] = useState<{ [posId: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const totalStudents = FinanceEngine.getStudents().length;

  // Search Results
  const searchResults = searchQuery.trim().length >= 1
    ? FinanceEngine.searchStudent(searchQuery)
    : [];

  const handleSelectStudent = (student: Student) => {
    try {
      const ledger = FinanceEngine.getStudentLedger(student.nis, selectedSppYear);
      setSelectedStudent(ledger);
      setCart([]);
      setSearchQuery('');
      setErrorMessage('');
    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  const handleResetStudent = () => {
    setSelectedStudent(null);
    setCart([]);
    setErrorMessage('');
  };

  const handleSppYearChange = (year: string) => {
    setSelectedSppYear(year);
    if (selectedStudent) {
      try {
        const updatedLedger = FinanceEngine.getStudentLedger(selectedStudent.siswa.nis, year);
        setSelectedStudent(updatedLedger);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Toggle SPP Month in Cart
  const handleToggleSppMonth = (bulan: string, nominal: number, isLunas: boolean) => {
    if (isLunas) return;

    const monthKey = `${bulan} ${selectedSppYear}`;
    const existingIdx = cart.findIndex((c) => c.idPos === 'POS-SPP' && c.bulan === monthKey);
    if (existingIdx > -1) {
      setCart(cart.filter((_, idx) => idx !== existingIdx));
    } else {
      setCart([
        ...cart,
        {
          idPos: 'POS-SPP',
          namaPos: `SPP Bulan ${bulan} (${selectedSppYear})`,
          bulan: monthKey,
          nominal
        }
      ]);
    }
  };

  // Add Non-SPP (DSP / PKL / Kegiatan) to Cart
  const handleAddNonSppToCart = (posId: string, namaPos: string, maxNominal: number) => {
    const inputVal = customNominalInput[posId];
    const nominal = inputVal ? parseInt(inputVal.replace(/[^0-9]/g, ''), 10) : maxNominal;

    if (!nominal || nominal <= 0) {
      setErrorMessage(`Nominal untuk ${namaPos} harus lebih dari Rp 0!`);
      return;
    }

    if (nominal > maxNominal) {
      setErrorMessage(`Nominal Rp ${nominal.toLocaleString('id-ID')} melebihi sisa tagihan (Rp ${maxNominal.toLocaleString('id-ID')})!`);
      return;
    }

    // Check if already in cart
    const existingIdx = cart.findIndex((c) => c.idPos === posId);
    if (existingIdx > -1) {
      // update
      const updated = [...cart];
      updated[existingIdx].nominal = nominal;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          idPos: posId,
          namaPos,
          nominal
        }
      ]);
    }

    // Clear input
    setCustomNominalInput({ ...customNominalInput, [posId]: '' });
    setErrorMessage('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((acc, item) => acc + item.nominal, 0);

  // Submit Payment
  const handleProcessTransaction = () => {
    if (!selectedStudent || cart.length === 0) return;

    setIsProcessing(true);
    setErrorMessage('');

    setTimeout(() => {
      try {
        const result = FinanceEngine.processBatchTransaction({
          nis: selectedStudent.siswa.nis,
          nama: selectedStudent.siswa.nama,
          kelas: selectedStudent.siswa.kelas,
          noHpWali: selectedStudent.siswa.noHpWali,
          metode,
          kasir: user.nama,
          items: cart,
          keterangan
        });

        // Trigger Receipt Modal in Parent
        onPaymentComplete({
          ...result,
          items: cart,
          student: selectedStudent.siswa,
          metode,
          kasir: user.nama
        });

        // Refresh selected student ledger
        const updatedLedger = FinanceEngine.getStudentLedger(selectedStudent.siswa.nis, selectedSppYear);
        setSelectedStudent(updatedLedger);
        setCart([]);
        setKeterangan('');
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal memproses transaksi!');
      } finally {
        setIsProcessing(false);
      }
    }, 200);
  };

  const sppPos = selectedStudent?.posStatus.find((p) => p.idPos === 'POS-SPP');
  const otherPosList = selectedStudent?.posStatus.filter((p) => p.idPos !== 'POS-SPP') || [];

  return (
    <div className="space-y-6">
      
      {/* Banner Error */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-semibold">Perhatian:</strong>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI (7/12): Pilih Siswa & Pos Biaya */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: PENCARIAN SISWA */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold">1</span>
              Pilih Siswa
            </h2>

            {totalStudents === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs font-semibold text-slate-700">Database Siswa Masih Kosong</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Belum ada data siswa riil yang tersimpan. Silakan masukkan data siswa di menu <strong>Pengaturan & Backup</strong> (Master Data Siswa) atau hubungkan Google Spreadsheet Anda.
                </p>
              </div>
            ) : !selectedStudent ? (
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan NIS, Nama Siswa, atau Kelas..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Dropdown Hasil Pencarian */}
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
                        <span className="text-emerald-600 font-semibold text-xs">Pilih Siswa →</span>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.trim().length >= 1 && searchResults.length === 0 && (
                  <div className="mt-2 p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    Tidak ditemukan siswa dengan kata kunci "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              /* Siswa Terpilih Card */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedStudent.siswa.nama.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{selectedStudent.siswa.nama}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                        Tingkat {getGradeLevel(selectedStudent.siswa.kelas)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 text-xs text-slate-600 mt-1">
                      <span>NIS: <strong className="text-slate-900 font-mono font-semibold">{selectedStudent.siswa.nis}</strong></span>
                      <span>·</span>
                      <span>Kelas: <strong className="text-slate-900 font-semibold">{selectedStudent.siswa.kelas}</strong></span>
                      <span>·</span>
                      <span>Jurusan: <strong className="text-slate-900 font-semibold">{selectedStudent.siswa.jurusan}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResetStudent}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Ganti Siswa
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: PILIHAN POS BIAYA (Menyesuaikan dengan Tingkat Kelas) */}
          {selectedStudent && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold">2</span>
                    Pilih Pos Biaya (Tingkat {getGradeLevel(selectedStudent.siswa.kelas)})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Menampilkan pos biaya khusus Tingkat {getGradeLevel(selectedStudent.siswa.kelas)} (SPP &amp; DSP berlaku di semua tingkatan kelas X, XI, XII)
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Total Tunggakan: <strong className="font-mono text-rose-600 font-bold">Rp {selectedStudent.sisaSemuaTagihan.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              {/* POS 1: SPP BULANAN (Grid 12 Bulan) */}
              {sppPos && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{sppPos.namaPos}</h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Sistem: Bulanan
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tarif: <strong className="font-mono text-slate-900 font-semibold">Rp {sppPos.nominalPerBulan?.toLocaleString('id-ID')}</strong>/bulan
                        · Lunas: <span className="text-emerald-700 font-semibold">{sppPos.bulanLunasCount} dari 12 Bulan (Tahun {selectedSppYear})</span>
                        · Total Setahun: <span className="font-mono">Rp {(Number(sppPos.nominalPerBulan) * 12).toLocaleString('id-ID')}</span>
                      </p>
                    </div>

                    {/* Dropdown Filter Tahun SPP */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs self-start sm:self-auto">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Filter Tahun:
                      </span>
                      <select
                        value={selectedSppYear}
                        onChange={(e) => handleSppYearChange(e.target.value)}
                        className="text-xs font-bold border border-slate-300 rounded-lg bg-slate-50 text-slate-900 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                        title="Pilih tahun tagihan SPP bagi murid kelas XI dan XII yang masih memiliki tunggakan tahun sebelumnya"
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

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {sppPos.sppMonths?.map((m) => {
                      const inCart = cart.some(
                        (c) => c.idPos === 'POS-SPP' && c.bulan === `${m.bulan} ${selectedSppYear}`
                      );
                      const isLunas = m.isLunas;

                      return (
                        <div
                          key={m.bulan}
                          onClick={() => handleToggleSppMonth(m.bulan, m.nominal, isLunas)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                            isLunas
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : inCart
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold mb-1">
                            <span>{m.bulan}</span>
                            {isLunas && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            {inCart && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                          </div>

                          <div className="text-[11px] font-mono">
                            {isLunas ? (
                              <span className="text-slate-400 font-sans">✓ Lunas</span>
                            ) : (
                              <span className={inCart ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                                Rp {m.nominal.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* POS 2: NON-SPP / SISTEM CICILAN (DSP, PKL, KURIKULUM, KESISWAAN, SARPRAS) */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Pos Biaya Sistem Cicilan</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Sistem: Cicilan
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  DSP, PKL, Kurikulum, Kesiswaan & Sarpras dapat dibayar bertahap / angsuran cicilan sesuai kemampuan siswa
                </p>

                <div className="space-y-3">
                  {otherPosList.map((pos) => {
                    const isLunas = pos.sisaTagihan === 0;
                    const inCartItem = cart.find((c) => c.idPos === pos.idPos);
                    const currentInput = customNominalInput[pos.idPos] ?? '';

                    return (
                      <div
                        key={pos.idPos}
                        className={`p-4 rounded-xl border transition-all ${
                          isLunas
                            ? 'bg-slate-50 border-slate-200'
                            : inCartItem
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-slate-900 text-sm">{pos.namaPos}</h4>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {pos.kategori}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                                Cicilan
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 mt-1 font-mono">
                              <span>Tarif Total: <strong className="text-slate-800">Rp {pos.totalTarget.toLocaleString('id-ID')}</strong></span>
                              <span>·</span>
                              <span>Sudah Masuk: Rp {pos.totalBayar.toLocaleString('id-ID')}</span>
                              <span>·</span>
                              <span>
                                Sisa Cicilan:{' '}
                                <strong className={`font-semibold ${pos.sisaTagihan > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  Rp {pos.sisaTagihan.toLocaleString('id-ID')}
                                </strong>
                              </span>
                            </div>
                          </div>

                          {/* Action area */}
                          <div>
                            {isLunas ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                                <Check className="w-3.5 h-3.5" /> Lunas
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <input
                                    type="number"
                                    placeholder={`Maks: ${pos.sisaTagihan.toLocaleString('id-ID')}`}
                                    value={currentInput}
                                    onChange={(e) =>
                                      setCustomNominalInput({
                                        ...customNominalInput,
                                        [pos.idPos]: e.target.value
                                      })
                                    }
                                    className="w-32 sm:w-36 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddNonSppToCart(pos.idPos, pos.namaPos, pos.sisaTagihan)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>{inCartItem ? 'Ubah' : '+ Cicilan'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* KOLOM KANAN (4/12): Shopping Cart & Transaksi Selesai */}
        <div className="lg:col-span-4 sticky top-20">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Keranjang Pembayaran
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {cart.length} Pos
              </span>
            </div>

            {/* List Item Cart */}
            <div className="min-h-[160px] max-h-[300px] overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                  Belum ada pos biaya yang dipilih.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="pr-2">
                      <span className="font-semibold text-slate-800 block">{item.namaPos}</span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        Rp {item.nominal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal & Total */}
            <div className="border-t-2 border-slate-900 pt-3 space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                <span>TOTAL TAGIHAN</span>
                <span className="text-lg font-mono text-emerald-600 font-bold tabular-nums">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method & Notes */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetode('Tunai')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      metode === 'Tunai'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💵 Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetode('Transfer')}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      metode === 'Transfer'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🏦 Transfer / QRIS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Titipan wali kelas, transfer bank BSI..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Process Button */}
            <button
              type="button"
              disabled={!selectedStudent || cart.length === 0 || isProcessing}
              onClick={handleProcessTransaction}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <span>Sedang Memproses...</span>
              ) : (
                <>
                  <span>Proses & Terbitkan Kwitansi</span>
                  <span className="font-mono text-xs">→</span>
                </>
              )}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
