import { jsPDF } from 'jspdf';
import { Settings, StudentLedger } from '../types';

/**
 * Generates an official printable PDF Student Card using jsPDF.
 */
export function downloadStudentCardPdf(ledger: StudentLedger, settings: Settings): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header / Kop Sekolah
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text((settings.NAMA_SEKOLAH || 'SEKOLAH').toUpperCase(), pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${settings.ALAMAT_SEKOLAH || ''} · Telp: ${settings.NO_TELP_SEKOLAH || '-'}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageWidth - 14, y);
  y += 1;
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  // Title Badge
  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect((pageWidth - 90) / 2, y - 4, 90, 7.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('KARTU PEMBAYARAN KEUANGAN SISWA', pageWidth / 2, y + 1.2, { align: 'center' });

  // Student Profile Info Box
  y += 9;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');

  // Left column
  doc.text('Nama Siswa', 18, y + 5.5);
  doc.text(':', 38, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(ledger.siswa.nama, 42, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('NIS', 18, y + 11.5);
  doc.text(':', 38, y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(ledger.siswa.nis, 42, y + 11.5);

  // Right column
  const rColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Kelas / Rombel', rColX, y + 5.5);
  doc.text(':', rColX + 24, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(ledger.siswa.kelas, rColX + 27, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Jurusan', rColX, y + 11.5);
  doc.text(':', rColX + 24, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(ledger.siswa.jurusan || '-', rColX + 27, y + 11.5);

  // Financial Summary 3-Box
  y += 22;
  const boxWidth = (pageWidth - 28 - 6) / 3;

  // Box 1: Total
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, boxWidth, 12, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL KEWAJIBAN', 14 + boxWidth / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Rp ${ledger.totalSemuaTagihan.toLocaleString('id-ID')}`, 14 + boxWidth / 2, y + 9.5, {
    align: 'center',
  });

  // Box 2: Paid
  doc.setFillColor(236, 253, 245);
  doc.rect(14 + boxWidth + 3, y, boxWidth, 12, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text('SUDAH DIBAYAR', 14 + boxWidth + 3 + boxWidth / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Rp ${ledger.totalSudahDibayar.toLocaleString('id-ID')}`,
    14 + boxWidth + 3 + boxWidth / 2,
    y + 9.5,
    { align: 'center' }
  );

  // Box 3: Remaining
  const isLunas = ledger.sisaSemuaTagihan === 0;
  doc.setFillColor(isLunas ? 240 : 255, isLunas ? 253 : 241, isLunas ? 244 : 242);
  doc.rect(14 + (boxWidth + 3) * 2, y, boxWidth, 12, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isLunas ? 5 : 225, isLunas ? 150 : 29, isLunas ? 105 : 72);
  doc.text('SISA TUNGGAKAN', 14 + (boxWidth + 3) * 2 + boxWidth / 2, y + 4.5, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Rp ${ledger.sisaSemuaTagihan.toLocaleString('id-ID')}`,
    14 + (boxWidth + 3) * 2 + boxWidth / 2,
    y + 9.5,
    { align: 'center' }
  );

  // Section 1: SPP 12-Month Table
  y += 17;
  const sppPos = ledger.posStatus.find((p) => p.idPos === 'POS-SPP');
  if (sppPos && sppPos.sppMonths) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`1. Matriks Pembayaran SPP (Tarif Rp ${(sppPos.nominalPerBulan || 300000).toLocaleString('id-ID')}/bln)`, 14, y);

    y += 3;
    // SPP Table Header
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 6, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Bulan', 18, y + 4.2);
    doc.text('Nominal', 50, y + 4.2);
    doc.text('Status', 85, y + 4.2);
    doc.text('No. Kwitansi', 125, y + 4.2);
    doc.text('Tgl Bayar', pageWidth - 18, y + 4.2, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'normal');

    sppPos.sppMonths.forEach((m) => {
      const rowHeight = 5.2;
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + rowHeight, pageWidth - 14, y + rowHeight);

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(m.bulan, 18, y + 3.8);
      doc.text(`Rp ${m.nominal.toLocaleString('id-ID')}`, 50, y + 3.8);

      if (m.isLunas) {
        doc.setTextColor(5, 150, 105);
        doc.setFont('helvetica', 'bold');
        doc.text('✓ LUNAS', 85, y + 3.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(m.noKwitansi || '-', 125, y + 3.8);
        doc.text(m.tanggalBayar || '-', pageWidth - 18, y + 3.8, { align: 'right' });
      } else {
        doc.setTextColor(225, 29, 72);
        doc.text('BELUM LUNAS', 85, y + 3.8);
        doc.setTextColor(148, 163, 184);
        doc.text('-', 125, y + 3.8);
        doc.text('-', pageWidth - 18, y + 3.8, { align: 'right' });
      }

      y += rowHeight;
    });
  }

  // Section 2: Non-SPP Fees Table
  y += 5;
  const nonSppList = ledger.posStatus.filter((p) => p.idPos !== 'POS-SPP');
  if (nonSppList.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('2. Status Pos Biaya Sistem Cicilan / Angsuran', 14, y);

    y += 3;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, y, pageWidth - 28, 6, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, pageWidth - 28, 6, 'S');

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Pos Biaya', 18, y + 4.2);
    doc.text('Target Biaya', 80, y + 4.2, { align: 'right' });
    doc.text('Sudah Dibayar', 120, y + 4.2, { align: 'right' });
    doc.text('Sisa Tagihan', 158, y + 4.2, { align: 'right' });
    doc.text('Status', pageWidth - 18, y + 4.2, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'normal');

    nonSppList.forEach((pos) => {
      const rowHeight = 5.6;
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + rowHeight, pageWidth - 14, y + rowHeight);

      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(pos.namaPos, 18, y + 4);

      doc.text(`Rp ${pos.totalTarget.toLocaleString('id-ID')}`, 80, y + 4, { align: 'right' });
      doc.setTextColor(5, 150, 105);
      doc.text(`Rp ${pos.totalBayar.toLocaleString('id-ID')}`, 120, y + 4, { align: 'right' });

      doc.setTextColor(pos.sisaTagihan > 0 ? 225 : 5, pos.sisaTagihan > 0 ? 29 : 150, pos.sisaTagihan > 0 ? 72 : 105);
      doc.text(`Rp ${pos.sisaTagihan.toLocaleString('id-ID')}`, 158, y + 4, { align: 'right' });

      if (pos.isLunas) {
        doc.setFont('helvetica', 'bold');
        doc.text('LUNAS', pageWidth - 18, y + 4, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text('Belum Lunas', pageWidth - 18, y + 4, { align: 'right' });
      }
      doc.setFont('helvetica', 'normal');

      y += rowHeight;
    });
  }

  // Rekening Bank Info Box
  y += 5;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, y, pageWidth - 28, 12, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('INFORMASI REKENING RESMI SEKOLAH:', 18, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Bank BRI : 009201011149539  A.N. SMK PGRI 1  (Loket Kasir Keuangan Sekolah)', 18, y + 9);

  // Signatures
  y += 18;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  const signX1 = 40;
  const signX2 = pageWidth - 40;

  doc.text('Mengetahui,', signX1, y, { align: 'center' });
  doc.text('Kepala Sekolah', signX1, y + 4.5, { align: 'center' });

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Dicetak per ${todayStr}`, signX2, y, { align: 'center' });
  doc.text('Petugas Kasir Keuangan', signX2, y + 4.5, { align: 'center' });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${settings.NAMA_KEPSEK || 'Kepala Sekolah'} )`, signX1, y, { align: 'center' });
  doc.text(`( ${settings.NAMA_BENDAHARA || 'Bendahara Kasir'} )`, signX2, y, { align: 'center' });

  // Save PDF
  doc.save(`Kartu_Pembayaran_${ledger.siswa.nis}_${ledger.siswa.nama.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Builds standalone printable HTML for the Student Card.
 */
export function buildStudentCardPrintHtml(ledger: StudentLedger, settings: Settings): string {
  const sppPos = ledger.posStatus.find((p) => p.idPos === 'POS-SPP');
  const sppRows = (sppPos?.sppMonths || [])
    .map(
      (m) => `
    <tr>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${m.bulan}</td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0;">Rp ${m.nominal.toLocaleString('id-ID')}</td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0;">
        ${m.isLunas ? '<span style="color:#059669; font-weight: bold;">✓ LUNAS</span>' : '<span style="color:#e11d48;">Belum Lunas</span>'}
      </td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${m.noKwitansi || '-'}</td>
      <td style="padding: 4px 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${m.tanggalBayar || '-'}</td>
    </tr>
  `
    )
    .join('');

  const otherPos = ledger.posStatus.filter((p) => p.idPos !== 'POS-SPP');
  const otherRows = otherPos
    .map(
      (p) => `
    <tr>
      <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${p.namaPos}</td>
      <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace;">Rp ${p.totalTarget.toLocaleString('id-ID')}</td>
      <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color:#059669; font-weight: 600;">Rp ${p.totalBayar.toLocaleString('id-ID')}</td>
      <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; color:${p.sisaTagihan > 0 ? '#e11d48' : '#059669'}; font-weight: bold;">Rp ${p.sisaTagihan.toLocaleString('id-ID')}</td>
      <td style="padding: 5px 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        ${p.isLunas ? '<span style="color:#059669; font-weight: bold;">LUNAS</span>' : '<span style="color:#64748b;">Belum Lunas</span>'}
      </td>
    </tr>
  `
    )
    .join('');

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kartu Pembayaran - ${ledger.siswa.nis} - ${ledger.siswa.nama}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 16px; color: #0f172a; background: #ffffff; font-size: 12px; }
    .header { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 10px; margin-bottom: 14px; }
    .title { font-size: 16px; font-weight: 800; text-transform: uppercase; margin: 0; color: #0f172a; }
    .sub { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
    .badge { display: inline-block; margin-top: 6px; padding: 3px 10px; background: #f1f5f9; font-weight: 700; font-size: 10px; border-radius: 4px; letter-spacing: 0.5px; }
    .student-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .metric-card { padding: 8px 12px; border-radius: 6px; text-align: center; }
    .table-section { margin-bottom: 16px; }
    .table-section h4 { margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f8fafc; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; padding: 5px 6px; text-align: left; color: #475569; font-weight: 700; }
    .bank-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11px; }
    .signatures { width: 100%; margin-top: 24px; text-align: center; font-size: 11px; }
    .signatures td { width: 50%; vertical-align: top; }
    .space { height: 45px; }
    .footer-note { text-align: center; font-size: 9.5px; color: #94a3b8; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 6px; }
  </style>
</head>
<body onload="window.print()">
  <div class="header">
    <div class="title">${settings.NAMA_SEKOLAH}</div>
    <div class="sub">${settings.ALAMAT_SEKOLAH} · Telp: ${settings.NO_TELP_SEKOLAH}</div>
    <div class="badge">KARTU PEMBAYARAN KEUANGAN SISWA</div>
  </div>

  <div class="student-box">
    <div>
      <div style="font-size: 14px; font-weight: 700;">${ledger.siswa.nama}</div>
      <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
        NIS: <strong style="color: #0f172a; font-family: monospace;">${ledger.siswa.nis}</strong> · 
        Kelas: <strong style="color: #0f172a;">${ledger.siswa.kelas}</strong> · 
        Jurusan: ${ledger.siswa.jurusan || '-'}
      </div>
    </div>
    <div style="text-align: right; color: #64748b; font-size: 11px;">
      <div>Tahun Ajaran: <strong>${settings.TAHUN_AJARAN || '2026/2027'}</strong></div>
      <div>Dicetak: <strong>${todayStr}</strong></div>
    </div>
  </div>

  <div class="metric-grid">
    <div class="metric-card" style="background: #f1f5f9; border: 1px solid #cbd5e1;">
      <div style="font-size: 10px; color: #64748b; font-weight: 600;">TOTAL KEWAJIBAN</div>
      <div style="font-size: 14px; font-weight: 800; font-family: monospace;">Rp ${ledger.totalSemuaTagihan.toLocaleString('id-ID')}</div>
    </div>
    <div class="metric-card" style="background: #ecfdf5; border: 1px solid #a7f3d0;">
      <div style="font-size: 10px; color: #059669; font-weight: 600;">SUDAH DIBAYAR</div>
      <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: #059669;">Rp ${ledger.totalSudahDibayar.toLocaleString('id-ID')}</div>
    </div>
    <div class="metric-card" style="background: ${ledger.sisaSemuaTagihan > 0 ? '#fff1f2' : '#f0fdf4'}; border: 1px solid ${ledger.sisaSemuaTagihan > 0 ? '#fecdd3' : '#bbf7d0'};">
      <div style="font-size: 10px; color: ${ledger.sisaSemuaTagihan > 0 ? '#e11d48' : '#059669'}; font-weight: 600;">SISA TUNGGAKAN</div>
      <div style="font-size: 14px; font-weight: 800; font-family: monospace; color: ${ledger.sisaSemuaTagihan > 0 ? '#e11d48' : '#059669'};">Rp ${ledger.sisaSemuaTagihan.toLocaleString('id-ID')}</div>
    </div>
  </div>

  <div class="table-section">
    <h4>1. Matriks Pembayaran SPP Bulanan</h4>
    <table>
      <thead>
        <tr>
          <th>Bulan</th>
          <th>Tarif</th>
          <th>Status</th>
          <th>No. Kwitansi</th>
          <th style="text-align: right;">Tgl Bayar</th>
        </tr>
      </thead>
      <tbody>
        ${sppRows}
      </tbody>
    </table>
  </div>

  <div class="table-section">
    <h4>2. Status Pos Biaya Sistem Cicilan / Angsuran</h4>
    <table>
      <thead>
        <tr>
          <th>Pos Biaya</th>
          <th style="text-align: right;">Target Biaya</th>
          <th style="text-align: right;">Sudah Dibayar</th>
          <th style="text-align: right;">Sisa Tagihan</th>
          <th style="text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${otherRows}
      </tbody>
    </table>
  </div>

  <div class="bank-box">
    <strong>INFORMASI REKENING RESMI PEMBAYARAN:</strong><br>
    Nomor Rekening BRI : <strong>009201011149539</strong> A.N. <strong>SMK PGRI 1</strong> (Konfirmasi ke Kasir Keuangan)
  </div>

  <table class="signatures">
    <tr>
      <td>
        <div style="color: #64748b;">Mengetahui,</div>
        <div style="color: #64748b;">Kepala Sekolah</div>
        <div class="space"></div>
        <div style="font-weight: 700; text-decoration: underline;">( ${settings.NAMA_KEPSEK || 'Kepala Sekolah'} )</div>
      </td>
      <td>
        <div style="color: #64748b;">Dicetak per ${todayStr}</div>
        <div style="color: #64748b;">Petugas Kasir Keuangan</div>
        <div class="space"></div>
        <div style="font-weight: 700; text-decoration: underline;">( ${settings.NAMA_BENDAHARA || 'Petugas Kasir'} )</div>
      </td>
    </tr>
  </table>

  <div class="footer-note">
    *Kartu ini merupakan dokumen sah riwayat pembayaran keuangan siswa. Simpan dengan baik.*
  </div>
</body>
</html>`;
}

/**
 * Executes Smart Print for the student card.
 */
export function executeStudentCardPrint(
  ledger: StudentLedger,
  settings: Settings
): { success: boolean; mode: 'iframe' | 'window' | 'pdf'; message?: string } {
  const printHtml = buildStudentCardPrintHtml(ledger, settings);

  try {
    const existing = document.getElementById('sikese-studentcard-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'sikese-studentcard-frame';
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
          attemptWindowOrPdf(ledger, settings);
        }
      }, 350);

      return { success: true, mode: 'iframe' };
    }
  } catch {
    // If iframe fails
  }

  return attemptWindowOrPdf(ledger, settings);
}

function attemptWindowOrPdf(
  ledger: StudentLedger,
  settings: Settings
): { success: boolean; mode: 'window' | 'pdf'; message?: string } {
  try {
    window.print();
    return { success: true, mode: 'window' };
  } catch {
    downloadStudentCardPdf(ledger, settings);
    return {
      success: true,
      mode: 'pdf',
      message: 'Pencetakan langsung dibatasi frame browser. Dokumen PDF Kartu Siswa berhasil diunduh!',
    };
  }
}
