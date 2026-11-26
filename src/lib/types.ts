export type TxType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type WalletKind = 'cash' | 'bank' | 'ewallet'
export type Jenis = 'transaksional' | 'vault'
export type Group = 'kebutuhan' | 'keinginan' | 'tabungan'

export const KIND_LABEL: Record<WalletKind, string> = { cash: 'Tunai', bank: 'Bank', ewallet: 'E-wallet' }
export const GROUP_LABEL: Record<Group, string> = { kebutuhan: 'Kebutuhan', keinginan: 'Keinginan', tabungan: 'Tabungan' }

export interface Wallet { id: string; name: string; kind: WalletKind; jenis?: Jenis; openingBalance: number; balance: number; active: boolean }
export interface Category { id: string; name: string; type: 'income' | 'expense'; group: Group | null; budgetNominal?: number; active: boolean }
export interface Template {
  id: string; label: string; type: 'income' | 'expense' | 'transfer'
  categoryId: string | null; walletId: string | null; toWalletId: string | null
  defaultAmount: number; usageCount: number
}
export interface NewTx {
  type: TxType; date: string; amount: number; description: string
  categoryId: string | null; walletFromId: string | null; walletToId: string | null
  status: 'draft' | 'final'
}
export interface Tx extends NewTx { id: string }

export interface Aset { id: string; kategori: string; name: string; value: number; note: string }
export interface Goal { id: string; name: string; walletId: string; targetAmount: number; deadline: string | null; darurat: boolean }
export interface Summary { id: string; totalIncome: number; totalExpense: number }
export interface NWLog { id: string; totalAsset: number; totalLiability: number; netWorth: number }
export interface Settings { tahunAktif: number; targetSavingRate: number; targetEmergencyFundBulan: number; targetInvestmentRatio: number; targetDebtRatioMaks: number }

export const INVEST = ['Reksa Dana', 'Saham', 'Crypto', 'Deposito', 'Emas']
export const TETAP = ['Properti', 'Kendaraan']
export const ASET_KATEGORI = [...INVEST, ...TETAP, 'Piutang', 'Aset Lain']
export const LIAB_KATEGORI = ['Cicilan', 'Kartu Kredit', 'PayLater', 'Pinjaman', 'Liability Lain']
