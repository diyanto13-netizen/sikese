import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  GraduationCap,
  Settings,
  Code2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  MessageSquare,
  ShieldCheck,
  KeyRound,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { SmkPgriLogo } from './SmkPgriLogo';

export const TutorialTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'kasir', label: 'Kasir & Transaksi', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard & Tunggakan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bukuKas', label: 'Buku Kas & Undo', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'bukuSiswa', label: 'Buku Bayar Siswa', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'pengaturan', label: 'Pengaturan & PIN', icon: <Settings className="w-4 h-4" /> },
    { id: 'gas', label: 'Integrasi Google Sheet', icon: <Code2 className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ & Kendala', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const tutorials = [
    {
      id: 'alur-kasir',
      category: 'kasir',
      badge: 'Transaksi Harian',
      title: 'Panduan Lengkap Menu Kasir & Pembayaran Siswa',
      description: 'Langkah demi langkah melayani wali murid di loket keuangan, memilih tagihan, hingga cetak kwitansi.',
      features: [
        { name: 'Pencarian Cepat Siswa (Live Autocomplete)', desc: 'Cari siswa instan dengan mengetikkan NIS atau nama lengkap.' },
        { name: 'Rangkuman Profil & Akumulasi Tunggakan', desc: 'Menampilkan data diri, rombel, nomor WA wali, dan total sisa kewajiban.' },
        { name: 'Matriks SPP 12 Bulan (Juli - Juni)', desc: 'Grid 12 bulan visual dengan badge LUNAS hijau dan riwayat setorannya.' },
        { name: 'Filter Multi-Tahun Ajaran SPP', desc: 'Mendukung pembayaran tahun berjalan atau pelunasan tunggakan tahun lalu.' },
        { name: 'Cicilan Bebas Non-SPP (DSP, PKL, dll)', desc: 'Input setoran bertahap fleksibel dengan validasi otomatis anti lebih bayar.' },
        { name: 'Keranjang Pembayaran Multi-Item', desc: 'Menggabungkan pembayaran banyak pos biaya dalam 1 kwitansi transaksi tunggal.' },
        { name: 'Metode Pembayaran Lengkap', desc: 'Pilihan metode Tunai di Loket, Transfer Bank BRI, atau QRIS barcode.' },
        { name: 'Nomor Kwitansi Unik Berurutan', desc: 'Format resmi KW-YYYYMMDD-XXXX dengan sistem penguncian aman.' },
        { name: 'Cetak Kwitansi Thermal & Standar', desc: 'Mendukung printer kasir Thermal POS (58/80mm) dan printer kantor A5/A4.' },
        { name: 'Kirim Kwitansi via WhatsApp Otomatis', desc: 'Tombol kirim pesan bukti transaksi berformat rapi langsung ke WA wali murid.' }
      ],
      steps: [
        {
          num: '01',
          title: 'Cari & Pilih Data Siswa',
          desc: 'Ketik Nomor Induk Siswa (NIS) atau sebagian nama siswa pada kotak pencarian di sisi kiri atas. Klik pada baris nama siswa yang muncul. Data identitas siswa, kelas, dan status kelayakan pos biayanya akan langsung dimuat secara otomatis.'
        },
        {
          num: '02',
          title: 'Pilih Tagihan yang Akan Dibayar',
          desc: 'Sistem menampilkan dua kelompok tagihan: (1) SPP Bulanan (Juli s/d Juni), centang bulan yang ingin dilunasi; (2) Pos Bebas/Paket (seperti DSP, PKL, Kurikulum, Sarpras). Pada Pos Bebas, Anda bisa memasukkan nominal angsuran/cicilan bebas sesuai kesanggupan wali murid atau melunasi penuh.'
        },
        {
          num: '03',
          title: 'Tentukan Metode Pembayaran & Catatan',
          desc: 'Pilih metode pembayaran: Tunai di Loket, Transfer Bank (BRI, dll), atau QRIS. Anda juga dapat menambahkan catatan khusus bila diperlukan (misal: "Titipan Wali Siswa A.n Bapak Budi").'
        },
        {
          num: '04',
          title: 'Simpan Pembayaran & Terbitkan Kwitansi',
          desc: 'Periksa kembali ringkasan total pembayaran di sisi kanan. Klik tombol hijau "Simpan Transaksi & Cetak Kwitansi". Sistem akan menerbitkan Nomor Kwitansi Resmi berurutan (contoh: KW-20260928-0001) yang tidak akan tertukar.'
        },
        {
          num: '05',
          title: 'Cetak Fisik & Kirim Kwitansi via WhatsApp',
          desc: 'Setelah pembayaran disimpan, jendela pratinjau kwitansi muncul otomatis. Anda dapat langsung mengklik tombol "Cetak Kwitansi" (mendukung printer Thermal POS maupun printer A4/Folio). Tersedia juga tombol "Kirim via WhatsApp" yang otomatis membuka aplikasi WhatsApp dengan pesan rincian pembayaran terformat rapi.'
        }
      ],
      tips: 'Untuk siswa kelas XII, tagihan khusus seperti PKL Kelas XI atau Kurikulum Kelas X tidak akan muncul karena sistem otomatis memfilter pos sesuai tingkatan kelas siswa!'
    },
    {
      id: 'alur-dashboard',
      category: 'dashboard',
      badge: 'Supervisi & Analisis',
      title: 'Panduan Menu Dashboard Finansial & Monitoring Kas',
      description: 'Memantau arus kas masuk, grafik tren harian, persentase realisasi target, dan live audit transaksi.',
      features: [
        { name: '6 Kartu Statistik Finansial Utama (KPI)', desc: 'Penerimaan Hari Ini, Bulan Ini, Saldo Kasir, Saldo Bank, Total Kwitansi, Total Siswa.' },
        { name: 'Diagram Visual Pendapatan & Komposisi Pos', desc: 'Grafik batang perbandingan perolehan kas antar pos biaya sekolah.' },
        { name: 'Live Audit 15 Transaksi Masuk Terkini', desc: 'Memantau transaksi yang baru saja diproses loket secara langsung.' },
        { name: 'Sinkronisasi Data Real-Time', desc: 'Pembaruan instan langsung dari server spreadsheet tanpa reload halaman.' }
      ],
      steps: [
        {
          num: '01',
          title: 'Membaca Kartu Indikator Finansial Utama (KPI)',
          desc: 'Di bagian atas dashboard terdapat 6 kartu statistik utama: (1) Penerimaan Hari Ini, (2) Penerimaan Bulan Ini, (3) Total Pembayaran Tunai (Cash) untuk fisik kasir/brankas, (4) Total Pembayaran Non-Tunai / Transfer untuk rekening bank/QRIS, (5) Total Kwitansi Terbit, dan (6) Jumlah Siswa Terdaftar di database.'
        },
        {
          num: '02',
          title: 'Menganalisis Grafik Penerimaan & Komposisi Pos',
          desc: 'Lihat diagram batang untuk tren penerimaan harian/mingguan dan diagram komposisi per pos biaya (misal proporsi SPP, DSP, PKL) guna mengevaluasi pos mana yang realisasinya paling tinggi atau perlu didorong.'
        },
        {
          num: '03',
          title: 'Tabel Monitoring Tunggakan per Kelas',
          desc: 'Gunakan filter kelas (contoh: X PPLG 1, XI AKL, XII OTKP) untuk menyaring siswa yang memiliki sisa tagihan. Sistem mengurutkan siswa dari tunggakan terbesar ke terkecil.'
        },
        {
          num: '04',
          title: 'Kirim Pesan Pengingat Tunggakan via WhatsApp',
          desc: 'Klik tombol ikon WhatsApp di sebelah baris siswa yang menunggak. Sistem akan membuka modal konfirmasi beserta draf pesan resmi penagihan yang memuat rincian sisa tagihan per pos, batas waktu, dan nomor rekening sekolah. Klik "Kirim via WhatsApp" untuk langsung menyapa wali murid.'
        }
      ],
      tips: 'Kepala Sekolah dapat menggunakan menu ini saat rapat evaluasi bulanan untuk melihat efektivitas penyerapan SPP dan penerimaan sekolah.'
    },
    {
      id: 'alur-bukukas-undo',
      category: 'bukuKas',
      badge: 'Audit & Akuntansi',
      title: 'Panduan Rekapitulasi Buku Kas & Pembatalan Transaksi (Undo)',
      description: 'Cara memeriksa mutasi kas masuk, mencetak rekapitulasi bertandatangan, dan membatalkan transaksi salah input.',
      features: [
        { name: 'Filter Tanggal & Pos Biaya', desc: 'Menyaring pembukuan kas harian, mingguan, atau bulanan dengan presisi.' },
        { name: 'Rekapitulasi Kas Bersih vs Mutasi Bank', desc: 'Memisahkan uang tunai kasir, setoran bank, dan nilai transaksi batal.' },
        { name: 'Tabel Jurnal Mutasi Format Bersih', desc: 'Kolom rapi menampilkan kwitansi, tanggal/jam bersih, siswa, pos biaya, dan nominal.' },
        { name: 'Aksi Undo Transaksi Berotorisasi PIN', desc: 'Koreksi transaksi salah input dengan pengamanan PIN Kasir / Kepsek.' },
        { name: 'Pemulihan Saldo Tunggakan Siswa 100% Riil', desc: 'Otomatis mengembalikan status tunggakan siswa seketika saat kwitansi dibatalkan.' },
        { name: 'Cetak Laporan Rekapitulasi Kas Resmi', desc: 'Format cetak resmi lengkap dengan Kop Surat Sekolah dan lembar tanda tangan.' }
      ],
      steps: [
        {
          num: '01',
          title: 'Menyaring Laporan berdasarkan Tanggal & Pos',
          desc: 'Buka menu "Buku Kas & Rekap". Gunakan kolom filter rentang tanggal (Tanggal Mulai s/d Tanggal Selesai) serta filter Pos Biaya untuk menyaring data kas harian, mingguan, atau bulanan.'
        },
        {
          num: '02',
          title: 'Mengevaluasi Total Penerimaan Riil',
          desc: 'Sistem membedakan total penerimaan menjadi: Penerimaan Tunai Kasir, Penerimaan Transfer/QRIS, serta Transaksi Dibatalkan (Void / Reversal). Ini memastikan jumlah uang fisik di loket cocok persis dengan pembukuan sistem.'
        },
        {
          num: '03',
          title: 'Mencetak Lembar Rekapitulasi Kas (Printable)',
          desc: 'Klik tombol "Cetak Laporan Rekap" di kanan atas. Sistem otomatis menyiapkan format cetak resmi lengkap dengan Kop Sekolah, tabel transaksi, dan lembar tanda tangan Kepala Sekolah serta Bendahara Keuangan.'
        },
        {
          num: '04',
          title: 'Melakukan Pembatalan Transaksi (Aksi Undo)',
          desc: 'Jika kasir salah memasukkan nominal atau wali murid membatalkan transaksi pada hari yang sama, cari nomor kwitansi tersebut lalu klik tombol merah "Undo". Masukkan PIN Otorisasi Anda (Kasir atau Kepsek) dan ketik alasan pembatalan (misal: "Salah pilih pos biaya").'
        },
        {
          num: '05',
          title: 'Pemulihan Saldo Tunggakan Secara Riil',
          desc: 'Setelah dikonfirmasi, status kwitansi berubah menjadi "Batal" (nominal dicoret). Saldo kas fisik berkurang sesuai nominal, dan saldo tunggakan siswa tersebut seketika pulih 100% riil (bulan SPP kembali belum bayar atau sisa cicilan bertambah kembali).'
        }
      ],
      tips: 'Setiap aksi Undo dicatat secara permanen di Audit Log lengkap dengan timestamp, PIN otorisator, nomor kwitansi, dan alasannya sehingga tidak ada transaksi yang bisa dimanipulasi tanpa jejak!'
    },
    {
      id: 'alur-bukusiswa',
      category: 'bukuSiswa',
      badge: 'Kartu Keuangan Siswa',
      title: 'Panduan Buku Bayar Siswa & Cetak Kartu Pembayaran',
      description: 'Melihat histori lengkap setoran seorang siswa dari awal masuk hingga lulus dan mencetak kartu SPP.',
      features: [
        { name: 'Pencarian & Profil Lengkap Siswa', desc: 'Identitas lengkap siswa, NIS, NISN, rombel, nomor WA wali, dan alamat.' },
        { name: 'Kotak Akumulasi Kewajiban', desc: 'Ringkasan total beban sekolah, total sudah disetor, dan sisa tunggakan.' },
        { name: 'Matriks Status Seluruh Pos Biaya', desc: 'Rincian target, terbayar, sisa, dan badge status LUNAS per pos.' },
        { name: 'Riwayat Seluruh Setoran Siswa', desc: 'Daftar kronologis seluruh kwitansi yang pernah diterbitkan untuk siswa tersebut.' },
        { name: 'Cetak Kartu Pembayaran Siswa A4 Resmi', desc: 'Kartu SPP & Cicilan resmi bertanda tangan bendahara untuk syarat ujian/rapor.' },
        { name: 'Kirim Surat Tagihan via WhatsApp Resmi', desc: 'Pesan rincian sisa tagihan lengkap dengan nomor rekening resmi Bank BRI sekolah.' }
      ],
      steps: [
        {
          num: '01',
          title: 'Mencari Siswa',
          desc: 'Di menu "Buku Siswa", ketik nama siswa atau NIS. Anda akan melihat kartu rangkuman total tagihan, total yang sudah dibayar, dan sisa tunggakan siswa tersebut.'
        },
        {
          num: '02',
          title: 'Mengecek Kartu Kendali SPP 12 Bulan',
          desc: 'Terdapat grid 12 kotak bulan SPP (Juli s/d Juni). Kotak hijau menandakan bulan tersebut LUNAS lengkap dengan nomor kwitansi dan tanggal setorannya. Kotak abu-abu menandakan belum dibayar.'
        },
        {
          num: '03',
          title: 'Mengecek Riwayat Cicilan Pos Bebas',
          desc: 'Pada bagian bawah, tabel merincikan pos biaya non-SPP (DSP, PKL, dll) yang menunjukkan target biaya, total yang telah disetor, dan sisa kewajiban.'
        },
        {
          num: '04',
          title: 'Cetak Kartu Keuangan Siswa',
          desc: 'Klik tombol "Cetak Kartu Pembayaran". Format kartu SPP sekolah siap cetak akan tampil, siap dibagikan ke siswa atau wali murid saat pembagian rapor.'
        }
      ],
      tips: 'Anda juga dapat mengirimkan seluruh rangkuman kartu pembayaran siswa ke WhatsApp wali murid hanya dengan satu klik!'
    },
    {
      id: 'alur-pengaturan-pin',
      category: 'pengaturan',
      badge: 'Konfigurasi & Keamanan',
      title: 'Panduan Pengaturan Identitas Sekolah & Cara Mengganti PIN',
      description: 'Mengubah nama sekolah, alamat, pejabat berwenang, dan mengganti PIN keamanan Kasir maupun Kepala Sekolah.',
      features: [
        { name: 'Identitas Lembaga Sekolah', desc: 'Nama sekolah, alamat lengkap, telepon, nama Kepala Sekolah dan Bendahara.' },
        { name: 'Konfigurasi Rekening Bank Resmi', desc: 'Nama bank, nomor rekening BRI, dan atas nama rekening sekolah.' },
        { name: 'Manajemen Keamanan PIN Masuk', desc: 'Ubah PIN Kasir (default 1234) dan PIN Kepala Sekolah (default 8899).' },
        { name: 'Pengelolaan Master Pos Biaya', desc: 'Atur pos bulanan vs bebas cicilan, target tingkat kelas, dan nominal default.' },
        { name: 'Pencadangan & Pemulihan Database', desc: 'Ekspor dan impor salinan cadangan data dalam format file JSON lokal.' },
        { name: 'Audit Log Rekam Jejak Digital', desc: 'Mencatat rekam jejak waktu dan nama petugas untuk setiap aktivitas sensitif.' }
      ],
      steps: [
        {
          num: '01',
          title: 'Buka Menu Pengaturan & Backup',
          desc: 'Klik tab "Pengaturan & Backup (⚙️)" di navbar atas. Menu ini dapat diakses oleh Kasir dan Kepala Sekolah.'
        },
        {
          num: '02',
          title: 'Mengubah Identitas Sekolah & Pejabat',
          desc: 'Perbarui Nama Sekolah (SMKS PGRI 1 Kota Sukabumi), Alamat Sekolah, Nomor Telepon, Nama Kepala Sekolah, dan Nama Bendahara. Data ini otomatis digunakan di seluruh kop kwitansi dan laporan cetak.'
        },
        {
          num: '03',
          title: 'Mengganti PIN Otorisasi Masuk',
          desc: 'Di bagian "Konfigurasi PIN Otorisasi Masuk", ubah kolom "PIN Kasir" (untuk loket transaksi) dan "PIN Kepala Sekolah" (untuk supervisi). Masukkan 4–6 digit angka rahasia baru yang aman.'
        },
        {
          num: '04',
          title: 'Simpan Perubahan',
          desc: 'Klik tombol hijau "Simpan Seluruh Pengaturan" di bagian bawah halaman. PIN baru akan langsung aktif dan berlaku untuk sesi login berikutnya.'
        },
        {
          num: '05',
          title: 'Melakukan Backup & Restore Database',
          desc: 'Di tab "Backup & Cadangan", Anda dapat mengunduh salinan cadangan data (file JSON) secara berkala ke komputer Anda untuk mencegah kehilangan data apabila ganti perangkat.'
        }
      ],
      tips: 'Jangan pernah membagikan PIN Kepala Sekolah kepada pihak yang tidak berwenang karena PIN ini memiliki hak otoritas tertinggi!'
    },
    {
      id: 'alur-gas-cloud',
      category: 'gas',
      badge: 'Database Cloud Google Sheets',
      title: 'Panduan Integrasi Google Sheets & Deploy Google Apps Script (GAS)',
      description: 'Menjadikan Google Spreadsheet gratis sebagai database cloud online tanpa biaya server bulanan.',
      steps: [
        {
          num: '01',
          title: 'Siapkan Google Spreadsheet Baru',
          desc: 'Buka Google Drive Anda, buat Google Spreadsheet baru dan beri nama misalnya "DATABASE KEUANGAN SMKS PGRI 1 SUKABUMI".'
        },
        {
          num: '02',
          title: 'Salin Kode dari Tab "Kode GAS (Script)"',
          desc: 'Di aplikasi SiKeSe, klik tab "Kode GAS (Script)". Klik tombol "Salin Kode.gs". Buka menu "Ekstensi" > "Apps Script" pada spreadsheet Anda, lalu tempel kode tersebut ke editor Apps Script.'
        },
        {
          num: '03',
          title: 'Jalankan Fungsi Setup Database',
          desc: 'Di editor Apps Script, pilih fungsi "setupInitialDatabase" lalu klik "Jalankan" (Run). Berikan izin akun Google Anda. Script akan otomatis membuat seluruh sheet yang dibutuhkan (SISWA, POS_BIAYA, TRANSAKSI, PENGATURAN, AUDIT_LOG).'
        },
        {
          num: '04',
          title: 'Terapkan sebagai Aplikasi Web (Deploy)',
          desc: 'Klik tombol biru "Terapkan (Deploy)" > "Penerapan Baru (New Deployment)". Pilih jenis "Aplikasi Web". Atur "Jalankan sebagai: Saya" dan "Siapa yang memiliki akses: Siapa saja (Anyone)". Klik Terapkan dan salin URL Web App yang dihasilkan.'
        },
        {
          num: '05',
          title: 'Hubungkan URL Web App ke SiKeSe',
          desc: 'Kembali ke aplikasi SiKeSe, masuk ke tab "Pengaturan & Backup", masukkan URL Web App tersebut ke kolom "URL Google Apps Script", lalu klik Simpan. Sekarang data aplikasi tersinkronisasi langsung ke Google Sheets Anda secara online!'
        }
      ],
      tips: 'Dengan integrasi ini, data Anda aman tersimpan di Google Cloud sekolah, gratis selamanya tanpa perlu sewa hosting atau domain!'
    }
  ];

  const faqs = [
    {
      q: 'Bagaimana jika Kasir lupa PIN Otorisasi?',
      a: 'Kepala Sekolah dapat masuk menggunakan PIN Kepala Sekolah lalu membuka tab "Pengaturan & Backup" untuk melihat atau mengganti PIN Kasir. Jika kedua PIN terlupa saat menggunakan Google Sheets, buka sheet "PENGATURAN" di spreadsheet Anda dan lihat baris PIN_KASIR atau PIN_KEPSEK pada kolom B.'
    },
    {
      q: 'Apakah uang di Buku Kas berkurang saat saya melakukan Undo Transaksi?',
      a: 'Ya, sistem otomatis mencoret transaksi yang dibatalkan dan mengeluarkannya dari total pendapatan riil loket. Pada rekap buku kas, transaksi tersebut dimasukkan ke kategori khusus "Transaksi Dibatalkan (Void)" sehingga selisih kas fisik di tangan kasir tetap seimbang.'
    },
    {
      q: 'Apakah bukti kwitansi bisa dicetak ulang setelah transaksi disimpan?',
      a: 'Bisa! Anda dapat membuka menu "Buku Kas & Rekap", mencari nomor kwitansi yang dimaksud, atau melalui menu "Buku Siswa" untuk melihat riwayat pembayaran siswa lalu mencetak ulang kwitansi tersebut kapan saja.'
    },
    {
      q: 'Bagaimana cara menambahkan siswa baru atau menaikkan kelas siswa?',
      a: 'Masuk ke tab "Pengaturan & Backup", gulir ke bagian "Master Data Siswa". Anda dapat menambah siswa satu per satu dengan tombol "Tambah Siswa Baru", atau mengedit kelas siswa yang bersangkutan secara langsung.'
    },
    {
      q: 'Apakah aplikasi SiKeSe bisa digunakan di ponsel / smartphone kasir?',
      a: 'Tentu saja! SiKeSe dirancang sepenuhnya responsif (mobile-friendly). Kasir dapat melakukan transaksi, mengecek tunggakan, maupun mengirim WhatsApp kwitansi langsung melalui browser smartphone Android atau iPhone.'
    }
  ];

  const filteredTutorials = tutorials.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.steps.some(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
          <SmkPgriLogo size={220} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Pusat Edukasi & Dokumentasi Resmi
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Panduan & Tutorial Penggunaan SiKeSe
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Selamat datang di panduan komprehensif Sistem Keuangan Sekolah SMKS PGRI 1 Kota Sukabumi.
            Pelajari cara mengoperasikan seluruh modul, loket transaksi kasir, buku kas, pembatalan kwitansi,
            hingga sinkronisasi Google Spreadsheet.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-5 relative max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik panduan (misal: 'Undo transaksi', 'Ganti PIN', 'Kwitansi', 'SPP')..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 px-2 py-0.5 rounded cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY PILLS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN TUTORIAL LIST */}
      <div className="space-y-6">
        {filteredTutorials.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Topik Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tidak ada panduan yang cocok dengan kata kunci "{searchQuery}". Silakan coba kata kunci lain.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
            >
              Tampilkan Semua Panduan
            </button>
          </div>
        ) : (
          filteredTutorials.map((tut) => (
            <div
              key={tut.id}
              id={tut.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {tut.badge}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {tut.steps.length} Langkah Prosedur
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {tut.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {tut.description}
                </p>
              </div>

              {/* Content Area */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Rincian Fitur-Fitur Utama */}
                {tut.features && tut.features.length > 0 && (
                  <div className="space-y-2.5 pb-4 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Rincian Fitur-Fitur di Menu Ini:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {tut.features.map((feat, fIdx) => (
                        <div key={fIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5 hover:border-slate-200 transition-colors">
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>{feat.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed pl-3">
                            {feat.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SOP Steps */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Prosedur Operasional Standar (SOP Langkah-Langkah):
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {tut.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
                      >
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                          {st.num}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            {st.title}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro Tip Callout */}
                {tut.tips && (
                  <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block text-amber-950">Tips Praktis & Efisiensi:</strong>
                      <span className="text-amber-800 leading-relaxed">{tut.tips}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAQ & TROUBLESHOOTING SECTION */}
      {(activeCategory === 'all' || activeCategory === 'faq') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tanya Jawab & Kendala Operasional (FAQ)
              </h3>
              <p className="text-xs text-slate-500">
                Solusi cepat untuk pertanyaan teknis dan kendala yang umum terjadi di loket
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, fIdx) => {
              const isOpen = expandedFaq === fIdx;
              return (
                <div
                  key={fIdx}
                  className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : fIdx)}
                    className="w-full p-4 text-left font-semibold text-xs text-slate-800 hover:text-emerald-700 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FOOTER INFO CARD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 hidden sm:block">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Butuh Bantuan Lebih Lanjut?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Hubungi Administrator Tim IT & Pengelola Database SMKS PGRI 1 Kota Sukabumi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Kembali ke Atas
          </button>
        </div>
      </div>

    </div>
  );
};
