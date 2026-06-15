import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Settings, 
  GraduationCap, 
  Percent, 
  Clock, 
  CheckCircle, 
  X,
  XCircle,
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Image as ImageIcon,
  DollarSign,
  Receipt,
  Phone,
  MapPin,
  Lock,
  User,
  Key,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { DataService, registerDataListener } from '../services/dataService';
import { Account, Product, Transaction, WithdrawalRequest, PortalConfig, getLevelDisplayName } from '../types';
import { getDirectDriveUrl } from '../utils/drive';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // Global States retrieved from local service
  const [config, setConfig] = useState<PortalConfig>(DataService.getConfig());
  const [accounts, setAccounts] = useState<Account[]>(DataService.getAccounts());
  const [products, setProducts] = useState<Product[]>(DataService.getProducts());
  const [transactions, setTransactions] = useState<Transaction[]>(DataService.getTransactions());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(DataService.getWithdrawals());

  // Navigation state inside dashboard
  const [activeTab, setActiveTab] = useState<'config' | 'accounts' | 'commissions' | 'products' | 'pending-txs' | 'withdrawals' | 'spp'>('config');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form States - SPP BULANAN
  const [sppStudentName, setSppStudentName] = useState('');
  const [sppMonth, setSppMonth] = useState(() => {
    const d = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });
  const [sppAmount, setSppAmount] = useState<number>(0);
  const [sppReferrerId, setSppReferrerId] = useState('');
  const [sppStatus, setSppStatus] = useState<'pending' | 'verified'>('verified');
  const [sppNotes, setSppNotes] = useState('');

  // Form States - CONFIG
  const [logoInput, setLogoInput] = useState(config.logoUrl);
  const [bannerInputs, setBannerInputs] = useState<string[]>(config.bannerUrls);
  const [appNameInput, setAppNameInput] = useState(config.appName || '');
  const [appDescInput, setAppDescInput] = useState(config.appDescription || '');
  const [productDescInput, setProductDescInput] = useState(config.productSectionDescription || '');
  const [yayasanBankNameInput, setYayasanBankNameInput] = useState(config.yayasanBankName || '');
  const [yayasanBankAccountNumberInput, setYayasanBankAccountNumberInput] = useState(config.yayasanBankAccountNumber || '');
  const [yayasanBankAccountNameInput, setYayasanBankAccountNameInput] = useState(config.yayasanBankAccountName || '');
  const [footerTextInput, setFooterTextInput] = useState(config.footerText || '');

  useEffect(() => {
    setLogoInput(config.logoUrl);
    setBannerInputs(config.bannerUrls);
    setAppNameInput(config.appName || '');
    setAppDescInput(config.appDescription || '');
    setProductDescInput(config.productSectionDescription || '');
    setYayasanBankNameInput(config.yayasanBankName || '');
    setYayasanBankAccountNumberInput(config.yayasanBankAccountNumber || '');
    setYayasanBankAccountNameInput(config.yayasanBankAccountName || '');
    setFooterTextInput(config.footerText || '');
  }, [config]);

  // Form States - ACCOUNTS (CRUD)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accName, setAccName] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accAddress, setAccAddress] = useState('');
  const [accUsername, setAccUsername] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accLevel, setAccLevel] = useState<Account['level']>('mitra');
  const [accParentId, setAccParentId] = useState('');

  // Form States - COMMISSIONS (Percentage & Code generation)
  const [selectedAccForComm, setSelectedAccForComm] = useState<string>('');
  const [commParentId, setCommParentId] = useState<string>('');
  const [commPercent, setCommPercent] = useState<number>(10);
  const [commReferral, setCommReferral] = useState<string>('');

  // Form States - PRODUCTS (CRUD)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodAdmission, setProdAdmission] = useState<number>(0);
  const [prodReg, setProdReg] = useState<number>(0);
  const [prodMonth, setProdMonth] = useState<number>(0);
  const [prodDesc, setProdDesc] = useState('');
  const [prodReferralDiscount, setProdReferralDiscount] = useState<number>(0);
  const [prodOrder, setProdOrder] = useState<number>(0);

  // Form States - WITHDRAWALS (Verifications)
  const [selectedWdForVerify, setSelectedWdForVerify] = useState<WithdrawalRequest | null>(null);
  const [wdProofInput, setWdProofInput] = useState('');

  // Custom non-blocking Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Load and refresh state triggers
  const triggerRefresh = () => {
    setConfig(DataService.getConfig());
    setAccounts(DataService.getAccounts());
    setProducts(DataService.getProducts());
    setTransactions(DataService.getTransactions());
    setWithdrawals(DataService.getWithdrawals());
  };

  useEffect(() => {
    triggerRefresh();
    const unsubscribe = registerDataListener(() => {
      triggerRefresh();
    });
    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  // CONFIG (Logo, Banners)
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      logoUrl: logoInput,
      bannerUrls: bannerInputs.filter(url => url.trim().length > 0),
      appName: appNameInput,
      appDescription: appDescInput,
      productSectionDescription: productDescInput,
      yayasanBankName: yayasanBankNameInput,
      yayasanBankAccountNumber: yayasanBankAccountNumberInput,
      yayasanBankAccountName: yayasanBankAccountNameInput,
      footerText: footerTextInput
    };
    await DataService.saveConfig(updated);
    setConfig(updated);
    alert('Konfigurasi portal berhasil disimpan!');
    triggerRefresh();
  };

  const handleAddBannerUrl = () => {
    setBannerInputs([...bannerInputs, '']);
  };

  const handleRemoveBannerUrl = (idx: number) => {
    setBannerInputs(bannerInputs.filter((_, i) => i !== idx));
  };

  // ACCOUNTS (CRUD)
  const handleOpenAccountModal = (acc: Account | null) => {
    setEditingAccount(acc);
    if (acc) {
      setAccName(acc.name);
      setAccPhone(acc.phone);
      setAccAddress(acc.address);
      setAccUsername(acc.username);
      setAccPassword(acc.password || '');
      setAccLevel(acc.level);
      setAccParentId(acc.parentId || '');
    } else {
      setAccName('');
      setAccPhone('');
      setAccAddress('');
      setAccUsername('');
      setAccPassword('');
      setAccLevel('mitra');
      setAccParentId('');
    }
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName || !accUsername || (!editingAccount && !accPassword)) {
      alert('Nama, Username, dan Password wajib diisi!');
      return;
    }

    const payload: Account = {
      id: editingAccount?.id || '',
      name: accName,
      username: accUsername,
      password: accPassword || editingAccount?.password || 'password123',
      phone: accPhone,
      address: accAddress,
      level: accLevel,
      parentId: accParentId || undefined,
      referralCode: editingAccount?.referralCode || accName.slice(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900),
      commissionPercent: editingAccount?.commissionPercent || (
        accLevel === 'konsultan' ? 25 :
        accLevel === 'induk' ? 20 :
        accLevel === 'mitra' ? 15 :
        accLevel === 'agen' ? 10 : 5
      )
    };

    await DataService.saveAccount(payload);
    setIsAccountModalOpen(false);
    triggerRefresh();
  };

  const handleDeleteAccount = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Mitra',
      message: 'Apakah Anda yakin ingin menghapus akun mitra ini? Alur relasi jaringan yang terikat dapat terpengaruh.',
      onConfirm: async () => {
        await DataService.deleteAccount(id);
        triggerRefresh();
      }
    });
  };

  // PRODUCTS (CRUD)
  const handleOpenProductModal = (prod: Product | null) => {
    setEditingProduct(prod);
    if (prod) {
       setProdName(prod.name);
       setProdCat(prod.category);
       setProdImg(prod.imageSrc);
       setProdAdmission(prod.admissionFee || 0);
       setProdReg(prod.regFee);
       setProdMonth(prod.monthlyFee);
       setProdDesc(prod.description);
       setProdReferralDiscount(prod.referralDiscount || 0);
       setProdOrder(prod.order ?? 0);
    } else {
       setProdName('');
       setProdCat('Pendidikan Anak');
       setProdImg('');
       setProdAdmission(1000000);
       setProdReg(150000);
       setProdMonth(100000);
       setProdDesc('');
       setProdReferralDiscount(50000);
       setProdOrder(products.length);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCat) return;

    const payload: Product = {
      id: editingProduct?.id || '',
      name: prodName,
      category: prodCat,
      imageSrc: prodImg || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
      admissionFee: prodAdmission,
      regFee: prodReg,
      monthlyFee: prodMonth,
      description: prodDesc,
      referralDiscount: prodReferralDiscount,
      order: prodOrder
    };

    await DataService.saveProduct(payload);
    setIsProductModalOpen(false);
    triggerRefresh();
  };

  const handleDeleteProduct = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Program Pendidikan',
      message: 'Apakah Anda yakin ingin menghapus program pendidikan ini dari katalog pendaftaran?',
      onConfirm: async () => {
        await DataService.deleteProduct(id);
        triggerRefresh();
      }
    });
  };

  const handleMoveProductOrder = async (prodId: string, direction: 'up' | 'down') => {
    const list = [...products];
    const index = list.findIndex(p => p.id === prodId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    // Swap ordering value
    const currentItem = { ...list[index] };
    const targetItem = { ...list[targetIndex] };

    // Assign sequence weights if they are undefined or identical
    const currentOrder = currentItem.order ?? index;
    const targetOrder = targetItem.order ?? targetIndex;

    currentItem.order = targetOrder;
    targetItem.order = currentOrder;

    // Force unique orders if swapped into the same value
    if (currentItem.order === targetItem.order) {
      if (direction === 'up') {
        currentItem.order = Math.max(0, targetOrder - 1);
      } else {
        currentItem.order = targetOrder + 1;
      }
    }

    // Save both
    await DataService.saveProduct(currentItem);
    await DataService.saveProduct(targetItem);
    triggerRefresh();
  };

  // COMMISSION SETUP OVERRIDE
  const handleLoadAccountCommission = (accId: string) => {
    const acc = accounts.find(a => a.id === accId);
    if (acc) {
      setSelectedAccForComm(accId);
      setCommParentId(acc.parentId || '');
      setCommPercent(acc.commissionPercent);
      setCommReferral(acc.referralCode);
    }
  };

  const handleSaveCommissionOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccForComm) return;

    const acc = accounts.find(a => a.id === selectedAccForComm);
    if (acc) {
      const updated: Account = {
        ...acc,
        parentId: commParentId || undefined,
        commissionPercent: commPercent,
        referralCode: commReferral.trim().toUpperCase()
      };
      await DataService.saveAccount(updated);
      alert('Informasi komisi dan relasi berhasil diperbarui!');
      triggerRefresh();
    }
  };

  // SPP PROCESSOR HANDLER
  const handleSaveSpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sppStudentName.trim()) {
      alert('Nama Santri/Pendaftar harus diisi.');
      return;
    }
    if (!sppReferrerId) {
      alert('Silakan pilih Mitra/Agen penerima komisi utama.');
      return;
    }
    if (sppAmount <= 0) {
      alert('Nominal SPP bulanan harus berupa angka positif.');
      return;
    }

    try {
      await DataService.createSppTransaction({
        studentName: sppStudentName.trim(),
        sppMonth: sppMonth,
        amount: sppAmount,
        referrerId: sppReferrerId,
        status: sppStatus,
        notes: sppNotes.trim()
      });
      alert('Pencatatan komisi SPP Bulanan berhasil disimpan ke database!');
      setSppStudentName('');
      setSppAmount(0);
      setSppNotes('');
      setSppReferrerId('');
      triggerRefresh();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data SPP.');
    }
  };

  // WITHDRAWALS VERIFICATION
  const handleOpenWdVerify = (wd: WithdrawalRequest) => {
    setSelectedWdForVerify(wd);
    setWdProofInput('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=400');
  };

  const handleConfirmWdVerify = async () => {
    if (!selectedWdForVerify) return;
    await DataService.verifyWithdrawal(selectedWdForVerify.id, wdProofInput);
    setSelectedWdForVerify(null);
    alert('Pencairan dana diperbarui dan disimpan!');
    triggerRefresh();
  };

  // TRANSACTION VERIFICATION
  const handleVerifyTxPayment = async (txId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Verifikasi Transaksi Pendaftaran',
      message: 'Apakah Anda yakin sudah memverifikasi dana pendaftaran di rekening pusat? Komisi akan segera didistribusikan ke jaringan afiliasi setelah ini.',
      onConfirm: async () => {
        await DataService.verifyTransactionPayment(txId);
        triggerRefresh();
      }
    });
  };

  const handleCancelTxPayment = async (txId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Batalkan Transaksi Pendaftaran',
      message: 'Apakah Anda yakin ingin MEMBATALKAN transaksi pendaftaran ini? Status transaksi akan berubah menjadi BATAL dan aliran komisi tidak akan dihitung.',
      onConfirm: async () => {
        await DataService.cancelTransactionPayment(txId);
        triggerRefresh();
      }
    });
  };

  const handleDeleteTx = async (txId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Permanen Transaksi',
      message: 'Apakah Anda yakin ingin HAPUS PERMANEN data transaksi pendaftaran ini? Data yang dihapus tidak bisa dikembalikan.',
      onConfirm: async () => {
        await DataService.deleteTransaction(txId);
        triggerRefresh();
      }
    });
  };

  const handleWipeDemoData = async () => {
    const confirmation = prompt(
      'Ketik "HAPUS" untuk mengonfirmasi bahwa Anda ingin menghapus secara permanen semua data demo (transaksi pendaftaran, pengajuan pencairan, perkembangan hafalan, dan semua akun mitra demo):'
    );
    if (confirmation === 'HAPUS') {
      try {
        await DataService.clearAllDemoData();
        alert('Seluruh data demo berhasil dihapus dengan sempurna! Sistem sekarang bersih dan siap digunakan.');
        triggerRefresh();
      } catch (err) {
        alert('Gagal menghapus data demo: ' + (err instanceof Error ? err.message : String(err)));
      }
    } else if (confirmation !== null) {
      alert('Konfirmasi salah. Penghapusan dibatalkan.');
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans" id="admin-container">
      {/* Top Admin Header */}
      <header className="bg-brand-green text-white h-20 px-6 flex items-center justify-between shrink-0 shadow-lg border-b border-brand-yellow/15">
        <div className="flex items-center space-x-3">
          <div className="bg-brand-yellow p-2.5 rounded-xl text-brand-green shadow-md shadow-brand-green/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg flex items-center gap-2">
              Pusat Kontrol Admin <span className="bg-brand-yellow/20 text-brand-yellow text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border border-brand-yellow/30">ROOT</span>
            </h1>
            <p className="text-xs text-slate-350">Pengelolaan portal, komisi, produk, dan verifikasi keuangan terpusat.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 hover:text-red-300 text-sm font-semibold text-slate-200 transition-colors border border-white/20 cursor-pointer"
          >
            Keluar Portal
          </button>
        </div>
      </header>

      {/* Main Panel grid */}
      <div className="flex-grow flex flex-col md:flex-row min-h-0" id="admin-body">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white md:border-r border-slate-200 p-4 md:p-6 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto scrollbar-none gap-2 md:gap-0 md:space-y-2 flex-shrink-0 border-b md:border-b-0">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider hidden md:block mb-4">Navigasi Utama</span>
          
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full ${
              activeTab === 'config' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-brand-green shrink-0" />
            <span>Logo &amp; Banner Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full ${
              activeTab === 'accounts' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-brand-green shrink-0" />
            <span>Manajemen Akun</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full ${
              activeTab === 'commissions' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Percent className="w-4 h-4 text-brand-green shrink-0" />
            <span>Skema Komisi</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap shrink-0 md:w-full ${
              activeTab === 'products' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-brand-green shrink-0" />
            <span>Katalog Produk</span>
          </button>

          <button
            onClick={() => setActiveTab('pending-txs')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all relative cursor-pointer whitespace-nowrap shrink-0 md:w-full gap-2 ${
              activeTab === 'pending-txs' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 text-brand-green shrink-0" />
            <span>Verifikasi Pendaftaran</span>
            {transactions.filter(t => t.status === 'pending').length > 0 && (
              <span className="bg-amber-500 text-white font-bold rounded-full text-[9px] px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
                {transactions.filter(t => t.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all relative cursor-pointer whitespace-nowrap shrink-0 md:w-full gap-2 ${
              activeTab === 'withdrawals' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4 text-brand-green shrink-0" />
            <span>Pencairan Dana</span>
            {withdrawals.filter(w => w.status === 'pending').length > 0 && (
              <span className="bg-brand-green text-white font-bold rounded-full text-[9px] px-1.5 py-0.5 min-w-[18px] text-center shrink-0 animate-pulse">
                {withdrawals.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('spp')}
            className={`flex items-center space-x-2.5 px-4 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all relative cursor-pointer whitespace-nowrap shrink-0 md:w-full gap-2 ${
              activeTab === 'spp' ? 'bg-brand-yellow/15 text-brand-green border-b-2 md:border-b-0 md:border-r-3 border-brand-green font-extrabold shadow-2xs' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4 text-brand-green shrink-0" />
            <span>Komisi SPP Bulanan</span>
          </button>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-grow p-6 overflow-y-auto" id="admin-main-view">
          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="max-w-3xl bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Konfigurasi Desain Landing Page</h3>
                <p className="text-sm text-slate-500 mt-0.5">Edit dan sesuaikan tampilan luar portal utama. Gunakan link image yang valid (bisa embed Google Drive atau Unsplash).</p>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Nama Aplikasi (Di Sebelah Logo)</label>
                    <input
                      required
                      type="text"
                      value={appNameInput}
                      onChange={e => setAppNameInput(e.target.value)}
                      placeholder="KO-TA (Koding Tahfidz)"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white text-sm outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Keterangan Aplikasi (Di Sebelah Logo)</label>
                    <input
                      required
                      type="text"
                      value={appDescInput}
                      onChange={e => setAppDescInput(e.target.value)}
                      placeholder="Platform Afiliasi Syariah & Penerimaan Santri Baru"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Keterangan Di Atas Produk-Produk</label>
                  <textarea
                    required
                    rows={2}
                    value={productDescInput}
                    onChange={e => setProductDescInput(e.target.value)}
                    placeholder="Pilih program pendidikan terbaik, daftar secara online, dan dapatkan penawaran khusus..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white text-sm outline-none resize-none"
                  ></textarea>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <span className="text-xs font-bold text-brand-green uppercase tracking-widest block">Rekening Bank Yayasan</span>
                  <p className="text-xs text-slate-500 leading-relaxed">Masukkan info rekening bank resmi milik Yayasan untuk pembayaran atau konfirmasi dana pendaftaran oleh calon santri.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nama Bank Yayasan</label>
                      <input
                        required
                        type="text"
                        value={yayasanBankNameInput}
                        onChange={e => setYayasanBankNameInput(e.target.value)}
                        placeholder="Misal: Bank Syariah Indonesia"
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nomor Rekening</label>
                      <input
                        required
                        type="text"
                        value={yayasanBankAccountNumberInput}
                        onChange={e => setYayasanBankAccountNumberInput(e.target.value)}
                        placeholder="Misal: 7148592034"
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green font-mono font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Atas Nama Pemilik Rekening</label>
                      <input
                        required
                        type="text"
                        value={yayasanBankAccountNameInput}
                        onChange={e => setYayasanBankAccountNameInput(e.target.value)}
                        placeholder="Misal: Yayasan Koding Tahfidz"
                        className="w-full px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Logo Lembaga (G-Drive Embed / URL)</label>
                  <input
                    type="url"
                    value={logoInput}
                    onChange={e => setLogoInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white text-sm outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-mono mt-1">Harap pastikan URL mengarah langsung ke asset gambar/logo berformat PNG/JPG.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Banner Slider Landing Page ({bannerInputs.length})</label>
                    <button
                      type="button"
                      onClick={handleAddBannerUrl}
                      className="text-xs font-bold text-brand-green hover:text-brand-green/90 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Banner
                    </button>
                  </div>

                  <div className="space-y-2">
                    {bannerInputs.map((bannerUrl, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="url"
                          value={bannerUrl}
                          onChange={e => {
                            const copy = [...bannerInputs];
                            copy[idx] = e.target.value;
                            setBannerInputs(copy);
                          }}
                          placeholder={`Link Banner Ke-${idx+1}`}
                          className="flex-grow px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs outline-none focus:border-brand-green"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBannerUrl(idx)}
                          className="bg-slate-150 hover:bg-red-55 text-slate-500 hover:text-red-600 p-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Teks Footer Website (Kaki Halaman)</label>
                  <textarea
                    required
                    rows={2}
                    value={footerTextInput}
                    onChange={e => setFooterTextInput(e.target.value)}
                    placeholder="Masukkan teks hak cipta, legalitas, atau catatan singkat di bawah halaman..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white text-sm outline-none resize-none"
                  ></textarea>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-green hover:bg-brand-green/95 text-white font-bold text-sm tracking-wide rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>

              {/* Pemeliharaan Database & Hapus Data Demo */}
              <div className="border-t border-slate-150 pt-8 mt-8 space-y-4">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                  <span className="text-rose-700 font-bold text-xxs flex items-center gap-1 leading-none uppercase tracking-wider mb-2">
                    🛡️ Pemeliharaan Basis Data
                  </span>
                  <h4 className="text-sm font-black text-rose-900 leading-none">Hapus Seluruh Data Demo &amp; Reset Bersih</h4>
                  <p className="text-xs text-rose-700/80 mt-2 leading-relaxed">
                    Menghapus seluruh transaksi pendaftaran, pengajuan pencairan dana (withdrawals), riwayat setoran hafalan (tahfidz), dan seluruh akun Mitra/Agen buatan demo. Akun <strong>Pusat Admin Utama</strong> Anda beserta program catalog kelas akan tetap utuh sehingga Anda langsung siap bekerja dengan data riil sesungguhnya.
                  </p>
                  <button
                    type="button"
                    onClick={handleWipeDemoData}
                    className="mt-4 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 uppercase"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Data Demo Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manajemen Akun Kemitraan</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Daftar mitra terdaftar. Anda dapat menambahkan user baru, serta mengedit biodata dan level.</p>
                </div>
                
                <button
                  onClick={() => handleOpenAccountModal(null)}
                  className="bg-brand-green hover:bg-brand-green/95 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-green/15 flex items-center gap-1.5 transition-all text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Akun
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                      <th className="p-4">Nama Lengkap</th>
                      <th className="p-4">Level</th>
                      <th className="p-4">WhatsApp</th>
                      <th className="p-4">Kota</th>
                      <th className="p-4">Upline Parent</th>
                      <th className="p-4">Kode Referral</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {accounts.filter(acc => acc.level !== 'admin').map(acc => {
                      const parentAcc = accounts.find(a => a.id === acc.parentId);
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-slate-950">{acc.name}</p>
                            <p className="text-xs text-slate-450">@{acc.username}</p>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              acc.level === 'konsultan' ? 'bg-violet-50 text-violet-700 border-violet-200/50' :
                              acc.level === 'induk' ? 'bg-pink-50 text-pink-700 border-pink-200/50' :
                              acc.level === 'mitra' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
                              acc.level === 'agen' ? 'bg-sky-50 text-sky-700 border-sky-200/50' :
                              acc.level === 'subagen' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                              'bg-slate-50 text-slate-600 border-slate-200/50'
                            }`}>
                              {getLevelDisplayName(acc.level)}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-medium">{acc.phone}</td>
                          <td className="p-4 truncate max-w-[120px]">{acc.address}</td>
                          <td className="p-4">
                            {parentAcc ? (
                              <span className="text-xs text-slate-600 font-semibold">✓ {parentAcc.name}</span>
                            ) : (
                              <span className="text-xs text-slate-400">Direct Pusat</span>
                            )}
                          </td>
                          <td className="p-4 font-mono font-bold text-brand-green">{acc.referralCode}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenAccountModal(acc)}
                              className="p-1.5 px-2.5 hover:bg-slate-100 rounded-lg text-brand-green font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-1.5 px-2.5 hover:bg-red-50 rounded-lg text-red-650 font-bold text-xs inline-flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COMMISSIONS & RELATIONSHIPS */}
          {activeTab === 'commissions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Form Input Setup */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 lg:col-span-1">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfigurasi Hak Komisi</h3>
                  <p className="text-xs text-slate-500">Pilih mitra untuk mengatur hubungan jaringan upline, persentase komisi manual, serta custom kode referral.</p>
                </div>

                <form onSubmit={handleSaveCommissionOverride} className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Pilih Akun Mitra</span>
                    <select
                      value={selectedAccForComm}
                      onChange={e => handleLoadAccountCommission(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl text-sm outline-none focus:border-brand-green"
                    >
                      <option value="">-- Pilih Akun Mitra --</option>
                      {accounts.filter(a => a.level !== 'admin').map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.level.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>

                  {selectedAccForComm && (
                    <>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Hubungkan Ke Upline Parent</span>
                        <select
                          value={commParentId}
                          onChange={e => setCommParentId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl text-xs outline-none focus:border-brand-green"
                        >
                          <option value="">Direct Pusat (Tanpa Upline)</option>
                          {accounts
                            .filter(a => a.id !== selectedAccForComm && a.level !== 'admin' && a.level !== 'agen')
                            .map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.level.toUpperCase()})</option>
                            ))
                          }
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Guna mendukung aliran komisi bertingkat (misal: Agen L3 bernaung di bawah Sub-Mitra L2).</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-650 flex justify-between">
                          <span>Persentase Komisi</span>
                          <span className="text-brand-green font-bold">{commPercent}%</span>
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={commPercent}
                          onChange={e => setCommPercent(parseInt(e.target.value))}
                          className="w-full accent-brand-green"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600">Kode Referral Afiliasi</span>
                        <input
                          type="text"
                          value={commReferral}
                          onChange={e => setCommReferral(e.target.value)}
                          placeholder="KODEREFF"
                          className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl text-sm font-mono font-semibold uppercase focus:border-brand-green outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-brand-green hover:bg-brand-green/95 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Simpan Skema Hubungan
                      </button>
                    </>
                  )}
                </form>
              </div>

              {/* Commission Log / Hierarchy View */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 lg:col-span-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Bagan Komisi &amp; Downline</h3>
                  <p className="text-xs text-slate-500">Melihat daftar saldo yang terakumulasi di masing-masing level.</p>
                </div>

                <div className="space-y-3">
                  {accounts.filter(a => a.level !== 'admin').map(acc => {
                    const stats = DataService.getPartnerBalances(acc.id);
                    const parent = accounts.find(p => p.id === acc.parentId);
                    return (
                      <div key={acc.id} className="p-4 border border-slate-200 rounded-2xl hover:border-brand-green/25 transition-all flex justify-between items-center bg-slate-50/50">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{acc.name}</p>
                          <div className="flex items-center gap-1.5 mt-1 text-xs">
                            <span className="text-[10px] bg-brand-green/10 text-brand-green font-extrabold px-1.5 py-0.5 rounded border border-brand-green/20 uppercase">{acc.level}</span>
                            <span className="text-slate-400">| Referral: <strong className="font-mono text-brand-green font-bold">{acc.referralCode}</strong> ({acc.commissionPercent}%)</span>
                            {parent && <span className="text-slate-400">| Upline: <span className="text-slate-650 font-semibold">{parent.name}</span></span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-semibold">Saldo Tersedia:</p>
                          <p className="text-sm font-black text-slate-900">{formatPrice(stats.balance)}</p>
                          <p className="text-[10px] text-slate-400">Total Didapat: {formatPrice(stats.earned)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Manajemen Program Akademik</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Input, edit, dan hapus informasi produk pendidikan serta iuran pendaftaran.</p>
                </div>

                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="bg-brand-green hover:bg-brand-green/95 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Program
                </button>
              </div>

              {/* Grid Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(prod => (
                  <div key={prod.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-xl overflow-hidden bg-slate-200 border border-slate-200/50">
                        <img 
                          src={getDirectDriveUrl(prod.imageSrc)} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                        <span className="absolute top-2.5 left-2.5 bg-brand-green/90 backdrop-blur-sm text-white text-[10px] font-bold py-1 px-2.5 rounded-lg">
                          {prod.category}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-950 text-sm line-clamp-1">{prod.name}</h4>
                        <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">{prod.description}</p>
                      </div>

                      <div className="border-t border-b border-slate-200/60 py-2.5 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold text-brand-green">Uang Pangkal</span>
                          <span className="font-extrabold text-slate-900">{formatPrice(prod.admissionFee || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Registrasi</span>
                          <span className="font-bold text-slate-850">{formatPrice(prod.regFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Iuran Bulanan (SPP)</span>
                          <span className="font-bold text-slate-850">{formatPrice(prod.monthlyFee)}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Diskon Referral</span>
                          <span>-{formatPrice(prod.referralDiscount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100/50 mt-4">
                      {/* Urutan Controls */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-extrabold mr-1 uppercase tracking-wider">Urutan: {prod.order ?? 0}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveProductOrder(prod.id, 'up')}
                          className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-brand-green cursor-pointer transition-colors border border-slate-200"
                          title="Geser Naik (Maju)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProductOrder(prod.id, 'down')}
                          className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500 hover:text-brand-green cursor-pointer transition-colors border border-slate-200"
                          title="Geser Turun (Mundur)"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenProductModal(prod)}
                          className="p-1.5 px-2.5 hover:bg-slate-100/85 rounded-lg border border-slate-200 text-brand-green hover:text-brand-green/85 font-medium transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 px-2.5 hover:bg-red-50 rounded-lg border border-slate-200 text-red-600 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PENDING TRANSACTIONS */}
          {activeTab === 'pending-txs' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Daftar Pengajuan &amp; Verifikasi Pembayaran</h3>
                <p className="text-sm text-slate-500 mt-0.5">Siswa mendaftar ke rekening pusat. Admin melakukan verifikasi di bawah ini untuk mengaktifkan status, meluncurkan pembagian komisi ke Mitra.</p>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Belum ada aktivitas pendaftaran santri baru.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <th className="p-4">Tanggal Pendaftaran</th>
                        <th className="p-4">Calon Santri</th>
                        <th className="p-4">Program</th>
                        <th className="p-4">Pembayaran Total</th>
                        <th className="p-4">Kode Referral</th>
                        <th className="p-4">Pembagian Aliran Komisi</th>
                        <th className="p-4">Status / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                          <td className="p-4 text-xs font-mono">{new Date(tx.createdAt).toLocaleString('id-ID')}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900">{tx.buyerName}</p>
                            <p className="text-xs text-slate-450 font-semibold">{tx.buyerPhone}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{tx.buyerAddress}</p>
                          </td>
                          <td className="p-4 text-xs">
                            {tx.products.map(p => (
                              <div key={p.productId} className="font-semibold text-slate-800 space-y-0.5">
                                <div>• {p.productName} {p.quantity && p.quantity > 1 ? `(${p.quantity} Peserta)` : ''}</div>
                                <div className="text-[10px] text-slate-400 pl-2">
                                  Pangkal: {formatPrice(p.admissionFee || 0)} | Reg: {formatPrice(p.regFee)} | SPP: {formatPrice(p.monthlyFee)} {p.quantity && p.quantity > 1 ? `x ${p.quantity} Peserta` : ''}
                                </div>
                              </div>
                            ))}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-slate-950">{formatPrice(tx.payableAmount)}</p>
                            {tx.discountAmount > 0 && <span className="text-[10px] bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded font-bold">Diskon {formatPrice(tx.discountAmount)}</span>}
                          </td>
                          <td className="p-4 font-mono text-xs text-amber-700 font-bold">{tx.referralCodeUsed || '-'}</td>
                          <td className="p-4 space-y-1">
                            {tx.commissions.map((comm, i) => (
                              <div key={i} className="text-xs bg-slate-50 rounded p-1.5 border border-slate-150">
                                <span className="font-bold text-slate-700">{comm.recipientName}</span>: <span className="text-brand-green font-bold">{formatPrice(comm.amount)}</span>
                              </div>
                            ))}
                          </td>
                          <td className="p-4 space-y-2">
                            {/* Status Badge */}
                            <div className="mb-2">
                              {tx.status === 'verified' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/20 uppercase tracking-widest">
                                  <CheckCircle className="w-3 h-3 text-brand-green" /> Terverifikasi
                                </span>
                              ) : tx.status === 'cancelled' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-650 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-150 uppercase tracking-widest">
                                  <XCircle className="w-3 h-3 text-rose-500" /> Dibatalkan/Gagal
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-150 uppercase tracking-widest">
                                  <Clock className="w-3 h-3 text-amber-500" /> Pending Bayar
                                </span>
                              )}
                            </div>

                            {/* Actions Group */}
                            <div className="flex flex-col sm:flex-row gap-1.5">
                              {tx.status !== 'verified' && (
                                <button
                                  onClick={() => handleVerifyTxPayment(tx.id)}
                                  className="px-2.5 py-1.5 bg-brand-green hover:bg-brand-green/95 text-white font-bold text-[11px] rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                                  title="Konfirmasi Pembayaran"
                                >
                                  <CheckCircle className="w-3 h-3 text-white" /> Verifikasi
                                </button>
                              )}
                              
                              {tx.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelTxPayment(tx.id)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg border border-amber-200 cursor-pointer transition-all flex items-center justify-center gap-1"
                                  title="Batalkan Transaksi"
                                >
                                  <XCircle className="w-3 h-3 text-amber-600" /> Batalkan
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTx(tx.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 font-bold text-[11px] rounded-lg border border-rose-150 cursor-pointer transition-all flex items-center justify-center gap-1"
                                title="Hapus Transaksi Permanen"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" /> Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WITHDRAWALS */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Dua Verifikasi Pencairan Dana (Withdrawals)</h3>
                <p className="text-sm text-slate-500 mt-0.5">Daftar pengajuan penarikan dana/komisi milik para Mitra, Sub-mitra, dan Agen dari saldo digital mereka.</p>
              </div>

              {withdrawals.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Belum ada pengajuan pencairan dana komisi.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <th className="p-4">No. Pengajuan</th>
                        <th className="p-4">Pemohon</th>
                        <th className="p-4">Level</th>
                        <th className="p-4">Nominal Pencairan</th>
                        <th className="p-4">Tanggal Penghentian</th>
                        <th className="p-4">Bukti Upload</th>
                        <th className="p-4 text-right">Status / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {withdrawals.map(wd => (
                        <tr key={wd.id} className="hover:bg-slate-50 text-slate-700 transition-colors">
                          <td className="p-4 font-mono text-xs">{wd.id}</td>
                          <td className="p-4">
                            <span className="font-bold text-slate-950">{wd.requesterName}</span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] py-0.5 px-2 rounded-full uppercase font-bold border ${
                              wd.requesterLevel === 'konsultan' ? 'bg-violet-50 text-violet-700 border-violet-150' :
                              wd.requesterLevel === 'induk' ? 'bg-pink-50 text-pink-700 border-pink-150' :
                              wd.requesterLevel === 'mitra' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' :
                              wd.requesterLevel === 'agen' ? 'bg-sky-50 text-sky-700 border-sky-150' :
                              wd.requesterLevel === 'subagen' ? 'bg-amber-50 text-amber-700 border-amber-150' :
                              'bg-slate-50 text-slate-700 border-slate-150'
                            }`}>{getLevelDisplayName(wd.requesterLevel)}</span>
                          </td>
                          <td className="p-4 font-black text-slate-950">{formatPrice(wd.amount)}</td>
                          <td className="p-4 text-xs font-mono">{new Date(wd.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            {wd.proofImage ? (
                              <a 
                                href={wd.proofImage} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
                              >
                                Lihat Bukti Transfer <ExternalLink className="w-3.5 h-3.5 text-brand-green" />
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {wd.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-brand-green font-bold bg-brand-green/10 border border-brand-green/20 py-1.5 px-2.5 rounded-xl">
                                <CheckCircle className="w-4 h-4" /> Transfer Sukses
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenWdVerify(wd)}
                                className="px-4 py-2 bg-brand-green hover:bg-brand-green/95 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                              >
                                Kirim &amp; Selesaikan
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SPP BULANAN */}
          {activeTab === 'spp' && (
            <div className="space-y-6 animate-fade-in text-slate-850">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-brand-green" />
                    Input Komisaris SPP Bulanan Santri
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Catat setoran biaya bulanan/SPP santri dengan nominal fleksibel. Alur komisi berjenjang syariah akan langsung dialokasikan ke masing-masing dompet kemitraan di atasnya.</p>
                </div>

                <form onSubmit={handleSaveSpp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Nama Santri / Pendaftar</label>
                      <input
                        required
                        type="text"
                        value={sppStudentName}
                        onChange={e => setSppStudentName(e.target.value)}
                        placeholder="Contoh: Muhammad Reyhan"
                        className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Periode Bulan SPP</label>
                        <input
                          required
                          type="text"
                          value={sppMonth}
                          onChange={e => setSppMonth(e.target.value)}
                          placeholder="Contoh: Juni 2026"
                          className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Nominal SPP Bulanan (Rp)</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={sppAmount || ''}
                          onChange={e => setSppAmount(Number(e.target.value))}
                          placeholder="Contoh: 350000"
                          className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Mitra / Agen Santri (Penerima Komisi Utama)</label>
                      <select
                        required
                        value={sppReferrerId}
                        onChange={e => setSppReferrerId(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                      >
                        <option value="">-- Pilih Mitra / Agen Santri --</option>
                        {accounts
                          .filter(acc => acc.level !== 'admin')
                          .map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} — {getLevelDisplayName(acc.level)} ({acc.referralCode || '-'})
                            </option>
                          ))
                        }
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Siapa yang mendaftarkan atau mengasuh santri ini. Seluruh pohon jaringan kemitraan di atasnya akan menikmati komisi proporsional berjenjang syariah secara live.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Status Verifikasi Setoran</label>
                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                          <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex-1">
                            <input
                              type="radio"
                              name="sppStatus"
                              checked={sppStatus === 'verified'}
                              onChange={() => setSppStatus('verified')}
                              className="text-brand-green focus:ring-brand-green focus:ring-0"
                            />
                            <div className="flex flex-col text-xs">
                              <span className="font-bold text-slate-800">Verifikasi Langsung (Lunas)</span>
                              <span className="text-[10px] text-slate-400">Komisi langsung masuk ke dompet aktif</span>
                            </div>
                          </label>
                          <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100/70 p-3 rounded-xl border border-slate-200 flex-1">
                            <input
                              type="radio"
                              name="sppStatus"
                              checked={sppStatus === 'pending'}
                              onChange={() => setSppStatus('pending')}
                              className="text-brand-green focus:ring-brand-green focus:ring-0"
                            />
                            <div className="flex flex-col text-xs">
                              <span className="font-bold text-slate-800">Pending Bayar (Verifikasi Manual)</span>
                              <span className="text-[10px] text-slate-400">Komisi masuk ke saldo tertunda</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Keterangan / Catatan Tambahan</label>
                        <textarea
                          rows={2}
                          value={sppNotes}
                          onChange={e => setSppNotes(e.target.value)}
                          placeholder="Contoh: Transfer Bank Syariah Indonesia, nomor struk #99281"
                          className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-3 bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Simpan SPP &amp; Alokasikan Komisi</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* RIWAYAT SPP */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-2xs">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Histori Pembayaran SPP Bulanan &amp; Alokasi Jaringan</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Daftar lengkap seluruh transaksi SPP santri yang tercatat beserta rincian komisi berjenjang dari bawah ke atas.</p>
                </div>

                {transactions.filter(t => t.type === 'spp').length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm animate-pulse">Belum ada riwayat pencatatan SPP bulanan santri.</div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-3xs">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-extrabold text-[10px] uppercase tracking-wider">
                          <th className="p-4">Waktu / ID</th>
                          <th className="p-4">Santri &amp; Bulan SPP</th>
                          <th className="p-4">Nominal SPP</th>
                          <th className="p-4">Alokasi Komisi Berjenjang</th>
                          <th className="p-4 text-right">Status / Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700">
                        {transactions
                          .filter(t => t.type === 'spp')
                          .map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <span className="block font-semibold text-slate-900">{new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span className="block text-[10px] font-mono text-slate-400 mt-0.5">{tx.id}</span>
                              </td>
                              <td className="p-4">
                                <span className="block font-bold text-slate-900 text-sm">{tx.buyerName}</span>
                                <span className="block text-[11px] text-slate-450 italic mt-0.5">{tx.buyerAddress}</span>
                              </td>
                              <td className="p-4 font-black text-slate-900 text-sm">
                                {formatPrice(tx.payableAmount)}
                              </td>
                              <td className="p-4 min-w-[280px]">
                                <div className="space-y-1.5 max-w-sm">
                                  {tx.commissions.length === 0 ? (
                                    <span className="text-slate-400 text-xs italic">Tanpa pembagian komisi</span>
                                  ) : (
                                    tx.commissions.map((comm, idx) => (
                                      <div key={idx} className="text-[11px] bg-slate-50 border border-slate-150 p-2 rounded-lg flex items-center justify-between gap-3 shadow-3xs">
                                        <div>
                                          <span className="font-extrabold text-slate-800 block leading-tight">{comm.recipientName}</span>
                                          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block mt-0.5">{getLevelDisplayName(comm.level)} ({comm.percentage}%)</span>
                                        </div>
                                        <span className="text-brand-green font-black text-xs">{formatPrice(comm.amount)}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right space-y-2">
                                <div className="flex justify-end mb-1">
                                  {tx.status === 'verified' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full border border-brand-green/25 uppercase tracking-widest leading-none">
                                      <CheckCircle className="w-3 h-3 text-brand-green" /> Lunas Verified
                                    </span>
                                  ) : tx.status === 'cancelled' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-650 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-150 uppercase tracking-widest leading-none">
                                      <XCircle className="w-3 h-3 text-rose-500" /> Dibatalkan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-150 uppercase tracking-widest leading-none">
                                      <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Pending Bayar
                                    </span>
                                  )}
                                </div>

                                <div className="flex justify-end gap-1.5">
                                  {tx.status === 'pending' && (
                                    <button
                                      onClick={() => handleVerifyTxPayment(tx.id)}
                                      className="px-2 py-1.5 bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-[10px] rounded-lg cursor-pointer shadow-3xs transition-all"
                                    >
                                      Selesaikan / Lunas
                                    </button>
                                  )}
                                  {tx.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelTxPayment(tx.id)}
                                      className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[10px] border border-rose-150 rounded-lg cursor-pointer transition-all"
                                    >
                                      Batalkan
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteTx(tx.id)}
                                    className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: ACCOUNT CRUD */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsAccountModalOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h4 className="font-bold text-slate-950">{editingAccount ? 'Edit Akun Mitra' : 'Tambah Akun Jaringan Baru'}</h4>
              <button onClick={() => setIsAccountModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 block">Nama Lengkap</span>
                <input
                  required
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder="Nama Lengkap Pemilik"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-450 block">Username</span>
                  <input
                    required
                    type="text"
                    value={accUsername}
                    onChange={e => setAccUsername(e.target.value)}
                    placeholder="budi_mitra"
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-450 block">Password</span>
                  <input
                    required={!editingAccount}
                    type="text"
                    value={accPassword}
                    onChange={e => setAccPassword(e.target.value)}
                    placeholder={editingAccount ? 'Ubah password' : 'password123'}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 block">No. HP / WhatsApp</span>
                <input
                  required
                  type="text"
                  value={accPhone}
                  onChange={e => setAccPhone(e.target.value)}
                  placeholder="0812345678"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 block">Alamat / Wilayah</span>
                <input
                  type="text"
                  value={accAddress}
                  onChange={e => setAccAddress(e.target.value)}
                  placeholder="Kota Pekanbaru, Riau"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-450 block">Hierarki Level</span>
                  <select
                    value={accLevel}
                    onChange={e => setAccLevel(e.target.value as Account['level'])}
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl"
                  >
                    <option value="konsultan">Level 1: Konsultan</option>
                    <option value="induk">Level 2: Induk</option>
                    <option value="mitra">Level 3: Mitra</option>
                    <option value="agen">Level 4: Agen</option>
                    <option value="subagen">Level 5: Sub Agen</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-450 block">Bawahan Dari Upline</span>
                  <select
                    value={accParentId}
                    onChange={e => setAccParentId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl text-xs"
                  >
                    <option value="">Direct Pusat (Tidak Ada)</option>
                    {accounts.filter(a => a.level !== 'admin' && a.id !== editingAccount?.id).map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({getLevelDisplayName(a.level)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2.5 border bg-white border-slate-205 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/95 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCT CRUD */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h4 className="font-bold text-slate-950">{editingProduct ? 'Edit Program Pendidikan' : 'Tambah Program Baru'}</h4>
              <button className="cursor-pointer" onClick={() => setIsProductModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 block">Nama Program Pendidikan</span>
                <input
                  required
                  type="text"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  placeholder="Contoh: Tahfidz Berbasis Coding - Scratch & Python"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-green block">Kategori Program</span>
                <input
                  required
                  type="text"
                  value={prodCat}
                  onChange={e => setProdCat(e.target.value)}
                  placeholder="Kategori (contoh: Pendidikan Anak)"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-brand-yellow block">Uang Pangkal</span>
                  <input
                    required
                    type="number"
                    value={prodAdmission}
                    onChange={e => setProdAdmission(parseInt(e.target.value) || 0)}
                    placeholder="1000000"
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Registrasi</span>
                  <input
                    required
                    type="number"
                    value={prodReg}
                    onChange={e => setProdReg(parseInt(e.target.value) || 0)}
                    placeholder="250000"
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">SPP Bulanan</span>
                  <input
                    required
                    type="number"
                    value={prodMonth}
                    onChange={e => setProdMonth(parseInt(e.target.value) || 0)}
                    placeholder="150000"
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 block">Google Drive Embed Image / Unsplash URL</span>
                <input
                  type="url"
                  value={prodImg}
                  onChange={e => setProdImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-brand-green block">Urutan Tampil Program (Makin kecil makin dahulu / di atas)</span>
                <input
                  required
                  type="number"
                  value={prodOrder}
                  onChange={e => setProdOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none focus:border-brand-green font-semibold"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 block">Diskon Produk jika menggunakan Kode Referral (IDR)</span>
                <input
                  required
                  type="number"
                  value={prodReferralDiscount}
                  onChange={e => setProdReferralDiscount(parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 50000"
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-rose-800 text-sm rounded-xl outline-none focus:border-brand-green font-semibold"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 block">Keterangan Produk</span>
                <textarea
                  required
                  rows={4}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  placeholder="Jelaskan detail program akademik dan pembagian metode hafalannya..."
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-sm rounded-xl outline-none resize-none focus:border-brand-green"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/95 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-green/10 cursor-pointer"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WITHDRAWAL TRANSFER PROOF UPLOAD */}
      {selectedWdForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div onClick={() => setSelectedWdForVerify(null)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"></div>
          
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h4 className="font-bold text-slate-950">Prosedur Verifikasi Pencairan</h4>
              <button className="cursor-pointer" onClick={() => setSelectedWdForVerify(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-brand-green/10 rounded-2xl p-4 border border-brand-green/20">
                <p className="text-xs text-brand-green uppercase font-bold">Rincian Penarikan:</p>
                <p className="font-bold text-slate-850 text-base mt-2">{selectedWdForVerify.requesterName} (<span className="uppercase text-brand-green">{getLevelDisplayName(selectedWdForVerify.requesterLevel)}</span>)</p>
                <p className="text-xl font-black text-rose-600 mt-1">{formatPrice(selectedWdForVerify.amount)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-450 block">Bukti Transfer Realized Link (G-Drive / Asset URL)</span>
                <input
                  type="url"
                  value={wdProofInput}
                  onChange={e => setWdProofInput(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-white text-slate-800 text-xs rounded-xl outline-none focus:border-brand-green"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Contoh link transaksi perbankan atau screenshot bukti transfer digital.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWdForVerify(null)}
                  className="px-4 py-2 border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWdVerify}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green/95 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Konfirmasi Sudah Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div onClick={() => setConfirmModal(null)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col z-10 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-sm leading-tight">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 leading-normal">{confirmModal.message}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const onConfirm = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await onConfirm();
                }}
                className="px-4 py-2 bg-brand-green hover:bg-brand-green/95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
