/**
 * Data Service for Tahfidz Coding Sales Portal
 * Handles real-time synchronized persistence with Firebase Firestore
 */
import { 
  Account, 
  Product, 
  Transaction, 
  WithdrawalRequest, 
  TahfidzProgress, 
  PortalConfig,
  CommissionSplit
} from '../types';
import { db, auth } from './firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Default mock data to populate local storage and Firebase if empty
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Tahfidz Berbasis Coding - Paket Basic',
    category: 'Pendidikan Anak',
    imageSrc: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=800',
    admissionFee: 1000000,
    regFee: 250000,
    monthlyFee: 150000,
    description: 'Program menghafal Al-Qur\'an Juz 30 sambil belajar logika pemrograman Scratch & Python dasar. Dirancang khusus untuk anak usia 7-12 tahun.',
    referralDiscount: 50000
  },
  {
    id: 'prod-2',
    name: 'Hafizh AI Developer - Paket Premium',
    category: 'Pendidikan Remaja',
    imageSrc: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
    admissionFee: 1500000,
    regFee: 500000,
    monthlyFee: 300000,
    description: 'Kelas intensif menghafal Juz Amma + Juz 1-2 dikombinasikan dengan Fullstack Web Development (React & Node.js) serta pemanfaatan Gemini AI API.',
    referralDiscount: 100000
  },
  {
    id: 'prod-3',
    name: 'Algoritma Huffaz - Kelas Dewasa',
    category: 'Pendidikan Dewasa',
    imageSrc: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    admissionFee: 1200000,
    regFee: 400000,
    monthlyFee: 250000,
    description: 'Kelas khusus dewasa dengan metode hafalan akseleratif berbasis visual mind mapping digital & software tracking Al-Qur\'an buatan sendiri.',
    referralDiscount: 100000
  }
];

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'admin-1',
    name: 'Ustadz Admin Pusat',
    username: 'admin',
    password: 'password123',
    phone: '08123456789',
    address: 'Pusat Coding Tahfidz, Jakarta',
    level: 'admin',
    referralCode: 'ADMINKODING',
    commissionPercent: 0
  },
  {
    id: 'mitra-1',
    name: 'Ahmad Muzakki (Mitra Riau)',
    username: 'ahmad_mitra',
    password: 'password123',
    phone: '08111222333',
    address: 'Pekanbaru, Riau',
    level: 'mitra',
    referralCode: 'AHMADMITR1',
    commissionPercent: 15
  },
  {
    id: 'sub-1',
    name: 'Siti Sarah (Sub-Mitra Pekanbaru)',
    username: 'siti_sub',
    password: 'password123',
    phone: '08222333444',
    address: 'Kec. Tampan, Pekanbaru',
    level: 'submitra',
    parentId: 'mitra-1',
    referralCode: 'SITISUBPEK2',
    commissionPercent: 10
  },
  {
    id: 'agen-1',
    name: 'Budi Santoso (Agen Tampan)',
    username: 'budi_agen',
    password: 'password123',
    phone: '08333444555',
    address: 'Perumahan Panam Raya, Pekanbaru',
    level: 'agen',
    parentId: 'sub-1',
    referralCode: 'BUDIAGETAP3',
    commissionPercent: 5
  }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    buyerName: 'Muhammad Reyhan',
    buyerPhone: '08999888777',
    buyerAddress: 'Jl. Sudirman No 45, Pekanbaru',
    products: [
      {
        productId: 'prod-1',
        productName: 'Tahfidz Berbasis Coding - Paket Basic',
        regFee: 250000,
        monthlyFee: 150000
      }
    ],
    totalPrice: 400000,
    discountAmount: 25000,
    payableAmount: 375000,
    referralCodeUsed: 'BUDIAGETAP3',
    referrerId: 'agen-1',
    commissions: [
      {
        recipientId: 'agen-1',
        recipientName: 'Budi Santoso (Agen Tampan)',
        level: 'agen',
        amount: 12500,
        percentage: 5
      },
      {
        recipientId: 'sub-1',
        recipientName: 'Siti Sarah (Sub-Mitra Pekanbaru)',
        level: 'submitra',
        amount: 25000,
        percentage: 10
      },
      {
        recipientId: 'mitra-1',
        recipientName: 'Ahmad Muzakki (Mitra Riau)',
        level: 'mitra',
        amount: 37500,
        percentage: 15
      }
    ],
    status: 'verified',
    createdAt: '2026-05-20T08:00:00Z'
  }
];

