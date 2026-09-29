/**
 * =========================================================================
 * SiKeSe (Sistem Keuangan Sekolah) - Backend Engine Google Apps Script
 * =========================================================================
 * Deskripsi : Backend lengkap untuk manajemen SPP, DSP, PKL & Pos Keuangan
 * Database  : Google Sheets (Multi-Sheet Relasional Sederhana)
 * Fitur     : Otorisasi PIN Multi-Role, Atomic Lock Cart Payment, Reversal (Undo),
 *             Rekapitulasi Harian/Periode, Grafik Chart.js Data, Backup Otomatis.
 * =========================================================================
 */

// Konfigurasi Nama Sheet Utama
var SHEET_NAMES = {
  SISWA: "SISWA",
  POS_BIAYA: "POS_BIAYA",
  TRANSAKSI: "TRANSAKSI",
  PENGATURAN: "PENGATURAN",
  LOG_AUDIT: "LOG_AUDIT"
};

/**
 * Entry point Web App GET (bisa melayani HTML Web App atau REST API JSON)
 */
function doGet(e) {
  // Jika dipanggil via HTTP GET dengan parameter ?action=...
  if (e && e.parameter && e.parameter.action) {
    try {
      var action = e.parameter.action;
      var result = {};
      if (action === "getInitialData") {
        result = getInitialData();
      } else if (action === "getStudentLedger") {
        result = getStudentLedger(e.parameter.nis);
      } else if (action === "searchStudent") {
        result = searchStudent(e.parameter.query);
      } else if (action === "getFinancialReport") {
        result = getFinancialReport(e.parameter.startDate, e.parameter.endDate, e.parameter.idPos);
      } else if (action === "getMonthlyChartData") {
        result = getMonthlyChartData(e.parameter.tahun);
      } else if (action === "ping") {
        result = { pong: true, time: new Date().toISOString() };
      } else {
        throw new Error("Aksi GET tidak dikenali: " + action);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        data: result
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: err.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Jika dibuka langsung di browser
  var template = HtmlService.createTemplateFromFile("Index");
  return template.evaluate()
    .setTitle("SiKeSe - Sistem Keuangan Sekolah")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Entry point Web App POST (untuk integrasi REST API atau Webhook)
 */
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var payload = contents.payload;
    var result = {};

    switch (action) {
      case "loginWithPin":
        result = loginWithPin(payload.pin);
        break;
      case "getInitialData":
        result = getInitialData();
        break;
      case "searchStudent":
        result = searchStudent(payload.query);
        break;
      case "getStudentLedger":
        result = getStudentLedger(payload.nis);
        break;
      case "processBatchTransaction":
        result = processBatchTransaction(payload);
        break;
      case "cancelTransaction":
        result = cancelTransaction(payload.noKwitansi, payload.pin, payload.alasan);
        break;
      case "getFinancialReport":
        result = getFinancialReport(payload.startDate, payload.endDate, payload.idPos);
        break;
      case "getMonthlyChartData":
        result = getMonthlyChartData(payload.tahun);
        break;
      case "triggerAutomatedBackup":
        result = triggerAutomatedBackup();
        break;
      case "initDatabase":
        result = initDatabase();
        break;
      default:
        throw new Error("Aksi tidak dikenali: " + action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper untuk menyertakan file parsial di GAS
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Dapatkan spreadsheet aktif
 */
function getDb() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Helper untuk mengekstrak detail tanggal (tahun, indeks bulan, ISO YYYY-MM-DD)
 * secara aman dari sel Google Sheets (baik bertipe Date object, string ISO, maupun format lokal)
 */
function extractDateDetails(dateVal, timestampVal) {
  var d = null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    d = dateVal;
  } else if (timestampVal instanceof Date && !isNaN(timestampVal.getTime())) {
    d = timestampVal;
  } else {
    var str = String(dateVal || timestampVal || "").trim();
    if (str) {
      // YYYY-MM-DD atau YYYY/MM/DD
      var m1 = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (m1) {
        d = new Date(parseInt(m1[1], 10), parseInt(m1[2], 10) - 1, parseInt(m1[3], 10));
      } else {
        // DD/MM/YYYY atau DD-MM-YYYY
        var m2 = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (m2) {
          d = new Date(parseInt(m2[3], 10), parseInt(m2[2], 10) - 1, parseInt(m2[1], 10));
        } else {
          var parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            d = parsed;
          }
        }
      }
    }
  }

  if (d) {
    return {
      dateObj: d,
      year: d.getFullYear(),
      monthIdx: d.getMonth(), // 0 - 11
      isoDate: Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd"),
      isoMonth: Utilities.formatDate(d, "GMT+7", "yyyy-MM")
    };
  }
  return null;
}

/**
 * Helper untuk memformat Jam secara bersih (HH:mm)
 * Mengatasi sel Google Sheets bertipe time yang otomatis dikonversi menjadi Date object 'Sat Dec 30 1899 ...'
 */
function formatCleanTime(timeVal, timestampVal) {
  if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
    var hh = ("0" + timeVal.getHours()).slice(-2);
    var mm = ("0" + timeVal.getMinutes()).slice(-2);
    return hh + ":" + mm;
  }
  var str = String(timeVal || "").trim();
  if (str) {
    var m = str.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
    if (m) {
      return ("0" + m[1]).slice(-2) + ":" + m[2];
    }
  }
  if (timestampVal instanceof Date && !isNaN(timestampVal.getTime())) {
    var th = ("0" + timestampVal.getHours()).slice(-2);
    var tm = ("0" + timestampVal.getMinutes()).slice(-2);
    return th + ":" + tm;
  }
  var tsStr = String(timestampVal || "").trim();
  if (tsStr) {
    var tm2 = tsStr.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
    if (tm2) {
      return ("0" + tm2[1]).slice(-2) + ":" + tm2[2];
    }
  }
  return "00:00";
}

/**
 * Helper untuk memformat kolom Bulan secara bersih (misal: 'Oktober 2026')
 * Mengatasi sel Google Sheets yang otomatis menjadi Date object 'Thu Oct 01 2026 ...'
 */
function formatCleanMonth(monthVal) {
  if (!monthVal || monthVal === "-") return "-";
  
  var indonesianMonths = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  if (monthVal instanceof Date && !isNaN(monthVal.getTime())) {
    return indonesianMonths[monthVal.getMonth()] + " " + monthVal.getFullYear();
  }
  
  var str = String(monthVal).trim();
  if (!str || str === "-") return "-";
  
  // Jika formatnya string panjang dari Date object seperti "Thu Oct 01 2026 00:00:00 GMT+0700..."
  if (str.indexOf("GMT") !== -1 || str.indexOf("WIB") !== -1 || /^[A-Za-z]{3}\s[A-Za-z]{3}\s\d{1,2}\s\d{4}/.test(str)) {
    var parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return indonesianMonths[parsedDate.getMonth()] + " " + parsedDate.getFullYear();
    }
  }
  
  var isoMatch = str.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    var imIdx = parseInt(isoMatch[2], 10) - 1;
    if (imIdx >= 0 && imIdx < 12) {
      return indonesianMonths[imIdx] + " " + isoMatch[1];
    }
  }
  
  return str;
}

/**
 * Inisialisasi Database Spreadsheet otomatis jika sheet belum ada
 */
function initDatabase() {
  var ss = getDb();
  var defaultSheets = [
    {
      name: SHEET_NAMES.SISWA,
      headers: ["NIS", "NISN", "Nama", "Kelas", "Jurusan", "NoHP_Wali", "Status", "Alamat"]
    },
    {
      name: SHEET_NAMES.POS_BIAYA,
      headers: ["ID_Pos", "Nama_Pos", "Tipe", "Kategori", "Kelas_Target", "Nominal_Default", "Keterangan"]
    },
    {
      name: SHEET_NAMES.TRANSAKSI,
      headers: ["No_Kwitansi", "Timestamp", "Tanggal", "Jam", "NIS", "Nama", "Kelas", "ID_Pos", "Nama_Pos", "Bulan", "Nominal", "Metode", "Kasir", "Status", "Keterangan"]
    },
    {
      name: SHEET_NAMES.PENGATURAN,
      headers: ["Kunci", "Nilai", "Deskripsi"]
    },
    {
      name: SHEET_NAMES.LOG_AUDIT,
      headers: ["Timestamp", "Aksi", "User", "Detail", "IP_Address"]
    }
  ];

  defaultSheets.forEach(function(item) {
    var sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
      sheet.appendRow(item.headers);
      sheet.getRange(1, 1, 1, item.headers.length)
        .setFontWeight("bold")
        .setBackground("#0f172a")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
  });

  // Isi default setting jika kosong
  var settingSheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  if (settingSheet.getLastRow() <= 1) {
    var defaultSettings = [
      ["PIN_KASIR", "1234", "PIN untuk login Kasir (Akses Transaksi & Kwitansi)"],
      ["PIN_KEPSEK", "8899", "PIN untuk login Kepala Sekolah (Akses Laporan & Rekap)"],
      ["NAMA_SEKOLAH", "SMKS PGRI 1 KOTA SUKABUMI", "Nama Lembaga Pendidikan"],
      ["ALAMAT_SEKOLAH", "Jl. Pelabuhan II Cipoho Indah, Cikondang, Citamiang, Kota Sukabumi, Jawa Barat", "Alamat Lengkap"],
      ["NO_TELP_SEKOLAH", "(0266) 221-820", "Nomor Telepon Sekolah"],
      ["TAHUN_AJARAN", "2026/2027", "Tahun Ajaran Aktif"],
      ["NAMA_KEPSEK", "Drs. H. Mulyono, M.Pd.", "Nama Kepala Sekolah"],
      ["NAMA_BENDAHARA", "Siti Aminah, S.E.", "Nama Bendahara / Kasir Utama"]
    ];
    settingSheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
  }

  // Isi default pos biaya jika kosong
  var posSheet = ss.getSheetByName(SHEET_NAMES.POS_BIAYA);
  if (posSheet.getLastRow() <= 1) {
    var defaultPos = [
      ["POS-SPP", "SPP (Bulanan)", "BULANAN", "SPP", "Semua", 300000, "Iuran SPP wajib per bulan (Tarif Rp 300.000/bulan)"],
      ["POS-DSP", "DSP (Cicilan)", "CICILAN", "DSP", "Semua", 2000000, "Dana Sumbangan Pendidikan (Dapat dicicil, Tarif Rp 2.000.000)"],
      ["POS-PKL", "Dana PKL (Cicilan)", "CICILAN", "PKL", "XI", 650000, "Dana Praktik Kerja Lapangan kelas XI (Tarif Rp 650.000)"],
      ["POS-KUR-11", "Dana Kegiatan Kurikulum kelas XI (Cicilan)", "CICILAN", "Kurikulum", "XI", 300000, "Kegiatan kurikulum & asesmen kelas XI (Tarif Rp 300.000)"],
      ["POS-KUR-12", "Dana Kegiatan Kurikulum kelas XII (Cicilan)", "CICILAN", "Kurikulum", "XII", 1100000, "Ujian kelulusan, sertifikasi & wisuda kelas XII (Tarif Rp 1.100.000)"],
      ["POS-KESIS-11", "Dana Kegiatan Kesiswaan kelas XI (Cicilan)", "CICILAN", "Kesiswaan", "XI", 150000, "Kegiatan OSIS, ekstrakurikuler & kepramukaan kelas XI (Tarif Rp 150.000)"],
      ["POS-KESIS-12", "Dana Kegiatan Kesiswaan kelas XII (Cicilan)", "CICILAN", "Kesiswaan", "XII", 150000, "Kegiatan kesiswaan & pelepasan siswa kelas XII (Tarif Rp 150.000)"],
      ["POS-SARPRAS-11", "Dana Kegiatan Sarpras kelas XI (Cicilan)", "CICILAN", "Sarpras", "XI", 50000, "Pemeliharaan sarana & prasarana belajar kelas XI (Tarif Rp 50.000)"],
      ["POS-SARPRAS-12", "Dana Kegiatan Sarpras kelas XII (Cicilan)", "CICILAN", "Sarpras", "XII", 50000, "Pemeliharaan sarana & prasarana belajar kelas XII (Tarif Rp 50.000)"]
    ];
    posSheet.getRange(2, 1, defaultPos.length, 7).setValues(defaultPos);
  }

  // Sheet SISWA dan TRANSAKSI dibiarkan bersih tanpa data dummy sample
  return { message: "Inisialisasi Database SiKeSe berhasil! Struktur sheet siap menerima data riil." };
}

/**
 * Ambil Pengaturan dari Sheet
 */
function getSettings() {
  var ss = getDb();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  }
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key) {
      settings[key] = String(val);
    }
  }
  return settings;
}

