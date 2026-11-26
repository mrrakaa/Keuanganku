import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { formatRp } from '../lib/format'
import { KIND_LABEL, type WalletKind } from '../lib/types'
import { Judul } from './Pages'

export default function Dompet() {
  const { wallets, error } = useData()
  const aktif = wallets.filter((w) => w.active)
  const total = aktif.reduce((s, w) => s + w.balance, 0)
  return (
    <>
      <Judul t="Dompet" s="Atur semua sumber uangmu." />
      {error && <p role="alert" className="card mb-3 text-bahaya">{error}</p>}
      <section className="mb-3 rounded-[28px] bg-hero p-5 text-white">
        <p className="kicker !text-white/70">Total saldo</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-tight">{formatRp(total)}</p>
      </section>
      {aktif.length === 0 && (
        <p className="card text-muted">Belum ada wallet. <Link to="/pengaturan" className="font-bold text-ink underline">Tambah di sini</Link>.</p>
      )}
      {([...(Object.keys(KIND_LABEL) as WalletKind[]), 'vault'] as const).map((k) => {
        const list = k === 'vault' ? aktif.filter((w) => w.jenis === 'vault') : aktif.filter((w) => w.kind === k && w.jenis !== 'vault')
        if (!list.length) return null
        return (
          <section key={k} className="mb-3">
            <div className="mx-1 mb-1 flex justify-between"><span className="kicker">{k === 'vault' ? 'Kantong goal' : KIND_LABEL[k]}</span><span className="kicker">{formatRp(list.reduce((s, w) => s + w.balance, 0))}</span></div>
            <div className="card divide-y divide-line !py-1">
              {list.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-3">
                  <div><b>{w.name}</b>{w.balance < 0 && <small className="block text-bahaya">Saldo minus, cek transaksi</small>}</div>
                  <b className={`font-mono ${w.balance < 0 ? 'text-bahaya' : ''}`}>{formatRp(w.balance)}</b>
                </div>
              ))}
            </div>
          </section>
        )
      })}
      <Link to="/pengaturan" className="mt-2 block text-center text-sm text-muted underline">Kelola wallet & kategori</Link>
    </>
  )
}
