import { FinanceEngine } from './storage';

/**
 * Jembatan Komunikasi (API Bridge) antara Frontend React dan Backend Google Apps Script (GAS)
 */
export class GasApiService {
  /**
   * Dapatkan URL Web App GAS aktif (dari konfigurasi pengguna atau file .env)
   */
  public static getGasUrl(): string {
    const configuredUrl = FinanceEngine.getGasUrl();
    if (configuredUrl) return configuredUrl.trim();

    // Fallback dari Vite Environment Variable jika ada
    const envUrl = (import.meta as any).env?.VITE_GAS_API_URL;
    if (envUrl) return String(envUrl).trim();

    return '';
  }

  /**
   * Cek apakah koneksi ke Google Apps Script aktif
   */
  public static isConnected(): boolean {
    const url = this.getGasUrl();
    return Boolean(url && url.startsWith('https://script.google.com/macros/s/'));
  }

  /**
   * Panggil API Google Apps Script (POST)
   * Menggunakan 'text/plain;charset=utf-8' untuk menghindari CORS Preflight (OPTIONS)
   */
  public static async post<T = any>(action: string, payload: any = {}): Promise<T> {
    const gasUrl = this.getGasUrl();
    if (!gasUrl) {
      throw new Error('URL Google Apps Script belum dikonfigurasi di menu Pengaturan!');
    }

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, payload })
      });

      if (!response.ok) {
        throw new Error(`Server error HTTP ${response.status}`);
      }

      const res = await response.json();
      if (res.status === 'error') {
        throw new Error(res.message || 'Terjadi kesalahan pada backend GAS');
      }

      return res.data as T;
    } catch (err: any) {
      console.error(`Gagal memanggil GAS action [${action}]:`, err);
      throw err;
    }
  }

  /**
   * Panggil API Google Apps Script (GET)
   */
  public static async get<T = any>(action: string, params: Record<string, string> = {}): Promise<T> {
    const gasUrl = this.getGasUrl();
    if (!gasUrl) {
      throw new Error('URL Google Apps Script belum dikonfigurasi di menu Pengaturan!');
    }

    try {
      const query = new URLSearchParams({ action, ...params }).toString();
      const finalUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}${query}`;

      const response = await fetch(finalUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Server error HTTP ${response.status}`);
      }

      const res = await response.json();
      if (res.status === 'error') {
        throw new Error(res.message || 'Terjadi kesalahan pada backend GAS');
      }

      return res.data as T;
    } catch (err: any) {
      console.error(`Gagal memanggil GAS action [${action}]:`, err);
      throw err;
    }
  }

  /**
   * Uji koneksi (Ping)
   */
  public static async testConnection(url?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = url ? url.trim() : this.getGasUrl();
    if (!targetUrl) {
      return { success: false, message: 'URL Web App GAS masih kosong.' };
    }

    try {
      const finalUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=ping`;
      const response = await fetch(finalUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        return { success: false, message: `Gagal HTTP ${response.status}: Periksa izin deployment Web App.` };
      }

      const res = await response.json();
      if (res.status === 'success' && res.data?.pong) {
        return { success: true, message: 'Koneksi ke Google Apps Script berhasil terhubung!' };
      }
      return { success: false, message: 'Respon server tidak sesuai format yang diharapkan.' };
    } catch (err: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message}. Pastikan izin deployment diatur ke 'Anyone' (Siapa saja).`
      };
    }
  }
}
