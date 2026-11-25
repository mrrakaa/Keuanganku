import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { addTransaction, bumpTemplate, saveTemplate } from '../lib/tx'
import { formatRp, kompak, todayWIB } from '../lib/format'
import type { Template } from '../lib/types'
import { Judul } from './Pages'

type Tipe = 'expense' | 'income' | 'transfer'
const LW = 'keuanganku.lastWallet'
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'Hapus']
const TIPE: { v: Tipe; l: string }[] = [{ v: 'expense', l: 'Pengeluaran' }, { v: 'income', l: 'Pemasukan' }, { v: 'transfer', l: 'Transfer' }]

function lastWallet(k: string) {
  try { return (JSON.parse(localStorage.getItem(LW) ?? '{}') as Record<string, string>)[k] ?? '' } catch { return '' }
}
function rememberWallet(k: string, v: string) {
  try {
    const o = JSON.parse(localStorage.getItem(LW) ?? '{}') as Record<string, string>
    o[k] = v
    localStorage.setItem(LW, JSON.stringify(o))
  } catch { /* abaikan */ }
}

function Pilih(p: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; kosong: string }) {
  return (
    <label className="card block !p-3">
      <span className="kicker block">{p.label}</span>
      <select value={p.value} onChange={(e) => p.onChange(e.target.value)} className="mt-1 w-full bg-transparent font-bold outline-none">
        <option value="">{p.kosong}</option>
        {p.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  )
}

export default function Tambah() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { wallets, categories, templates, error } = useData()
  const [tipe, setTipe] = useState<Tipe>('expense')
  const [digits, setDigits] = useState('')
  const [catId, setCatId] = useState('')
  const [wId, setWId] = useState('')
  const [toId, setToId] = useState('')
  const [tanggal, setTanggal] = useState(todayWIB)
  const [catatan, setCatatan] = useState('')
  const [jadikanTpl, setJadikanTpl] = useState(false)
  const [pesan, setPesan] = useState('')

  const uid = user?.uid ?? ''
  const amount = Number(digits || '0')
  const cats = categories.filter((c) => c.active && c.type === (tipe === 'income' ? 'income' : 'expense')).map((c) => ({ v: c.id, l: c.name }))
  const ws = wallets.filter((w) => w.active).map((w) => ({ v: w.id, l: w.name }))
  const lengkap = amount > 0 && (tipe === 'transfer' ? !!wId && !!toId && wId !== toId : !!catId && !!wId)
  const gagal = () => setPesan('Gagal menyimpan, coba lagi.')

  const tekan = (k: string) => {
    setPesan('')
    if (k === 'Hapus') return setDigits((d) => d.slice(0, -1))
    if (digits === '' && (k === '0' || k === '000')) return
    setDigits((d) => (d + k).slice(0, 12))
  }
  const pilihKategori = (id: string) => {
    setCatId(id)
    const lw = lastWallet(id)
    if (lw && ws.some((w) => w.v === lw)) setWId(lw)
  }
  const ganti = (t: Tipe) => { setTipe(t); setCatId(''); setPesan('') }
  const pakai = (t: Template) => {
    setTipe(t.type); setDigits(String(t.defaultAmount || '')); setCatId(t.categoryId ?? '')
    setWId(t.walletId ?? ''); setToId(t.toWalletId ?? ''); setCatatan(t.label); setPesan('')
    void bumpTemplate(uid, t.id).catch(() => {})
  }

  const simpan = (draft: boolean) => {
    if (!uid || amount <= 0) return
    const dasar = { type: tipe, date: tanggal, amount, description: catatan.trim() }
    if (draft) {
      void addTransaction(uid, { ...dasar, status: 'draft', categoryId: null, walletFromId: null, walletToId: null }).catch(gagal)
    } else {
      if (!lengkap) return
      const rinci =
        tipe === 'transfer' ? { categoryId: null, walletFromId: wId, walletToId: toId }
        : tipe === 'expense' ? { categoryId: catId, walletFromId: wId, walletToId: null }
        : { categoryId: catId, walletFromId: null, walletToId: wId }
      void addTransaction(uid, { ...dasar, ...rinci, status: 'final' }).catch(gagal)
      rememberWallet(tipe === 'transfer' ? 'transfer' : catId, wId)
      if (jadikanTpl) {
        void saveTemplate(uid, {
          label: catatan.trim() || cats.find((c) => c.v === catId)?.l || 'Template',
          type: tipe, categoryId: rinci.categoryId, walletId: wId, toWalletId: tipe === 'transfer' ? toId : null,
          defaultAmount: amount, usageCount: 0,
        }).catch(gagal)
      }
    }
    setDigits(''); setCatatan(''); setJadikanTpl(false)
    setPesan(draft ? 'Draft tersimpan.' : 'Tersimpan.')
  }

  return (
    <>
      <Judul t="Catat transaksi" s="Isi nominal, lalu simpan." />
      {error && <p role="alert" className="card mb-3 text-bahaya">{error}</p>}
      {(wallets.length === 0 || categories.length === 0) && (
        <p className="card mb-3 text-muted">Belum ada wallet atau kategori. <Link to="/pengaturan" className="font-bold text-ink underline">Atur dulu di sini</Link>.</p>
      )}
      <div className="mb-3 flex gap-1 rounded-2xl bg-line p-1">
        {TIPE.map((o) => (
          <button key={o.v} aria-pressed={tipe === o.v} onClick={() => ganti(o.v)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${tipe === o.v ? 'bg-surface text-ink' : 'text-muted'}`}>{o.l}</button>
        ))}
      </div>
      <div className="my-4 text-center">
        <p className="kicker">Jumlah</p>
        <output aria-live="polite" className="block font-mono text-5xl font-bold tracking-tight">{formatRp(amount)}</output>
      </div>
      {templates.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {templates.slice(0, 8).map((t) => (
            <button key={t.id} onClick={() => pakai(t)} className="whitespace-nowrap rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-sm font-bold">
              {t.label} {kompak(t.defaultAmount)}
            </button>
          ))}
        </div>
      )}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {tipe !== 'transfer' && <Pilih label="Kategori" value={catId} onChange={pilihKategori} options={cats} kosong="Pilih" />}
        <Pilih label={tipe === 'transfer' ? 'Dari wallet' : 'Wallet'} value={wId} onChange={setWId} options={ws} kosong="Pilih" />
        {tipe === 'transfer' && <Pilih label="Ke wallet" value={toId} onChange={setToId} options={ws} kosong="Pilih" />}
        <label className="card block !p-3">
          <span className="kicker block">Tanggal</span>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="mt-1 w-full bg-transparent font-bold outline-none" />
        </label>
        <label className="card block !p-3">
          <span className="kicker block">Catatan</span>
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="opsional" className="mt-1 w-full bg-transparent font-bold outline-none" />
        </label>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button key={k} onClick={() => tekan(k)} className="h-12 rounded-2xl border border-line bg-surface font-mono text-lg font-bold active:bg-line">{k}</button>
        ))}
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={jadikanTpl} onChange={(e) => setJadikanTpl(e.target.checked)} /> Simpan sebagai template
      </label>
      {amount > 0 && !lengkap && <p className="mb-2 text-sm text-muted">Lengkapi kategori dan wallet, atau pakai Catat cepat.</p>}
      <div className="flex gap-2">
        <button disabled={amount <= 0} onClick={() => simpan(true)} className="h-13 flex-1 rounded-2xl border-[1.5px] border-line bg-surface font-bold disabled:opacity-40">Catat cepat (draft)</button>
        <button disabled={!lengkap} onClick={() => simpan(false)} className="h-13 flex-1 rounded-2xl bg-accent font-bold text-on-accent disabled:opacity-40">Simpan</button>
      </div>
      {pesan && <p role="status" className="mt-3 text-center font-bold">{pesan}</p>}
      <button onClick={() => nav('/')} className="mx-auto mt-3 block text-sm text-muted underline">Selesai, kembali ke Beranda</button>
    </>
  )
}
