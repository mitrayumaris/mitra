/**
 * Types definition for Tahfidz Coding Sales Portal
 */

export type UserLevel = 'admin' | 'mitra' | 'submitra' | 'agen';

export interface Account {
  id: string;
  name: string;
  username: string;
  password?: string; // Hidden on client except for display in Admin
  phone: string;
  address: string;
  level: UserLevel;
  parentId?: string; // Connections: Agent level 3 -> Sub-Mitra level 2 -> Mitra level 1
  referralCode: string; // The code used for customer purchases
  commissionPercent: number; // Percent of registration fee or total sale
}

export interface Product {
  id: string;
  name: string;
  category: string;
  imageSrc: string; // Embed Google Drive link or static image
  admissionFee?: number; // Uang Pangkal (Biaya Pangkal)
  regFee: number; // Biaya Pendaftaran
  monthlyFee: number; // Biaya Bulanan
  description: string;
  referralDiscount?: number; // Biaya diskon jika mendaftar menggunakan referral code
  order?: number; // Sorting/arrangement order of programs
}

export interface ReferralCode {
  id: string;
  code: string;
  ownerId: string;
  discountPercent: number;
}

export interface CommissionSplit {
  recipientId: string;
  recipientName: string;
  level: UserLevel;
  amount: number;
  percentage: number;
}

export interface Transaction {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  products: {
    productId: string;
    productName: string;
    admissionFee?: number;
    regFee: number;
    monthlyFee: number;
    referralDiscount?: number;
    quantity?: number;
  }[];
  totalPrice: number; // Sum of regFee + monthlyFee across products
  discountAmount: number; // Referral code discount amount
  payableAmount: number; // Total price - discount
  referralCodeUsed?: string;
  referrerId?: string; // Partner who referred
  commissions: CommissionSplit[]; // Calculated split
  status: 'pending' | 'verified' | 'cancelled'; // Center payment verification
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterLevel: UserLevel;
  amount: number;
  status: 'pending' | 'completed';
  proofImage?: string; // Embed G-Drive proof of transfer
  createdAt: string;
  completedAt?: string;
}

export interface TahfidzLog {
  id: string;
  date: string;
  surah: string;
  fromAyat: number;
  toAyat: number;
  status: 'Setor Baru' | 'Murojaah' | 'Lancar';
  notes?: string;
}

export interface TahfidzProgress {
  partnerId: string;
  totalSurahs: number;
  totalJuz: number;
  lastUpdated: string;
  logs: TahfidzLog[];
}

export interface PortalConfig {
  logoUrl: string;
  bannerUrls: string[];
  appName?: string;
  appDescription?: string;
  productSectionDescription?: string;
  yayasanBankName?: string;
  yayasanBankAccountNumber?: string;
  yayasanBankAccountName?: string;
  footerText?: string;
}
