import {
  Student,
  FeeItem,
  Transaction,
  Settings,
  UserSession,
  StudentLedger,
  CartItem,
  BackupRecord,
  AuditLog
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_POS_BIAYA,
  INITIAL_TRANSACTIONS,
  BULAN_SPP_LIST
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'sikese_settings',
  STUDENTS: 'sikese_students',
  POS_BIAYA: 'sikese_pos_biaya',
  TRANSACTIONS: 'sikese_transactions',
  BACKUPS: 'sikese_backups',
  AUDIT_LOGS: 'sikese_audit_logs',
  GAS_URL: 'sikese_gas_url'
};

export function getGradeLevel(kelas: string): string {
  if (!kelas) return '';
  const k = kelas.trim().toUpperCase();
  if (/\bXII\b|XII\s|^XII|12/i.test(k)) return 'XII';
  if (/\bXI\b|XI\s|^XI|11/i.test(k)) return 'XI';
  if (/\bX\b|X\s|^X|10/i.test(k)) return 'X';
  return '';
}

export function isPosEligibleForClass(target: string, kelas: string): boolean {
  if (!target || target === 'Semua') return true;
  const studentGrade = getGradeLevel(kelas);
  const targetGrade = target.trim().toUpperCase();
  return studentGrade === targetGrade;
}