/**
 * Autentikasi Pengguna berdasarkan PIN
 */
function loginWithPin(pin) {
  if (!pin) {
    throw new Error("PIN wajib diisi!");
  }
  var settings = getSettings();
  var pinKasir = settings["PIN_KASIR"] || "1234";
  var pinKepsek = settings["PIN_KEPSEK"] || "8899";

  pin = String(pin).trim();

  if (pin === pinKasir) {
    writeAuditLog("LOGIN", "Kasir", "Login sukses sebagai Kasir");
    return {
      role: "KASIR",
      nama: settings["NAMA_BENDAHARA"] || "Kasir Keuangan",
      permissions: {
        canTransaction: true,
        canCancel: true,
        canViewReport: true,
        canViewChart: true,
        canManageSettings: false
      }
    };
  } else if (pin === pinKepsek) {
    writeAuditLog("LOGIN", "Kepala Sekolah", "Login sukses sebagai Kepala Sekolah");
    return {
      role: "KEPSEK",
      nama: settings["NAMA_KEPSEK"] || "Kepala Sekolah",
      permissions: {
        canTransaction: false, // Kepala sekolah fokus supervisi & laporan
        canCancel: false,
        canViewReport: true,
        canViewChart: true,
        canManageSettings: true
      }
    };
  } else {
    writeAuditLog("LOGIN_FAILED", "Anonim", "Percobaan login gagal dengan PIN: " + pin);
    throw new Error("PIN yang Anda masukkan salah. Silakan periksa kembali!");
  }
}

