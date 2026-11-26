import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { hapusDoc, simpanSnapshot, tambahDoc, ubahNilai, useFin } from '../lib/fin'
import { hitungNW, rataBulanan } from '../lib/skor'
import { formatRp, todayWIB } from '../lib/format'
import { ASET_KATEGORI, LIAB_KATEGORI, type Aset } from '../lib/types'
import { Judul } from './Pages'

const inp = 'h-11 w-full rounded-xl border border-line bg-bg px-3 font-bold outline-none'

function Daftar(p: { judul: string; uid: string; koleksi: 'assets' | 'liabilities'; kategori: string[]; items: Aset[] }) {
  const [k, setK] = useState(p.kategori[0])
  const [nama, setNama] = useState('')
  const [nilai, setNilai] = useState('')
  return (
    <section className="card mb-3 space-y-2">
      <div className="flex justify-between"><p className="kicker">{p.judul}</p><p className="kicker">{formatRp(p.items.reduce((s, a) => s + a.value, 0))}</p></div>
      {p.items.length === 0 && <p className="text-sm text-muted">Belum ada.</p>}
      {p.items.map((a) => (
        <div key={`${a.id}:${a.value}`} className="flex items-center gap-2">
          <span className="min-w-0 flex-1"><b className="block truncate">{a.name}</b><small className="text-muted">{a.kategori}</small></span>
          <input inputMode="numeric" aria-label={`Nilai ${a.name}`} defaultValue={a.value} className="h-10 w-32 rounded-xl border border-line bg-bg px-3 text-right font-mono font-bold outline-none"
            onBlur={(e) => { const v = Number(e.target.value.replace(/\D/g, '') || '0'); if (v !== a.value) void ubahNilai(p.uid, p.koleksi, a.id, v) }} />
          <button aria-label={`Hapus ${a.name}`} className="px-2 text-bahaya" onClick={() => { if (window.confirm(`Hapus ${a.name}?`)) void hapusDoc(p.uid, p.koleksi, a.id) }}>✕</button>
        </div>
      ))}
      <select className={inp} aria-label="Kategori" value={k} onChange={(e) => setK(e.target.value)}>{p.kategori.map((x) => <option key={x}>{x}</option>)}</select>
      <div className="flex gap-2">
        <input className={inp} placeholder="Nama" aria-label="Nama" value={nama} onChange={(e) => setNama(e.target.value)} />
        <input className={inp} inputMode="numeric" placeholder="Nilai" aria-label="Nilai" value={nilai} onChange={(e) => setNilai(e.target.value.replace(/\D/g, ''))} />
      </div>
      <button disabled={!nama.trim()} className="h-11 w-full rounded-xl bg-accent font-bold text-on-accent disabled:opacity-40"
        onClick={() => { void tambahDoc(p.uid, p.koleksi, { kategori: k, name: nama.trim(), value: Number(nilai || '0'), note: '' }); setNama(''); setNilai('') }}>Tambah</button>
    </section>
  )
}

export default function AsetPage() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { wallets } = useData()
  const fin = useFin(uid)
  const nw = hitungNW(wallets, fin.assets, fin.liabilities)
  const { avgExp } = rataBulanan(fin.summaries)
  const runway = avgExp > 0 ? (nw.totalAset - nw.tetap) / avgExp : 0
  const bulan = todayWIB().slice(0, 7)
  const [pesan, setPesan] = useState('')
  const chip = (l: string, v: number) => <div className="flex-1 rounded-2xl bg-white/10 p-3"><p className="kicker !text-white/70">{l}</p><b className="font-mono text-sm">{formatRp(v)}</b></div>

  return (
    <>
      <Judul t="Aset" s="Pantau kekayaan bersihmu." />
      {fin.error && <p role="alert" className="card mb-3 text-bahaya">{fin.error}</p>}
      <section className="mb-3 rounded-[28px] bg-hero p-5 text-white">
        <p className="kicker !text-white/70">Kekayaan bersih</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{formatRp(nw.nw)}</p>
        {runway > 0 && <p className="text-white/80">setara {runway.toFixed(1).replace('.', ',')} bulan pengeluaran dari aset yang bisa dicairkan</p>}
        <div className="mt-4 flex gap-2">{chip('Dompet', nw.dompet)}{chip('Investasi', nw.invest)}{chip('Lain', nw.lain + nw.tetap)}</div>
        <p className="mt-3 text-sm text-white/80">Total aset {formatRp(nw.totalAset)} − utang {formatRp(nw.totalLiab)}</p>
      </section>
      <div className="mb-3 flex gap-2">
        <Link to="/skor" className="flex-1 rounded-2xl border border-line bg-surface py-3 text-center font-bold">Skor kesehatan</Link>
        <Link to="/goals" className="flex-1 rounded-2xl border border-line bg-surface py-3 text-center font-bold">Goals</Link>
      </div>
      <Daftar judul="Aset (di luar wallet)" uid={uid} koleksi="assets" kategori={ASET_KATEGORI} items={fin.assets} />
      <Daftar judul="Utang" uid={uid} koleksi="liabilities" kategori={LIAB_KATEGORI} items={fin.liabilities} />
      <section className="card space-y-2">
        <p className="kicker">Riwayat net worth</p>
        <p className="text-sm text-muted">Saldo wallet otomatis dihitung sebagai aset. Simpan snapshot tiap akhir bulan agar tren dan skor pertumbuhan terbaca.</p>
        <button className="h-11 w-full rounded-xl bg-accent font-bold text-on-accent" onClick={() => { void simpanSnapshot(uid, bulan, { totalAsset: nw.totalAset, totalLiability: nw.totalLiab, netWorth: nw.nw }); setPesan(`Snapshot ${bulan} tersimpan.`) }}>Simpan snapshot bulan ini</button>
        {pesan && <p role="status" className="font-bold">{pesan}</p>}
        {fin.logs.map((l, i) => {
          const prev = fin.logs[i + 1]
          const g = prev && prev.netWorth !== 0 ? ((l.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100 : null
          return <div key={l.id} className="flex justify-between"><span className="font-mono">{l.id}</span><span><b className="font-mono">{formatRp(l.netWorth)}</b>{g !== null && <small className={`ml-2 ${g >= 0 ? 'text-pos' : 'text-bahaya'}`}>{g >= 0 ? '+' : ''}{g.toFixed(1)}%</small>}</span></div>
        })}
      </section>
    </>
  )
}
