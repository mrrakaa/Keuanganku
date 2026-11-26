import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { addCategory, addWallet, hapusSemua, seedDefaults, ubahDoc } from '../lib/tx'
import { formatRp } from '../lib/format'
import { GROUP_LABEL, KIND_LABEL, type Group, type Jenis, type WalletKind } from '../lib/types'
import { Judul } from './Pages'

const inp = 'h-11 w-full rounded-xl border border-line bg-bg px-3 font-bold outline-none'
const kecil = 'rounded-lg border border-line bg-bg px-2 py-1 text-xs font-bold'
const btn = 'h-11 rounded-xl bg-accent px-4 font-bold text-on-accent disabled:opacity-40'

export default function Pengaturan() {
  const { user } = useAuth()
  const { wallets, categories, error } = useData()
  const uid = user?.uid ?? ''
  const [wn, setWn] = useState('')
  const [wk, setWk] = useState<WalletKind>('cash')
  const [wj, setWj] = useState<Jenis>('transaksional')
  const [wb, setWb] = useState('')
  const [cn, setCn] = useState('')
  const [ct, setCt] = useState<'expense' | 'income'>('expense')
  const [cg, setCg] = useState<Group>('kebutuhan')
  const [konfirm, setKonfirm] = useState('')
  const [pesan, setPesan] = useState('')

  return (
    <>
      <Judul t="Wallet & kategori" s="Atur sumber uang dan pos pengeluaranmu." />
      {error && <p role="alert" className="card mb-3 text-bahaya">{error}</p>}
      {wallets.length === 0 && categories.length === 0 && (
        <div className="card mb-3 space-y-3">
          <p className="text-muted">Punya data di Excel? Pakai impor. Atau mulai cepat dengan data awal umum.</p>
          <Link to="/impor" className="block rounded-xl bg-accent py-3 text-center font-bold text-on-accent">Impor dari Excel</Link>
          <button className="h-11 w-full rounded-xl border border-line font-bold" onClick={() => void seedDefaults(uid)}>Isi data awal umum</button>
        </div>
      )}
      <section className="card mb-3 space-y-2">
        <p className="kicker">Wallet</p>
        {wallets.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate">{w.name}</span>
            <select aria-label={`Jenis ${w.name}`} className={kecil} value={w.jenis ?? 'transaksional'} onChange={(e) => void ubahDoc(uid, 'wallets', w.id, { jenis: e.target.value })}>
              <option value="transaksional">Transaksional</option><option value="vault">Kantong goal</option>
            </select>
            <b className="font-mono text-sm">{formatRp(w.balance)}</b>
          </div>
        ))}
        <input className={inp} placeholder="Nama wallet" aria-label="Nama wallet" value={wn} onChange={(e) => setWn(e.target.value)} />
        <div className="flex gap-2">
          <select className={inp} aria-label="Jenis wallet" value={wk} onChange={(e) => setWk(e.target.value as WalletKind)}>
            {(Object.keys(KIND_LABEL) as WalletKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <select className={inp} aria-label="Fungsi" value={wj} onChange={(e) => setWj(e.target.value as Jenis)}>
            <option value="transaksional">Transaksional</option><option value="vault">Kantong goal</option>
          </select>
        </div>
        <input className={inp} inputMode="numeric" placeholder="Saldo awal" aria-label="Saldo awal" value={wb} onChange={(e) => setWb(e.target.value.replace(/\D/g, ''))} />
        <button className={btn} disabled={!wn.trim()} onClick={() => { void addWallet(uid, wn.trim(), wk, wj, Number(wb || '0')); setWn(''); setWb('') }}>Tambah wallet</button>
      </section>
      <section className="card mb-3 space-y-2">
        <p className="kicker">Kategori</p>
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2">
            <span className="min-w-0 flex-1 truncate">{c.name}</span>
            {c.type === 'income' ? <small className="text-muted">Pemasukan</small> : (
              <select aria-label={`Kelompok ${c.name}`} className={kecil} value={c.group ?? 'kebutuhan'} onChange={(e) => void ubahDoc(uid, 'categories', c.id, { group: e.target.value })}>
                {(Object.keys(GROUP_LABEL) as Group[]).map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
              </select>
            )}
          </div>
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
      <section className="card space-y-2 border-bahaya/50">
        <p className="kicker text-bahaya">Hapus semua data</p>
        <p className="text-sm text-muted">Menghapus wallet, kategori, transaksi, template, dan ringkasan di akun ini. Tidak bisa dibatalkan. Berguna untuk membersihkan data uji sebelum impor.</p>
        <input className={inp} aria-label="Ketik HAPUS untuk konfirmasi" placeholder="Ketik HAPUS" value={konfirm} onChange={(e) => setKonfirm(e.target.value)} />
        <button disabled={konfirm !== 'HAPUS'} className="h-11 w-full rounded-xl bg-bahaya font-bold text-white disabled:opacity-40" onClick={() => { setPesan('Menghapus…'); hapusSemua(uid).then(() => { setKonfirm(''); setPesan('Semua data terhapus.') }).catch(() => setPesan('Gagal menghapus.')) }}>Hapus semua data</button>
        {pesan && <p role="status" className="font-bold">{pesan}</p>}
      </section>
    </>
  )
}
