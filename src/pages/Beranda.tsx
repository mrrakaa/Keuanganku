import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { useMonthTx } from '../lib/useTx'
import { hitung } from '../lib/budget'
import { formatRp, kompak, labelBulan, todayWIB } from '../lib/format'
import { GROUP_LABEL, type Group } from '../lib/types'
import { Judul } from './Pages'

const WARNA: Record<Group, string> = { kebutuhan: 'bg-kebutuhan', keinginan: 'bg-keinginan', tabungan: 'bg-tabungan' }
const HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

export default function Beranda() {
  const { user } = useAuth()
  const { categories } = useData()
  const today = todayWIB()
  const bulan = today.slice(0, 7)
  const { items, loading } = useMonthTx(user?.uid ?? '', bulan)
  const h = hitung(items, categories)
  const [y, m, d] = today.split('-').map(Number)
  const jumlahHari = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const sisaHari = jumlahHari - d + 1
  const hi = h.hari.get(today) ?? { inc: 0, exp: 0, n: 0 }
  const ada = h.totalBudget > 0
  // Jatah awal hari ini = (sisa budget bulan ini + pengeluaran hari ini) dibagi sisa hari
  const jatah = Math.round(Math.max(0, h.totalBudget - h.totalUsed + hi.exp) / sisaHari)
  const sisaIni = jatah - hi.exp
  const pct = jatah > 0 ? Math.min(100, (hi.exp / jatah) * 100) : hi.exp > 0 ? 100 : 0
  const nama = user?.displayName?.split(' ')[0] ?? ''

  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const awal = [...h.hari.keys()].sort()[0]
  const maxExp = Math.max(1, ...[...h.hari.values()].map((v) => v.exp))
  const kosong: number[] = []
  const sel = Array.from({ length: jumlahHari }, (_, i) => {
    const hari = i + 1
    const key = `${bulan}-${String(hari).padStart(2, '0')}`
    const v = h.hari.get(key)
    const lewat = key < today
    // Hari sebelum transaksi pertama bulan ini dianggap belum mulai dicatat
    const perluIsi = !v && (lewat || key === today) && (!awal || key > awal)
    if (!v && lewat && perluIsi) kosong.push(hari)
    return { hari, key, v, lewat, perluIsi }
  })

  return (
    <>
      <Judul t={`Halo${nama ? `, ${nama}` : ''}`} s="Ringkasan hari ini." />
      <section className="mb-3 rounded-[28px] bg-hero p-5 text-white">
        <p className="kicker !text-white/70">Sekilas hari ini</p>
        <p className="mt-1 font-mono text-4xl font-bold tracking-tight">{loading ? '…' : ada ? formatRp(sisaIni) : formatRp(hi.exp)}</p>
        <p className="text-white/80">{ada ? (sisaIni >= 0 ? 'jatah harian yang tersisa' : 'melebihi jatah hari ini') : 'pengeluaran hari ini'}</p>
        <div className="mt-4 flex justify-between">
          <div><p className="kicker !text-white/70">Masuk</p><b className="font-mono text-accent">{formatRp(hi.inc)}</b></div>
          <div className="text-right"><p className="kicker !text-white/70">Keluar</p><b className="font-mono">{formatRp(hi.exp)}</b></div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-sm text-white/80">{ada ? `Jatah harian ${formatRp(jatah)} · ${sisaHari} hari tersisa` : 'Atur batas di menu Budget agar jatah harian muncul.'}</p>
      </section>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {[['/budget', 'Budget'], ['/dompet', 'Dompet'], ['/transaksi', 'Transaksi'], ['/aset', 'Aset'], ['/goals', 'Goals'], ['/skor', 'Skor'], ['/pengaturan', 'Wallet & kategori']].map(([to, l]) => (
          <Link key={to} to={to} className="whitespace-nowrap rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm font-bold">{l}</Link>
        ))}
      </div>

      {ada && (
        <section className="card mb-3">
          <b className="text-lg">Progres pengeluaran</b>
          <p className="text-sm text-muted">Hari ke-{d} dari {jumlahHari}</p>
          {(['kebutuhan', 'keinginan', 'tabungan'] as Group[]).filter((g) => h.grup[g].budget > 0).map((g) => {
            const p = (h.grup[g].used / h.grup[g].budget) * 100
            const st = p >= 100 ? 'Melebihi' : p > (d / jumlahHari) * 100 + 10 ? 'Cepat sekali' : 'Masih aman'
            return (
              <div key={g} className="mt-3">
                <div className="flex justify-between text-sm"><span><span className="kicker !text-ink">{GROUP_LABEL[g]}</span> <span className={p >= 100 ? 'font-bold text-bahaya' : 'text-muted'}>{st}</span></span><b className="font-mono">{Math.round(p)}%</b></div>
                <div role="progressbar" aria-label={GROUP_LABEL[g]} aria-valuenow={Math.round(Math.min(p, 100))} aria-valuemin={0} aria-valuemax={100} className="mt-1 h-2 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full ${p >= 100 ? 'bg-bahaya' : WARNA[g]}`} style={{ width: `${Math.min(100, p)}%` }} /></div>
              </div>
            )
          })}
        </section>
      )}

      <section className="card">
        <div className="mb-3 flex items-center justify-between"><b className="text-lg capitalize">{labelBulan(bulan)}</b><span className="kicker">{kosong.length} hari kosong</span></div>
        <div className="grid grid-cols-7 gap-1.5">
          {HARI.map((x) => <span key={x} className="text-center font-mono text-[11px] text-muted">{x}</span>)}
          {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
          {sel.map(({ hari, key, v, lewat, perluIsi }) => {
            const isi = key === today
            const dasar = `flex h-12 flex-col items-center justify-center rounded-xl text-xs ${isi ? 'ring-2 ring-accent' : ''}`
            if (v) {
              const p = Math.round((v.exp / maxExp) * 55)
              return (
                <Link key={key} to="/transaksi" aria-label={`${hari}: ${v.exp ? `keluar ${kompak(v.exp)}` : `masuk ${kompak(v.inc)}`}`} className={`${dasar} bg-line`} style={{ background: v.exp ? `color-mix(in srgb, var(--ac) ${p + 10}%, transparent)` : undefined }}>
                  <b className="font-mono">{hari}</b>
                  <span className="font-mono text-[10px]">{v.exp ? `-${kompak(v.exp)}` : `+${kompak(v.inc)}`}</span>
                </Link>
              )
            }
            if (perluIsi) {
              return (
                <Link key={key} to={`/tambah?tgl=${key}`} aria-label={`${hari}: belum dicatat, ketuk untuk mengisi`} className={`${dasar} border-[1.5px] border-dashed border-accent`}>
                  <b className="font-mono">{hari}</b><span className="text-[10px] text-muted">isi</span>
                </Link>
              )
            }
            return <div key={key} className={`${dasar} ${lewat ? 'bg-line/50 text-muted' : 'text-muted'}`}><b className="font-mono">{hari}</b></div>
          })}
        </div>
        <p className="mt-3 text-sm text-muted">Kotak putus-putus = hari yang belum dicatat. Ketuk untuk mengisi.</p>
      </section>
    </>
  )
}
