import { addDoc, collection, doc, getDocs, increment, serverTimestamp, updateDoc, writeBatch, type FieldValue, type WriteBatch } from 'firebase/firestore'
import { db } from './firebase'
import type { Group, Jenis, NewTx, Template, Tx, WalletKind } from './types'

const col = (uid: string, name: string) => collection(db, 'users', uid, name)

export interface Acc { w: Map<string, number>; s: Map<string, { inc: number; exp: number; cat: Map<string, number> }> }
export const newAcc = (): Acc => ({ w: new Map(), s: new Map() })

// Efek sebuah transaksi pada saldo wallet dan ringkasan bulanan (sign -1 = membalikkan).
// Draft tidak punya efek sampai dilengkapi.
export function efek(t: NewTx, sign: 1 | -1, a: Acc) {
  if (t.status !== 'final') return
  const add = (id: string | null, d: number) => { if (id) a.w.set(id, (a.w.get(id) ?? 0) + d * sign) }
  if (t.type === 'expense') add(t.walletFromId, -t.amount)
  if (t.type === 'income') add(t.walletToId, t.amount)
  if (t.type === 'transfer') { add(t.walletFromId, -t.amount); add(t.walletToId, t.amount) }
  if (t.type === 'adjustment') add(t.walletFromId, t.amount)
  if (t.type === 'income' || t.type === 'expense') {
    const k = t.date.slice(0, 7)
    const s = a.s.get(k) ?? { inc: 0, exp: 0, cat: new Map<string, number>() }
    if (t.type === 'income') s.inc += t.amount * sign
    else s.exp += t.amount * sign
    if (t.categoryId) s.cat.set(t.categoryId, (s.cat.get(t.categoryId) ?? 0) + t.amount * sign)
    a.s.set(k, s)
  }
}

function terapkan(b: WriteBatch, uid: string, a: Acc) {
  a.w.forEach((d, id) => { if (d !== 0) b.update(doc(db, 'users', uid, 'wallets', id), { balance: increment(d) }) })
  a.s.forEach((s, k) => {
    const cat: Record<string, FieldValue> = {}
    s.cat.forEach((d, id) => { if (d !== 0) cat[id] = increment(d) })
    if (s.inc === 0 && s.exp === 0 && Object.keys(cat).length === 0) return
    b.set(doc(db, 'users', uid, 'monthlySummaries', k), { totalIncome: increment(s.inc), totalExpense: increment(s.exp), byCategory: cat }, { merge: true })
  })
}

export function addTransaction(uid: string, t: NewTx) {
  const b = writeBatch(db)
  b.set(doc(col(uid, 'transactions')), { ...t, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const a = newAcc(); efek(t, 1, a); terapkan(b, uid, a)
  return b.commit()
}
export function updateTransaction(uid: string, lama: Tx, t: NewTx) {
  const b = writeBatch(db)
  b.update(doc(db, 'users', uid, 'transactions', lama.id), { ...t, updatedAt: serverTimestamp() })
  const a = newAcc(); efek(lama, -1, a); efek(t, 1, a); terapkan(b, uid, a)
  return b.commit()
}
export function deleteTransaction(uid: string, lama: Tx) {
  const b = writeBatch(db)
  b.delete(doc(db, 'users', uid, 'transactions', lama.id))
  const a = newAcc(); efek(lama, -1, a); terapkan(b, uid, a)
  return b.commit()
}

export const saveTemplate = (uid: string, t: Omit<Template, 'id'>) => addDoc(col(uid, 'quickTemplates'), t)
export const bumpTemplate = (uid: string, id: string) => updateDoc(doc(db, 'users', uid, 'quickTemplates', id), { usageCount: increment(1) })
export const addWallet = (uid: string, name: string, kind: WalletKind, jenis: Jenis, openingBalance: number) =>
  addDoc(col(uid, 'wallets'), { name, kind, jenis, openingBalance, balance: openingBalance, active: true })
export const addCategory = (uid: string, name: string, type: 'income' | 'expense', group: Group | null) =>
  addDoc(col(uid, 'categories'), { name, type, group, budgetNominal: 0, active: true })
export const ubahDoc = (uid: string, koleksi: 'wallets' | 'categories', id: string, data: Record<string, unknown>) =>
  updateDoc(doc(db, 'users', uid, koleksi, id), data)

export function seedDefaults(uid: string) {
  const b = writeBatch(db)
  const wallets: [string, WalletKind][] = [['Tunai', 'cash'], ['Rekening Bank', 'bank'], ['E-wallet', 'ewallet']]
  wallets.forEach(([name, kind]) => b.set(doc(col(uid, 'wallets')), { name, kind, jenis: 'transaksional', openingBalance: 0, balance: 0, active: true }))
  const exp: [string, Group][] = [['Makan', 'kebutuhan'], ['Transportasi', 'kebutuhan'], ['Tagihan', 'kebutuhan'], ['Rokok', 'keinginan'], ['Nongkrong', 'keinginan'], ['Belanja Online', 'keinginan']]
  exp.forEach(([name, group]) => b.set(doc(col(uid, 'categories')), { name, type: 'expense', group, budgetNominal: 0, active: true }))
  ;['Gaji', 'Pemasukan Lain'].forEach((name) => b.set(doc(col(uid, 'categories')), { name, type: 'income', group: null, budgetNominal: 0, active: true }))
  return b.commit()
}

export async function hapusSemua(uid: string) {
  for (const name of ['transactions', 'wallets', 'categories', 'quickTemplates', 'monthlySummaries', 'settings']) {
    const snap = await getDocs(col(uid, name))
    let b = writeBatch(db)
    let n = 0
    for (const d of snap.docs) {
      b.delete(d.ref)
      if (++n === 400) { await b.commit(); b = writeBatch(db); n = 0 }
    }
    if (n > 0) await b.commit()
  }
}
