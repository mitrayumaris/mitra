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
  ChevronLeft,
  Calendar,
  Layers,
  Heart,
  BookOpenCheck,
  X,
  Minus,
  BookMarked
} from 'lucide-react';
import { DataService, registerDataListener } from '../services/dataService';
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

  // Checkout State
  const [cart, setCart] = useState<(Product & { quantity: number })[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddr, setCustAddr] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  const getProductQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  const updateProductQuantity = (productId: string, val: number) => {
    const newVal = Math.max(1, val);
    setQuantities(prev => ({
      ...prev,
      [productId]: newVal
    }));
    
    // Also update cart quantity if it's already in the cart!
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newVal } : item
    ));
  };

  const toggleCartItem = (product: Product) => {
    setCart(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        // Automatically open checkout drawer to make a transaction
        setIsCheckoutOpen(true);
        const qty = getProductQuantity(product.id);
        return [...prev, { ...product, quantity: qty }];
      }
    });
  };

  const toggleDescription = (id: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
    const unsubscribe = registerDataListener(() => {
      refreshDashboardData();
    });
    return () => unsubscribe();
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
    if (cart.length === 0 || !custName || !custPhone || !custAddr) {
      alert('Mohon isi semua data pembeli dan pilih minimal 1 program!');
      return;
    }

    setIsBuying(true);

    setTimeout(() => {
      DataService.createTransaction({
        buyerName: custName,
        buyerPhone: custPhone,
        buyerAddress: custAddr,
        products: cart,
        // Placing partner's referral code automatically to direct cash splits to network
        referralCode: partner.referralCode
      });

      setIsBuying(false);
      setBuySuccess(true);
      setCart([]);
      setCustName('');
      setCustPhone('');
      setCustAddr('');
      setIsCheckoutOpen(false);
      refreshDashboardData();

      setTimeout(() => setBuySuccess(false), 4500);
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

          {cart.length > 0 && (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="relative inline-flex items-center justify-center p-2 rounded-xl bg-brand-yellow hover:bg-yellow-500 text-brand-green font-extrabold transition-all cursor-pointer shadow-sm"
              id="partner-cart-btn"
              title="Keranjang Pendaftaran"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black animate-bounce shadow">
                {cart.length}
              </span>
            </button>
          )}

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
          <div className="space-y-6">
            {/* Box 1: Referral Link banner */}
            <div className="bg-gradient-to-r from-brand-green to-teal-850 text-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 text-white/5 pointer-events-none">
                <Sparkles className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-extrabold text-white text-base md:text-lg">Tingkatkan Syiar Bersama Link Afiliasi Anda</h4>
                  <span className="text-xs font-mono font-black text-brand-green bg-brand-yellow px-2.5 py-0.5 rounded shadow-sm">{partner.referralCode}</span>
                </div>
                <p className="text-xs text-slate-100 leading-relaxed max-w-2xl">Bagikan link atau kode referral Anda ini kepada masyarakat. Setiap pendaftar baru otomatis mendapatkan diskon 10% dan komisi pembagian hasil berjenjang akan langsung masuk ke dompet Anda secara syariah.</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="relative z-10 shrink-0 inline-flex items-center justify-center gap-1.5 py-3 px-5 rounded-xl text-brand-green font-black text-xs bg-brand-yellow hover:bg-yellow-400 transition-all cursor-pointer shadow-md self-start md:self-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-brand-green" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Salin Link Referral
                  </>
                )}
              </button>
            </div>

            {/* Toolbar with Categories */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-fade-in">
              <div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 leading-none">Katalog Program Akademik &amp; Syiar</h3>
                <p className="text-xs text-slate-500 mt-1.5">Setiap santri baru yang didaftarkan dari dashboard ini otomatis terikat dengan referral Anda <strong className="font-mono text-brand-green">{partner.referralCode}</strong>.</p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-brand-green text-white shadow-md shadow-brand-green/10' 
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-350 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Program Catalog Grid (Landing-Page Style) */}
            {products.filter(p => selectedCategory === 'Semua' || p.category === selectedCategory).length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Belum ada program akademik pada kategori ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products
                  .filter(p => selectedCategory === 'Semua' || p.category === selectedCategory)
                  .map(product => {
                    const inCart = cart.some(p => p.id === product.id);
                    return (
                      <div 
                        key={product.id}
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-xl hover:border-brand-green/20 transition-all duration-300 flex flex-col group h-full"
                      >
                        <div className="relative h-56 overflow-hidden bg-slate-100">
                          <img 
                            src={getDirectDriveUrl(product.imageSrc)} 
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800';
                            }}
                          />
                          <span className="absolute top-2 left-2 bg-brand-green text-white text-[9px] font-bold py-0.5 px-2 rounded tracking-wider uppercase z-10">
                            {product.category}
                          </span>
                        </div>

                        <div className="p-6 flex-grow flex flex-col">
                          <h4 className="font-bold text-lg text-slate-900 leading-snug group-hover:text-brand-green transition-colors mb-2">
                            {product.name}
                          </h4>
                          <div className="flex-grow flex flex-col justify-between mb-4">
                            <p className={`text-slate-500 text-sm leading-relaxed ${expandedProducts[product.id] ? '' : 'line-clamp-3'}`}>
                              {product.description}
                            </p>
                            <button
                              onClick={() => toggleDescription(product.id)}
                              className="text-brand-green hover:text-brand-green/80 text-xs font-bold tracking-wide mt-2 self-start flex items-center gap-1 transition-all focus:outline-none cursor-pointer"
                            >
                              {expandedProducts[product.id] ? 'Sembunyikan Rincian ▲' : 'Lihat Selengkapnya ▼'}
                            </button>
                          </div>

                          <div className="space-y-2 border-t border-slate-100 pt-4 mb-4">
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="text-slate-450 font-semibold text-brand-green">Uang Pangkal</span>
                              <span className="font-extrabold text-slate-900">{formatPrice(product.admissionFee || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="text-slate-450 font-medium">Biaya Registrasi</span>
                              <span className="font-bold text-slate-800">{formatPrice(product.regFee)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="text-slate-450 font-medium">Iuran Bulanan (SPP)</span>
                              <span className="font-bold text-slate-950">{formatPrice(product.monthlyFee)} <span className="text-xs text-slate-400 font-normal">/ bln</span></span>
                            </div>
                          </div>

                          {/* Jumlah Peserta Selector */}
                          <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3 rounded-2xl mb-4 text-xs font-semibold">
                            <span className="text-slate-600 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" /> Jml Peserta/Santri:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(product.id, getProductQuantity(product.id) - 1)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-slate-250 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-sm font-bold shadow-2xs"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={getProductQuantity(product.id)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  updateProductQuantity(product.id, val);
                                }}
                                className="w-8 text-center font-bold text-slate-900 bg-transparent outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateProductQuantity(product.id, getProductQuantity(product.id) + 1)}
                                className="w-7 h-7 flex items-center justify-center bg-white border border-slate-250 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-sm font-bold shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleCartItem(product)}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                              inCart 
                                ? 'bg-brand-yellow hover:bg-yellow-500 text-brand-green font-black shadow-md' 
                                : 'bg-brand-green hover:bg-brand-green/90 text-white hover:shadow-lg'
                            }`}
                          >
                            {inCart ? (
                              <>
                                <X className="w-4 h-4" /> Batalkan Pendaftaran
                              </>
                            ) : (
                              <>
                                <BookMarked className="w-4 h-4" /> Daftar Program Ini
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
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
                                {tx.products.map(p => p.productName + (p.quantity && p.quantity > 1 ? ` (${p.quantity} Peserta)` : '')).join(', ')}
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

      {/* Checkout Side Draw / Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" id="partner-checkout-modal-backdrop">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
            ></motion.div>

            {/* Content panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10"
              id="partner-checkout-modal-panel"
            >
              {/* Header */}
              <div className="h-20 border-b border-brand-yellow/15 px-6 flex items-center justify-between bg-brand-green text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-brand-yellow text-brand-green rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Formulir Pendaftaran Siswa</h4>
                    <p className="text-xs text-slate-350">Daftarkan santri baru melalui program afiliasi Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {buySuccess && (
                  <div className="p-3.5 bg-brand-green/10 border border-brand-green/15 rounded-xl flex items-center gap-2.5 text-xs text-brand-green animate-bounce">
                    <CheckCircle className="w-5 h-5 shrink-0 text-brand-green" />
                    <div>
                      <h5 className="font-bold">Siswa Berhasil Didaftarkan!</h5>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 font-medium">Pendaftaran santri baru berhasil terekam. Tagihan akan diproses, dan pembagian komisi afiliasi berjenjang Anda akan menunggu verifikasi pembayaran di pusat.</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDirectPurchase} className="space-y-6">
                  {/* Selected Programs */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Program Yang Dipilih</label>
                    <div className="space-y-3">
                      {cart.map(p => (
                        <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="max-w-[75%]">
                              <p className="font-bold text-sm text-slate-950 truncate">{p.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium">{p.category}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCartItem(p)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
                              title="Hapus"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            {/* Quantity selection inside drawer */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-500">Santri:</span>
                              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(p.id, p.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-50 border border-slate-150 text-slate-650 rounded-md hover:bg-slate-100 transition-colors cursor-pointer font-black text-xs"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-6 text-center font-bold text-xs text-slate-800 select-none">{p.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateProductQuantity(p.id, p.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center bg-slate-50 border border-slate-150 text-slate-650 rounded-md hover:bg-slate-100 transition-colors cursor-pointer font-black text-xs"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-600 font-bold text-brand-green">Total: {formatPrice(((p.admissionFee || 0) + p.regFee + p.monthlyFee) * p.quantity)}</p>
                              <p className="text-[10px] text-slate-400">Pangkal {formatPrice(p.admissionFee || 0)} | Reg {formatPrice(p.regFee)} | SPP {formatPrice(p.monthlyFee)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Data Pendaftar / Calon Santri</label>
                    
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><User className="w-3 h-3 inline text-slate-400" /> Nama Lengkap Calon Santri</span>
                      <input
                        required
                        type="text"
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-800 bg-white placeholder:text-slate-300 transition-all outline-none text-sm text-[#0f172a]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3 inline text-slate-400" /> Nomor HP / WhatsApp Orang Tua</span>
                      <input
                        required
                        type="text"
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        placeholder="Contoh: 0812345678"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-850 bg-white placeholder:text-slate-300 transition-all outline-none text-sm text-[#0f172a]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3 inline text-slate-400" /> Alamat Lengkap Domisili</span>
                      <textarea
                        required
                        rows={3}
                        value={custAddr}
                        onChange={e => setCustAddr(e.target.value)}
                        placeholder="Masukkan alamat domisili lengkap"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-850 bg-white placeholder:text-slate-300 transition-all outline-none text-sm resize-none text-[#0f172a]"
                      ></textarea>
                    </div>
                  </div>

                  {/* Automatic Referral Code Bound Banner */}
                  <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-xl space-y-1.5 animate-pulse">
                    <div className="text-xs font-bold text-brand-green flex items-center gap-1.5 leading-none">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-yellow font-black" /> KODE REFERRAL TERPASANG OTOMATIS
                    </div>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
                      Kode referral afiliasi Anda <strong className="font-mono text-brand-green bg-brand-green/10 px-1 py-0.5 rounded border border-brand-green/15">{partner.referralCode}</strong> telah dihubungkan secara otomatis. Pembelian ini akan memperoleh potongan khusus sebesar <strong className="text-brand-green">{formatPrice(cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0))}</strong> dan bonus pencatatan komisi tiering Anda <strong className="text-brand-green">({partner.commissionPercent}%)</strong> akan otomatis diakui.
                    </p>
                  </div>

                  {/* Pricing Breakdowns */}
                  <div className="space-y-2 border-t border-slate-150 pt-4 text-sm font-semibold">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Biaya</span>
                      <span>{formatPrice(cart.reduce((acc, p) => acc + ((p.admissionFee || 0) + p.regFee + p.monthlyFee) * p.quantity, 0))}</span>
                    </div>
                    
                    {/* Since it is on behalf of their referral code, there is always the referral discount */}
                    <div className="flex justify-between text-brand-green">
                      <span className="flex items-center gap-1">Potongan Referral Khusus</span>
                      <span>-{formatPrice(cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0))}</span>
                    </div>

                    <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-2.5 mt-2">
                      <span>Jumlah Total Pembayaran</span>
                      <span className="text-brand-green border-b-2 border-brand-green pb-0.5">
                        {formatPrice(Math.max(0, cart.reduce((acc, p) => acc + ((p.admissionFee || 0) + p.regFee + p.monthlyFee) * p.quantity, 0) - cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0)))}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBuying || cart.length === 0}
                    className="w-full py-3 px-4 bg-brand-green hover:bg-brand-green/90 disabled:bg-slate-350 text-white font-bold text-sm tracking-wide rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    {isBuying ? 'Memproses Pendaftaran...' : 'Kirim Pendaftaran Santri'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
