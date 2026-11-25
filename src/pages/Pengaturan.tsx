import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { addCategory, addWallet, seedDefaults } from '../lib/tx'
import { formatRp } from '../lib/format'
import { GROUP_LABEL, KIND_LABEL, type Group, type WalletKind } from '../lib/types'
import { Judul } from './Pages'

const inp = 'h-11 w-full rounded-xl border border-line bg-bg px-3 font-bold outline-none'
const btn = 'h-11 rounded-xl bg-accent px-4 font-bold text-on-accent disabled:opacity-40'

export default function Pengaturan() {
  const { user } = useAuth()
  const { wallets, categories, error } = useData()
  const uid = user?.uid ?? ''
  const [wn, setWn] = useState('')
  const [wk, setWk] = useState<WalletKind>('cash')
  const [wb, setWb] = useState('')
  const [cn, setCn] = useState('')
  const [ct, setCt] = useState<'expense' | 'income'>('expense')
  const [cg, setCg] = useState<Group>('kebutuhan')

  return (
    <>
      <Judul t="Wallet & kategori" s="Atur sumber uang dan pos pengeluaranmu." />
      {error && <p role="alert" className="card mb-3 text-bahaya">{error}</p>}
      {wallets.length === 0 && categories.length === 0 && (
        <div className="card mb-3">
          <p className="mb-3 text-muted">Mulai cepat dengan data awal umum (bisa diubah atau ditambah). Riwayat Excel akan diimpor di tahap berikutnya.</p>
          <button className={btn} onClick={() => void seedDefaults(uid)}>Isi data awal</button>
        </div>
      )}
      <section className="card mb-3 space-y-2">
        <p className="kicker">Wallet</p>
        {wallets.map((w) => (
          <div key={w.id} className="flex justify-between"><span>{w.name} <small className="text-muted">{KIND_LABEL[w.kind]}</small></span><b className="font-mono">{formatRp(w.balance)}</b></div>
        ))}
        <input className={inp} placeholder="Nama wallet" aria-label="Nama wallet" value={wn} onChange={(e) => setWn(e.target.value)} />
        <div className="flex gap-2">
          <select className={inp} aria-label="Jenis wallet" value={wk} onChange={(e) => setWk(e.target.value as WalletKind)}>
            {(Object.keys(KIND_LABEL) as WalletKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <input className={inp} inputMode="numeric" placeholder="Saldo awal" aria-label="Saldo awal" value={wb} onChange={(e) => setWb(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className={btn} disabled={!wn.trim()} onClick={() => { void addWallet(uid, wn.trim(), wk, Number(wb || '0')); setWn(''); setWb('') }}>Tambah wallet</button>
      </section>
      <section className="card space-y-2">
        <p className="kicker">Kategori</p>
        {categories.map((c) => (
          <div key={c.id} className="flex justify-between"><span>{c.name}</span><small className="text-muted">{c.type === 'income' ? 'Pemasukan' : c.group ? GROUP_LABEL[c.group] : 'Pengeluaran'}</small></div>
        ))}
        <input className={inp} placeholder="Nama kategori" aria-label="Nama kategori" value={cn} onChange={(e) => setCn(e.target.value)} />
        <div className="flex gap-2">
          <select className={inp} aria-label="Tipe kategori" value={ct} onChange={(e) => setCt(e.target.value as 'expense' | 'income')}>
            <option value="expense">Pengeluaran</option><option value="income">Pemasukan</option>
          </select>
          {ct === 'expense' && (
            <select className={inp} aria-label="Kelompok" value={cg} onChange={(e) => setCg(e.target.value as Group)}>
              {(Object.keys(GROUP_LABEL) as Group[]).map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
            </select>
          )}
        </div>
        <button className={btn} disabled={!cn.trim()} onClick={() => { void addCategory(uid, cn.trim(), ct, ct === 'expense' ? cg : null); setCn('') }}>Tambah kategori</button>
      </section>
    </>
  )
}
