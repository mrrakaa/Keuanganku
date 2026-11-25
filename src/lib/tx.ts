import { addDoc, collection, doc, increment, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import type { Group, NewTx, Template, WalletKind } from './types'

const col = (uid: string, name: string) => collection(db, 'users', uid, name)

// Satu batch: transaksi + saldo wallet + ringkasan bulanan (atomik, jalan juga saat offline).
// Draft tidak mengubah saldo/ringkasan sampai dilengkapi.
export function addTransaction(uid: string, t: NewTx) {
  const b = writeBatch(db)
  b.set(doc(col(uid, 'transactions')), { ...t, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  if (t.status === 'final') {
    const geser = (id: string | null, d: number) => {
      if (id) b.update(doc(db, 'users', uid, 'wallets', id), { balance: increment(d) })
    }
    if (t.type === 'expense') geser(t.walletFromId, -t.amount)
    if (t.type === 'income') geser(t.walletToId, t.amount)
    if (t.type === 'transfer') {
      geser(t.walletFromId, -t.amount)
      geser(t.walletToId, t.amount)
    }
    if (t.type === 'income' || t.type === 'expense') {
      b.set(
        doc(db, 'users', uid, 'monthlySummaries', t.date.slice(0, 7)),
        {
          [t.type === 'income' ? 'totalIncome' : 'totalExpense']: increment(t.amount),
          byCategory: t.categoryId ? { [t.categoryId]: increment(t.amount) } : {},
        },
        { merge: true },
      )
    }
  }
  return b.commit()
}

export const saveTemplate = (uid: string, t: Omit<Template, 'id'>) => addDoc(col(uid, 'quickTemplates'), t)
export const bumpTemplate = (uid: string, id: string) =>
  updateDoc(doc(db, 'users', uid, 'quickTemplates', id), { usageCount: increment(1) })

export const addWallet = (uid: string, name: string, kind: WalletKind, openingBalance: number) =>
  addDoc(col(uid, 'wallets'), { name, kind, openingBalance, balance: openingBalance, active: true })

export const addCategory = (uid: string, name: string, type: 'income' | 'expense', group: Group | null) =>
  addDoc(col(uid, 'categories'), { name, type, group, active: true })

export function seedDefaults(uid: string) {
  const b = writeBatch(db)
  const wallets: [string, WalletKind][] = [['Tunai', 'cash'], ['Rekening Bank', 'bank'], ['E-wallet', 'ewallet']]
  wallets.forEach(([name, kind]) =>
    b.set(doc(col(uid, 'wallets')), { name, kind, openingBalance: 0, balance: 0, active: true }),
  )
  const exp: [string, Group][] = [
    ['Makan', 'kebutuhan'], ['Transportasi', 'kebutuhan'], ['Tagihan', 'kebutuhan'],
    ['Rokok', 'keinginan'], ['Nongkrong', 'keinginan'], ['Belanja Online', 'keinginan'],
  ]
  exp.forEach(([name, group]) => b.set(doc(col(uid, 'categories')), { name, type: 'expense', group, active: true }))
  ;['Gaji', 'Pemasukan Lain'].forEach((name) =>
    b.set(doc(col(uid, 'categories')), { name, type: 'income', group: null, active: true }),
  )
  return b.commit()
}