/**
 * Ambil Data Awal untuk aplikasi (Siswa, Pos Biaya, Pengaturan, Ringkasan)
 */
function getInitialData() {
  var ss = getDb();
  var siswaSheet = ss.getSheetByName(SHEET_NAMES.SISWA);
  var posSheet = ss.getSheetByName(SHEET_NAMES.POS_BIAYA);
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);

  if (!siswaSheet || !posSheet || !transSheet) {
    initDatabase();
    siswaSheet = ss.getSheetByName(SHEET_NAMES.SISWA);
    posSheet = ss.getSheetByName(SHEET_NAMES.POS_BIAYA);
    transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  }

  // 1. Data Siswa
  var siswaRows = siswaSheet.getDataRange().getValues();
  var siswaList = [];
  for (var i = 1; i < siswaRows.length; i++) {
    if (siswaRows[i][0]) {
      siswaList.push({
        nis: String(siswaRows[i][0]),
        nisn: String(siswaRows[i][1] || ""),
        nama: String(siswaRows[i][2]),
        kelas: String(siswaRows[i][3]),
        jurusan: String(siswaRows[i][4] || ""),
        noHpWali: String(siswaRows[i][5] || ""),
        status: String(siswaRows[i][6] || "Aktif"),
        alamat: String(siswaRows[i][7] || "")
      });
    }
  }

  // 2. Data Pos Biaya
  var posRows = posSheet.getDataRange().getValues();
  var posList = [];
  for (var j = 1; j < posRows.length; j++) {
    if (posRows[j][0]) {
      posList.push({
        idPos: String(posRows[j][0]),
        namaPos: String(posRows[j][1]),
        tipe: String(posRows[j][2]), // SPP_BULANAN, NON_SPP_BEBAS, NON_SPP_PAKET
        kategori: String(posRows[j][3]),
        kelasTarget: String(posRows[j][4]),
        nominalDefault: Number(posRows[j][5]) || 0,
        keterangan: String(posRows[j][6] || "")
      });
    }
  }

  // 3. Ringkasan Hari Ini, Bulan Ini, Tunai vs Non-Tunai & Transaksi Terakhir
  var transRows = transSheet.getDataRange().getValues();
  var todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var currentMonthStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM");
  var totalHariIni = 0;
  var totalBulanIni = 0;
  var totalTransaksiCount = 0;
  var totalTunaiAll = 0;
  var totalTransferAll = 0;
  var totalTunaiHariIni = 0;
  var totalTransferHariIni = 0;
  var totalTunaiBulanIni = 0;
  var totalTransferBulanIni = 0;
  var recentTransactions = [];

  for (var k = transRows.length - 1; k >= 1; k--) {
    var r = transRows[k];
    if (!r[0]) continue;
    var dt = extractDateDetails(r[2], r[1]);
    var tgl = dt ? dt.isoDate : String(r[2]);
    var nominal = Number(r[10]) || 0;
    var metode = String(r[11] || "Tunai");
    var status = String(r[13]);

    if (status !== "Batal") {
      if (tgl === todayStr) {
        totalHariIni += nominal;
        if (metode === "Transfer") {
          totalTransferHariIni += nominal;
        } else {
          totalTunaiHariIni += nominal;
        }
      }
      if (tgl.indexOf(currentMonthStr) === 0) {
        totalBulanIni += nominal;
        if (metode === "Transfer") {
          totalTransferBulanIni += nominal;
        } else {
          totalTunaiBulanIni += nominal;
        }
      }
      if (metode === "Transfer") {
        totalTransferAll += nominal;
      } else {
        totalTunaiAll += nominal;
      }
      totalTransaksiCount++;
    }

    if (recentTransactions.length < 15) {
      recentTransactions.push({
        noKwitansi: String(r[0]),
        timestamp: String(r[1]),
        tanggal: tgl,
        jam: formatCleanTime(r[3], r[1]),
        nis: String(r[4]),
        nama: String(r[5]),
        kelas: String(r[6]),
        idPos: String(r[7]),
        namaPos: String(r[8]),
        bulan: formatCleanMonth(r[9]),
        nominal: nominal,
        metode: metode,
        kasir: String(r[12]),
        status: status,
        keterangan: String(r[14] || "")
      });
    }
  }

  return {
    siswaList: siswaList,
    posList: posList,
    settings: getSettings(),
    summary: {
      totalHariIni: totalHariIni,
      totalBulanIni: totalBulanIni,
      totalTransaksiCount: totalTransaksiCount,
      totalSiswa: siswaList.length,
      totalTunai: totalTunaiAll,
      totalTransfer: totalTransferAll,
      totalTunaiHariIni: totalTunaiHariIni,
      totalTransferHariIni: totalTransferHariIni,
      totalTunaiBulanIni: totalTunaiBulanIni,
      totalTransferBulanIni: totalTransferBulanIni
    },
    recentTransactions: recentTransactions
  };
}

