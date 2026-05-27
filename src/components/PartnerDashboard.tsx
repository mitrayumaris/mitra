import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  BookOpen, 
  DollarSign, 
  Send, 
  CheckCircle, 
  CreditCard, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  Plus, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronRight, 
  Calendar,
  Layers,
  Heart,
  BookOpenCheck
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Account, Product, Transaction, WithdrawalRequest, TahfidzProgress } from '../types';
import { getDirectDriveUrl } from '../utils/drive';

interface PartnerDashboardProps {
  partner: Account;
  onLogout: () => void;
}

export default function PartnerDashboard({ partner, onLogout }: PartnerDashboardProps) {
  // Sync States
  const [products, setProducts] = useState<Product[]>(DataService.getProducts());
  const [balances, setBalances] = useState(DataService.getPartnerBalances(partner.id));

  // Current tab inside dashboard (products, reports)
  const [activeTab, setActiveTab] = useState<'products' | 'reports'>('products');

  // Copy referral status
  const [copied, setCopied] = useState(false);

  // Local Form state - customer purchase
  const [selectedProdIds, setSelectedProdIds] = useState<string[]>([]);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddr, setCustAddr] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  // Local Form state - Withdraw command
  const [wdAmount, setWdAmount] = useState<number>(0);
  const [wdSuccess, setWdSuccess] = useState(false);
  const [wdError, setWdError] = useState('');

  const refreshDashboardData = () => {
    setProducts(DataService.getProducts());
    setBalances(DataService.getPartnerBalances(partner.id));
  };

  useEffect(() => {
    refreshDashboardData();
  }, [partner.id]);

  // Copy referral link to clipboard
  const handleCopyLink = () => {
    const link = `${window.location.origin}/?ref=${partner.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Submit purchase as referral owner
  const handleDirectPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProdIds.length === 0 || !custName || !custPhone || !custAddr) {
      alert('Mohon isi semua data pembeli dan pilih minimal 1 program!');
      return;
    }

    setIsBuying(true);

    const productsToBuy = products.filter(p => selectedProdIds.includes(p.id));

    setTimeout(() => {
      DataService.createTransaction({
        buyerName: custName,
        buyerPhone: custPhone,
        buyerAddress: custAddr,
        products: productsToBuy,
        // Placing partner's referral code automatically to direct cash splits to network
        referralCode: partner.referralCode
      });

      setIsBuying(false);
      setBuySuccess(true);
      setSelectedProdIds([]);
      setCustName('');
      setCustPhone('');
      setCustAddr('');
      refreshDashboardData();

      setTimeout(() => setBuySuccess(false), 4000);
    }, 1200);
  };

  // Trigger withdrawal command
  const handleRequestWD = (e: React.FormEvent) => {
    e.preventDefault();
    if (wdAmount <= 0) {
      setWdError('Jumlah pencairan harus lebih dari Rp 0');
      return;
    }
    if (wdAmount > balances.balance) {
      setWdError('Saldo Anda tidak mencukupi untuk penarikan sebesar ini.');
      return;
    }

    DataService.createWithdrawal(partner.id, wdAmount);
    setWdAmount(0);
    setWdError('');
    setWdSuccess(true);
    refreshDashboardData();

    setTimeout(() => setWdSuccess(false), 4000);
  };

  const handleProductCheckbox = (id: string) => {
    setSelectedProdIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Fetching all transactions in which this partner receives a commission split
  const myTransactions = DataService.getTransactions().filter(tx =>
    tx.commissions.some(c => c.recipientId === partner.id)
  );

  // Calculating total referral sales done
  const myReferralsCount = myTransactions.filter(tx => tx.status === 'verified').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans" id="partner-container">
      {/* Top Banner Header with User branding */}
      <header className="bg-brand-green text-white py-6 px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-yellow/15 shadow-md shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-brand-yellow text-brand-green rounded-2xl shadow-md shadow-brand-green/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl text-white leading-tight">{partner.name}</h1>
              <span className="inline-flex py-0.5 px-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30">
                {partner.level === 'mitra' ? 'Level 1: Mitra Utama' : partner.level === 'submitra' ? 'Level 2: Sub-Mitra' : 'Level 3: Agen'}
              </span>
            </div>
            <p className="text-xs text-slate-350 mt-1">Sistem Penjualan Multi-Level Terpadu Nilai-Nilai Tahfidz Berbasis Coding &amp; AI</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick tabs selection */}
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 sm:px-4.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products' ? 'bg-brand-yellow text-brand-green shadow font-black' : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Menu Produk &amp; Transaksi
          </button>
          
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 sm:px-4.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-brand-yellow text-brand-green shadow font-black' : 'bg-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            Laporan Kemitraan
          </button>

          <button 
            onClick={onLogout}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/15 hover:text-red-300 border border-white/20 rounded-xl text-[11px] sm:text-xs font-bold text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Body content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-10" id="partner-view">
        {activeTab === 'products' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Referral Link setup & Direct Buy Form */}
            <div className="space-y-6 lg:col-span-1">
              {/* Box 1: Referral Link */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Link Referral Anda</h4>
                  <span className="text-xs font-mono font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded border border-brand-green/20">{partner.referralCode}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Sebarkan link atau kode referral milik Anda. Pendaftar baru yang bertransaksi akan otomatis diskon 10% dan komisi akan dialirkan langsung ke saldo dompet Anda.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-grow inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-brand-green text-slate-700 hover:text-brand-green font-bold text-xs bg-slate-50 hover:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-brand-green" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin Link Referral
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Box 2: Direct Buy Form */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">Daftarkan Konsumen (Daftar Cepat)</h4>
                  <p className="text-xs text-slate-550 mt-0.5 font-medium text-slate-450">Punya calon santri? Input langsung data mereka untuk mendaftar.</p>
                </div>

                {buySuccess && (
                  <div className="p-3.5 bg-brand-green/10 border border-brand-green/15 rounded-xl flex items-center gap-2.5 text-xs text-brand-green">
                    <CheckCircle className="w-5 h-5 shrink-0 text-brand-green" />
                    <p>Siswa sukses didaftarkan! Status pendaftaran akan menunggu verifikasi pembayaran di Admin Pusat.</p>
                  </div>
                )}

                <form onSubmit={handleDirectPurchase} className="space-y-4">
                  {/* Select program checkboxes */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-450 uppercase block">Pilih Kelas Akademik</span>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                      {products.map(p => (
                        <label key={p.id} className="flex items-start gap-2.5 p-1.5 cursor-pointer hover:bg-white rounded hover:shadow-xs transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedProdIds.includes(p.id)}
                            onChange={() => handleProductCheckbox(p.id)}
                            className="mt-1 h-3.5 w-3.5 rounded text-brand-green focus:ring-brand-green focus:border-brand-green"
                          />
                          <div className="text-xs">
                            <p className="font-bold text-slate-800">{p.name}</p>
                            <p className="text-slate-400">Pangkal: {formatPrice(p.admissionFee || 0)} | Reg: {formatPrice(p.regFee)} | SPP: {formatPrice(p.monthlyFee)}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Customer information */}
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-600">Nama Lengkap Siswa</span>
                      <input
                        required
                        type="text"
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-600">Nomor HP / WA</span>
                      <input
                        required
                        type="text"
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        placeholder="0812345..."
                        className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-600">Alamat Domisili</span>
                      <textarea
                        required
                        rows={2}
                        value={custAddr}
                        onChange={e => setCustAddr(e.target.value)}
                        placeholder="Alamat Lengkap"
                        className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none resize-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBuying || selectedProdIds.length === 0}
                    className="w-full py-2.5 bg-brand-green hover:bg-brand-green/95 disabled:bg-slate-350 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                  >
                    {isBuying ? 'Mendaftarkan...' : 'Kirim Pendaftaran Siswa'}
                  </button>
                </form>
              </div>
            </div>

            {/* Column 2: Educational Programs Catalog grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Katalog Program &amp; Lembaga</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {products.map(prod => (
                    <div key={prod.id} className="border border-slate-150 rounded-2xl overflow-hidden hover:border-brand-green/25 transition-all flex flex-col h-full bg-slate-50/20 group">
                      <div className="h-40 bg-slate-100 relative">
                        <img 
                          src={getDirectDriveUrl(prod.imageSrc)} 
                          alt="class" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-350"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                        <span className="absolute top-2 left-2 bg-brand-green text-white text-[9px] font-bold py-0.5 px-2 rounded tracking-wider uppercase">
                          {prod.category}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-brand-green transition-colors">{prod.name}</h4>
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{prod.description}</p>
                        </div>
                        
                        <div className="border-t border-slate-100 pt-3.5 mt-4 space-y-1 text-xs font-semibold">
                          <div className="flex justify-between">
                            <span className="text-slate-450 font-medium text-brand-green">Uang Pangkal</span>
                            <span className="font-extrabold text-slate-900">{formatPrice(prod.admissionFee || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-450 font-medium">Registrasi Mandiri</span>
                            <span className="font-bold text-slate-800">{formatPrice(prod.regFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-450 font-medium">Bimbingan Bulanan (SPP)</span>
                            <span className="font-bold text-slate-950">{formatPrice(prod.monthlyFee)}</span>
                          </div>
                          <div className="flex justify-between text-rose-500 font-medium">
                            <span className="text-slate-450 font-medium">Potongan Referral</span>
                            <span className="font-bold text-rose-600">-{formatPrice(prod.referralDiscount || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reports tab contents */}
            
            {/* Column 1: Financial statements & withdrawal trigger */}
            <div className="space-y-6 lg:col-span-1">
              {/* Saldo details card */}
              <div className="bg-brand-green text-white rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden border border-brand-yellow/15 animate-fade-in">
                <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-brand-yellow/10 pointer-events-none">
                  <CreditCard className="w-36 h-36" />
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-xs text-brand-yellow font-bold uppercase tracking-widest block">Dompet Afiliasi</span>
                  <p className="text-3xl font-black">{formatPrice(balances.balance)}</p>
                  <p className="text-[10px] text-slate-300">Saldo yang dapat dicairkan langsung ke perbankan.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs relative z-10">
                  <div>
                    <span className="text-slate-300 block">Komisi Total</span>
                    <span className="font-bold text-sm block text-brand-yellow">{formatPrice(balances.earned)}</span>
                  </div>
                  <div>
                    <span className="text-slate-300 block">Pending Verif</span>
                    <span className="font-bold text-sm block text-amber-300">{formatPrice(balances.pendingEarned)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5 flex justify-between">
                    <span className="text-[10px] text-slate-200">Dana Sudah Cair:</span>
                    <span className="text-[10px] font-bold text-white font-mono">{formatPrice(balances.withdrawn)}</span>
                  </div>
                </div>
              </div>

              {/* Withdraw request triggers */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-brand-green" /> Tarik Saldo Komisi
                </h4>

                {wdSuccess && (
                  <div className="p-3 bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-brand-green" />
                    <span>Pengajuan WD dikirim, sedang waiting antrean transfer admin!</span>
                  </div>
                )}

                {wdError && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <span>❌ {wdError}</span>
                  </div>
                )}

                <form onSubmit={handleRequestWD} className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Jumlah Penarikan (Rp)</span>
                    <input
                      required
                      type="number"
                      value={wdAmount}
                      onChange={e => setWdAmount(parseInt(e.target.value) || 0)}
                      placeholder="Contoh: 50000"
                      className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none font-semibold focus:border-brand-green focus:ring-1 focus:ring-brand-green/10"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-brand-green hover:bg-brand-green/95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                  >
                    Ajukan Penarikan Dana
                  </button>
                </form>
              </div>

              {/* Sales Statistics tracker in this block */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-brand-green" /> Indikator Aktivitas Dunawi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Siswa Direferal</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">{myReferralsCount}</span>
                    <span className="text-[9px] text-slate-400">Terverifikasi</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Rasio Komisi</span>
                    <span className="text-xl font-black text-slate-900 block mt-1">{partner.commissionPercent}%</span>
                    <span className="text-[9px] text-brand-green">Per Pendaftaran</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Spiritual Feature (Quran memorization / Tahfidz tracking) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <span className="text-brand-green font-bold text-xs flex items-center gap-1 leading-none uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow inline" /> Syiar &amp; Dakwah Kebaikan
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none">Inspirasi &amp; Motivasi Syiar Akademik</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">Mari tingkatkan semangat berdakwah dengan menyebarkan informasi program pendidikan ini untuk mencetak generasi Qur'ani yang unggul di bidang teknologi.</p>
                </div>

                {/* Motivational Verses and Hadith grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 space-y-3">
                    <span className="inline-flex py-0.5 px-2 bg-brand-green/10 text-brand-green text-[10px] font-bold rounded-lg uppercase">Hadits Riwayat Muslim</span>
                    <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                      "Barangsiapa yang menunjuki kepada kebaikan maka dia akan mendapatkan pahala seperti pahala orang yang mengerjakannya."
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Setiap santri yang mendaftar melalui wasilah (rekomendasi) Anda akan belajar menghafalkan ayat suci Al-Qur'an sekaligus belajar coding. Pahala kebaikan yang mereka lakukan akan terus mengalir tanpa mengurangi pahala mereka sedikit pun.
                    </p>
                  </div>

                  <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-5 space-y-3">
                    <span className="inline-flex py-0.5 px-2 bg-brand-green/10 text-brand-green text-[10px] font-bold rounded-lg uppercase">QS. Al-Mujadilah: 11</span>
                    <p className="text-sm font-semibold text-slate-800 italic leading-relaxed">
                      "Allah akan meninggikan orang-orang yang beriman di antaramu dan orang-orang yang diberi ilmu pengetahuan beberapa derajat."
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Program Tahfidz + Coding didesain agar santri tidak hanya matang secara spiritual, melainkan juga tangguh bersaing di kancah global. Anda berperan penting dalam membuka jalan kemuliaan ilmu ini bagi masa depan mereka.
                    </p>
                  </div>
                </div>

                {/* Additional inspiring quote from the scholars */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Mengapa Rekomendasi Anda Sangat Berarti?
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Umat Islam hari ini membutuhkan kader-kader da'i yang melek teknologi (Ulama-Programmer). Dengan berperan aktif menginformasikan program kami kepada sanak saudara, tetangga, maupun jamaah pengajian:
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-750">
                    <li className="flex gap-2 items-start bg-white p-3 rounded-xl border border-slate-150">
                      <span className="text-brand-green text-sm">💡</span>
                      <div>
                        <strong className="font-bold text-slate-800">Menyelamatkan Gadget Use</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">Mengarahkan waktu bermain gadget anak ke aktivitas berhafalan &amp; ngoding logis.</p>
                      </div>
                    </li>
                    <li className="flex gap-2 items-start bg-white p-3 rounded-xl border border-slate-150">
                      <span className="text-brand-green text-sm">🤝</span>
                      <div>
                        <strong className="font-bold text-slate-800">Menyediakan Solusi Diskon</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">Pendaftar menghemat biaya registrasi berkat potongan referral aktif Anda secara otomatis.</p>
                      </div>
                    </li>
                    <li className="flex gap-2 items-start bg-white p-3 rounded-xl border border-slate-150">
                      <span className="text-brand-green text-sm">📈</span>
                      <div>
                        <strong className="font-bold text-slate-800">Ulama Masa Depan</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">Menyiapkan santri yang hafal Kalam-Nya sekaligus andal membuat solusi teknologi syariah.</p>
                      </div>
                    </li>
                    <li className="flex gap-2 items-start bg-white p-3 rounded-xl border border-slate-150">
                      <span className="text-brand-green text-sm">🕌</span>
                      <div>
                        <strong className="font-bold text-slate-800">Syiar Tanpa Riba</strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">Membangun ekonomi umat yang adil, jujur, transparan melalui komisi terkelola syariah.</p>
                      </div>
                    </li>
                  </ul>
                  
                  {/* Footer call to action */}
                  <div className="bg-brand-green text-white p-4.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-brand-yellow">Bagikan Sekarang &amp; Raih Berkahnya!</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Setiap langkah kebaikan Anda mengantarkan anak didik menuju keshalihan digital.</p>
                    </div>
                    <button 
                      onClick={handleCopyLink}
                      className="inline-flex py-1.5 px-3.5 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-green font-extrabold text-xs rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap self-start md:self-auto"
                    >
                      {copied ? 'Link Tersalin!' : 'Copy Link Refferalku'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real Transactions Breakdown and Commission History */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-brand-green font-bold text-xs flex items-center gap-1 leading-none uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-brand-green inline" /> Laporan Riil Keuangan &amp; Syiar
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none">Rincian Transaksi &amp; Aliran Komisi Riil</h3>
                  <p className="text-xs text-slate-500 mt-1">Laporan transparan seluruh pencatatan transaksi masuk, status verifikasi administrasi, dan besaran komisi yang Anda peroleh sesuai skema.</p>
                </div>

                {myTransactions.length === 0 ? (
                  <div className="py-12 bg-slate-50 text-center text-slate-400 rounded-2xl border border-slate-150 text-xs">
                    Belum ada riwayat transaksi pendaftaran yang menggunakan kode referral Anda atau dari jaringan Anda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="py-3 px-4">Calon Santri</th>
                          <th className="py-3 px-4">Program Pilihan</th>
                          <th className="py-3 px-4">Tanggal</th>
                          <th className="py-3 px-4 text-right">Potongan Reff</th>
                          <th className="py-3 px-4 text-right">Komisi Anda</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTransactions.map(tx => {
                          const myComm = tx.commissions.find(c => c.recipientId === partner.id);
                          const commAmount = myComm ? myComm.amount : 0;
                          const commPercent = myComm ? myComm.percentage : 0;
                          
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 text-xs transition-colors">
                              <td className="py-3.5 px-4">
                                <p className="font-extrabold text-slate-900">{tx.buyerName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.buyerPhone}</p>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-650 max-w-44 truncate">
                                {tx.products.map(p => p.productName).join(', ')}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">
                                {new Date(tx.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="py-3.5 px-4 text-right text-rose-600 font-bold">
                                -{formatPrice(tx.discountAmount || 0)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-brand-green">
                                {formatPrice(commAmount)}
                                <span className="block text-[9px] text-slate-430 font-normal mt-0.5">({commPercent}%)</span>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex py-1 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wide leading-none border ${
                                  tx.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  tx.status === 'verified' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  'bg-rose-100 text-rose-800 border-rose-200'
                                }`}>
                                  {tx.status === 'pending' ? 'Tunda' : tx.status === 'verified' ? 'Disetujui' : 'Ditolak'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
