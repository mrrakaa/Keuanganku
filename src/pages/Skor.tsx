import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { useFin } from '../lib/fin'
import { useMonthTx } from '../lib/useTx'
import { hitung } from '../lib/budget'
import { hitungNW, hitungSkor } from '../lib/skor'
import { todayWIB } from '../lib/format'
import { Judul } from './Pages'

const WARNA = ['bg-tabungan', 'bg-[#6C9BFF]', 'bg-bahaya', 'bg-kebutuhan', 'bg-accent', 'bg-keinginan', 'bg-tabungan']

export default function Skor() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { wallets, categories } = useData()
  const fin = useFin(uid)
  const { items } = useMonthTx(uid, todayWIB().slice(0, 7))
  const h = hitung(items, categories)
  const dgBudget = categories.filter((c) => c.active && c.type === 'expense' && (c.budgetNominal ?? 0) > 0)
  const kepatuhan = dgBudget.length ? (dgBudget.filter((c) => (h.used.get(c.id) ?? 0) <= (c.budgetNominal ?? 0)).length / dgBudget.length) * 100 : 100
  const nw = hitungNW(wallets, fin.assets, fin.liabilities)
  const r = hitungSkor({ sums: fin.summaries, settings: fin.settings, nw, wallets, goals: fin.goals, logs: fin.logs, kepatuhan })
  const total = Math.round(r.total)
  const keliling = 2 * Math.PI * 42

  return (
    <>
      <Judul t="Skor kesehatan finansial" s="Dari tabungan, disiplin budget, dana darurat, dan utang." />
      <section className="card mb-3 flex flex-col items-center gap-2 text-center">
        <svg width="140" height="140" viewBox="0 0 100 100" role="img" aria-label={`Skor ${total} dari 100`}>
          <circle cx="50" cy="50" r="42" fill="none" style={{ stroke: 'var(--bd)' }} strokeWidth="12" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#A4E636" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(total / 100) * keliling} ${keliling}`} transform="rotate(-90 50 50)" />
          <text x="50" y="57" textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor" fontFamily="Space Grotesk Variable, sans-serif">{total}</text>
        </svg>
        <p className="kicker">dari 100</p>
        <b className="rounded-full bg-line px-4 py-1">{r.status}</b>
        <p className="text-sm text-muted">Fokus perbaikan: <b className="text-ink">{r.terendah.nama}</b> ({Math.round(r.terendah.skor)}/100).</p>
      </section>
      {r.komponen.map((k, i) => (
        <section key={k.nama} className="card mb-2 !p-3">
          <div className="flex justify-between"><b>{k.nama}</b><b className="font-mono">{Math.round(k.skor)}%</b></div>
          <div role="progressbar" aria-label={k.nama} aria-valuenow={Math.round(k.skor)} aria-valuemin={0} aria-valuemax={100} className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full ${WARNA[i]}`} style={{ width: `${k.skor}%` }} /></div>
          <p className="mt-1 text-xs text-muted">{k.ket} · bobot {Math.round(k.bobot * 100)}%</p>
        </section>
      ))}
    </>
  )
}