/**
 * Cari siswa berdasarkan NIS atau Nama
 */
function searchStudent(query) {
  if (!query) return [];
  query = String(query).toLowerCase().trim();
  var initial = getInitialData();
  return initial.siswaList.filter(function(s) {
    return s.nis.toLowerCase().indexOf(query) !== -1 ||
           s.nama.toLowerCase().indexOf(query) !== -1 ||
           s.kelas.toLowerCase().indexOf(query) !== -1;
  });
}

function getGradeLevel(kelas) {
  if (!kelas) return "";
  var k = String(kelas).trim().toUpperCase();
  if (/\bXII\b|XII\s|^XII|12/i.test(k)) return "XII";
  if (/\bXI\b|XI\s|^XI|11/i.test(k)) return "XI";
  if (/\bX\b|X\s|^X|10/i.test(k)) return "X";
  return "";
}

function isPosEligibleForClass(target, kelas) {
  if (!target || target === "Semua") return true;
  var studentGrade = getGradeLevel(kelas);
  var targetGrade = String(target).trim().toUpperCase();
  return studentGrade === targetGrade;
}

/**
 * Daftar 12 Bulan Pembukuan SPP (Tahun Ajaran Juli s/d Juni)
 */
var BULAN_SPP = [
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni"
];

/**
 * Dapatkan Buku Kas / Rekening Tagihan Lengkap Siswa
 */