export class FinanceEngine {
  // Helper LocalStorage
  private static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static set<T>(key: string, val: T): void {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Getters
  public static purgeSampleDataIfPresent(): void {
    try {
      const storedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (storedStudents) {
        const parsed = JSON.parse(storedStudents);
        if (Array.isArray(parsed) && parsed.some((s: any) => s.nis === '1001' || s.nis === '1002' || s.nama === 'Achmad Fauzan')) {
          localStorage.removeItem(STORAGE_KEYS.STUDENTS);
        }
      }

      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions);
        if (Array.isArray(parsed) && parsed.some((t: any) => t.noKwitansi && (t.noKwitansi.includes('20240715') || t.nis === '1001'))) {
          localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        }
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (parsed.NAMA_SEKOLAH && parsed.NAMA_SEKOLAH.includes('MADRASAH ALIYAH NEGERI TELADAN')) {
          parsed.NAMA_SEKOLAH = 'SMKS PGRI 1 KOTA SUKABUMI';
          parsed.ALAMAT_SEKOLAH = 'Jl. Pelabuhan II Cipoho Indah, Cikondang, Citamiang, Kota Sukabumi, Jawa Barat';
          parsed.NO_TELP_SEKOLAH = '(0266) 221-820';
          parsed.TAHUN_AJARAN = '2026/2027';
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error('Error purging sample data:', e);
    }
  }

  public static clearAllTransactions(): void {
    this.set(STORAGE_KEYS.TRANSACTIONS, []);
    this.addAuditLog('TRANSAKSI_CLEAR', 'Admin', 'Mengosongkan seluruh riwayat data transaksi');
  }

  public static clearAllStudents(): void {
    this.set(STORAGE_KEYS.STUDENTS, []);
    this.addAuditLog('SISWA_CLEAR', 'Admin', 'Mengosongkan seluruh data master siswa');
  }

  public static getSettings(): Settings {
    return this.get<Settings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public static updateSettings(newSettings: Partial<Settings>): Settings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    this.set(STORAGE_KEYS.SETTINGS, updated);
    this.addAuditLog('PENGATURAN', 'Admin', 'Memperbarui pengaturan sistem');
    return updated;
  }

  public static getGasUrl(): string {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  }

  public static setGasUrl(url: string): void {
    localStorage.setItem(STORAGE_KEYS.GAS_URL, url.trim());
  }

  public static getStudents(): Student[] {
    return this.get<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  public static addStudent(student: Student): Student[] {
    const students = this.getStudents();
    if (students.some((s) => s.nis.trim() === student.nis.trim())) {
      throw new Error(`Siswa dengan NIS ${student.nis} sudah terdaftar!`);
    }
    students.push(student);
    this.set(STORAGE_KEYS.STUDENTS, students);
    this.addAuditLog('SISWA_TAMBAH', 'Admin', `Menambahkan siswa baru: ${student.nama} (${student.nis})`);
    return students;
  }

  public static updateStudent(nis: string, updatedFields: Partial<Student>): Student[] {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.nis === nis);
    if (idx === -1) {
      throw new Error(`Siswa dengan NIS ${nis} tidak ditemukan!`);
    }
    students[idx] = { ...students[idx], ...updatedFields };
    this.set(STORAGE_KEYS.STUDENTS, students);
    this.addAuditLog('SISWA_UPDATE', 'Admin', `Memperbarui data siswa: ${students[idx].nama}`);
    return students;
  }

  public static deleteStudent(nis: string): Student[] {
    const students = this.getStudents();
    const toDelete = students.find((s) => s.nis === nis);
    const filtered = students.filter((s) => s.nis !== nis);
    this.set(STORAGE_KEYS.STUDENTS, filtered);
    this.addAuditLog('SISWA_HAPUS', 'Admin', `Menghapus siswa: ${toDelete?.nama || nis}`);
    return filtered;
  }

  public static importStudents(newStudents: Student[]): { added: number; skipped: number } {
    const existing = this.getStudents();
    const existingNisMap = new Set(existing.map((s) => s.nis.trim()));
    let added = 0;
    let skipped = 0;

    for (const s of newStudents) {
      if (!s.nis || !s.nama || existingNisMap.has(s.nis.trim())) {
        skipped++;
      } else {
        existing.push(s);
        existingNisMap.add(s.nis.trim());
        added++;
      }
    }

    this.set(STORAGE_KEYS.STUDENTS, existing);
    this.addAuditLog('SISWA_IMPOR', 'Admin', `Impor massal: ${added} siswa berhasil, ${skipped} dilewati`);
    return { added, skipped };
  }

  public static getPosBiaya(): FeeItem[] {
    const list = this.get<FeeItem[]>(STORAGE_KEYS.POS_BIAYA, INITIAL_POS_BIAYA);
    // Auto-migrate if old pos list without POS-KUR-11 is stored
    if (!list || list.length === 0 || !list.some((p) => p.idPos === 'POS-KUR-11')) {
      this.set(STORAGE_KEYS.POS_BIAYA, INITIAL_POS_BIAYA);
      return INITIAL_POS_BIAYA;
    }
    return list;
  }

  public static getTransactions(): Transaction[] {
    return this.get<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  public static getBackups(): BackupRecord[] {
    return this.get<BackupRecord[]>(STORAGE_KEYS.BACKUPS, []);
  }

  public static getAuditLogs(): AuditLog[] {
    const now = new Date();
    const ts = now.toISOString().replace('T', ' ').substring(0, 19);
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, [
      {
        id: 'log-init',
        timestamp: ts,
        aksi: 'INIT_SYSTEM',
        user: 'System',
        detail: 'Database Keuangan SiKeSe siap beroperasi dengan data riil'
      }
    ]);
  }

  public static addAuditLog(aksi: string, user: string, detail: string): void {
    const logs = this.getAuditLogs();
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    logs.unshift({
      id: 'log-' + Date.now(),
      timestamp,
      aksi,
      user,
      detail
    });
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 50));
  }

  // Autentikasi PIN
  public static loginWithPin(pin: string): UserSession {
    const settings = this.getSettings();
    const cleanPin = pin.trim();

    if (cleanPin === settings.PIN_KASIR) {
      this.addAuditLog('LOGIN', 'Kasir Keuangan', 'Login berhasil sebagai Kasir');
      return {
        role: 'KASIR',
        nama: settings.NAMA_BENDAHARA || 'Kasir Keuangan',
        permissions: {
          canTransaction: true,
          canCancel: true,
          canViewReport: true,
          canViewChart: true,
          canManageSettings: false
        }
      };
    } else if (cleanPin === settings.PIN_KEPSEK) {
      this.addAuditLog('LOGIN', 'Kepala Sekolah', 'Login berhasil sebagai Kepala Sekolah');
      return {
        role: 'KEPSEK',
        nama: settings.NAMA_KEPSEK || 'Kepala Sekolah',
        permissions: {
          canTransaction: false, // Kepala sekolah fokus supervisi & audit
          canCancel: false,
          canViewReport: true,
          canViewChart: true,
          canManageSettings: true
        }
      };
    } else {
      this.addAuditLog('LOGIN_FAILED', 'Anonim', `Gagal login dengan PIN [${cleanPin}]`);
      throw new Error('PIN yang Anda masukkan salah!');
    }
  }

  // Pencarian Siswa
  public static searchStudent(query: string): Student[] {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const students = this.getStudents();
    return students.filter(
      (s) =>
        s.nis.toLowerCase().includes(q) ||
        s.nama.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q)
    );
  }

  // Dapatkan Buku Kas / Ledgers Siswa
  public static getStudentLedger(nis: string, sppYear: string = '2026'): StudentLedger {
    const students = this.getStudents();
    const student = students.find((s) => s.nis === nis);
    if (!student) {
      throw new Error(`Siswa dengan NIS ${nis} tidak ditemukan!`);
    }

    const transactions = this.getTransactions();
    const studentTransactions = transactions.filter((t) => t.nis === nis && t.status !== 'Batal');

    const paidPerPos: Record<string, number> = {};

    studentTransactions.forEach((item) => {
      paidPerPos[item.idPos] = (paidPerPos[item.idPos] || 0) + item.nominal;
    });

    const posList = this.getPosBiaya();
    const posStatus = posList
      .filter((p) => isPosEligibleForClass(p.kelasTarget, student.kelas))
      .map((p) => {
        const totalBayar = paidPerPos[p.idPos] || 0;
        if (p.tipe === 'SPP_BULANAN' || p.tipe === 'BULANAN') {
          const sppDetail = BULAN_SPP_LIST.map((bln) => {
            const blnLower = bln.toLowerCase();
            const info = studentTransactions.find((item) => {
              if (item.idPos !== 'POS-SPP' || !item.bulan || item.bulan === '-') return false;
              const b = item.bulan.trim().toLowerCase();
              if (b.includes(blnLower) && b.includes(sppYear)) {
                return true;
              }
              if (b === blnLower && item.tanggal && item.tanggal.startsWith(sppYear)) {
                return true;
              }
              return false;
            });

            return {
              bulan: bln,
              isLunas: !!info,
              noKwitansi: info?.noKwitansi,
              tanggalBayar: info?.tanggal,
              nominal: p.nominalDefault
            };
          });

          const lunasCount = sppDetail.filter((b) => b.isLunas).length;
          const totalTarget = p.nominalDefault * 12;
          const sisaTagihan = Math.max(0, totalTarget - (lunasCount * p.nominalDefault));

          return {
            idPos: p.idPos,
            namaPos: p.namaPos,
            tipe: p.tipe,
            kategori: p.kategori,
            nominalPerBulan: p.nominalDefault,
            totalTarget,
            totalBayar: lunasCount * p.nominalDefault,
            sisaTagihan,
            bulanLunasCount: lunasCount,
            sppMonths: sppDetail
          };
        } else {
          const sisa = Math.max(0, p.nominalDefault - totalBayar);
          return {
            idPos: p.idPos,
            namaPos: p.namaPos,
            tipe: p.tipe,
            kategori: p.kategori,
            totalTarget: p.nominalDefault,
            totalBayar,
            sisaTagihan: sisa,
            isLunas: sisa === 0
          };
        }
      });

    let totalSemuaTagihan = 0;
    let totalSudahDibayar = 0;
    posStatus.forEach((ps) => {
      totalSemuaTagihan += ps.totalTarget;
      totalSudahDibayar += ps.totalBayar;
    });

    return {
      siswa: student,
      posStatus,
      totalSemuaTagihan,
      totalSudahDibayar,
      sisaSemuaTagihan: Math.max(0, totalSemuaTagihan - totalSudahDibayar),
      history: [...studentTransactions].reverse()
    };
  }

  // Buat Nomor Kwitansi Unik Berurutan (KW-YYYYMMDD-XXXX)
  public static generateKwitansiNumber(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayPrefix = `KW-${yyyy}${mm}${dd}-`;

    const transactions = this.getTransactions();
    let maxSeq = 0;
    transactions.forEach((t) => {
      if (t.noKwitansi.startsWith(todayPrefix)) {
        const seqPart = parseInt(t.noKwitansi.replace(todayPrefix, ''), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `${todayPrefix}${String(nextSeq).padStart(4, '0')}`;
  }

  // Proses Transaksi Multi-Item Keranjang
  public static processBatchTransaction(payload: {
    nis: string;
    nama: string;
    kelas: string;
    noHpWali?: string;
    metode: 'Tunai' | 'Transfer';
    kasir: string;
    items: CartItem[];
    keterangan?: string;
  }): {
    success: boolean;
    noKwitansi: string;
    tanggal: string;
    jam: string;
    grandTotal: number;
    itemsCount: number;
    waText: string;
    waLink: string;
  } {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Keranjang pembayaran kosong!');
    }

    const ledger = this.getStudentLedger(payload.nis);
    const posMap = new Map(ledger.posStatus.map((p) => [p.idPos, p]));

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const tanggalStr = `${yyyy}-${mm}-${dd}`;
    const jamStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestampStr = `${tanggalStr} ${jamStr}:${String(now.getSeconds()).padStart(2, '0')}`;

    const noKwitansi = this.generateKwitansiNumber();
    let grandTotal = 0;
    const newTransactions: Transaction[] = [];

    payload.items.forEach((item) => {
      const posInfo = posMap.get(item.idPos);
      if (!posInfo) {
        throw new Error(`Pos biaya ${item.namaPos} tidak ditemukan untuk siswa ini.`);
      }

      if (posInfo.tipe === 'SPP_BULANAN' || posInfo.tipe === 'BULANAN') {
        if (!item.bulan) {
          throw new Error('Bulan SPP wajib dipilih!');
        }
        const allTrans = this.getTransactions();
        const itemBulanNorm = item.bulan.trim().toLowerCase();
        const alreadyPaid = allTrans.some((t) => {
          if (t.status === 'Batal' || t.nis !== payload.nis || t.idPos !== 'POS-SPP') return false;
          if (!t.bulan || t.bulan === '-') return false;
          return t.bulan.trim().toLowerCase() === itemBulanNorm;
        });
        if (alreadyPaid) {
          throw new Error(`SPP bulan ${item.bulan} sudah berstatus LUNAS sebelumnya!`);
        }
      } else {
        if (item.nominal > posInfo.sisaTagihan) {
          throw new Error(
            `Nominal Rp ${item.nominal.toLocaleString('id-ID')} untuk ${item.namaPos} melebihi sisa tagihan (Rp ${posInfo.sisaTagihan.toLocaleString('id-ID')}).`
          );
        }
      }

      grandTotal += item.nominal;

      newTransactions.push({
        noKwitansi,
        timestamp: timestampStr,
        tanggal: tanggalStr,
        jam: jamStr,
        nis: payload.nis,
        nama: payload.nama,
        kelas: payload.kelas,
        idPos: item.idPos,
        namaPos: item.namaPos,
        bulan: item.bulan || '-',
        nominal: item.nominal,
        metode: payload.metode,
        kasir: payload.kasir,
        status: 'Sukses',
        keterangan: payload.keterangan || 'Pembayaran kasir'
      });
    });

    const allTransactions = this.getTransactions();
    allTransactions.push(...newTransactions);
    this.set(STORAGE_KEYS.TRANSACTIONS, allTransactions);

    this.addAuditLog(
      'TRANSAKSI_MASUK',
      payload.kasir,
      `Kwitansi: ${noKwitansi} | NIS: ${payload.nis} (${payload.nama}) | Total: Rp ${grandTotal.toLocaleString('id-ID')}`
    );

    const settings = this.getSettings();
    const waText = this.buildWhatsAppReceiptText({
      sekolah: settings.NAMA_SEKOLAH,
      alamat: settings.ALAMAT_SEKOLAH,
      telp: settings.NO_TELP_SEKOLAH,
      noKwitansi,
      tanggal: `${tanggalStr} ${jamStr}`,
      nis: payload.nis,
      nama: payload.nama,
      kelas: payload.kelas,
      items: payload.items,
      grandTotal,
      metode: payload.metode,
      kasir: payload.kasir
    });

    const cleanPhone = this.cleanPhoneNumber(payload.noHpWali || '');
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}` : '';

    return {
      success: true,
      noKwitansi,
      tanggal: tanggalStr,
      jam: jamStr,
      grandTotal,
      itemsCount: newTransactions.length,
      waText,
      waLink
    };
  }

  // Pembatalan Transaksi (Undo) dengan validasi PIN
  public static cancelTransaction(
    noKwitansi: string,
    pin: string,
    alasan: string
  ): { success: boolean; message: string; rowsUpdated: number } {
    const settings = this.getSettings();
    const cleanPin = pin.trim();

    if (cleanPin !== settings.PIN_KASIR && cleanPin !== settings.PIN_KEPSEK) {
      throw new Error('PIN Otorisasi salah! Pembatalan transaksi ditolak.');
    }

    const transactions = this.getTransactions();
    let updatedCount = 0;
    let alreadyCancelled = false;

    transactions.forEach((t) => {
      if (t.noKwitansi === noKwitansi) {
        if (t.status === 'Batal') {
          alreadyCancelled = true;
        } else {
          t.status = 'Batal';
          t.keterangan = `Dibatalkan: ${alasan || 'Reversal kasir'}`;
          updatedCount++;
        }
      }
    });

    if (alreadyCancelled && updatedCount === 0) {
      throw new Error(`Kwitansi ${noKwitansi} sudah dibatalkan sebelumnya.`);
    }

    if (updatedCount === 0) {
      throw new Error(`Kwitansi ${noKwitansi} tidak ditemukan.`);
    }

    this.set(STORAGE_KEYS.TRANSACTIONS, transactions);

    this.addAuditLog(
      'BATAL_TRANSAKSI',
      'Otorisator PIN',
      `Kwitansi: ${noKwitansi} (${updatedCount} item). Alasan: ${alasan}`
    );

    return {
      success: true,
      message: `Kwitansi ${noKwitansi} berhasil dibatalkan. Saldo tunggakan telah dipulihkan.`,
      rowsUpdated: updatedCount
    };
  }

  // Rekapitulasi Laporan Keuangan
  public static getFinancialReport(
    startDate?: string,
    endDate?: string,
    idPos?: string
  ): {
    totalMasuk: number;
    totalTunai: number;
    totalTransfer: number;
    totalBatal: number;
    perCategory: Record<string, number>;
    transactions: Transaction[];
  } {
    const transactions = this.getTransactions();

    let totalMasuk = 0;
    let totalTunai = 0;
    let totalTransfer = 0;
    let totalBatal = 0;
    const perCategory: Record<string, number> = {};
    const filtered: Transaction[] = [];

    transactions.forEach((t) => {
      if (startDate && t.tanggal < startDate) return;
      if (endDate && t.tanggal > endDate) return;
      if (idPos && idPos !== 'SEMUA' && t.idPos !== idPos) return;

      if (t.status === 'Batal') {
        totalBatal += t.nominal;
      } else {
        totalMasuk += t.nominal;
        if (t.metode === 'Transfer') {
          totalTransfer += t.nominal;
        } else {
          totalTunai += t.nominal;
        }

        perCategory[t.namaPos] = (perCategory[t.namaPos] || 0) + t.nominal;
        filtered.push(t);
      }
    });

    return {
      totalMasuk,
      totalTunai,
      totalTransfer,
      totalBatal,
      perCategory,
      transactions: filtered.reverse()
    };
  }

  // Data Bulanan Chart.js
  public static getMonthlyChartData(tahun: string = '2026') {
    const transactions = this.getTransactions();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const sppMonthly = Array(12).fill(0);
    const nonSppMonthly = Array(12).fill(0);
    const tunaiMonthly = Array(12).fill(0);
    const transferMonthly = Array(12).fill(0);
    const totalMonthly = Array(12).fill(0);
    let totalYearRevenue = 0;
    let totalYearTransactions = 0;

    transactions.forEach((t) => {
      if (t.status === 'Batal') return;
      if (t.tanggal.startsWith(tahun)) {
        const parts = t.tanggal.split('-');
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          if (t.idPos === 'POS-SPP') {
            sppMonthly[monthIdx] += t.nominal;
          } else {
            nonSppMonthly[monthIdx] += t.nominal;
          }

          if (t.metode === 'Transfer') {
            transferMonthly[monthIdx] += t.nominal;
          } else {
            tunaiMonthly[monthIdx] += t.nominal;
          }

          totalMonthly[monthIdx] += t.nominal;
          totalYearRevenue += t.nominal;
          totalYearTransactions++;
        }
      }
    });

    return {
      tahun,
      labels: monthNames,
      sppMonthly,
      nonSppMonthly,
      tunaiMonthly,
      transferMonthly,
      totalMonthly,
      totalYearRevenue,
      totalYearTransactions
    };
  }

  // Trigger Backup Database Simulator
  public static triggerAutomatedBackup(): BackupRecord {
    const now = new Date();
    const timeStampStr = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const backupName = `SiKeSe_Backup_Database_${timeStampStr}.json`;
    const transactions = this.getTransactions();

    const record: BackupRecord = {
      id: 'bkp-' + Date.now(),
      fileName: backupName,
      timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
      size: `${(Math.random() * 1.5 + 1.1).toFixed(2)} MB`,
      totalTransactions: transactions.length
    };

    const backups = this.getBackups();
    backups.unshift(record);
    this.set(STORAGE_KEYS.BACKUPS, backups);

    this.addAuditLog('BACKUP_DATABASE', 'Admin', `Backup berhasil: ${backupName}`);
    return record;
  }

  // Reset Default Data
  public static resetSampleData(): void {
    this.set(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.set(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.set(STORAGE_KEYS.POS_BIAYA, INITIAL_POS_BIAYA);
    this.set(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    this.addAuditLog('RESET_SYSTEM', 'Admin', 'Data dikembalikan ke pengaturan awal');
  }

  // WhatsApp Helpers
  public static cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  public static buildWhatsAppReceiptText(data: {
    sekolah: string;
    alamat: string;
    telp: string;
    noKwitansi: string;
    tanggal: string;
    nis: string;
    nama: string;
    kelas: string;
    items: CartItem[];
    grandTotal: number;
    metode: string;
    kasir: string;
  }): string {
    const itemLines = data.items
      .map((item, idx) => {
        let desc = item.namaPos;
        if (item.bulan && item.bulan !== '-') {
          desc += ` (${item.bulan})`;
        }
        return `${idx + 1}. ${desc}: Rp ${item.nominal.toLocaleString('id-ID')}`;
      })
      .join('\n');

    return (
      `*BUKTI PEMBAYARAN KEUANGAN SEKOLAH*\n` +
      `*${data.sekolah.toUpperCase()}*\n` +
      (data.alamat ? `${data.alamat}\n` : '') +
      `==================================\n\n` +
      `Yth. Bapak/Ibu Wali Murid,\n` +
      `Berikut rincian tanda bukti pembayaran resmi putra/putri Anda:\n\n` +
      `• *No. Kwitansi :* \`${data.noKwitansi}\`\n` +
      `• *Waktu        :* ${data.tanggal}\n` +
      `• *NIS          :* ${data.nis}\n` +
      `• *Nama Siswa   :* *${data.nama}*\n` +
      `• *Kelas        :* ${data.kelas}\n` +
      `• *Metode Bayar :* ${data.metode}\n\n` +
      `*Rincian Pos Pembayaran:*\n` +
      `${itemLines}\n` +
      `----------------------------------\n` +
      `*TOTAL DIBAYAR  : Rp ${data.grandTotal.toLocaleString('id-ID')}*\n` +
      `----------------------------------\n\n` +
      `_Status : LUNAS / TERVERIFIKASI_\n` +
      `_Kasir  : ${data.kasir}_\n\n` +
      `Terima kasih atas partisipasi dan amanah Bapak/Ibu dalam mendukung kelancaran operasional dan pendidikan siswa.\n\n` +
      `_Simpan pesan ini sebagai bukti sah pembayaran._`
    );
  }

  public static buildWhatsAppBillingNotice(ledger: StudentLedger, settings?: Settings): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Ambil data riil tunggakan murid (pos dengan sisaTagihan > 0)
    const unpaidItems = ledger.posStatus
      .filter((p) => p.sisaTagihan > 0)
      .map((p, idx) => {
        return `${idx + 1}. ${p.namaPos} : Rp ${p.sisaTagihan.toLocaleString('id-ID')}`;
      });

    const itemsText = unpaidItems.length > 0
      ? unpaidItems.join('\n')
      : '1. Semua Pos Biaya : Rp 0 (LUNAS)';

    return (
`PEMBERITAHUAN KEWAJIBAN BIAYA SEKOLAH
Yth. Bapak/Ibu Wali Murid dari:
Nama  : ${ledger.siswa.nama}
NIS   : ${ledger.siswa.nis}
Kelas : ${ledger.siswa.kelas}

Berikut rincian kewajiban yang belum diselesaikan per tanggal ${formattedDate} :
${itemsText}
--------------------------------------
TOTAL KEWAJIBAN : Rp ${ledger.sisaSemuaTagihan.toLocaleString('id-ID')}

Pembayaran dapat diselesaikan langsung di loket kasir
bendahara sekolah atau via transper bank dengan Nomor Rekening BRI : 009201011149539
A.N. SMK PGRI 1  Terima kasih. (Abaikan pesan ini jika sudah melakukan pembayaran)`
    );
  }
}

// Inisialisasi pembersihan data sampel dummy otomatis agar hanya data riil yang digunakan
FinanceEngine.purgeSampleDataIfPresent();

