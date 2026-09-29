import { jsPDF } from 'jspdf';
import { Settings, CartItem } from '../types';

export interface ReceiptData {
  noKwitansi: string;
  tanggal: string;
  jam: string;
  grandTotal: number;
  items: CartItem[];
  student: {
    nis: string;
    nama: string;
    kelas: string;
    noHpWali?: string;
  };
  metode: 'Tunai' | 'Transfer';
  kasir: string;
  waText: string;
  waLink: string;
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

/**
 * Generates an official school PDF receipt using jsPDF (Vector-based, high quality).
 */
export function downloadReceiptPdf(data: ReceiptData, settings: Settings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard for school receipts, crisp and economical
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header / Kop Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((settings.NAMA_SEKOLAH || 'SEKOLAH').toUpperCase(), pageWidth / 2, y, { align: 'center' });
  
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const addressText = `${settings.ALAMAT_SEKOLAH || ''} | Telp: ${settings.NO_TELP_SEKOLAH || '-'}`;
  doc.text(addressText, pageWidth / 2, y, { align: 'center' });

  y += 4;
  // Double rule header
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.8);
  doc.line(12, y, pageWidth - 12, y);
  y += 1;
  doc.setLineWidth(0.3);
  doc.line(12, y, pageWidth - 12, y);