function getStudentLedger(nis, sppYear) {
  if (!nis) throw new Error("NIS Siswa wajib diisi!");
  nis = String(nis).trim();
  sppYear = sppYear ? String(sppYear) : "2026";

  var ss = getDb();
  var siswaSheet = ss.getSheetByName(SHEET_NAMES.SISWA);
  var posSheet = ss.getSheetByName(SHEET_NAMES.POS_BIAYA);
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);

  // Cari Siswa
  var siswaData = siswaSheet.getDataRange().getValues();
  var siswa = null;
  for (var i = 1; i < siswaData.length; i++) {
    if (String(siswaData[i][0]) === nis) {
      siswa = {
        nis: String(siswaData[i][0]),
        nisn: String(siswaData[i][1] || ""),
        nama: String(siswaData[i][2]),
        kelas: String(siswaData[i][3]),
        jurusan: String(siswaData[i][4] || ""),
        noHpWali: String(siswaData[i][5] || ""),
        status: String(siswaData[i][6] || "Aktif"),
        alamat: String(siswaData[i][7] || "")
      };
      break;
    }
  }

  if (!siswa) {
    throw new Error("Siswa dengan NIS " + nis + " tidak ditemukan!");
  }

  // Cari semua transaksi untuk siswa ini
  var transData = transSheet.getDataRange().getValues();
  var history = [];
  var sppPaidMap = {}; // mapping bulan -> true
  var paidPerPos = {}; // mapping idPos -> total bayar

  for (var t = 1; t < transData.length; t++) {
    var row = transData[t];
    if (String(row[4]) === nis) {
      var status = String(row[13]);
      var dtLedger = extractDateDetails(row[2], row[1]);
      var tglLedger = dtLedger ? dtLedger.isoDate : String(row[2]);
      var jamLedger = formatCleanTime(row[3], row[1]);
      var item = {
        noKwitansi: String(row[0]),
        timestamp: String(row[1]),
        tanggal: tglLedger,
        jam: jamLedger,
        nis: String(row[4]),
        nama: String(row[5]),
        kelas: String(row[6]),
        idPos: String(row[7]),
        namaPos: String(row[8]),
        bulan: formatCleanMonth(row[9]),
        nominal: Number(row[10]) || 0,
        metode: String(row[11]),
        kasir: String(row[12]),
        status: status,
        keterangan: String(row[14] || "")
      };
      history.push(item);

      if (status !== "Batal") {
        if (item.idPos === "POS-SPP" && item.bulan) {
          sppPaidMap[item.bulan] = {
            paid: true,
            noKwitansi: item.noKwitansi,
            tanggal: item.tanggal,
            nominal: item.nominal
          };
        }
        paidPerPos[item.idPos] = (paidPerPos[item.idPos] || 0) + item.nominal;
      }
    }
  }

  // Bangun status per pos biaya
  var posData = posSheet.getDataRange().getValues();
  var posStatus = [];

  for (var p = 1; p < posData.length; p++) {
    var pRow = posData[p];
    if (!pRow[0]) continue;
    var idPos = String(pRow[0]);
    var namaPos = String(pRow[1]);
    var tipe = String(pRow[2]);
    var kategori = String(pRow[3]);
    var kelasTarget = String(pRow[4]);
    var nominalTarget = Number(pRow[5]) || 0;

    // Filter apakah pos ini relevan untuk tingkat kelas siswa
    var isEligible = isPosEligibleForClass(kelasTarget, siswa.kelas);

    if (!isEligible) continue;

    var totalBayar = paidPerPos[idPos] || 0;

    if (tipe === "SPP_BULANAN" || tipe === "BULANAN") {
      var sppDetail = BULAN_SPP.map(function(bln) {
        var blnLower = bln.toLowerCase();
        var info = null;
        for (var h = 0; h < history.length; h++) {
          var item = history[h];
          if (item.status === "Batal" || item.idPos !== "POS-SPP" || !item.bulan) continue;
          var b = item.bulan.trim().toLowerCase();
          if (b.indexOf(blnLower) !== -1 && b.indexOf(sppYear) !== -1) {
            info = item;
            break;
          }
          if (b === blnLower && item.tanggal && item.tanggal.indexOf(sppYear) === 0) {
            info = item;
            break;
          }
        }
        return {
          bulan: bln,
          isLunas: !!info,
          noKwitansi: info ? info.noKwitansi : "",
          tanggalBayar: info ? info.tanggal : "",
          nominal: nominalTarget
        };
      });

      var totalLunasCount = sppDetail.filter(function(b) { return b.isLunas; }).length;
      var totalSppTarget = nominalTarget * 12;
      var totalSppBayar = totalLunasCount * nominalTarget;

      posStatus.push({
        idPos: idPos,
        namaPos: namaPos,
        tipe: tipe,
        kategori: kategori,
        nominalPerBulan: nominalTarget,
        totalTarget: totalSppTarget,
        totalBayar: totalSppBayar,
        sisaTagihan: Math.max(0, totalSppTarget - totalSppBayar),
        bulanLunasCount: totalLunasCount,
        sppMonths: sppDetail
      });
    } else {
      // Pos Bebas atau Paket (DSP, PKL, Kegiatan, dll)
      var sisa = Math.max(0, nominalTarget - totalBayar);
      posStatus.push({
        idPos: idPos,
        namaPos: namaPos,
        tipe: tipe,
        kategori: kategori,
        totalTarget: nominalTarget,
        totalBayar: totalBayar,
        sisaTagihan: sisa,
        isLunas: sisa === 0
      });
    }
  }

  // Hitung total akumulasi sisa tagihan semua pos
  var totalSemuaTagihan = 0;
  var totalSudahDibayar = 0;
  posStatus.forEach(function(ps) {
    totalSemuaTagihan += ps.totalTarget;
    totalSudahDibayar += ps.totalBayar;
  });

  return {
    siswa: siswa,
    posStatus: posStatus,
    totalSemuaTagihan: totalSemuaTagihan,
    totalSudahDibayar: totalSudahDibayar,
    sisaSemuaTagihan: Math.max(0, totalSemuaTagihan - totalSudahDibayar),
    history: history.reverse()
  };
}

/**
 * Generator Nomor Kwitansi Unik Berurutan (KW-YYYYMMDD-XXXX)
 */
