import type { Category, Group, Tx } from './types'

export interface Hari { inc: number; exp: number; n: number }

// Menghitung pemakaian per kategori, per grup, dan per hari dari transaksi satu bulan
export function hitung(items: Tx[], cats: Category[]) {
  const used = new Map<string, number>()
  const hari = new Map<string, Hari>()
  for (const t of items) {
    const h = hari.get(t.date) ?? { inc: 0, exp: 0, n: 0 }
    h.n++
    if (t.status === 'final') {
      if (t.type === 'expense') {
        h.exp += t.amount
        if (t.categoryId) used.set(t.categoryId, (used.get(t.categoryId) ?? 0) + t.amount)
      }
      if (t.type === 'income') h.inc += t.amount
    }
    hari.set(t.date, h)
  }
  const grup: Record<Group, { budget: number; used: number }> = {
    kebutuhan: { budget: 0, used: 0 }, keinginan: { budget: 0, used: 0 }, tabungan: { budget: 0, used: 0 },
  }
  cats.filter((c) => c.active && c.type === 'expense').forEach((c) => {
    const g = grup[c.group ?? 'kebutuhan']
    g.budget += c.budgetNominal ?? 0
    g.used += used.get(c.id) ?? 0
  })
  const totalBudget = grup.kebutuhan.budget + grup.keinginan.budget + grup.tabungan.budget
  const totalUsed = grup.kebutuhan.used + grup.keinginan.used + grup.tabungan.used
  return { used, hari, grup, totalBudget, totalUsed }
}
