import React, { useState, useEffect } from 'react';
import { UserSession, Settings, StudentLedger } from './types';
import { FinanceEngine } from './services/storage';
import { CurtainLogin } from './components/CurtainLogin';
import { Navbar } from './components/Navbar';
import { KasirTab } from './components/KasirTab';
import { DashboardTab } from './components/DashboardTab';
import { CashBookTab } from './components/CashBookTab';
import { StudentLedgerTab } from './components/StudentLedgerTab';
import { SettingsTab } from './components/SettingsTab';
import { CodeExportTab } from './components/CodeExportTab';
import { TutorialTab } from './components/TutorialTab';
import { ReceiptModal } from './components/ReceiptModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { StudentCardModal } from './components/StudentCardModal';
import { CODE_GS_RAW, INDEX_HTML_RAW } from './data/rawCode';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('transaksi');
  const [settings, setSettings] = useState<Settings>(FinanceEngine.getSettings());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mode Gelap (Dark Mode) / Mode Terang (Light Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sikese_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('sikese_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('sikese_theme', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Modal Receipt
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Modal Student Card
  const [selectedCardLedger, setSelectedCardLedger] = useState<StudentLedger | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Modal WhatsApp Billing
  const [whatsAppModal, setWhatsAppModal] = useState<{
    isOpen: boolean;
    phone: string;
    studentName: string;
    message: string;
  }>({
    isOpen: false,
    phone: '',
    studentName: '',
    message: ''
  });

  const handleLoginSuccess = (session: UserSession) => {
    setUser(session);
    if (!session.permissions.canTransaction) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('transaksi');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handlePaymentComplete = (receipt: any) => {
    setReceiptData(receipt);
    setIsReceiptOpen(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenWhatsAppBilling = (ledger: StudentLedger) => {
    const message = FinanceEngine.buildWhatsAppBillingNotice(ledger, settings);
    setWhatsAppModal({
      isOpen: true,
      phone: ledger.siswa.noHpWali || '',
      studentName: ledger.siswa.nama,
      message
    });
  };

  const handleSettingsUpdated = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      
      {/* 1. CURTAIN LOGIN WITH PIN */}
      {!user && (
        <CurtainLogin
          onLoginSuccess={handleLoginSuccess}
          isDark={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* 2. TOP NAVBAR */}
      {user && (
        <Navbar
          user={user}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          schoolName={settings.NAMA_SEKOLAH}
          isDark={isDarkMode}
          onToggleTheme={handleToggleTheme}
        />
      )}

      {/* 3. MAIN CONTENT VIEWPORT */}
      {user && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'transaksi' && user.permissions.canTransaction && (
            <KasirTab
              user={user}
              settings={settings}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              key={refreshTrigger}
              onOpenWhatsAppBilling={handleOpenWhatsAppBilling}
            />
          )}

          {activeTab === 'bukuKas' && (
            <CashBookTab
              user={user}
              settings={settings}
              onRefreshData={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}

          {activeTab === 'tabungan' && (
            <StudentLedgerTab
              settings={settings}
              onOpenWhatsAppBilling={handleOpenWhatsAppBilling}
              onOpenPrintCard={(ledger) => {
                setSelectedCardLedger(ledger);
                setIsCardModalOpen(true);
              }}
            />
          )}

          {activeTab === 'pengaturan' && (
            <SettingsTab
              settings={settings}
              user={user}
              onSettingsUpdated={handleSettingsUpdated}
            />
          )}

          {activeTab === 'tutorial' && (
            <TutorialTab />
          )}

          {activeTab === 'codeGas' && (
            <CodeExportTab
              codeGsContent={CODE_GS_RAW}
              indexHtmlContent={INDEX_HTML_RAW}
            />
          )}
        </main>
      )}

      {/* 4. MODALS */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={receiptData}
        settings={settings}
      />

      <StudentCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        ledger={selectedCardLedger}
        settings={settings}
        onOpenWhatsApp={handleOpenWhatsAppBilling}
      />

      <WhatsAppModal
        isOpen={whatsAppModal.isOpen}
        onClose={() => setWhatsAppModal((prev) => ({ ...prev, isOpen: false }))}
        phone={whatsAppModal.phone}
        studentName={whatsAppModal.studentName}
        initialMessage={whatsAppModal.message}
      />

      {/* Footer subtle text */}
      {user && (
        <footer className="no-print py-4 text-center text-xs text-slate-600 border-t border-slate-200 bg-white">
          <p>
            <strong>SiKeSe (Sistem Keuangan Sekolah)</strong> &copy; {new Date().getFullYear()} · Terintegrasi Cloud Google Sheets &amp; Apps Script
          </p>
        </footer>
      )}

    </div>
  );
}