const DEFAULT_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd-1',
    requesterId: 'mitra-1',
    requesterName: 'Ahmad Muzakki',
    requesterLevel: 'mitra',
    amount: 30000,
    status: 'completed',
    proofImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-22T10:00:00Z',
    completedAt: '2026-05-22T14:30:00Z'
  },
  {
    id: 'wd-2',
    requesterId: 'agen-1',
    requesterName: 'Budi Santoso',
    requesterLevel: 'agen',
    amount: 10000,
    status: 'pending',
    createdAt: '2026-05-26T04:15:00Z'
  }
];

const DEFAULT_TAHFIDZ: TahfidzProgress[] = [
  {
    partnerId: 'mitra-1',
    totalSurahs: 3,
    totalJuz: 1,
    lastUpdated: '2026-05-26T08:00:00Z',
    logs: [
      { id: 'l-1', date: '2026-05-24', surah: 'An-Naba', fromAyat: 1, toAyat: 20, status: 'Setor Baru', notes: 'Makhroj sangat bagus, harap lancarkan dengung.' },
      { id: 'l-2', date: '2026-05-25', surah: 'An-Naba', fromAyat: 21, toAyat: 40, status: 'Setor Baru', notes: 'Alhamdulillah selesai Surah An-Naba.' },
      { id: 'l-3', date: '2026-05-26', surah: 'An-Naba', fromAyat: 1, toAyat: 40, status: 'Murojaah', notes: 'Sangat lancar, siap melanjutkan ke An-Nazi\'at.' }
    ]
  },
  {
    partnerId: 'sub-1',
    totalSurahs: 1,
    totalJuz: 0.5,
    lastUpdated: '2026-05-25T09:00:00Z',
    logs: [
      { id: 'l-4', date: '2026-05-23', surah: 'An-Nas', fromAyat: 1, toAyat: 6, status: 'Setor Baru' },
      { id: 'l-5', date: '2026-05-25', surah: 'Al-Falaq', fromAyat: 1, toAyat: 5, status: 'Setor Baru', notes: 'Fokus pada tajwid qalqalah.' }
    ]
  },
  {
    partnerId: 'agen-1',
    totalSurahs: 5,
    totalJuz: 1.2,
    lastUpdated: '2026-05-27T02:00:00Z',
    logs: [
      { id: 'l-6', date: '2026-05-25', surah: 'Al-Fajr', fromAyat: 1, toAyat: 15, status: 'Setor Baru', notes: 'Fokus tawasut ra rasm usmani.' },
      { id: 'l-7', date: '2026-05-27', surah: 'Al-Fajr', fromAyat: 16, toAyat: 30, status: 'Setor Baru', notes: 'Selesai Al-Fajr, murojaah besok.' }
    ]
  }
];

const DEFAULT_CONFIG: PortalConfig = {
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=150',
  bannerUrls: [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200'
  ],
  appName: 'KO-TA (Koding Tahfidz)',
  appDescription: 'Platform Afiliasi Syariah & Penerimaan Santri Baru',
  productSectionDescription: 'Pilih dan daftar program pendidikan Tahfidz + Coding unggulan kami di bawah ini untuk memulai belajar Al-Qur\'an dan pemrograman.',
  yayasanBankName: 'Bank Syariah Indonesia (BSI)',
  yayasanBankAccountNumber: '7148592034',
  yayasanBankAccountName: 'Yayasan Koding Tahfidz Nusantara',
  footerText: '© 2026 Yayasan Koding Tahfidz Nusantara. Mendidik Generasi Hafizh Al-Qur\'an Modern yang Mahir Teknologi & Pemrograman.'
};