function generateKwitansiNumber() {
  var ss = getDb();
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  var todayPrefix = "KW-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-";

  var lastRow = transSheet.getLastRow();
  var maxSeq = 0;

  if (lastRow > 1) {
    var checkCount = Math.min(lastRow - 1, 100);
    var kwValues = transSheet.getRange(lastRow - checkCount + 1, 1, checkCount, 1).getValues();
    for (var i = 0; i < kwValues.length; i++) {
      var val = String(kwValues[i][0] || "");
      if (val.indexOf(todayPrefix) === 0) {
        var seqPart = parseInt(val.replace(todayPrefix, ""), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    }
  }

  var nextSeq = maxSeq + 1;
  var seqStr = ("0000" + nextSeq).slice(-4);
  return todayPrefix + seqStr;
}

/**
 * Proses Pembayaran Keranjang (Multi-item atomic cart transaction)
 * Menggunakan LockService untuk mencegah race condition / pembayaran dobel.
 */
function processBatchTransaction(payload) {
  var lock = LockService.getScriptLock();
  try {
    // Kunci eksekusi selama maksimal 30 detik untuk menjamin konsistensi
    lock.waitLock(30000);

    if (!payload || !payload.items || payload.items.length === 0) {
      throw new Error("Keranjang pembayaran kosong!");
    }
    if (!payload.nis) {
      throw new Error("NIS Siswa wajib disertakan!");
    }

    var ss = getDb();
    var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
    var now = new Date();
    var timestampStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd HH:mm:ss");
    var tanggalStr = Utilities.formatDate(now, "GMT+7", "yyyy-MM-dd");
    var jamStr = Utilities.formatDate(now, "GMT+7", "HH:mm");

    // Validasi sisa saldo dan duplikasi SPP secara real-time
    var ledger = getStudentLedger(payload.nis);
    var posStatusMap = {};
    ledger.posStatus.forEach(function(ps) {
      posStatusMap[ps.idPos] = ps;
    });

    var rowsToInsert = [];
    var noKwitansi = generateKwitansiNumber();
    var grandTotal = 0;

    payload.items.forEach(function(item) {
      var posInfo = posStatusMap[item.idPos];
      if (!posInfo) {
        throw new Error("Pos biaya " + item.namaPos + " tidak valid untuk siswa ini!");
      }

      var nominal = Number(item.nominal);
      if (isNaN(nominal) || nominal <= 0) {
        throw new Error("Nominal pembayaran untuk " + item.namaPos + " harus lebih besar dari 0!");
      }

      // Validasi SPP jika sudah lunas di bulan tersebut
      if (posInfo.tipe === "SPP_BULANAN" || posInfo.tipe === "BULANAN") {
        if (!item.bulan) {
          throw new Error("Bulan SPP wajib dipilih untuk pembayaran SPP!");
        }
        var targetMonth = posInfo.sppMonths.find(function(m) { return m.bulan === item.bulan; });
        if (targetMonth && targetMonth.isLunas) {
          throw new Error("Bulan " + item.bulan + " sudah lunas sebelumnya (No Kwitansi: " + targetMonth.noKwitansi + ")!");
        }
      } else {
        // Validasi Pos Non-SPP (DSP / Kegiatan): cegah pembayaran melebihi sisa tagihan
        if (nominal > posInfo.sisaTagihan) {
          throw new Error("Pembayaran " + item.namaPos + " (Rp " + nominal.toLocaleString("id-ID") + ") melebihi sisa tagihan (Rp " + posInfo.sisaTagihan.toLocaleString("id-ID") + ")!");
        }
      }

      grandTotal += nominal;

      rowsToInsert.push([
        noKwitansi,
        timestampStr,
        tanggalStr,
        jamStr,
        payload.nis,
        payload.nama,
        payload.kelas,
        item.idPos,
        item.namaPos,
        item.bulan || "-",
        nominal,
        payload.metode || "Tunai",
        payload.kasir || "Kasir Utama",
        "Sukses",
        payload.keterangan || "-"
      ]);
    });

    // Tulis ke sheet secara batch
    var startRow = transSheet.getLastRow() + 1;
    transSheet.getRange(startRow, 1, rowsToInsert.length, 15).setValues(rowsToInsert);

    // Audit log
    writeAuditLog("TRANSAKSI_MASUK", payload.kasir || "Kasir", "Kwitansi: " + noKwitansi + " | NIS: " + payload.nis + " | Total: Rp " + grandTotal);

    var settings = getSettings();

    // Buat template WhatsApp
    var waText = buildWhatsAppReceiptText({
      sekolah: settings["NAMA_SEKOLAH"] || "SiKeSe",
      alamat: settings["ALAMAT_SEKOLAH"] || "",
      telp: settings["NO_TELP_SEKOLAH"] || "",
      noKwitansi: noKwitansi,
      tanggal: tanggalStr + " " + jamStr,
      nis: payload.nis,
      nama: payload.nama,
      kelas: payload.kelas,
      items: payload.items,
      grandTotal: grandTotal,
      metode: payload.metode || "Tunai",
      kasir: payload.kasir || "Kasir"
    });

    return {
      success: true,
      noKwitansi: noKwitansi,
      tanggal: tanggalStr,
      jam: jamStr,
      grandTotal: grandTotal,
      itemsCount: rowsToInsert.length,
      waText: waText,
      waLink: payload.noHpWali ? "https://wa.me/" + cleanPhoneNumber(payload.noHpWali) + "?text=" + encodeURIComponent(waText) : ""
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Pembatalan Transaksi (Undo) dengan validasi PIN
 * Mengembalikan status menjadi 'Batal' dan saldo tunggakan otomatis kembali.
 */
function cancelTransaction(noKwitansi, pin, alasan) {
  if (!noKwitansi) throw new Error("Nomor Kwitansi wajib disertakan!");
  if (!pin) throw new Error("PIN Otorisasi wajib diisi untuk pembatalan transaksi!");

  var settings = getSettings();
  var pinKasir = settings["PIN_KASIR"] || "1234";
  var pinKepsek = settings["PIN_KEPSEK"] || "8899";

  if (pin !== pinKasir && pin !== pinKepsek) {
    throw new Error("PIN Otorisasi salah! Pembatalan transaksi ditolak.");
  }

  var ss = getDb();
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  var data = transSheet.getDataRange().getValues();
  var found = false;
  var rowsUpdated = 0;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === noKwitansi) {
      var currentStatus = String(data[i][13]);
      if (currentStatus === "Batal") {
        throw new Error("Kwitansi " + noKwitansi + " sudah dibatalkan sebelumnya!");
      }
      transSheet.getRange(i + 1, 14).setValue("Batal");
      transSheet.getRange(i + 1, 15).setValue("Dibatalkan: " + (alasan || "Reversal kasir"));
      rowsUpdated++;
      found = true;
    }
  }

  if (!found) {
    throw new Error("Kwitansi " + noKwitansi + " tidak ditemukan!");
  }

  writeAuditLog("BATAL_TRANSAKSI", "Otorisator", "Pembatalan Kwitansi: " + noKwitansi + " (" + rowsUpdated + " item). Alasan: " + alasan);

  return {
    success: true,
    message: "Kwitansi " + noKwitansi + " berhasil dibatalkan. Saldo tunggakan telah dipulihkan.",
    rowsUpdated: rowsUpdated
  };
}

/**
 * Rekapitulasi Laporan Keuangan Harian / Periode Date Range
 */
function getFinancialReport(startDate, endDate, idPos) {
  var ss = getDb();
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  var data = transSheet.getDataRange().getValues();

  var totalMasuk = 0;
  var totalTunai = 0;
  var totalTransfer = 0;
  var totalBatal = 0;
  var perCategory = {};
  var filteredTransactions = [];

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    var dt = extractDateDetails(r[2], r[1]);
    var tgl = dt ? dt.isoDate : String(r[2]);
    var posId = String(r[7]);
    var posNama = String(r[8]);
    var nominal = Number(r[10]) || 0;
    var metode = String(r[11]);
    var status = String(r[13]);

    // Filter tanggal
    if (startDate && tgl < startDate) continue;
    if (endDate && tgl > endDate) continue;
    // Filter pos biaya jika dipilih
    if (idPos && idPos !== "SEMUA" && posId !== idPos) continue;

    if (status === "Batal") {
      totalBatal += nominal;
    } else {
      totalMasuk += nominal;
      if (metode === "Transfer") {
        totalTransfer += nominal;
      } else {
        totalTunai += nominal;
      }

      perCategory[posNama] = (perCategory[posNama] || 0) + nominal;

      filteredTransactions.push({
        noKwitansi: String(r[0]),
        timestamp: String(r[1]),
        tanggal: tgl,
        jam: formatCleanTime(r[3], r[1]),
        nis: String(r[4]),
        nama: String(r[5]),
        kelas: String(r[6]),
        idPos: posId,
        namaPos: posNama,
        bulan: formatCleanMonth(r[9]),
        nominal: nominal,
        metode: metode,
        kasir: String(r[12]),
        status: status,
        keterangan: String(r[14] || "")
      });
    }
  }

  return {
    startDate: startDate,
    endDate: endDate,
    totalMasuk: totalMasuk,
    totalTunai: totalTunai,
    totalTransfer: totalTransfer,
    totalBatal: totalBatal,
    perCategory: perCategory,
    transactions: filteredTransactions.reverse()
  };
}

/**
 * Data Grafik Pendapatan Bulanan untuk Chart.js
 */
function getMonthlyChartData(tahun) {
  var ss = getDb();
  var transSheet = ss.getSheetByName(SHEET_NAMES.TRANSAKSI);
  var data = transSheet.getDataRange().getValues();

  var currentYear = Utilities.formatDate(new Date(), "GMT+7", "yyyy");
  tahun = tahun ? String(tahun) : currentYear;

  var monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var sppMonthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  var nonSppMonthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  var tunaiMonthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  var transferMonthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  var totalMonthly = [0,0,0,0,0,0,0,0,0,0,0,0];
  var totalYearRevenue = 0;
  var totalYearTransactions = 0;

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    var status = String(r[13]);
    if (status === "Batal") continue;

    var dt = extractDateDetails(r[2], r[1]);
    if (!dt) continue;

    if (String(dt.year) === String(tahun)) {
      var monthIdx = dt.monthIdx;
      if (monthIdx >= 0 && monthIdx < 12) {
        var nominal = Number(r[10]) || 0;
        var idPos = String(r[7]);
        var metode = String(r[11] || "Tunai");

        if (idPos === "POS-SPP") {
          sppMonthly[monthIdx] += nominal;
        } else {
          nonSppMonthly[monthIdx] += nominal;
        }

        if (metode === "Transfer") {
          transferMonthly[monthIdx] += nominal;
        } else {
          tunaiMonthly[monthIdx] += nominal;
        }

        totalMonthly[monthIdx] += nominal;
        totalYearRevenue += nominal;
        totalYearTransactions++;
      }
    }
  }

  return {
    tahun: tahun,
    labels: monthNames,
    totalYearRevenue: totalYearRevenue,
    totalYearTransactions: totalYearTransactions,
    sppMonthly: sppMonthly,
    nonSppMonthly: nonSppMonthly,
    tunaiMonthly: tunaiMonthly,
    transferMonthly: transferMonthly,
    totalMonthly: totalMonthly,
    datasets: [
      {
        label: "SPP Bulanan",
        data: sppMonthly,
        backgroundColor: "#059669",
        borderColor: "#047857",
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: "DSP, PKL & Pos Lainnya",
        data: nonSppMonthly,
        backgroundColor: "#0284c7",
        borderColor: "#0369a1",
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: "Total Penerimaan Riil",
        data: totalMonthly,
        type: "line",
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 4,
        pointBackgroundColor: "#f59e0b"
      }
    ]
  };
}

/**
 * Backup Database Otomatis ke Google Drive
 */
function triggerAutomatedBackup() {
  var ss = getDb();
  var timeStamp = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
  var backupName = "SiKeSe_Backup_" + ss.getName() + "_" + timeStamp;

  // Folder Backup khusus
  var folderIterator = DriveApp.getFoldersByName("SiKeSe_Backup");
  var backupFolder;
  if (folderIterator.hasNext()) {
    backupFolder = folderIterator.next();
  } else {
    backupFolder = DriveApp.createFolder("SiKeSe_Backup");
  }

  var file = DriveApp.getFileById(ss.getId());
  var backupFile = file.makeCopy(backupName, backupFolder);

  writeAuditLog("BACKUP", "Sistem", "Backup berhasil dibuat: " + backupName + " (ID: " + backupFile.getId() + ")");

  return {
    success: true,
    fileName: backupName,
    url: backupFile.getUrl(),
    timestamp: timeStamp
  };
}

/**
 * Pasang Trigger Backup Otomatis Terjadwal (Harian pukul 23:00)
 */
function setupBackupTrigger() {
  // Hapus trigger lama jika sudah ada
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === "triggerAutomatedBackup") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Buat trigger baru setiap hari pukul 23.00
  ScriptApp.newTrigger("triggerAutomatedBackup")
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();

  return { message: "Trigger backup harian berhasil dijadwalkan setiap pukul 23:00 WIB." };
}

