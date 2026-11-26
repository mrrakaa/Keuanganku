import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { hapusDoc, tambahDoc, useFin } from '../lib/fin'
import { rataBulanan } from '../lib/skor'
import { formatRp, todayWIB } from '../lib/format'
import { Link } from 'react-router-dom'
import { Judul } from './Pages'

const inp = 'h-11 w-full rounded-xl border border-line bg-bg px-3 font-bold outline-none'

export default function Goals() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { wallets } = useData()
  const fin = useFin(uid)
  const { avgNet } = rataBulanan(fin.summaries)
  const [nama, setNama] = useState('')
  const [wid, setWid] = useState('')
  const [target, setTarget] = useState('')
  const [tenggat, setTenggat] = useState('')
  const [darurat, setDarurat] = useState(false)
  const aktif = wallets.filter((w) => w.active)
  const today = todayWIB()
  const hari = (d: string) => Math.max(0, Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000))

  return (
    <>
      <Judul t="Goals" s="Mimpi besar, mulai dari recehan." />
      {fin.error && <p role="alert" className="card mb-3 text-bahaya">{fin.error}</p>}
      {fin.goals.length === 0 && <p className="card mb-3 text-muted">Belum ada goal. Tautkan goal ke satu wallet (misalnya kantong goal), lalu setor lewat Transfer.</p>}
      {fin.goals.map((g) => {
        const w = wallets.find((x) => x.id === g.walletId)
        const kumpul = Math.max(0, w?.balance ?? 0)
        const pct = g.targetAmount > 0 ? Math.min(100, (kumpul / g.targetAmount) * 100) : 0
        const sisa = g.deadline ? hari(g.deadline) : null
        const perBulan = sisa !== null && sisa > 0 ? Math.max(g.targetAmount - kumpul, 0) / Math.max(sisa / 30, 1) : null
        const status = kumpul >= g.targetAmount ? 'Tercapai' : perBulan === null ? 'Tanpa tenggat' : avgNet >= perBulan ? 'On track' : 'Perlu nabung lebih'
        return (
          <section key={g.id} className="card mb-3">
            <div className="flex items-start justify-between gap-2">
              <div><b className="text-lg">{g.name}</b>{g.darurat && <span className="ml-2 rounded-lg bg-line px-2 py-0.5 text-xs font-bold">Dana darurat</span>}<p className="text-sm text-muted">{w?.name ?? 'Wallet tidak ditemukan'}{g.deadline ? ` · ${g.deadline}` : ''}</p></div>
              <button aria-label={`Hapus ${g.name}`} className="px-2 text-bahaya" onClick={() => { if (window.confirm(`Hapus goal ${g.name}?`)) void hapusDoc(uid, 'goals', g.id) }}>✕</button>
            </div>
            <p className="mt-3 font-mono text-xl font-bold">{formatRp(kumpul)} <small className="text-sm font-normal text-muted">dari {formatRp(g.targetAmount)}</small></p>
            <div role="progressbar" aria-label={g.name} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted">{Math.round(pct)}% · {status}{perBulan !== null && kumpul < g.targetAmount ? ` · butuh ${formatRp(Math.round(perBulan))}/bulan` : ''}</span>
              <Link to={`/tambah?tipe=transfer&ke=${g.walletId}`} className="rounded-xl bg-accent px-3 py-1.5 font-bold text-on-accent">Setor</Link>
            </div>
          </section>
        )
      })}
      <section className="card space-y-2">
        <p className="kicker">Goal baru</p>
        <input className={inp} placeholder="Nama goal" aria-label="Nama goal" value={nama} onChange={(e) => setNama(e.target.value)} />
        <select className={inp} aria-label="Wallet tertaut" value={wid} onChange={(e) => setWid(e.target.value)}>
          <option value="">Pilih wallet tertaut</option>
          {aktif.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <input className={inp} inputMode="numeric" placeholder="Target nominal" aria-label="Target nominal" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))} />
        <label className="block"><span className="kicker">Tenggat (opsional)</span><input type="date" className={`${inp} mt-1`} value={tenggat} onChange={(e) => setTenggat(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={darurat} onChange={(e) => setDarurat(e.target.checked)} /> Tandai sebagai dana darurat (dipakai di skor kesehatan)</label>
        <button disabled={!nama.trim() || !wid || !target} className="h-11 w-full rounded-xl bg-accent font-bold text-on-accent disabled:opacity-40"
          onClick={() => { void tambahDoc(uid, 'goals', { name: nama.trim(), walletId: wid, targetAmount: Number(target), deadline: tenggat || null, darurat }); setNama(''); setWid(''); setTarget(''); setTenggat(''); setDarurat(false) }}>Tambah goal</button>
      </section>
    </>
  )
}
