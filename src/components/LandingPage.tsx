import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle, 
  Tag, 
  ShoppingBag, 
  LogIn, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  X,
  Plus,
  Minus,
  Award,
  BookMarked
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Product, PortalConfig } from '../types';
import { getDirectDriveUrl } from '../utils/drive';

interface CartItem extends Product {
  quantity: number;
}

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  const [config, setConfig] = useState<PortalConfig>(DataService.getConfig());
  const [products, setProducts] = useState<Product[]>(DataService.getProducts());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Safely extract bannerUrls array to avoid NaN or invalid length errors
  const bannerUrls = config?.bannerUrls && config.bannerUrls.length > 0 
    ? config.bannerUrls 
    : ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200'];

  // Description expansion state
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  // Quantities for each product selected prior to / during checkout
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [verifiedReferrer, setVerifiedReferrer] = useState<string | null>(null);
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [referralPercent, setReferralPercent] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Active categories
  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category)))];

  // Slide loop timer
  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % bannerUrls.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerUrls]);

  // Load latest state
  useEffect(() => {
    const handleStorageChange = () => {
      setConfig(DataService.getConfig());
      setProducts(DataService.getProducts());
    };
    window.addEventListener('storage', handleStorageChange);
    // Poll to keep in sync during active debug sessions
    const interval = setInterval(handleStorageChange, 1500);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Update discount based on referral code and selected items
  const handleVerifyReferral = () => {
    if (!referralInput.trim()) {
      setVerifiedReferrer(null);
      setReferralDiscount(0);
      setReferralPercent(0);
      return;
    }
    const accounts = DataService.getAccounts();
    const cleanCode = referralInput.trim().toUpperCase();
    const found = accounts.find(a => a.referralCode.toUpperCase() === cleanCode);

    if (found) {
      setVerifiedReferrer(found.name + ` (${found.level.toUpperCase()})`);
      setReferralPercent(found.commissionPercent);
      // Compute discount based on individual product referralDiscounts and quantity
      const totalDiscount = cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0);
      setReferralDiscount(totalDiscount);
    } else {
      setVerifiedReferrer('Kode tidak ditemukan');
      setReferralDiscount(0);
      setReferralPercent(0);
    }
  };

  // Recalculate discount whenever cart elements change but code stays verified
  useEffect(() => {
    if (verifiedReferrer && verifiedReferrer !== 'Kode tidak ditemukan') {
      const totalDiscount = cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0);
      setReferralDiscount(totalDiscount);
    } else {
      setReferralDiscount(0);
    }
  }, [cart, verifiedReferrer]);

  const toggleCartItem = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      if (idx >= 0) {
        return prev.filter(p => p.id !== product.id);
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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !buyerName || !buyerPhone || !buyerAddress) return;

    setIsSubmitting(true);
    
    // Simulate API / DB transaction
    setTimeout(() => {
      DataService.createTransaction({
        buyerName,
        buyerPhone,
        buyerAddress,
        products: cart,
        referralCode: verifiedReferrer && verifiedReferrer !== 'Kode tidak ditemukan' ? referralInput : undefined
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      setCart([]);
      setBuyerName('');
      setBuyerPhone('');
      setBuyerAddress('');
      setReferralInput('');
      setVerifiedReferrer(null);
      setReferralDiscount(0);
    }, 1200);
  };

  const handleNextSlide = () => {
    setCurrentSlide((currentSlide + 1) % bannerUrls.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((currentSlide - 1 + bannerUrls.length) % bannerUrls.length);
  };

  const filteredProducts = selectedCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="landing-container">
      {/* Dynamic Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 shadow-sm transition-all duration-300" id="landing-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img 
              src={getDirectDriveUrl(config.logoUrl)} 
              alt="Logo" 
              referrerPolicy="no-referrer"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover border border-brand-yellow/30 bg-brand-green/10 shadow-sm shrink-0"
              onError={(e) => {
                // Return default on error
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150';
              }}
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-xl font-black text-slate-950 flex items-center gap-1.5 leading-tight truncate">
                {config.appName || "Tahfidz Berbasis Coding & AI"}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium truncate hidden sm:block">{config.appDescription || "Mulia dengan Al-Qur'an, Unggul dengan Jaringan & Teknologi"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button 
              onClick={onLoginClick}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 hover:border-brand-green hover:text-brand-green font-bold text-slate-700 text-xs sm:text-sm transition-all duration-200 bg-white gap-1.5 shadow-2xs"
              id="login-portal-btn"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>
                <span className="hidden sm:inline">Portal Kemitraan</span>
                <span className="sm:hidden">Portal</span>
              </span>
            </button>
            
            {cart.length > 0 && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="relative inline-flex items-center justify-center p-2 sm:p-2.5 rounded-xl bg-brand-green hover:bg-brand-green/90 text-white transition-colors"
                id="cart-btn"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 bg-brand-yellow text-slate-900 font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs animate-bounce">
                  {cart.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Slider Section */}
      <section className="relative overflow-hidden bg-slate-100 text-white h-[220px] sm:h-[350px] md:h-[450px] lg:h-[500px] xl:h-[550px] w-full" id="landing-hero-slider">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide}
              src={getDirectDriveUrl(bannerUrls[currentSlide])}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
              alt="Banner Akademik"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200';
              }}
            />
          </AnimatePresence>
        </div>

        {/* Carousel buttons */}
        {bannerUrls.length > 1 && (
          <>
            <button 
              onClick={handlePrevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white transition-colors z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </section>

      {/* Catalog & Registration Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="katalog-produk">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h3 className="text-2xl md:text-3.5xl font-black text-slate-900 tracking-tight">Katalog Program Akademik</h3>
            <p className="text-slate-500 mt-1 max-w-xl">{config.productSectionDescription || "Pilih program pendidikan terbaik, daftar secara online, dan dapatkan penawaran khusus menggunakan kode referral mitra kami."}</p>
          </div>

          {/* Filtering Categories */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                  selectedCategory === cat 
                    ? 'bg-brand-green text-white shadow-md shadow-brand-green/10' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada program pendidikan pada kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map(product => {
              const inCart = cart.some(p => p.id === product.id);
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-green/20 transition-all duration-300 flex flex-col group h-full"
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
                        className="text-brand-green hover:text-brand-green/80 text-xs font-bold tracking-wide mt-2 self-start flex items-center gap-1 transition-all focus:outline-none"
                      >
                        {expandedProducts[product.id] ? 'Sembunyikan Rincian ▲' : 'Lihat Selengkapnya ▼'}
                      </button>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-4 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-450 font-semibold text-brand-green">Uang Pangkal</span>
                        <span className="font-extrabold text-slate-900">{formatPrice(product.admissionFee || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-450 font-medium font-medium">Biaya Registrasi</span>
                        <span className="font-bold text-slate-800">{formatPrice(product.regFee)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
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
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
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
      </main>

      {/* Checkout Side Draw / Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" id="checkout-modal-backdrop">
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
              id="checkout-modal-panel"
            >
              {/* Header */}
              <div className="h-20 border-b border-brand-yellow/15 px-6 flex items-center justify-between bg-brand-green text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-brand-yellow text-brand-green rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Formulir Pendaftaran</h4>
                    <p className="text-xs text-slate-350">Selesaikan registrasi program santri baru</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-grow overflow-y-auto p-6 space-y-8">
                {isSuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h5 className="font-extrabold text-xl text-slate-900">Pendaftaran Berhasil Dikirim!</h5>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                      Terima kasih atas kepercayaan Anda. Data telah kami hubungkan ke jaringan afiliasi. Silakan hubungi admin kami atau bayar pembayaran pendaftaran ke rekening resmi lembaga kami.
                    </p>
                    <div className="bg-brand-green/10 rounded-xl p-4 border border-brand-yellow/20 text-left text-xs text-slate-650 max-w-sm mx-auto space-y-1">
                      <p className="font-bold text-slate-800">Transfer Pembayaran Ke Rekening Pusat:</p>
                      <p className="font-mono mt-1 text-slate-900">{config.yayasanBankName || "Bank Syariah Indonesia (BSI)"}</p>
                      <p className="font-mono text-sm text-brand-green font-bold">
                        {config.yayasanBankAccountNumber || "7148592034"} a.n. {config.yayasanBankAccountName || "Yayasan Koding Tahfidz Nusantara"}
                      </p>
                      <p className="text-slate-500 mt-2">Harap screenshot bukti transfer untuk memudahkan verifikasi admin.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsSuccess(false);
                        setIsCheckoutOpen(false);
                      }}
                      className="px-6 py-2.5 bg-brand-green text-white font-bold text-sm rounded-xl hover:bg-brand-green/95 transition-all"
                    >
                      Selesai
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-6">
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
                      <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Biodata Pendaftar / Santri</label>
                      
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><User className="w-3 w-3 inline text-slate-400" /> Nama Lengkap</span>
                        <input
                          required
                          type="text"
                          value={buyerName}
                          onChange={e => setBuyerName(e.target.value)}
                          placeholder="Masukkan nama lengkap santri"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-800 bg-white placeholder:text-slate-300 transition-all outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone className="w-3 w-3 inline text-slate-400" /> Nomor HP / WhatsApp</span>
                        <input
                          required
                          type="text"
                          value={buyerPhone}
                          onChange={e => setBuyerPhone(e.target.value)}
                          placeholder="Contoh: 0812345678"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-800 bg-white placeholder:text-slate-300 transition-all outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1"><MapPin className="w-3 w-3 inline text-slate-400" /> Alamat Domisili</span>
                        <textarea
                          required
                          rows={3}
                          value={buyerAddress}
                          onChange={e => setBuyerAddress(e.target.value)}
                          placeholder="Tulis alamat rumah lengkap"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 text-slate-800 bg-white placeholder:text-slate-300 transition-all outline-none text-sm resize-none"
                        ></textarea>
                      </div>
                    </div>

                    {/* Referral Engine */}
                    <div className="p-4 bg-brand-green/5 border border-brand-green/10 rounded-xl space-y-3">
                      <label className="text-xs font-bold text-brand-green flex items-center gap-1.5 leading-none">
                        <Tag className="w-3.5 h-3.5 text-brand-yellow" /> GABUNG KODE REFERRAL MITRA (Diskon Langsung)
                      </label>
                      <p className="text-xs text-brand-green/85 leading-relaxed">Punya kode referral dari Mitra, Sub-Mitra, atau Agen kami? Masukkan untuk memperoleh potongan langsung sesuai dengan nilai diskon produk yang di-input oleh admin.</p>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={referralInput}
                          onChange={e => {
                            const val = e.target.value;
                            setReferralInput(val);
                            // Auto-lookup matching referral code to calculate dynamic discount in real-time
                            const accounts = DataService.getAccounts();
                            const cleanCode = val.trim().toUpperCase();
                            const found = accounts.find(a => a.referralCode.toUpperCase() === cleanCode);
                            if (found) {
                              setVerifiedReferrer(found.name + ` (${found.level.toUpperCase()})`);
                              setReferralPercent(found.commissionPercent);
                              const totalDiscount = cart.reduce((acc, p) => acc + (p.referralDiscount || 0) * p.quantity, 0);
                              setReferralDiscount(totalDiscount);
                            } else if (val.trim() === '') {
                              setVerifiedReferrer(null);
                              setReferralDiscount(0);
                              setReferralPercent(0);
                            } else {
                              // Reset active state while typing newly
                              setVerifiedReferrer(null);
                              setReferralDiscount(0);
                              setReferralPercent(0);
                            }
                          }}
                          placeholder="Contoh: BUDIAGETAP3"
                          className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-slate-800 bg-white placeholder:text-slate-300 transition-all outline-none text-xs uppercase focus:border-brand-green"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyReferral}
                          className="bg-brand-green hover:bg-brand-green/90 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Verifikasi
                        </button>
                      </div>

                      {verifiedReferrer && (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {verifiedReferrer === 'Kode tidak ditemukan' ? (
                            <span className="text-red-500 flex items-center gap-1">❌ Kode tidak ditemukan / salah</span>
                          ) : (
                            <span className="text-brand-green flex items-center gap-1 bg-white px-2 py-1 rounded border border-brand-green/15 leading-none">
                              ✓ Terhubung: <strong className="font-semibold text-brand-green">{verifiedReferrer}</strong> (Potongan khusus aktif)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pricing Breakdowns */}
                    <div className="space-y-2 border-t border-slate-150 pt-4 text-sm font-medium">
                      <div className="flex justify-between text-slate-500">
                        <span>Total Biaya</span>
                        <span>{formatPrice(cart.reduce((acc, p) => acc + ((p.admissionFee || 0) + p.regFee + p.monthlyFee) * p.quantity, 0))}</span>
                      </div>
                      
                      {referralDiscount > 0 && (
                        <div className="flex justify-between text-brand-green">
                          <span className="flex items-center gap-1">Potongan Referral Khusus</span>
                          <span>-{formatPrice(referralDiscount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-100 pt-2.5 mt-2">
                        <span>Jumlah Total Pembayaran</span>
                        <span className="text-brand-green">
                          {formatPrice(Math.max(0, cart.reduce((acc, p) => acc + ((p.admissionFee || 0) + p.regFee + p.monthlyFee) * p.quantity, 0) - referralDiscount))}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || cart.length === 0}
                      className="w-full py-3 px-4 bg-brand-green hover:bg-brand-green/90 disabled:bg-slate-350 text-white font-bold text-sm tracking-wide rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Mengirim Data...' : 'Kirim Pendaftaran Santri'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" id="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left max-w-xl">
            <h5 className="font-bold text-white text-base">{config.appName || "Yayasan Tahfidz Berbasis Coding & AI"}</h5>
            <p className="text-xs text-slate-500 mt-1">{config.appDescription || "Sinergi Nilai Islami Al-Qur'anul Karim, Logika Pemrograman Modern, dan Jaringan Afiliasi Berintegritas."}</p>
          </div>
          <div className="text-xs text-slate-500 text-center md:text-right max-w-md md:ml-auto leading-relaxed">
            {config.footerText || `© 1447 - ${new Date().getFullYear()} Tahfidz Coding AI. All Rights Reserved. Powered by AI Studio Antigravity.`}
          </div>
        </div>
      </footer>
    </div>
  );
}
