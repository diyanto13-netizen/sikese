import { Student, FeeItem, Settings, Transaction } from '../types';

export const INITIAL_SETTINGS: Settings = {
  PIN_KASIR: '1234',
  PIN_KEPSEK: '8899',
  NAMA_SEKOLAH: 'SMKS PGRI 1 KOTA SUKABUMI',
  ALAMAT_SEKOLAH: 'Jl. Pelabuhan II Cipoho Indah, Cikondang, Citamiang, Kota Sukabumi, Jawa Barat',
  NO_TELP_SEKOLAH: '(0266) 221-820',
  TAHUN_AJARAN: '2026/2027',
  NAMA_KEPSEK: 'Drs. H. Mulyono, M.Pd.',
  NAMA_BENDAHARA: 'Siti Aminah, S.E.'
};

// Data Siswa Riil Kosong (Hanya data riil dari database yang diinputkan pengguna)
export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_POS_BIAYA: FeeItem[] = [
  {
    idPos: 'POS-SPP',
    namaPos: 'SPP (Bulanan)',
    tipe: 'BULANAN',
    sistemPembayaran: 'Bulanan',
    kategori: 'SPP',
    kelasTarget: 'Semua',
    nominalDefault: 300000,
    keterangan: 'Iuran SPP wajib per bulan (Tarif Rp 300.000/bulan)'
  },
  {
    idPos: 'POS-DSP',
    namaPos: 'DSP (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'DSP',
    kelasTarget: 'Semua',
    nominalDefault: 2000000,
    keterangan: 'Dana Sumbangan Pendidikan (Dapat dicicil, Tarif Rp 2.000.000)'
  },
  {
    idPos: 'POS-PKL',
    namaPos: 'Dana PKL (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'PKL',
    kelasTarget: 'XI',
    nominalDefault: 650000,
    keterangan: 'Dana Praktik Kerja Lapangan kelas XI (Tarif Rp 650.000)'
  },
  {
    idPos: 'POS-KUR-11',
    namaPos: 'Dana Kegiatan Kurikulum kelas XI (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Kurikulum',
    kelasTarget: 'XI',
    nominalDefault: 300000,
    keterangan: 'Kegiatan kurikulum & asesmen kelas XI (Tarif Rp 300.000)'
  },
  {
    idPos: 'POS-KUR-12',
    namaPos: 'Dana Kegiatan Kurikulum kelas XII (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Kurikulum',
    kelasTarget: 'XII',
    nominalDefault: 1100000,
    keterangan: 'Ujian kelulusan, sertifikasi & wisuda kelas XII (Tarif Rp 1.100.000)'
  },
  {
    idPos: 'POS-KESIS-11',
    namaPos: 'Dana Kegiatan Kesiswaan kelas XI (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Kesiswaan',
    kelasTarget: 'XI',
    nominalDefault: 150000,
    keterangan: 'Kegiatan OSIS, ekstrakurikuler & kepramukaan kelas XI (Tarif Rp 150.000)'
  },
  {
    idPos: 'POS-KESIS-12',
    namaPos: 'Dana Kegiatan Kesiswaan kelas XII (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Kesiswaan',
    kelasTarget: 'XII',
    nominalDefault: 150000,
    keterangan: 'Kegiatan kesiswaan & pelepasan siswa kelas XII (Tarif Rp 150.000)'
  },
  {
    idPos: 'POS-SARPRAS-11',
    namaPos: 'Dana Kegiatan Sarpras kelas XI (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Sarpras',
    kelasTarget: 'XI',
    nominalDefault: 50000,
    keterangan: 'Pemeliharaan sarana & prasarana belajar kelas XI (Tarif Rp 50.000)'
  },
  {
    idPos: 'POS-SARPRAS-12',
    namaPos: 'Dana Kegiatan Sarpras kelas XII (Cicilan)',
    tipe: 'CICILAN',
    sistemPembayaran: 'Cicilan',
    kategori: 'Sarpras',
    kelasTarget: 'XII',
    nominalDefault: 50000,
    keterangan: 'Pemeliharaan sarana & prasarana belajar kelas XII (Tarif Rp 50.000)'
  }
];

export const BULAN_SPP_LIST = [
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
];

// Data Riwayat Transaksi Kosong (Hanya transaksi riil loket)
export const INITIAL_TRANSACTIONS: Transaction[] = [];
