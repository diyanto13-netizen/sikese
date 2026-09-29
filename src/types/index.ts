export type UserRole = 'KASIR' | 'KEPSEK';

export interface UserSession {
  role: UserRole;
  nama: string;
  permissions: {
    canTransaction: boolean;
    canCancel: boolean;
    canViewReport: boolean;
    canViewChart: boolean;
    canManageSettings: boolean;
  };
}

export interface Student {
  nis: string;
  nisn: string;
  nama: string;
  kelas: string;
  jurusan: string;
  noHpWali: string;
  status: 'Aktif' | 'Lulus' | 'Pindah';
  alamat: string;
}

export type FeePaymentSystem = 'Bulanan' | 'Cicilan';
export type FeeType = 'BULANAN' | 'CICILAN' | 'SPP_BULANAN' | 'NON_SPP_BEBAS' | 'NON_SPP_PAKET';

export interface FeeItem {
  idPos: string;
  namaPos: string;
  tipe: FeeType;
  sistemPembayaran?: FeePaymentSystem; // 'Bulanan' | 'Cicilan'
  kategori: 'SPP' | 'DSP' | 'PKL' | 'Kurikulum' | 'Kesiswaan' | 'Sarpras' | 'Kegiatan';
  kelasTarget: string; // 'Semua', 'X', 'XI', 'XII'
  nominalDefault: number;
  keterangan: string;
}

export interface Transaction {
  noKwitansi: string;
  timestamp: string;
  tanggal: string; // YYYY-MM-DD
  jam: string;     // HH:mm
  nis: string;
  nama: string;
  kelas: string;
  idPos: string;
  namaPos: string;
  bulan: string;   // e.g. 'Juli', 'Agustus', or '-'
  nominal: number;
  metode: 'Tunai' | 'Transfer';
  kasir: string;
  status: 'Sukses' | 'Batal';
  keterangan?: string;
}

export interface CartItem {
  idPos: string;
  namaPos: string;
  bulan?: string;
  nominal: number;
}

export interface Settings {
  PIN_KASIR: string;
  PIN_KEPSEK: string;
  NAMA_SEKOLAH: string;
  ALAMAT_SEKOLAH: string;
  NO_TELP_SEKOLAH: string;
  TAHUN_AJARAN: string;
  NAMA_KEPSEK: string;
  NAMA_BENDAHARA: string;
  LOGO_URL?: string;
}

export interface SppMonthStatus {
  bulan: string;
  isLunas: boolean;
  noKwitansi?: string;
  tanggalBayar?: string;
  nominal: number;
}

export interface PosPaymentStatus {
  idPos: string;
  namaPos: string;
  tipe: FeeType;
  kategori: string;
  nominalPerBulan?: number;
  totalTarget: number;
  totalBayar: number;
  sisaTagihan: number;
  isLunas?: boolean;
  bulanLunasCount?: number;
  sppMonths?: SppMonthStatus[];
}

export interface StudentLedger {
  siswa: Student;
  posStatus: PosPaymentStatus[];
  totalSemuaTagihan: number;
  totalSudahDibayar: number;
  sisaSemuaTagihan: number;
  history: Transaction[];
}

export interface BackupRecord {
  id: string;
  fileName: string;
  timestamp: string;
  size: string;
  totalTransactions: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  aksi: string;
  user: string;
  detail: string;
}
