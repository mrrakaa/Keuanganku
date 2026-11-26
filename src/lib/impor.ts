import { collection, doc, serverTimestamp, writeBatch, type WriteBatch } from 'firebase/firestore'
import { db } from './firebase'
import { efek, newAcc } from './tx'
import type { Group, Jenis, NewTx, TxType, WalletKind } from './types'

export interface ImporData {
  settings?: Record<string, number>
  wallets: { name: string; kind: WalletKind; jenis: Jenis; openingBalance: number; active: boolean }[]
  categories: { name: string; type: 'income' | 'expense'; group: Group | null; budgetNominal: number }[]
  transactions: { date: string; type: TxType; category: string | null; walletFrom: string | null; walletTo: string | null; description: string; amount: number }[]
}

export async function imporSemua(uid: string, d: ImporData) {
  const U = (n: string) => collection(db, 'users', uid, n)
  const wid = new Map(d.wallets.map((w) => [w.name, doc(U('wallets')).id]))
  const cid = new Map(d.categories.map((c) => [c.name, doc(U('categories')).id]))
  const ambil = (m: Map<string, string>, n: string | null, apa: string) => {
    if (n === null) return null
    const v = m.get(n)
    if (!v) throw new Error(`${apa} tidak dikenal: ${n}`)
    return v
  }
  const acc = newAcc()
  const ops: ((b: WriteBatch) => void)[] = []
  for (const t of d.transactions) {
    const n: NewTx = {
      type: t.type, date: t.date, amount: t.amount, description: t.description, status: 'final',
      categoryId: ambil(cid, t.category, 'Kategori'), walletFromId: ambil(wid, t.walletFrom, 'Wallet'), walletToId: ambil(wid, t.walletTo, 'Wallet'),
    }
    efek(n, 1, acc)
    ops.push((b) => b.set(doc(U('transactions')), { ...n, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
  }
  for (const w of d.wallets) {
    const id = wid.get(w.name)!
    ops.push((b) => b.set(doc(db, 'users', uid, 'wallets', id), { ...w, balance: w.openingBalance + (acc.w.get(id) ?? 0) }))
  }
  for (const c of d.categories) {
    const id = cid.get(c.name)!
    ops.push((b) => b.set(doc(db, 'users', uid, 'categories', id), { ...c, active: true }))
  }
  acc.s.forEach((s, k) =>
    ops.push((b) => b.set(doc(db, 'users', uid, 'monthlySummaries', k), { totalIncome: s.inc, totalExpense: s.exp, byCategory: Object.fromEntries(s.cat) })),
  )
  if (d.settings) ops.push((b) => b.set(doc(db, 'users', uid, 'settings', 'main'), d.settings!))
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db)
    ops.slice(i, i + 400).forEach((op) => op(b))
    await b.commit()
  }
  return { wallet: d.wallets.length, kategori: d.categories.length, transaksi: d.transactions.length }
}
