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
      // Fallback with visual selection menu and guidance
      setLoginError('Sambungan Google popup terhalang iFrame Sandbox / browser security. Silakan pilih salah satu simulasi profil di bawah.');
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
                  <div className="space-y-5">
                    <div className="text-center pb-2">
                      <div className="inline-flex p-3 bg-slate-50 border border-slate-150 rounded-full mb-2">
                        <svg className="w-8 h-8" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fillRule="evenodd" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                      </div>
                      <h5 className="font-extrabold text-slate-900 text-sm">Masuk via Google SSO</h5>
                      <p className="text-xs text-slate-400 mt-0.5">Verifikasi Instan Akun Pemilik Portal</p>
                    </div>

                    <div className="space-y-3">
                      {/* Principal Owner Google Acc */}
                      <button
                        type="button"
                        onClick={() => handleGoogleSuccess('onikediri@gmail.com', 'Ustadz Owner (onikediri)')}
                        className="w-full p-4 border border-slate-200 hover:border-brand-green/30 hover:bg-slate-50/50 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 text-brand-green font-black rounded-xl flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform">
                            O
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-800">onikediri@gmail.com</p>
                            <p className="text-[10px] text-brand-green font-bold mt-0.5">Akun Google Pemilik (Utama)</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-brand-green/10 text-brand-green font-extrabold px-2 py-1 rounded-lg border border-brand-green/10 uppercase group-hover:bg-brand-green group-hover:text-white transition-all">PILIH</span>
                      </button>

                      {/* Alternate Owner Account */}
                      <button
                        type="button"
                        onClick={() => handleGoogleSuccess('admin@tahfidzcoding.com', 'Admin Pusat')}
                        className="w-full p-4 border border-slate-200 hover:border-brand-green/30 hover:bg-slate-50/50 rounded-2xl text-left transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-100 text-amber-700 font-extrabold rounded-xl flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform">
                            A
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-800">admin@tahfidzcoding.com</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Email Cadangan Admin Pusat</p>
                          </div>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-1 rounded-lg border border-slate-150 uppercase group-hover:bg-brand-green group-hover:text-white transition-all">PILIH</span>
                      </button>

                      {/* Google Button integration placeholder */}
                      <div id="gsi-button-container" className="flex justify-center w-full"></div>

                      {/* Custom google email input selector */}
                      <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/30 space-y-2.5">
                        <span className="text-[10px] font-extrabold text-slate-450 uppercase block tracking-wider">Gunakan Akun Google Lain</span>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="Contoh: ustadz.baru@gmail.com"
                            value={customGoogleEmail}
                            onChange={e => setCustomGoogleEmail(e.target.value)}
                            className="flex-grow px-3 py-2 border border-slate-200 bg-white text-slate-850 rounded-xl text-xs outline-none focus:border-brand-green"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customGoogleEmail.includes('@')) {
                                handleGoogleSuccess(customGoogleEmail, customGoogleEmail.split('@')[0]);
                              } else {
                                alert('Harap masukkan alamat email Google yang valid!');
                              }
                            }}
                            className="bg-brand-green hover:bg-brand-green/95 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer shadow-sm transition-colors"
                          >
                            Masuk
                          </button>
                        </div>
                      </div>
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
