import { collection, doc, getDocs, limit, query, writeBatch } from 'firebase/firestore'
import { db } from './firebase'

const NAMA = ['wallets', 'categories', 'transactions', 'quickTemplates', 'monthlySummaries', 'settings', 'assets', 'liabilities', 'goals', 'netWorthLogs']

export interface CadanganData { versi: number; dibuat: string; koleksi: Record<string, ({ id: string } & Record<string, unknown>)[]> }

export async function buatCadangan(uid: string): Promise<CadanganData> {
  const koleksi: CadanganData['koleksi'] = {}
  for (const n of NAMA) {
    const s = await getDocs(collection(db, 'users', uid, n))
    koleksi[n] = s.docs.map((d) => {
      const data = { ...d.data() }
      delete data.createdAt
      delete data.updatedAt
      return { id: d.id, ...data }
    })
  }
  return { versi: 1, dibuat: new Date().toISOString(), koleksi }
}

export async function pulihkan(uid: string, d: CadanganData) {
  if (d.versi !== 1 || typeof d.koleksi !== 'object') throw new Error('Berkas cadangan tidak dikenali.')
  for (const n of ['wallets', 'transactions', 'categories']) {
    const s = await getDocs(query(collection(db, 'users', uid, n), limit(1)))
    if (!s.empty) throw new Error('Akun ini sudah berisi data. Hapus semua data dulu sebelum memulihkan.')
  }
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []
  let jumlah = 0
  for (const n of NAMA) {
    for (const { id, ...data } of d.koleksi[n] ?? []) {
      ops.push((b) => b.set(doc(db, 'users', uid, n, id), data))
      jumlah++
    }
  }
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db)
    ops.slice(i, i + 400).forEach((op) => op(b))
    await b.commit()
  }
  return jumlah
}
