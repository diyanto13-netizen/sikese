import React, { useState } from 'react';
import { FinanceEngine } from '../services/storage';
import { GasApiService } from '../services/gasApi';
import { Settings, BackupRecord, UserSession, Student } from '../types';
import {
  Save,
  Database,
  Shield,
  RotateCcw,
  CheckCircle2,
  HardDriveDownload,
  School,
  Link as LinkIcon,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Users,
  UserPlus,
  Trash2,
  Upload,
  Search,
  AlertTriangle,
  Download
} from 'lucide-react';
import { SmkPgriLogo } from './SmkPgriLogo';

interface SettingsTabProps {
  settings: Settings;
  user: UserSession;
  onSettingsUpdated: (newSettings: Settings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings: initialSettings,
  user,
  onSettingsUpdated
}) => {
  const [formData, setFormData] = useState<Settings>({ ...initialSettings });
  const [gasUrl, setGasUrl] = useState(FinanceEngine.getGasUrl());
  const [backups, setBackups] = useState<BackupRecord[]>(FinanceEngine.getBackups());
  const [students, setStudents] = useState<Student[]>(FinanceEngine.getStudents());
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [newStudent, setNewStudent] = useState<Student>({
    nis: '',
    nisn: '',
    nama: '',
    kelas: 'X PPLG 1',
    jurusan: 'Pengembangan Perangkat Lunak & Gim',
    noHpWali: '',
    status: 'Aktif',
    alamat: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestGasConnection = async () => {
    if (!gasUrl) {
      setTestResult({ success: false, message: 'Silakan isi URL Web App GAS terlebih dahulu!' });
      return;
    }
    setIsTestingGas(true);
    setTestResult(null);
    try {
      const res = await GasApiService.testConnection(gasUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: `Gagal: ${err.message}` });
    } finally {
      setIsTestingGas(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleChange = (key: keyof Settings, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = FinanceEngine.updateSettings(formData);
    FinanceEngine.setGasUrl(gasUrl);
    onSettingsUpdated(updated);
    showSuccess('Pengaturan lembaga berhasil disimpan!');
  };

  const handleCreateBackup = () => {
    const newRecord = FinanceEngine.triggerAutomatedBackup();
    setBackups(FinanceEngine.getBackups());
    setBackupMsg(`Cadangan database berhasil dibuat: ${newRecord.fileName}`);
    setTimeout(() => setBackupMsg(''), 4000);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.nis || !newStudent.nama || !newStudent.kelas) {
      showError('NIS, Nama Lengkap, dan Kelas wajib diisi!');
      return;
    }

    try {
      const updated = FinanceEngine.addStudent(newStudent);
      setStudents(updated);
      setIsAddStudentOpen(false);
      setNewStudent({
        nis: '',
        nisn: '',
        nama: '',
        kelas: 'X PPLG 1',
        jurusan: 'Pengembangan Perangkat Lunak & Gim',
        noHpWali: '',
        status: 'Aktif',
        alamat: ''
      });
      showSuccess(`Siswa ${newStudent.nama} berhasil ditambahkan ke database riil!`);
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan siswa.');
    }
  };

  const handleDeleteStudent = (nis: string, nama: string) => {
    if (confirm(`Hapus data siswa ${nama} (NIS: ${nis}) dari database?`)) {
      const updated = FinanceEngine.deleteStudent(nis);
      setStudents(updated);
      showSuccess(`Siswa ${nama} berhasil dihapus.`);
    }
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;

    try {
      const lines = importText.trim().split('\n');
      const parsedStudents: Student[] = [];

      lines.forEach((line) => {
        const parts = line.split(/[,\t;]/).map((p) => p.trim());
        if (parts.length >= 3) {
          const nis = parts[0];
          const nama = parts[1];
          const kelas = parts[2];
          const noHpWali = parts[3] || '';
          const jurusan = parts[4] || '';
          const alamat = parts[5] || '';

          if (nis && nama && kelas) {
            parsedStudents.push({
              nis,
              nisn: '',
              nama,
              kelas,
              jurusan,
              noHpWali,
              status: 'Aktif',
              alamat
            });
          }
        }
      });

      if (parsedStudents.length === 0) {
        showError('Format data tidak sesuai. Pastikan ada minimal NIS, Nama, dan Kelas dipisahkan koma atau tab.');
        return;
      }

      const res = FinanceEngine.importStudents(parsedStudents);
      setStudents(FinanceEngine.getStudents());
      setIsImportModalOpen(false);
      setImportText('');
      showSuccess(`Impor selesai! ${res.added} siswa baru berhasil ditambahkan, ${res.skipped} dilewati.`);
    } catch (err: any) {
      showError('Gagal memproses impor: ' + err.message);
    }
  };

  const handleClearTransactions = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATA TRANSAKSI? Seluruh riwayat kwitansi pembayaran akan dihapus untuk memulai pembukuan baru dari Rp 0.')) {
      FinanceEngine.clearAllTransactions();
      showSuccess('Seluruh data transaksi berhasil dikosongkan!');
    }
  };

  const handleClearStudents = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATA SISWA?')) {
      FinanceEngine.clearAllStudents();
      setStudents([]);
      showSuccess('Seluruh data siswa berhasil dikosongkan.');
    }
  };

  const handleResetClean = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh database ke kondisi bersih (0 transaksi & 0 siswa sample)?')) {
      FinanceEngine.resetSampleData();
      const updated = FinanceEngine.getSettings();
      setFormData(updated);
      setStudents([]);
      onSettingsUpdated(updated);
      showSuccess('Database telah dikosongkan dari seluruh data sample. Siap untuk data riil!');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nis.includes(studentSearch) ||
      s.kelas.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {backupMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{backupMsg}</span>
        </div>
      )}

      {/* FORM PENGATURAN LEMBAGA & PIN */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-emerald-600" />
            Identitas Sekolah & Madrasah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi ini otomatis tercetak pada kop surat kwitansi dan laporan rekapitulasi buku kas
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Logo Sekolah Preview & Upload */}
          <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 shrink-0 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center shadow-2xs">
              <SmkPgriLogo
                customLogoUrl={formData.LOGO_URL}
                className="max-h-full max-w-full object-contain mx-auto"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Logo Resmi Sekolah
              </h4>
              <p className="text-[11px] text-slate-500">
                Logo ini akan ditampilkan pada Halaman Login, Kwitansi Pembayaran, dan Kartu SPP Siswa. Format gambar asli (PNG/JPG/SVG) akan dipertahankan bentuknya 100% tanpa distorsi.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                  <span>Unggah Berkas Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        handleChange('LOGO_URL', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {formData.LOGO_URL && (
                  <button
                    type="button"
                    onClick={() => handleChange('LOGO_URL', '')}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Gunakan Logo Standar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Lembaga Pendidikan
            </label>
            <input
              type="text"
              value={formData.NAMA_SEKOLAH}
              onChange={(e) => handleChange('NAMA_SEKOLAH', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Lengkap Sekolah
            </label>
            <input
              type="text"
              value={formData.ALAMAT_SEKOLAH}
              onChange={(e) => handleChange('ALAMAT_SEKOLAH', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Telepon / Layanan Keuangan
            </label>
            <input
              type="text"
              value={formData.NO_TELP_SEKOLAH}
              onChange={(e) => handleChange('NO_TELP_SEKOLAH', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tahun Ajaran Aktif
            </label>
            <input
              type="text"
              value={formData.TAHUN_AJARAN}
              onChange={(e) => handleChange('TAHUN_AJARAN', e.target.value)}
              placeholder="Contoh: 2026/2027"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kepala Sekolah (Penanggung Jawab)
            </label>
            <input
              type="text"
              value={formData.NAMA_KEPSEK}
              onChange={(e) => handleChange('NAMA_KEPSEK', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Bendahara / Kasir Utama
            </label>
            <input
              type="text"
              value={formData.NAMA_BENDAHARA}
              onChange={(e) => handleChange('NAMA_BENDAHARA', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>
        </div>

        {/* KONFIGURASI KEAMANAN PIN */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Konfigurasi PIN Otorisasi Masuk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan kombinasi angka rahasia untuk memisahkan hak akses loket transaksi kasir dan supervisi keuangan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                PIN Kasir (Loket Transaksi & Kwitansi)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.PIN_KASIR}
                onChange={(e) => handleChange('PIN_KASIR', e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest border border-slate-200 rounded-lg bg-white"
                required
              />
              <span className="text-[11px] text-slate-400 block mt-1">Default: 1234 (4-6 digit angka)</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                PIN Kepala Sekolah (Supervisi & Rekap)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.PIN_KEPSEK}
                onChange={(e) => handleChange('PIN_KEPSEK', e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest border border-slate-200 rounded-lg bg-white"
                required
              />
              <span className="text-[11px] text-slate-400 block mt-1">Default: 8899 (4-6 digit angka)</span>
            </div>
          </div>
        </div>

        {/* INTEGRASI GOOGLE APPS SCRIPT WEB APP */}
        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
            <LinkIcon className="w-4 h-4 text-blue-600" />
            URL Web App Google Apps Script (Opsional)
          </h3>
          <p className="text-xs text-slate-500 mb-2">
            Jika Anda telah mendeploy <code>Code.gs</code> di Google Sheets sebagai Web App, tempelkan URL deployment Anda di sini untuk menghubungkan antarmuka ini secara live ke Google Cloud Spreadsheet.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={gasUrl}
              onChange={(e) => {
                setGasUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleTestGasConnection}
              disabled={isTestingGas}
              className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
              <span>{isTestingGas ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>

      </form>

      {/* MASTER DATA SISWA (DATA RIIL) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Master Data Siswa ({students.length} Siswa Riil)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola data identitas siswa resmi sekolah yang terdaftar di database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Impor Teks / CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Search Siswa */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder="Cari siswa berdasarkan Nama, NIS, atau Kelas..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Tabel Siswa */}
        {students.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">Database Siswa Masih Kosong</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Seluruh data sample dummy telah dibersihkan. Klik tombol <strong>"Tambah Siswa Baru"</strong> atau <strong>"Impor Teks / CSV"</strong> untuk menambahkan data siswa riil sekolah Anda.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">NIS</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Jurusan</th>
                    <th className="p-3">No HP Wali</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.nis} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800">{s.nis}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.nama}</td>
                      <td className="p-3">{s.kelas}</td>
                      <td className="p-3 text-slate-500">{s.jurusan || '-'}</td>
                      <td className="p-3 font-mono text-slate-600">{s.noHpWali || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.nis, s.nama)}
                          title="Hapus data siswa ini"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
              <span>Menampilkan {filteredStudents.length} dari {students.length} siswa</span>
            </div>
          </div>
        )}
      </div>

      {/* CADANGAN & PEMELIHARAAN DATABASE */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              Cadangan Database (Backup Otomatis)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Snapshot berkala database ke folder Google Drive <code>SiKeSe_Backup</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBackup}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Buat Cadangan Baru</span>
            </button>
          </div>
        </div>

        {/* Riwayat Backup */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Daftar Arsip Cadangan Tersimpan
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {backups.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada arsip cadangan tersimpan. Klik "Buat Cadangan Baru" untuk membuat salinan file database.
              </div>
            ) : (
              backups.map((b) => (
                <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-slate-900 font-mono block text-xs">{b.fileName}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Waktu: {b.timestamp} · Ukuran: {b.size}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Tersimpan di Drive
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zona Pembersihan Data Transaksi & Data Siswa */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Pemeliharaan & Pembersihan Data Riil
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gunakan opsi di bawah ini untuk memulai pembukuan baru pada tahun ajaran baru atau membersihkan transaksi uji coba kasir tanpa merusak konfigurasi sistem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <strong className="text-xs block text-slate-800">Kosongkan Data Transaksi</strong>
                <span className="text-[11px] text-slate-400">Hapus seluruh catatan kwitansi kasir (kembali ke Rp 0).</span>
              </div>
              <button
                type="button"
                onClick={handleClearTransactions}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Kosongkan Kas
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <strong className="text-xs block text-slate-800">Kosongkan Database Siswa</strong>
                <span className="text-[11px] text-slate-400">Hapus seluruh data siswa dari database.</span>
              </div>
              <button
                type="button"
                onClick={handleClearStudents}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Kosongkan Siswa
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL TAMBAH SISWA BARU */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Tambah Siswa Riil Baru
              </h3>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS (Wajib)
                  </label>
                  <input
                    type="text"
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value.trim() })}
                    placeholder="Contoh: 240101"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newStudent.nisn}
                    onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value.trim() })}
                    placeholder="Contoh: 007123456"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa (Wajib)
                </label>
                <input
                  type="text"
                  value={newStudent.nama}
                  onChange={(e) => setNewStudent({ ...newStudent, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rizki"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas (Wajib)
                  </label>
                  <input
                    type="text"
                    value={newStudent.kelas}
                    onChange={(e) => setNewStudent({ ...newStudent, kelas: e.target.value })}
                    placeholder="Contoh: X PPLG 1, XI AKL, XII OTKP"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jurusan / Kompetensi Keahlian
                  </label>
                  <input
                    type="text"
                    value={newStudent.jurusan}
                    onChange={(e) => setNewStudent({ ...newStudent, jurusan: e.target.value })}
                    placeholder="Contoh: PPLG, AKL, MPLB"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp Wali Murid (Wajib untuk notifikasi)
                </label>
                <input
                  type="text"
                  value={newStudent.noHpWali}
                  onChange={(e) => setNewStudent({ ...newStudent, noHpWali: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <input
                  type="text"
                  value={newStudent.alamat}
                  onChange={(e) => setNewStudent({ ...newStudent, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Pelabuhan II No. 10, Sukabumi"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPOR MASSAL SISWA */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Impor Data Siswa Massal
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Salin dan tempel baris data siswa dari Excel atau file teks.
                Format per baris (dipisahkan koma atau tab):
              </p>
              <div className="p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] text-slate-800">
                NIS, Nama Lengkap, Kelas, NoHpWali, Jurusan, Alamat
              </div>
              <p className="text-[11px] text-slate-400">
                Contoh:<br />
                <code>2401, Andi Pratama, X PPLG 1, 08123456789, PPLG, Sukabumi</code><br />
                <code>2402, Siti Nurhaliza, X PPLG 1, 08198765432, PPLG, Sukabumi</code>
              </p>
            </div>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Tempel data siswa di sini..."
              className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Proses Impor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
