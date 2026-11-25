export type TxType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type WalletKind = 'cash' | 'bank' | 'ewallet'
export type Group = 'kebutuhan' | 'keinginan' | 'tabungan'

export const KIND_LABEL: Record<WalletKind, string> = { cash: 'Tunai', bank: 'Bank', ewallet: 'E-wallet' }
export const GROUP_LABEL: Record<Group, string> = { kebutuhan: 'Kebutuhan', keinginan: 'Keinginan', tabungan: 'Tabungan' }

export interface Wallet { id: string; name: string; kind: WalletKind; openingBalance: number; balance: number; active: boolean }
export interface Category { id: string; name: string; type: 'income' | 'expense'; group: Group | null; active: boolean }
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
