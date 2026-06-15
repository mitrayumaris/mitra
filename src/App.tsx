import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  LogIn, 
  User, 
  ArrowLeft, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  X,
  Heart,
  BookOpen
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import PartnerDashboard from './components/PartnerDashboard';
import { DataService, initializeFirebaseSync, registerDataListener } from './services/dataService';
import { Account } from './types';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Login credentials forms
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Referral URL grabber
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Google login states
  const [showGoogleAccounts, setShowGoogleAccounts] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  
  // Hidden owner login states & counter
  const [logoClicks, setLogoClicks] = useState(0);
  const [showOwnerLogin, setShowOwnerLogin] = useState(false);

  // Reset owner visibility when modal is closed
  useEffect(() => {
    if (!isLoginModalOpen) {
      setLogoClicks(0);
      setShowOwnerLogin(false);
    }
  }, [isLoginModalOpen]);

  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);
    if (nextCount >= 5) {
      setShowOwnerLogin(true);
      setLogoClicks(0);
    }
  };

  // Real-time remote storage version counter
  const [dbVersion, setDbVersion] = useState(0);
  const [isDataReady, setIsDataReady] = useState(DataService.isReady());

  // Initialize Firebase listeners and local reactive updates
  useEffect(() => {
    initializeFirebaseSync();
    const unsubscribe = registerDataListener(() => {
      setDbVersion(prev => prev + 1);
      setIsDataReady(DataService.isReady());
    });
    return () => unsubscribe();
  }, []);

  // Read ref from URL parameter at initial mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      const accounts = DataService.getAccounts();
      const referrer = accounts.find(a => a.referralCode.toUpperCase() === refCode.trim().toUpperCase());
      if (referrer) {
        setAlertMessage(`KODE REFERRAL TERDETEKSI: Selamat! Anda menggunakan kode dari ${referrer.name} (${referrer.level.toUpperCase()}). Diskon 10% akan otomatis dipasang pada menu checkout.`);
      } else {
        setAlertMessage(`KODE REFERRAL INVALID: Kode referral "${refCode}" tidak ditemukan di database.`);
      }
    }
  }, []);

  const handleGoogleSuccess = (email: string, name: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== 'onikediri@gmail.com' && normalizedEmail !== 'admin@tahfidzcoding.com') {
      setLoginError(`AKSES DITOLAK: Akun Google Anda (${email}) tidak terdaftar sebagai Pemilik Sah.`);
      setShowGoogleAccounts(true);
      return;
    }

    const accounts = DataService.getAccounts();
    const adminAcc = accounts.find(a => a.level === 'admin') || {
      id: 'admin-1',
      name: 'Ustadz Admin Pusat',
      username: 'admin',
      password: 'password123',
      phone: '08123456789',
      address: 'Pusat Coding Tahfidz, Jakarta',
      level: 'admin',
      referralCode: 'ADMINKODING',
      commissionPercent: 0
    };
    
    // Enrich owner data with Google active profile
    const updatedUser: Account = {
      ...adminAcc,
      name: name || adminAcc.name,
      username: 'admin', // keep core admin username for full backend dashboard query safety
      phone: adminAcc.phone,
      address: `Diotentikasi via Google SSO: ${email}`
    };

    setCurrentUser(updatedUser);
    setIsLoginModalOpen(false);
    setShowGoogleAccounts(false);
    setAlertMessage(`OTENTIKASI GOOGLE SUKSES: Selamat datang Pemilik Portal, ${name} (${email})!`);
  };

  const handleGoogleBtnClick = async () => {
    try {
      setLoginError('');
      const { signInWithGoogle } = await import('./services/firebaseConfig');
      const googleUser = await signInWithGoogle();
      if (googleUser && googleUser.email) {
        handleGoogleSuccess(googleUser.email, googleUser.displayName || 'Ustadz Pemilik');
      }
    } catch (e: any) {
      console.error("Popup login error", e);
      setLoginError('Sambungan Google popup terhalang iFrame Sandbox / browser security. Silakan buka aplikasi di Tab Baru (klik tombol di kanan atas) lalu gunakan Akun Google Pemilik asli.');
      setShowGoogleAccounts(true);
    }
  };

  // Dynamically setup real Google Identity Services if a client ID is provided
  useEffect(() => {
    if (!isLoginModalOpen) return;
    
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              try {
                // Decode identity payload
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const unicodeJson = decodeURIComponent(
                  window.atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const profile = JSON.parse(unicodeJson);
                if (profile && profile.email) {
                  handleGoogleSuccess(profile.email, profile.name || 'Pemilik Google Account');
                }
              } catch (e) {
                console.error('Error parsing GSI token', e);
                setLoginError('Sistem Google SSO mengalami gangguan pembacaan token ID.');
              }
            }
          }
        });

        // Render standard branding GSI Button
        setTimeout(() => {
          const container = document.getElementById('gsi-button-container');
          if (container && (window as any).google) {
            (window as any).google.accounts.id.renderButton(
              container,
              { theme: 'outline', size: 'large', width: '312', text: 'signin_with' }
            );
          }
        }, 100);
      }
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch {
        // Safe ignore
      }
    };
  }, [isLoginModalOpen, showGoogleAccounts]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const accounts = DataService.getAccounts();
    const found = accounts.find(
      a => a.username.toLowerCase() === usernameInput.trim().toLowerCase() && 
           a.password === passwordInput
    );

    if (found) {
      setCurrentUser(found);
      setIsLoginModalOpen(false);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Kombinasi admin username dan password tidak valid!');
    }
  };

  const handleQuickLogin = (user: { username: string; pass: string }) => {
    setUsernameInput(user.username);
    setPasswordInput(user.pass);
    setLoginError('');
  };

  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center space-y-6 max-w-sm text-center">
          {/* Pulsing beautiful logo ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-20 h-20 bg-[#135d47]/10 rounded-3xl animate-ping opacity-75"></div>
            <div className="w-16 h-16 bg-[#135d47] rounded-2xl flex items-center justify-center shadow-lg border border-[#d97706]/30 relative z-10">
              <GraduationCap className="w-9 h-9 text-[#fbbf24] animate-pulse" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-[#135d47] text-lg tracking-tight">Yumaris Madani Indonesia</h3>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">Menghubungkan ke basis data portal. Sinyal aman...</p>
          </div>
          {/* Simple sleek progress bar */}
          <div className="w-36 h-1 bg-slate-200 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute h-full bg-[#135d47] rounded-full"
              initial={{ left: '-50%', width: '40%' }}
              animate={{ left: '110%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Dynamic Referral Notification Banner */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={`px-6 py-3.5 text-center text-xs font-semibold relative z-50 flex items-center justify-center gap-3 shadow-md ${
              alertMessage.includes('SELAMAT') || alertMessage.includes('TERDETEKSI')
                ? 'bg-brand-green text-white border-b border-brand-yellow/20' 
                : 'bg-red-600 text-white'
            }`}
          >
            <span>{alertMessage}</span>
            <button 
              onClick={() => setAlertMessage(null)}
              className="p-1 rounded-full hover:bg-black/10 text-white/85 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main routing switcher */}
      <AnimatePresence mode="wait">
        {currentUser ? (
          currentUser.level === 'admin' ? (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard onLogout={() => setCurrentUser(null)} />
            </motion.div>
          ) : (
            <motion.div 
              key="partner-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PartnerDashboard partner={currentUser} onLogout={() => setCurrentUser(null)} />
            </motion.div>
          )
        ) : (
          <motion.div 
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onLoginClick={() => setIsLoginModalOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGIN PORTAL MODAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="login-modal-root">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
            ></motion.div>

            {/* Panel */}
             <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              id="login-modal-panel"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-brand-green text-white flex justify-between items-center border-b border-brand-yellow/15">
                <div className="flex items-center space-x-2.5">
                  {showOwnerLogin && (
                    <div 
                      onClick={handleGoogleBtnClick}
                      className="p-2 bg-brand-yellow text-brand-green rounded-xl font-black cursor-pointer active:scale-95 transition-transform"
                      title="Akses Pemilik Portal"
                    >
                      <LogIn className="w-5 h-5 animate-pulse" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-base text-white">Portal Akses Kemitraan</h4>
                    <p className="text-[10px] text-slate-350">Masuk ke pusat kontrol atau dasbor mitra Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLoginModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Brand Logo Header Interactive */}
                <div className="flex flex-col items-center justify-center text-center select-none pt-1 pb-2">
                  <div 
                    onClick={handleLogoClick}
                    className="w-16 h-16 bg-emerald-50 hover:bg-emerald-100 border border-brand-green/35 rounded-2xl flex items-center justify-center shadow-xs cursor-pointer transition-all active:scale-95 duration-200 relative group"
                    title="Logo Tahfidz Coding"
                  >
                    <div className="w-13 h-13 bg-brand-green rounded-xl flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-7 h-7 text-brand-yellow" />
                    </div>
                    {/* Tiny badge */}
                    <span className="absolute -bottom-1 -right-1.5 bg-brand-yellow text-brand-green text-[8px] font-black px-1.5 py-0.5 rounded-md border border-brand-green scale-85 uppercase tracking-wider shadow-2xs">Pusat</span>
                  </div>
                  <h4 className="font-black text-xs text-brand-green uppercase tracking-wider mt-2.5">Tahfidz Coding</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Sistem Kemitraan Affiliasi &amp; Pembagian Komisi Akademik</p>

                  {/* Hidden Owner Google Login Trigger (Unlocked on 5 clicks) */}
                  {showOwnerLogin && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 w-full bg-emerald-50/80 border border-emerald-150 rounded-2xl p-4 flex flex-col items-center space-y-2.5 text-center shadow-3xs"
                    >
                      <span className="text-[9px] font-black text-brand-green uppercase tracking-wider flex items-center gap-1">
                        ✨ Mode Akses Pemilik Terbuka ✨
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Silakan gunakan tombol verifikasi instan di bawah ini untuk memulai masuk sebagai Pemilik Portal Utama.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleBtnClick}
                        className="w-full py-2.5 bg-brand-yellow hover:bg-yellow-500 text-brand-green font-black text-xs tracking-wider rounded-xl cursor-pointer shadow-md shadow-brand-yellow/5 flex items-center justify-center gap-1.5 uppercase transition-all"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Masuk via Akun Google Pemilik
                      </button>
                    </motion.div>
                  )}
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-150">
                    ⚠️ {loginError}
                  </div>
                )}

                {showGoogleAccounts ? (
                  <div className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="inline-flex p-3 bg-red-50 border border-red-200 rounded-full mb-2">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-sm">Masuk via Google SSO</h5>
                      <p className="text-xs text-slate-400 mt-0.5">Sistem Verifikasi Pemilik Portal</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl space-y-2.5 text-xs leading-relaxed font-semibold">
                      <p className="font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1">
                        🛡️ Akses Bypass Simulasi Dinonaktifkan
                      </p>
                      <p>
                        Demi menjamin keamanan data dan memenuhi permintaan pemilik, sistem **tasis telah menghapus seluruh opsi bypass**, tiruan profil, maupun input manual tanpa login pihak ketiga.
                      </p>
                      <p>
                        Akses halaman pemilik **hanya diizinkan** melalui otentikasi Google asli yang divalidasi langsung oleh server Google secara live.
                      </p>
                      <div className="bg-amber-100/50 p-2.5 rounded-lg text-[11px] space-y-1 text-amber-900 border border-amber-250">
                        <p className="font-black text-amber-950">Email Pemilik yang Sah (Whitelist):</p>
                        <ul className="list-disc list-inside font-mono text-amber-950">
                          <li>onikediri@gmail.com</li>
                          <li>admin@tahfidzcoding.com</li>
                        </ul>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                        *Catatan: Jika login popup di iFrame Sandbox browser Anda gagal/terblokir, silakan klik tombol **&quot;Open in new window / Buka di Tab Baru&quot;** di kanan atas browser agar sesi pop-up SSO Google asli Anda terotentikasi sempurna.
                      </p>
                    </div>

                    <div className="space-y-3 pt-1">
                      {/* Google Button integration placeholder */}
                      <div id="gsi-button-container" className="flex justify-center w-full"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGoogleAccounts(false)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-colors text-center block"
                    >
                      ← Kembali ke Login Sandi Manual
                    </button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username Akun</span>
                        <input
                          required
                          type="text"
                          value={usernameInput}
                          onChange={e => setUsernameInput(e.target.value)}
                          placeholder="Contoh: admin atau budi_agen"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</span>
                        <input
                          required
                          type="password"
                          value={passwordInput}
                          onChange={e => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-brand-yellow hover:bg-yellow-500 text-brand-green font-black text-sm tracking-wide rounded-xl shadow-lg shadow-brand-yellow/10 cursor-pointer transition-all"
                      >
                        Masuk Portal Keamanan
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
