import { INVEST, TETAP, type Aset, type Goal, type NWLog, type Settings, type Summary, type Wallet } from './types'

export interface NW { dompet: number; invest: number; tetap: number; lain: number; totalAset: number; totalLiab: number; nw: number; debtRatio: number }

export function hitungNW(wallets: Wallet[], assets: Aset[], liabs: Aset[]): NW {
  const dompet = wallets.filter((w) => w.active).reduce((s, w) => s + w.balance, 0)
  const jml = (f: (a: Aset) => boolean) => assets.filter(f).reduce((s, a) => s + a.value, 0)
  const invest = jml((a) => INVEST.includes(a.kategori))
  const tetap = jml((a) => TETAP.includes(a.kategori))
  const lain = jml((a) => !INVEST.includes(a.kategori) && !TETAP.includes(a.kategori))
  const totalAset = dompet + invest + tetap + lain
  const totalLiab = liabs.reduce((s, a) => s + a.value, 0)
  return { dompet, invest, tetap, lain, totalAset, totalLiab, nw: totalAset - totalLiab, debtRatio: totalAset > 0 ? totalLiab / totalAset : 0 }
}

// Rata-rata hingga 12 bulan terakhir yang punya data
export function rataBulanan(sums: Summary[]) {
  const r = [...sums].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 12)
  const ada = r.filter((s) => s.totalExpense > 0 || s.totalIncome > 0)
  const n = ada.length
  const avgExp = n ? ada.reduce((s, x) => s + x.totalExpense, 0) / n : 0
  const avgNet = n ? ada.reduce((s, x) => s + x.totalIncome - x.totalExpense, 0) / n : 0
  return { n, avgExp, avgNet, positif: ada.filter((s) => s.totalIncome - s.totalExpense > 0).length }
}

export interface Komponen { nama: string; skor: number; bobot: number; ket: string }
const clamp = (x: number) => (Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : 0)

export function hitungSkor(p: { sums: Summary[]; settings: Settings; nw: NW; wallets: Wallet[]; goals: Goal[]; logs: NWLog[]; kepatuhan: number }) {
  const { settings: st } = p
  const { avgExp, n, positif } = rataBulanan(p.sums)
  const th = p.sums.filter((s) => s.id.startsWith(String(st.tahunAktif)))
  const inc = th.reduce((s, x) => s + x.totalIncome, 0)
  const exp = th.reduce((s, x) => s + x.totalExpense, 0)
  const sr = inc > 0 ? (inc - exp) / inc : 0
  const wDarurat = new Set(p.goals.filter((g) => g.darurat).map((g) => g.walletId))
  const dana = p.wallets.filter((w) => wDarurat.has(w.id)).reduce((s, w) => s + w.balance, 0)
  const efTarget = st.targetEmergencyFundBulan * avgExp
  const [l0, l1] = p.logs
  const nwg = l0 && l1 && l1.netWorth !== 0 ? clamp((((l0.netWorth - l1.netWorth) / Math.abs(l1.netWorth)) / 0.02) * 100) : 50
  const komponen: Komponen[] = [
    { nama: 'Rasio tabungan', bobot: 0.2, skor: clamp((sr / st.targetSavingRate) * 100), ket: `Tabungan ${(sr * 100).toFixed(0)}% dari pemasukan, target ${(st.targetSavingRate * 100).toFixed(0)}%` },
    { nama: 'Dana darurat', bobot: 0.2, skor: efTarget > 0 ? clamp((dana / efTarget) * 100) : 0, ket: avgExp > 0 ? `${(dana / avgExp).toFixed(1)} bulan dari target ${st.targetEmergencyFundBulan} bulan` : 'Butuh data pengeluaran bulanan' },
    { nama: 'Kesehatan utang', bobot: 0.15, skor: clamp((1 - p.nw.debtRatio / st.targetDebtRatioMaks) * 100), ket: `Utang ${(p.nw.debtRatio * 100).toFixed(0)}% dari aset, batas ${(st.targetDebtRatioMaks * 100).toFixed(0)}%` },
    { nama: 'Disiplin anggaran', bobot: 0.15, skor: clamp(p.kepatuhan), ket: 'Kategori ber-budget yang tidak melewati batas bulan ini' },
    { nama: 'Pertumbuhan kekayaan', bobot: 0.1, skor: nwg, ket: p.logs.length < 2 ? 'Simpan snapshot net worth tiap bulan (default 50)' : 'Pertumbuhan bulan terakhir vs target 2%' },
    { nama: 'Rasio investasi', bobot: 0.1, skor: p.nw.totalAset > 0 ? clamp((p.nw.invest / p.nw.totalAset / st.targetInvestmentRatio) * 100) : 0, ket: `Investasi ${p.nw.totalAset > 0 ? ((p.nw.invest / p.nw.totalAset) * 100).toFixed(0) : 0}% dari aset, target ${(st.targetInvestmentRatio * 100).toFixed(0)}%` },
    { nama: 'Arus kas positif', bobot: 0.1, skor: n > 0 ? (positif / n) * 100 : 0, ket: `${positif} dari ${n} bulan bercatatan berarus kas positif` },
  ]
  const total = komponen.reduce((s, k) => s + k.skor * k.bobot, 0)
  const status = total < 40 ? 'Bahaya' : total < 60 ? 'Perlu perbaikan' : total < 80 ? 'Sehat' : 'Sangat baik'
  const terendah = [...komponen].sort((a, b) => a.skor - b.skor)[0]
  return { komponen, total, status, terendah }
}
