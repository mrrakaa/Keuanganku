import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { useMonthTx } from '../lib/useTx'
import { formatRp, geserBulan, labelBulan, labelHari, todayWIB } from '../lib/format'
import type { Tx } from '../lib/types'
import { Judul } from './Pages'

type Saring = 'semua' | 'expense' | 'income' | 'transfer' | 'draft'
const FILTER: { v: Saring; l: string }[] = [{ v: 'semua', l: 'Semua' }, { v: 'expense', l: 'Keluar' }, { v: 'income', l: 'Masuk' }, { v: 'transfer', l: 'Transfer' }, { v: 'draft', l: 'Draft' }]

export default function Transaksi() {
  const { user } = useAuth()
  const { categories, wallets } = useData()
  const [bulan, setBulan] = useState(() => todayWIB().slice(0, 7))
  const [cari, setCari] = useState('')
  const [saring, setSaring] = useState<Saring>('semua')
  const { items, loading } = useMonthTx(user?.uid ?? '', bulan)
  const cat = new Map(categories.map((c) => [c.id, c]))
  const wal = new Map(wallets.map((w) => [w.id, w.name]))
  const q = cari.trim().toLowerCase()
  const tampil = items.filter((t) => {
    if (saring === 'draft') return t.status === 'draft'
    if (saring !== 'semua' && t.type !== saring) return false
    return !q || `${t.description} ${cat.get(t.categoryId ?? '')?.name ?? ''}`.toLowerCase().includes(q)
  })
  const draftN = items.filter((t) => t.status === 'draft').length
  const grup = new Map<string, Tx[]>()
  tampil.forEach((t) => grup.set(t.date, [...(grup.get(t.date) ?? []), t]))

  return (
    <>
      <Judul t="Transaksi" s="Ke mana uangmu pergi?" />
      <div className="mb-3 flex items-center justify-between">
        <button aria-label="Bulan sebelumnya" onClick={() => setBulan(geserBulan(bulan, -1))} className="size-11 rounded-full border border-line bg-surface font-bold">‹</button>
        <b className="capitalize">{labelBulan(bulan)}</b>
        <button aria-label="Bulan berikutnya" onClick={() => setBulan(geserBulan(bulan, 1))} className="size-11 rounded-full border border-line bg-surface font-bold">›</button>
      </div>
      <input aria-label="Cari catatan" placeholder="Cari catatan…" value={cari} onChange={(e) => setCari(e.target.value)} className="mb-3 h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none" />
      <div className="mb-3 flex gap-2 overflow-x-auto">
        {FILTER.map((f) => (
          <button key={f.v} aria-pressed={saring === f.v} onClick={() => setSaring(f.v)} className={`whitespace-nowrap rounded-2xl border px-3.5 py-2 text-sm font-bold ${saring === f.v ? 'border-transparent bg-hero text-white' : 'border-line bg-surface'}`}>{f.l}</button>
        ))}
      </div>
      {draftN > 0 && saring !== 'draft' && (
        <button onClick={() => setSaring('draft')} className="mb-3 flex w-full items-center justify-between rounded-2xl bg-accent px-4 py-3 text-left text-on-accent">
          <b>{draftN} draft belum lengkap</b><span className="text-sm font-bold underline">Lihat</span>
        </button>
      )}
      {loading && <p className="text-muted">Memuat…</p>}
      {!loading && tampil.length === 0 && <p className="card text-muted">Belum ada transaksi. <Link to="/tambah" className="font-bold text-ink underline">Catat sekarang</Link>.</p>}
      {[...grup.entries()].map(([tgl, list]) => {
        const net = list.filter((t) => t.status === 'final').reduce((s, t) => s + (t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0), 0)
        return (
          <section key={tgl} className="mb-3">
            <div className="mx-1 mb-1 flex justify-between"><span className="kicker">{labelHari(tgl)}</span><span className="kicker">{net !== 0 ? formatRp(net) : ''}</span></div>
            <div className="card divide-y divide-line !py-1">
              {list.map((t) => {
                const c = cat.get(t.categoryId ?? '')
                const draft = t.status === 'draft'
                const judul = t.description || c?.name || (t.type === 'transfer' ? 'Transfer' : 'Transaksi')
                const sub = draft ? 'Belum lengkap · draft' : t.type === 'transfer' ? `${wal.get(t.walletFromId ?? '') ?? '?'} → ${wal.get(t.walletToId ?? '') ?? '?'}` : `${c?.name ?? '—'} · ${wal.get((t.type === 'income' ? t.walletToId : t.walletFromId) ?? '') ?? '—'}`
                const warna = draft ? 'bg-line' : t.type === 'income' ? 'bg-tabungan/40' : t.type === 'transfer' ? 'bg-kebutuhan/40' : c?.group === 'keinginan' ? 'bg-keinginan/40' : 'bg-accent/50'
                return (
                  <Link key={t.id} to={`/transaksi/${t.id}`} className="flex items-center gap-3 py-3">
                    <span className={`flex size-10 flex-none items-center justify-center rounded-2xl font-bold ${warna}`}>{draft ? '?' : (c?.name ?? judul)[0].toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><b className="block truncate">{judul}</b><small className="block truncate text-muted">{sub}</small></span>
                    <b className={`font-mono ${t.type === 'income' ? 'text-pos' : ''}`}>{t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}{formatRp(t.amount)}</b>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