/**
 * Pencatatan Riwayat Audit Log
 */
function writeAuditLog(aksi, user, detail) {
  try {
    var ss = getDb();
    var sheet = ss.getSheetByName(SHEET_NAMES.LOG_AUDIT);
    if (!sheet) return;
    var nowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([nowStr, aksi, user, detail, "-"]);
  } catch (e) {
    Logger.log("Audit log failed: " + e.message);
  }
}

/**
 * Format Nomor WhatsApp ke Format Internasional Indonesia (62xxx)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return "";
  var cleaned = String(phone).replace(/[^0-9]/g, "");
  if (cleaned.indexOf("0") === 0) {
    cleaned = "62" + cleaned.substring(1);
  } else if (cleaned.indexOf("8") === 0) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

/**
 * Format Rupiah
 */
function formatRupiah(num) {
  num = Number(num) || 0;
  return "Rp " + num.toLocaleString("id-ID");
}

/**
 * Susun Pesan WhatsApp Bukti Pembayaran Resmi
 */
function buildWhatsAppReceiptText(data) {
  var itemLines = "";
  data.items.forEach(function(item, idx) {
    var desc = item.namaPos;
    if (item.bulan && item.bulan !== "-") {
      desc += " (" + item.bulan + ")";
    }
    itemLines += (idx + 1) + ". " + desc + ": " + formatRupiah(item.nominal) + "\n";
  });

  return "*BUKTI PEMBAYARAN KEUANGAN SEKOLAH*\n" +
         "*" + data.sekolah.toUpperCase() + "*\n" +
         (data.alamat ? data.alamat + "\n" : "") +
         "==================================\n\n" +
         "Yth. Bapak/Ibu Wali Murid,\n" +
         "Berikut tanda bukti penerimaan pembayaran sekolah:\n\n" +
         "• *No. Kwitansi :* `" + data.noKwitansi + "`\n" +
         "• *Tanggal/Jam  :* " + data.tanggal + "\n" +
         "• *NIS          :* " + data.nis + "\n" +
         "• *Nama Siswa   :* *" + data.nama + "*\n" +
         "• *Kelas        :* " + data.kelas + "\n" +
         "• *Metode Bayar :* " + data.metode + "\n\n" +
         "*Rincian Pos Pembayaran:*\n" +
         itemLines +
         "----------------------------------\n" +
         "*TOTAL DIBAYAR : " + formatRupiah(data.grandTotal) + "*\n" +
         "----------------------------------\n\n" +
         "_Status : LUNAS / TERVERIFIKASI_\n" +
         "_Kasir  : " + data.kasir + "_\n\n" +
         "Terima kasih atas partisipasi dan kerja samanya dalam mendukung proses pendidikan putra/putri di sekolah kita.\n\n" +
         "Simpan pesan ini sebagai bukti transaksi resmi.";
}
