import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { buatCadangan, pulihkan, type CadanganData } from '../lib/cadangan'
import { buatIcs, eksporCsv, unduh } from '../lib/ekspor'
import { todayWIB } from '../lib/format'
import { Judul } from './Pages'

const btn = 'h-11 w-full rounded-xl bg-accent font-bold text-on-accent disabled:opacity-40'
const inp = 'h-11 w-full rounded-xl border border-line bg-bg px-3 font-bold outline-none'

export default function Cadangan() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { wallets, categories } = useData()
  const [bulan, setBulan] = useState(() => todayWIB().slice(0, 7))
  const [semua, setSemua] = useState(false)
  const [jam, setJam] = useState('20:00')
  const [berkas, setBerkas] = useState<CadanganData | null>(null)
  const [pesan, setPesan] = useState('')
  const jalan = async (f: () => Promise<string>) => {
    setPesan('Memproses…')
    try { setPesan(await f()) } catch (e) { setPesan(`Gagal: ${(e as Error).message}`) }
  }
  const baca = async (f: File | undefined) => {
    if (!f) return
    try { setBerkas(JSON.parse(await f.text()) as CadanganData); setPesan('') } catch { setBerkas(null); setPesan('Berkas bukan cadangan yang valid.') }
  }
  const lokal = location.hostname === 'localhost'

  return (
    <>
      <Judul t="Ekspor & cadangan" s="Datamu tetap milikmu." />
      <section className="card mb-3 space-y-2">
        <p className="kicker">Ekspor transaksi (CSV)</p>
        <p className="text-sm text-muted">Kolomnya sama dengan sheet Transaksi Pribadi di Excel lama. Draft tidak ikut diekspor.</p>
        <input type="month" aria-label="Bulan" disabled={semua} className={inp} value={bulan} onChange={(e) => setBulan(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={semua} onChange={(e) => setSemua(e.target.checked)} /> Semua bulan</label>
        <button className={btn} onClick={() => void jalan(async () => `${await eksporCsv(uid, semua ? null : bulan, categories, wallets)} transaksi diekspor.`)}>Unduh CSV</button>
      </section>
      <section className="card mb-3 space-y-2">
        <p className="kicker">Cadangan lengkap (JSON)</p>
        <p className="text-sm text-muted">Berisi semua wallet, kategori, transaksi, goal, aset, dan pengaturan. Simpan di tempat aman seperti Google Drive, bukan di folder proyek.</p>
        <button className={btn} onClick={() => void jalan(async () => { unduh(`keuanganku-cadangan-${todayWIB()}.json`, JSON.stringify(await buatCadangan(uid)), 'application/json'); return 'Cadangan diunduh.' })}>Unduh cadangan</button>
        <hr className="border-line" />
        <p className="text-sm text-muted">Pulihkan dari cadangan (hanya untuk akun yang masih kosong).</p>
        <input type="file" accept=".json,application/json" aria-label="Berkas cadangan" onChange={(e) => void baca(e.target.files?.[0])} />
        <button disabled={!berkas} className={btn} onClick={() => berkas && void jalan(async () => `${await pulihkan(uid, berkas)} dokumen dipulihkan.`)}>Pulihkan</button>
      </section>
      <section className="card mb-3 space-y-2">
        <p className="kicker">Pengingat harian</p>
        <p className="text-sm text-muted">Berkas kalender dengan alarm harian. Buka berkasnya di HP atau laptop, lalu tambahkan ke kalender.{lokal && ' Kamu sedang di localhost, jadi buat pengingat ini setelah aplikasi di-deploy agar tautannya benar.'}</p>
        <label className="block"><span className="kicker">Jam pengingat</span><input type="time" className={`${inp} mt-1`} value={jam} onChange={(e) => setJam(e.target.value)} /></label>
        <button className={btn} disabled={!jam} onClick={() => { unduh('pengingat-keuanganku.ics', buatIcs(jam, `${location.origin}/tambah`, todayWIB()), 'text/calendar;charset=utf-8'); setPesan('Berkas pengingat diunduh. Buka untuk menambahkannya ke kalender.') }}>Unduh pengingat</button>
      </section>
      {pesan && <p role="status" className="card font-bold">{pesan}</p>}
    </>
  )
}
