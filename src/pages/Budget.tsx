import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { useMonthTx } from '../lib/useTx'
import { hitung } from '../lib/budget'
import { formatRp, geserBulan, labelBulan, todayWIB } from '../lib/format'
import { ubahDoc } from '../lib/tx'
import { GROUP_LABEL, type Group } from '../lib/types'
import { Judul } from './Pages'

const WARNA: Record<Group, string> = { kebutuhan: 'bg-kebutuhan', keinginan: 'bg-keinginan', tabungan: 'bg-tabungan' }

function Baris(p: { nama: string; used: number; budget: number; grup: Group }) {
  const pct = p.budget > 0 ? (p.used / p.budget) * 100 : 0
  const bar = pct >= 100 ? 'bg-bahaya' : pct >= 85 ? 'bg-keinginan' : WARNA[p.grup]
  const label = p.budget <= 0 ? 'Tanpa budget' : pct >= 100 ? 'Melebihi batas' : pct >= 85 ? 'Hampir habis' : ''
  return (
    <div className="py-2.5">
      <div className="flex justify-between gap-2"><span className="min-w-0 truncate">{p.nama}</span><b className="font-mono">{formatRp(p.used)}</b></div>
      <div role="progressbar" aria-label={p.nama} aria-valuenow={Math.round(Math.min(pct, 100))} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted"><span className={pct >= 100 ? 'font-bold text-bahaya' : ''}>{label}</span><span>dari {formatRp(p.budget)}</span></div>
    </div>
  )
}

export default function Budget() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { categories } = useData()
  const [bulan, setBulan] = useState(() => todayWIB().slice(0, 7))
  const [atur, setAtur] = useState(false)
  const { items, loading } = useMonthTx(uid, bulan)
  const h = hitung(items, categories)
  const exp = categories.filter((c) => c.active && c.type === 'expense')
  const sisa = h.totalBudget - h.totalUsed
  const pctTotal = h.totalBudget > 0 ? (h.totalUsed / h.totalBudget) * 100 : 0

  return (
    <>
      <Judul t="Budget" s="Batas pengeluaran per kategori." />
      <div className="mb-3 flex items-center justify-between">
        <button aria-label="Bulan sebelumnya" onClick={() => setBulan(geserBulan(bulan, -1))} className="size-11 rounded-full border border-line bg-surface font-bold">‹</button>
        <b className="capitalize">{labelBulan(bulan)}</b>
        <button aria-label="Bulan berikutnya" onClick={() => setBulan(geserBulan(bulan, 1))} className="size-11 rounded-full border border-line bg-surface font-bold">›</button>
      </div>
      <section className="mb-3 rounded-[28px] bg-hero p-5 text-white">
        <p className="kicker !text-white/70">{sisa >= 0 ? 'Sisa budget' : 'Melebihi budget'}</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{loading ? '…' : formatRp(Math.abs(sisa))}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, pctTotal)}%` }} /></div>
        <p className="mt-2 text-sm text-white/80">Terpakai {formatRp(h.totalUsed)} dari {formatRp(h.totalBudget)}</p>
      </section>
      <button onClick={() => setAtur(!atur)} aria-pressed={atur} className="mb-3 w-full rounded-2xl border border-line bg-surface py-2.5 text-sm font-bold">{atur ? 'Selesai mengatur' : 'Atur batas budget'}</button>
      {atur ? (
        <section className="card space-y-2">
          <p className="kicker">Batas bulanan per kategori</p>
          {exp.map((c) => (
            <label key={`${c.id}:${c.budgetNominal ?? 0}`} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              <input
                inputMode="numeric" aria-label={`Batas ${c.name}`} defaultValue={c.budgetNominal ?? 0}
                onBlur={(e) => { const v = Number(e.target.value.replace(/\D/g, '') || '0'); if (v !== (c.budgetNominal ?? 0)) void ubahDoc(uid, 'categories', c.id, { budgetNominal: v }) }}
                className="h-10 w-32 rounded-xl border border-line bg-bg px-3 text-right font-mono font-bold outline-none"
              />
            </label>
          ))}
        </section>
      ) : (
        (['kebutuhan', 'keinginan', 'tabungan'] as Group[]).map((g) => {
          const rows = exp.filter((c) => (c.group ?? 'kebutuhan') === g && ((c.budgetNominal ?? 0) > 0 || (h.used.get(c.id) ?? 0) > 0))
          if (!rows.length) return null
          const gr = h.grup[g]
          return (
            <section key={g} className="card mb-3">
              <div className="flex items-center gap-2"><i className={`size-3 rounded-full ${WARNA[g]}`} /><b className="kicker !text-ink">{GROUP_LABEL[g]}</b></div>
              <p className="mt-1 font-mono text-sm text-muted">{formatRp(gr.used)} / {formatRp(gr.budget)}</p>
              <div className="divide-y divide-line">
                {rows.map((c) => <Baris key={c.id} nama={c.name} used={h.used.get(c.id) ?? 0} budget={c.budgetNominal ?? 0} grup={g} />)}
              </div>
            </section>
          )
        })
      )}
    </>
  )
}