const KEYS = {
  PRODUCTS: 'tcs_products',
  ACCOUNTS: 'tcs_accounts',
  TRANSACTIONS: 'tcs_transactions',
  WITHDRAWALS: 'tcs_withdrawals',
  TAHFIDZ: 'tcs_tahfidz',
  CONFIG: 'tcs_config',
};

// Access helpers for LocalStorage (Fallback / Immediate response)
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving key ${key}`, e);
  }
}

// Memory Cache Layers (Pre-loaded from local storage synchronously on load to prevent any flash of template defaults)
let cacheProducts: Product[] = getStored<Product[]>(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
let cacheAccounts: Account[] = getStored<Account[]>(KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
let cacheTransactions: Transaction[] = getStored<Transaction[]>(KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
let cacheWithdrawals: WithdrawalRequest[] = getStored<WithdrawalRequest[]>(KEYS.WITHDRAWALS, DEFAULT_WITHDRAWALS);
let cacheTahfidzProgress: TahfidzProgress[] = getStored<TahfidzProgress[]>(KEYS.TAHFIDZ, DEFAULT_TAHFIDZ);
let cachePortalConfig: PortalConfig = getStored<PortalConfig>(KEYS.CONFIG, DEFAULT_CONFIG);

let isProductsLoaded = localStorage.getItem(KEYS.PRODUCTS) !== null;
let isAccountsLoaded = localStorage.getItem(KEYS.ACCOUNTS) !== null;
let isTransactionsLoaded = localStorage.getItem(KEYS.TRANSACTIONS) !== null;
let isWithdrawalsLoaded = localStorage.getItem(KEYS.WITHDRAWALS) !== null;
let isConfigLoaded = localStorage.getItem(KEYS.CONFIG) !== null;

// Listeners to trigger UI re-renders on remote Firestore updates
const dataListeners: (() => void)[] = [];

export const registerDataListener = (callback: () => void) => {
  dataListeners.push(callback);
  return () => {
    const idx = dataListeners.indexOf(callback);
    if (idx >= 0) dataListeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  dataListeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error("Listener update failed", e);
    }
  });
};

// Global initialization of Real-Time Firebase Subscriptions
export const initializeFirebaseSync = async () => {
  console.log("Initializing Firebase Sync listeners...");

  // Setup PortalConfig Listener
  onSnapshot(
    doc(db, 'portalConfig', 'main'),
    async (snap) => {
      try {
        if (snap.exists()) {
          cachePortalConfig = snap.data() as PortalConfig;
          setStored(KEYS.CONFIG, cachePortalConfig);
        } else {
          await setDoc(doc(db, 'portalConfig', 'main'), DEFAULT_CONFIG);
          cachePortalConfig = DEFAULT_CONFIG;
        }
        isConfigLoaded = true;
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'portalConfig/main');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'portalConfig/main');
    }
  );

  // Setup Products Listener
  onSnapshot(
    collection(db, 'products'),
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          const hasSeeded = getStored<boolean>('tcs_products_seeded', false);
          if (!hasSeeded) {
            for (const p of DEFAULT_PRODUCTS) {
              await setDoc(doc(db, 'products', p.id), p);
            }
            setStored('tcs_products_seeded', true);
            cacheProducts = DEFAULT_PRODUCTS;
          } else {
            cacheProducts = [];
            setStored(KEYS.PRODUCTS, []);
          }
        } else {
          const items: Product[] = [];
          snapshot.forEach(d => {
            items.push(d.data() as Product);
          });
          cacheProducts = items;
          setStored(KEYS.PRODUCTS, cacheProducts);
          // Auto-mark as seeded if database is already populated
          setStored('tcs_products_seeded', true);
        }
        isProductsLoaded = true;
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'products');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
    }
  );

  // Setup Accounts Listener
  onSnapshot(
    collection(db, 'accounts'),
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          const hasSeeded = getStored<boolean>('tcs_accounts_seeded', false);
          if (!hasSeeded) {
            for (const a of DEFAULT_ACCOUNTS) {
              await setDoc(doc(db, 'accounts', a.id), a);
            }
            setStored('tcs_accounts_seeded', true);
            cacheAccounts = DEFAULT_ACCOUNTS;
          } else {
            cacheAccounts = [];
            setStored(KEYS.ACCOUNTS, []);
          }
        } else {
          const items: Account[] = [];
          snapshot.forEach(d => {
            items.push(d.data() as Account);
          });
          cacheAccounts = items;
          setStored(KEYS.ACCOUNTS, cacheAccounts);
          // Auto-mark as seeded if database is already populated
          setStored('tcs_accounts_seeded', true);
        }
        isAccountsLoaded = true;
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'accounts');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'accounts');
    }
  );

  // Setup Transactions Listener
  onSnapshot(
    collection(db, 'transactions'),
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          const hasSeeded = getStored<boolean>('tcs_transactions_seeded', false);
          if (!hasSeeded) {
            for (const t of DEFAULT_TRANSACTIONS) {
              await setDoc(doc(db, 'transactions', t.id), t);
            }
            setStored('tcs_transactions_seeded', true);
            cacheTransactions = DEFAULT_TRANSACTIONS;
          } else {
            cacheTransactions = [];
            setStored(KEYS.TRANSACTIONS, []);
          }
        } else {
          const items: Transaction[] = [];
          snapshot.forEach(d => {
            items.push(d.data() as Transaction);
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          cacheTransactions = items;
          setStored(KEYS.TRANSACTIONS, cacheTransactions);
          // Auto-mark as seeded if database is already populated
          setStored('tcs_transactions_seeded', true);
        }
        isTransactionsLoaded = true;
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transactions');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'transactions');
    }
  );

  // Setup Withdrawals Listener
  onSnapshot(
    collection(db, 'withdrawals'),
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          const hasSeeded = getStored<boolean>('tcs_withdrawals_seeded', false);
          if (!hasSeeded) {
            for (const w of DEFAULT_WITHDRAWALS) {
              await setDoc(doc(db, 'withdrawals', w.id), w);
            }
            setStored('tcs_withdrawals_seeded', true);
            cacheWithdrawals = DEFAULT_WITHDRAWALS;
          } else {
            cacheWithdrawals = [];
            setStored(KEYS.WITHDRAWALS, []);
          }
        } else {
          const items: WithdrawalRequest[] = [];
          snapshot.forEach(d => {
            items.push(d.data() as WithdrawalRequest);
          });
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          cacheWithdrawals = items;
          setStored(KEYS.WITHDRAWALS, cacheWithdrawals);
          // Auto-mark as seeded if database is already populated
          setStored('tcs_withdrawals_seeded', true);
        }
        isWithdrawalsLoaded = true;
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'withdrawals');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'withdrawals');
    }
  );

  // Setup Tahfidz Listener
  onSnapshot(
    collection(db, 'tahfidzProgress'),
    async (snapshot) => {
      try {
        if (snapshot.empty) {
          const hasSeeded = getStored<boolean>('tcs_tahfidz_seeded', false);
          if (!hasSeeded) {
            for (const t of DEFAULT_TAHFIDZ) {
              await setDoc(doc(db, 'tahfidzProgress', t.partnerId), t);
            }
            setStored('tcs_tahfidz_seeded', true);
            cacheTahfidzProgress = DEFAULT_TAHFIDZ;
          } else {
            cacheTahfidzProgress = [];
            setStored(KEYS.TAHFIDZ, []);
          }
        } else {
          const items: TahfidzProgress[] = [];
          snapshot.forEach(d => {
            items.push(d.data() as TahfidzProgress);
          });
          cacheTahfidzProgress = items;
          setStored(KEYS.TAHFIDZ, cacheTahfidzProgress);
          setStored('tcs_tahfidz_seeded', true);
        }
        notifyListeners();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'tahfidzProgress');
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'tahfidzProgress');
    }
  );
};

export const DataService = {
  isReady(): boolean {
    return isProductsLoaded && isConfigLoaded;
  },

  // ----------------------------------------------------
  // CONFIG LOGO & BANNERS
  // ----------------------------------------------------
  getConfig(): PortalConfig {
    return cachePortalConfig;
  },

  async saveConfig(config: PortalConfig): Promise<void> {
    cachePortalConfig = config;
    setStored(KEYS.CONFIG, config);
    notifyListeners();
    try {
      await setDoc(doc(db, 'portalConfig', 'main'), config);
    } catch (e) {
      console.error("Firebase saveConfig error:", e);
    }
  },

  // ----------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------
  getProducts(): Product[] {
    return [...cacheProducts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  },

  async saveProduct(product: Product): Promise<Product> {
    const list = this.getProducts();
    let target = { ...product };
    if (!target.id) {
      target.id = 'prod-' + Date.now();
    }
    
    // Update memory
    const idx = list.findIndex(p => p.id === target.id);
    if (idx >= 0) {
      list[idx] = target;
    } else {
      list.push(target);
    }
    cacheProducts = [...list];
    setStored(KEYS.PRODUCTS, cacheProducts);
    notifyListeners();

    try {
      await setDoc(doc(db, 'products', target.id), target);
    } catch (e) {
      console.error("Firebase saveProduct error:", e);
    }
    return target;
  },

  async deleteProduct(id: string): Promise<void> {
    const list = this.getProducts();
    cacheProducts = list.filter(p => p.id !== id);
    setStored(KEYS.PRODUCTS, cacheProducts);
    notifyListeners();

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.error("Firebase deleteProduct error:", e);
    }
  },

  // ----------------------------------------------------
  // ACCOUNTS & RELATIONSHIPS
  // ----------------------------------------------------
  getAccounts(): Account[] {
    return cacheAccounts;
  },

  async saveAccount(acc: Account): Promise<Account> {
    const list = this.getAccounts();
    let target = { ...acc };
    if (!target.id) {
      target.id = 'acc-' + Date.now();
    }

    const idx = list.findIndex(a => a.id === target.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...target };
    } else {
      list.push(target);
    }
    cacheAccounts = [...list];
    setStored(KEYS.ACCOUNTS, cacheAccounts);
    notifyListeners();

    try {
      await setDoc(doc(db, 'accounts', target.id), target);
    } catch (e) {
      console.error("Firebase saveAccount error:", e);
    }
    return target;
  },

  async deleteAccount(id: string): Promise<void> {
    const list = this.getAccounts();
    cacheAccounts = list.filter(a => a.id !== id);
    setStored(KEYS.ACCOUNTS, cacheAccounts);
    notifyListeners();

    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (e) {
      console.error("Firebase deleteAccount error:", e);
    }
  },

  // ----------------------------------------------------
  // TRANSACTIONS & COMMISSIONS CALCULATION
  // ----------------------------------------------------
  getTransactions(): Transaction[] {
    if (!isTransactionsLoaded && cacheTransactions.length === 0) {
      const stored = getStored<Transaction[]>(KEYS.TRANSACTIONS, []);
      cacheTransactions = stored.length > 0 ? stored : DEFAULT_TRANSACTIONS;
      isTransactionsLoaded = true;
    }
    return cacheTransactions;
  },

  async createTransaction(data: {
    buyerName: string;
    buyerPhone: string;
    buyerAddress: string;
    products: (Product & { quantity?: number })[];
    referralCode?: string;
  }): Promise<Transaction> {
    const accounts = this.getAccounts();
    const transactions = this.getTransactions();

    // 1. Calculate price variables
    let totalPrice = 0;
    const detailProducts = data.products.map(p => {
      const q = p.quantity || 1;
      const admission = p.admissionFee || 0;
      totalPrice += (admission + p.regFee + p.monthlyFee) * q;
      return {
        productId: p.id,
        productName: p.name,
        admissionFee: admission,
        regFee: p.regFee,
        monthlyFee: p.monthlyFee,
        referralDiscount: p.referralDiscount || 0,
        quantity: q
      };
    });

    // 2. Resolve referral and commission receiver chain
    let discountAmount = 0;
    let referrerId: string | undefined = undefined;
    let referrerAccount: Account | undefined = undefined;

    if (data.referralCode) {
      const codeCleaned = data.referralCode.trim().toUpperCase();
      referrerAccount = accounts.find(a => a.referralCode.toUpperCase() === codeCleaned);
      if (referrerAccount) {
        referrerId = referrerAccount.id;
        // Compute discount based on product's referralDiscount and quantity
        discountAmount = data.products.reduce((acc, p) => acc + (p.referralDiscount || 0) * (p.quantity || 1), 0);
      }
    }

    const payableAmount = Math.max(0, totalPrice - discountAmount);

    // 3. Multi-level commissions calculation
    const commissions: CommissionSplit[] = [];
    
    if (referrerAccount) {
      // Build the upward referral chain (e.g. [Agen, Sub-Mitra, Mitra])
      const chain: Account[] = [];
      let current: Account | undefined = referrerAccount;
      const visited = new Set<string>();
      while (current) {
        if (visited.has(current.id)) {
          console.warn("Circular reference detected in referral chain:", current.id);
          break;
        }
        visited.add(current.id);
        if (current.level !== 'admin') {
          chain.push(current);
        }
        if (current.parentId && current.parentId !== current.id) {
          current = accounts.find(a => a.id === current?.parentId);
        } else {
          current = undefined;
        }
      }

      // Calculate commissions based on the rate difference of consecutive levels in the chain
      // Commission is calculated from the payable amount (transaction value after discount)
      for (let i = 0; i < chain.length; i++) {
        const item = chain[i];
        let cleanPercent = item.commissionPercent;

        if (i > 0) {
          // Subtract the rate of the preceding level below it
          cleanPercent = Math.max(0, item.commissionPercent - chain[i - 1].commissionPercent);
        }

        const commissionAmount = Math.round((cleanPercent / 100) * payableAmount);

        commissions.push({
          recipientId: item.id,
          recipientName: item.name,
          level: item.level,
          amount: commissionAmount,
          percentage: cleanPercent
        });
      }
    }

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerAddress: data.buyerAddress,
      products: detailProducts,
      totalPrice,
      discountAmount,
      payableAmount,
      referralCodeUsed: data.referralCode || '',
      referrerId: referrerId || '',
      commissions,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    transactions.unshift(newTx);
    cacheTransactions = [...transactions];
    setStored(KEYS.TRANSACTIONS, cacheTransactions);
    notifyListeners();

    try {
      await setDoc(doc(db, 'transactions', newTx.id), newTx);
    } catch (e) {
      console.error("Firebase createTransaction error:", e);
    }
    return newTx;
  },

  async verifyTransactionPayment(id: string): Promise<void> {
    const list = this.getTransactions();
    const idx = list.findIndex(tx => tx.id === id);
    if (idx >= 0) {
      const updatedTx = { ...list[idx], status: 'verified' as const };
      list[idx] = updatedTx;
      cacheTransactions = [...list];
      setStored(KEYS.TRANSACTIONS, cacheTransactions);
      notifyListeners();

      try {
        await setDoc(doc(db, 'transactions', id), updatedTx);
      } catch (e) {
        console.error("Firebase verifyTransactionPayment error:", e);
      }
    }
  },

  async cancelTransactionPayment(id: string): Promise<void> {
    const list = this.getTransactions();
    const idx = list.findIndex(tx => tx.id === id);
    if (idx >= 0) {
      const updatedTx = { ...list[idx], status: 'cancelled' as const };
      list[idx] = updatedTx;
      cacheTransactions = [...list];
      setStored(KEYS.TRANSACTIONS, cacheTransactions);
      notifyListeners();

      try {
        await setDoc(doc(db, 'transactions', id), updatedTx);
      } catch (e) {
        console.error("Firebase cancelTransactionPayment error:", e);
      }
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const list = this.getTransactions();
    const updatedList = list.filter(tx => tx.id !== id);
    cacheTransactions = [...updatedList];
    setStored(KEYS.TRANSACTIONS, cacheTransactions);
    notifyListeners();

    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (e) {
      console.error("Firebase deleteTransaction error:", e);
    }
  },

  // ----------------------------------------------------
  // WITHDRAWALS & SALDO VERIFICATION
  // ----------------------------------------------------
  getWithdrawals(): WithdrawalRequest[] {
    if (!isWithdrawalsLoaded && cacheWithdrawals.length === 0) {
      const stored = getStored<WithdrawalRequest[]>(KEYS.WITHDRAWALS, []);
      cacheWithdrawals = stored.length > 0 ? stored : DEFAULT_WITHDRAWALS;
      isWithdrawalsLoaded = true;
    }
    return cacheWithdrawals;
  },

  async createWithdrawal(requesterId: string, amount: number): Promise<WithdrawalRequest> {
    const list = this.getWithdrawals();
    const accounts = this.getAccounts();
    const requester = accounts.find(a => a.id === requesterId);

    const newWd: WithdrawalRequest = {
      id: 'wd-' + Date.now(),
      requesterId,
      requesterName: requester?.name || 'Partner',
      requesterLevel: requester?.level || 'agen',
      amount,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    list.unshift(newWd);
    cacheWithdrawals = [...list];
    setStored(KEYS.WITHDRAWALS, cacheWithdrawals);
    notifyListeners();

    try {
      await setDoc(doc(db, 'withdrawals', newWd.id), newWd);
    } catch (e) {
      console.error("Firebase createWithdrawal error:", e);
    }
    return newWd;
  },

  async verifyWithdrawal(id: string, proofImage: string): Promise<void> {
    const list = this.getWithdrawals();
    const idx = list.findIndex(wd => wd.id === id);
    if (idx >= 0) {
      const updatedWd = {
        ...list[idx],
        status: 'completed' as const,
        proofImage,
        completedAt: new Date().toISOString()
      };
      list[idx] = updatedWd;
      cacheWithdrawals = [...list];
      setStored(KEYS.WITHDRAWALS, cacheWithdrawals);
      notifyListeners();

      try {
        await setDoc(doc(db, 'withdrawals', id), updatedWd);
      } catch (e) {
        console.error("Firebase verifyWithdrawal error:", e);
      }
    }
  },

  // Helper: Calculate partner financial stats
  getPartnerBalances(partnerId: string) {
    const txs = this.getTransactions();
    const wds = this.getWithdrawals();

    const earned = txs
      .filter(tx => tx.status === 'verified')
      .reduce((sum, tx) => {
        const commObj = tx.commissions.find(c => c.recipientId === partnerId);
        return sum + (commObj ? commObj.amount : 0);
      }, 0);

    const pendingEarned = txs
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => {
        const commObj = tx.commissions.find(c => c.recipientId === partnerId);
        return sum + (commObj ? commObj.amount : 0);
      }, 0);

    const withdrawn = wds
      .filter(wd => wd.requesterId === partnerId && wd.status === 'completed')
      .reduce((sum, wd) => sum + wd.amount, 0);

    const pendingWithdrawal = wds
      .filter(wd => wd.requesterId === partnerId && wd.status === 'pending')
      .reduce((sum, wd) => sum + wd.amount, 0);

    const balance = earned - withdrawn - pendingWithdrawal;

    return {
      earned,
      pendingEarned,
      withdrawn,
      pendingWithdrawal,
      balance: Math.max(0, balance)
    };
  },

  // ----------------------------------------------------
  // QURANIC / TAHFIDZ PROGRESS & SPIRITUAL FEATURE
  // ----------------------------------------------------
  getTahfidzProgress(partnerId: string): TahfidzProgress {
    const list = cacheTahfidzProgress.length > 0 ? cacheTahfidzProgress : getStored<TahfidzProgress[]>(KEYS.TAHFIDZ, DEFAULT_TAHFIDZ);
    let item = list.find(p => p.partnerId === partnerId);
    if (!item) {
      item = {
        partnerId,
        totalSurahs: 0,
        totalJuz: 0,
        lastUpdated: new Date().toISOString(),
        logs: []
      };
    }
    return item;
  },

  async saveTahfidzLog(partnerId: string, log: Omit<TahfidzProgress['logs'][0], 'id'>): Promise<TahfidzProgress> {
    const list = cacheTahfidzProgress.length > 0 ? cacheTahfidzProgress : getStored<TahfidzProgress[]>(KEYS.TAHFIDZ, DEFAULT_TAHFIDZ);
    let itemIdx = list.findIndex(p => p.partnerId === partnerId);
    
    let item: TahfidzProgress;
    if (itemIdx >= 0) {
      item = { ...list[itemIdx] };
    } else {
      item = {
        partnerId,
        totalSurahs: 0,
        totalJuz: 0,
        lastUpdated: new Date().toISOString(),
        logs: []
      };
    }

    const newLog = {
      ...log,
      id: 'l-' + Date.now()
    };

    const updatedLogs = [newLog, ...item.logs];
    
    const uniqueSurahs = new Set(updatedLogs.map(l => l.surah.toLowerCase()));
    const totalSurahs = uniqueSurahs.size;
    
    const totalVerses = updatedLogs.reduce((acc, l) => acc + (l.toAyat - l.fromAyat + 1), 0);
    const totalJuz = Math.min(30, parseFloat((totalVerses / 100).toFixed(2)));

    const updatedItem: TahfidzProgress = {
      ...item,
      logs: updatedLogs,
      totalSurahs,
      totalJuz,
      lastUpdated: new Date().toISOString()
    };

    if (itemIdx >= 0) {
      const updatedList = [...list];
      updatedList[itemIdx] = updatedItem;
      cacheTahfidzProgress = updatedList;
    } else {
      cacheTahfidzProgress = [...list, updatedItem];
    }

    setStored(KEYS.TAHFIDZ, cacheTahfidzProgress);
    notifyListeners();

    try {
      await setDoc(doc(db, 'tahfidzProgress', partnerId), updatedItem);
    } catch (e) {
      console.error("Firebase saveTahfidzLog error:", e);
    }
    return updatedItem;
  },

  async clearAllDemoData(): Promise<void> {
    console.log("Starting wiping of all demo/transactional data...");
    
    // Ensure all seed flags are locked to true so they do not auto-recreate empty collections
    setStored('tcs_transactions_seeded', true);
    setStored('tcs_withdrawals_seeded', true);
    setStored('tcs_accounts_seeded', true);
    setStored('tcs_tahfidz_seeded', true);

    // 1. Wipe Transactions
    try {
      const txs = this.getTransactions();
      for (const tx of txs) {
        await deleteDoc(doc(db, 'transactions', tx.id));
      }
    } catch (e) {
      console.error("Error wiping transactions collection:", e);
    }
    cacheTransactions = [];
    setStored(KEYS.TRANSACTIONS, []);

    // 2. Wipe Withdrawals
    try {
      const wds = this.getWithdrawals();
      for (const wd of wds) {
        await deleteDoc(doc(db, 'withdrawals', wd.id));
      }
    } catch (e) {
      console.error("Error wiping withdrawals collection:", e);
    }
    cacheWithdrawals = [];
    setStored(KEYS.WITHDRAWALS, []);

    // 3. Wipe Tahfidz Progress
    try {
      for (const t of cacheTahfidzProgress) {
        await deleteDoc(doc(db, 'tahfidzProgress', t.partnerId));
      }
    } catch (e) {
      console.error("Error wiping tahfidzProgress collection:", e);
    }
    cacheTahfidzProgress = [];
    setStored(KEYS.TAHFIDZ, []);

    // 4. Wipe non-admin accounts (keeping admin accounts intact)
    try {
      const accs = this.getAccounts();
      for (const acc of accs) {
        if (acc.level !== 'admin' && acc.username !== 'admin') {
          await deleteDoc(doc(db, 'accounts', acc.id));
        }
      }
      cacheAccounts = accs.filter(acc => acc.level === 'admin' || acc.username === 'admin');
      setStored(KEYS.ACCOUNTS, cacheAccounts);
    } catch (e) {
      console.error("Error wiping accounts collection:", e);
    }

    notifyListeners();
  }
};