  // Receipt Title Badge
  y += 6;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect((pageWidth - 65) / 2, y - 4, 65, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('KWITANSI PEMBAYARAN RESMI', pageWidth / 2, y + 1, { align: 'center' });

  // Receipt Meta Grid
  y += 9;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const leftColX = 14;
  const leftValX = 42;
  const rightColX = pageWidth / 2 + 6;
  const rightValX = rightColX + 30;

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.text('No. Kwitansi', leftColX, y);
  doc.text(':', leftColX + 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.noKwitansi, leftValX, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Waktu', rightColX, y);
  doc.text(':', rightColX + 25, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${formatDisplayDate(data.tanggal)} ${formatDisplayTime(data.jam)}`, rightValX, y);

  // Row 2
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('NIS / Siswa', leftColX, y);
  doc.text(':', leftColX + 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.student.nis} - ${data.student.nama}`, leftValX, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kelas', rightColX, y);
  doc.text(':', rightColX + 25, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.student.kelas, rightValX, y);

  // Row 3
  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Metode Bayar', leftColX, y);
  doc.text(':', leftColX + 25, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(data.metode.toUpperCase(), leftValX, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas Kasir', rightColX, y);
  doc.text(':', rightColX + 25, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.kasir, rightValX, y);

  // Items Table Header
  y += 8;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(12, y, pageWidth - 24, 7, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.2);
  doc.rect(12, y, pageWidth - 24, 7, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('No.', 16, y + 4.8);
  doc.text('Pos Pembayaran / Keterangan', 26, y + 4.8);
  doc.text('Nominal (Rp)', pageWidth - 16, y + 4.8, { align: 'right' });

  // Items List
  y += 7;
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item, index) => {
    const itemHeight = 6.5;
    doc.setDrawColor(241, 245, 249);
    doc.line(12, y + itemHeight, pageWidth - 12, y + itemHeight);

    doc.setTextColor(100, 116, 139);
    doc.text(String(index + 1), 16, y + 4.5);

    doc.setTextColor(15, 23, 42);
    let desc = item.namaPos;
    if (item.bulan && item.bulan !== '-') {
      desc += ` (Bulan: ${item.bulan})`;
    }
    doc.text(desc, 26, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(item.nominal.toLocaleString('id-ID'), pageWidth - 16, y + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += itemHeight;
  });

  // Grand Total Box
  y += 2;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.rect(12, y, pageWidth - 24, 9, 'F');
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.4);
  doc.rect(12, y, pageWidth - 24, 9, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL TERBAYAR', 16, y + 6);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Rp ${data.grandTotal.toLocaleString('id-ID')}`, pageWidth - 16, y + 6, { align: 'right' });

  // Signatures
  y += 16;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  const signCol1X = 35;
  const signCol2X = pageWidth - 35;

  doc.text('Penyetor / Wali Murid,', signCol1X, y, { align: 'center' });
  doc.text('Petugas Kasir Keuangan,', signCol2X, y, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${data.student.nama} )`, signCol1X, y, { align: 'center' });
  doc.text(`( ${data.kasir} )`, signCol2X, y, { align: 'center' });

  // Footer Note
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('* Bukti pembayaran ini adalah dokumen sah dari sistem informasi SiKeSe sekolah.', pageWidth / 2, y, { align: 'center' });

  // Save PDF
  doc.save(`Kwitansi_${data.noKwitansi}.pdf`);
}

/**
 * Builds standalone printable HTML markup for receipt.
 */
export function buildReceiptPrintHtml(data: ReceiptData, settings: Settings, thermalMode: boolean = false): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 6px 4px; border-bottom: 1px solid #f1f5f9; text-align: left;">
        <strong style="color: #0f172a;">${item.namaPos}</strong>
        ${item.bulan && item.bulan !== '-' ? `<br><small style="color: #059669;">Bulan: ${item.bulan}</small>` : ''}
      </td>
      <td style="padding: 6px 4px; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-weight: 600;">
        Rp ${item.nominal.toLocaleString('id-ID')}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kwitansi ${data.noKwitansi}</title>
  <style>
    @page {
      margin: ${thermalMode ? '4mm' : '10mm'};
      size: ${thermalMode ? '80mm auto' : 'A5 portrait'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: ${thermalMode ? '6px' : '16px'};
      color: #0f172a;
      background: #ffffff;
      width: ${thermalMode ? '72mm' : '100%'};
      max-width: ${thermalMode ? '72mm' : '160mm'};
      margin-left: auto;
      margin-right: auto;
      font-size: ${thermalMode ? '11px' : '13px'};
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .school-title {
      font-size: ${thermalMode ? '13px' : '16px'};
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .school-info {
      font-size: ${thermalMode ? '9px' : '11px'};
      color: #64748b;
      margin: 0;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 8px;
      background: #f1f5f9;
      border-radius: 4px;
      font-weight: 700;
      font-size: 10px;
      color: #334155;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: ${thermalMode ? '10px' : '11.5px'};
    }
    .meta-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .meta-label {
      color: #64748b;
      width: ${thermalMode ? '75px' : '100px'};
    }
    .meta-val {
      font-weight: 600;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .items-table th {
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 4px;
      font-weight: 700;
      font-size: ${thermalMode ? '10px' : '11px'};
      color: #475569;
    }
    .total-box {
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 8px 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-weight: 800;
      font-size: ${thermalMode ? '13px' : '15px'};
    }
    .signatures {
      width: 100%;
      margin-top: 14px;
      font-size: ${thermalMode ? '10px' : '11px'};
      text-align: center;
    }
    .signatures td {
      width: 50%;
      padding-top: 6px;
    }
    .sign-space {
      height: ${thermalMode ? '35px' : '45px'};
    }
    .footer-note {
      text-align: center;
      margin-top: 16px;
      font-size: ${thermalMode ? '8.5px' : '10px'};
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 8px;
    }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="school-title">${settings.NAMA_SEKOLAH}</div>
    <div class="school-info">${settings.ALAMAT_SEKOLAH} · Telp: ${settings.NO_TELP_SEKOLAH}</div>
    <div class="badge">KWITANSI PEMBAYARAN KEUANGAN</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">No. Kwitansi</td>
      <td class="meta-val" style="font-family: monospace; font-size: 12px;">: ${data.noKwitansi}</td>
      <td class="meta-label">Waktu</td>
      <td class="meta-val">: ${formatDisplayDate(data.tanggal)} ${formatDisplayTime(data.jam)}</td>
    </tr>
    <tr>
      <td class="meta-label">NIS / Siswa</td>
      <td class="meta-val">: ${data.student.nis} - ${data.student.nama}</td>
      <td class="meta-label">Kelas</td>
      <td class="meta-val">: ${data.student.kelas}</td>
    </tr>
    <tr>
      <td class="meta-label">Metode Bayar</td>
      <td class="meta-val">: <strong>${data.metode}</strong></td>
      <td class="meta-label">Petugas Kasir</td>
      <td class="meta-val">: ${data.kasir}</td>
    </tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">Rincian Pos Biaya</th>
        <th style="text-align: right;">Nominal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="total-box">
    <span>TOTAL TERBAYAR</span>
    <span style="color: #059669; font-family: monospace;">Rp ${data.grandTotal.toLocaleString('id-ID')}</span>
  </div>

  <table class="signatures">
    <tr>
      <td>
        <div style="color: #64748b;">Penyetor / Wali Murid</div>
        <div class="sign-space"></div>
        <div style="font-weight: 700; text-decoration: underline;">( ${data.student.nama} )</div>
      </td>
      <td>
        <div style="color: #64748b;">Petugas Kasir</div>
        <div class="sign-space"></div>
        <div style="font-weight: 700; text-decoration: underline;">( ${data.kasir} )</div>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    *Simpan bukti kwitansi ini sebagai tanda pelunasan resmi keuangan sekolah.*
  </div>
</body>
</html>`;
}

/**
 * Smart Print: Attempts hidden iframe print first, falls back to direct print,
 * and if restricted by sandbox, automatically triggers PDF download.
 */
export function executeReceiptPrint(
  data: ReceiptData,
  settings: Settings,
  thermalMode: boolean = false
): { success: boolean; mode: 'iframe' | 'window' | 'pdf'; message?: string } {
  const printHtml = buildReceiptPrintHtml(data, settings, thermalMode);

  // Strategy 1: Hidden Iframe printing
  try {
    const existingFrame = document.getElementById('sikese-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'sikese-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (frameDoc && iframe.contentWindow) {
      frameDoc.open();
      frameDoc.write(printHtml);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // Fallback if iframe.contentWindow.print() is blocked
          attemptWindowPrintOrPdf(data, settings);
        }
      }, 350);

      return { success: true, mode: 'iframe' };
    }
  } catch {
    // If iframe creation fails or is blocked
  }

  return attemptWindowPrintOrPdf(data, settings);
}

function attemptWindowPrintOrPdf(
  data: ReceiptData,
  settings: Settings
): { success: boolean; mode: 'window' | 'pdf'; message?: string } {
  // Strategy 2: Direct window.print()
  try {
    window.print();
    return { success: true, mode: 'window' };
  } catch (err) {
    console.warn('Direct window.print() was blocked or failed:', err);
    // Strategy 3: Automatic PDF generation fallback
    downloadReceiptPdf(data, settings);
    return {
      success: true,
      mode: 'pdf',
      message: 'Browser membatasi cetak langsung di frame. Berhasil mengunduh dokumen PDF Kwitansi Resmi!',
    };
  }
}
