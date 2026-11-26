import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { imporSemua, type ImporData } from '../lib/impor'
import { Judul } from './Pages'

export default function Impor() {
  const { user } = useAuth()
  const { wallets, categories } = useData()
  const [data, setData] = useState<ImporData | null>(null)
  const [pesan, setPesan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const kosong = wallets.length === 0 && categories.length === 0

  const baca = async (f: File | undefined) => {
    if (!f) return
    try {
      const j = JSON.parse(await f.text()) as ImporData
      if (!Array.isArray(j.wallets) || !Array.isArray(j.categories) || !Array.isArray(j.transactions)) throw new Error('format')
      setData(j); setPesan('')
    } catch {
      setData(null); setPesan('Berkas tidak valid. Pilih data-import.json.')
    }
  }
  const jalan = async () => {
    if (!data || !user) return
    setSibuk(true); setPesan('Mengimpor… jangan tutup halaman ini.')
    try {
      const r = await imporSemua(user.uid, data)
      setPesan(`Selesai: ${r.wallet} wallet, ${r.kategori} kategori, ${r.transaksi} transaksi. Cek tab Dompet dan Transaksi.`)
      setData(null)
    } catch (e) {
      setPesan(`Gagal: ${(e as Error).message}`)
    }
    setSibuk(false)
  }
  return (
    <>
      <Judul t="Impor dari Excel" s="Pindahkan data lama sekali saja." />
      {!kosong && (
        <p className="card mb-3 text-bahaya">Sudah ada wallet/kategori di akun ini. Hapus data uji dulu di <Link to="/pengaturan" className="font-bold underline">Wallet & kategori</Link> (bagian Hapus semua data), lalu kembali ke sini.</p>
      )}
      <section className="card mb-3 space-y-3">
        <p className="text-muted">Pilih berkas <b>data-import.json</b> (simpan di luar folder proyek, jangan di-commit ke Git). Perlu koneksi internet.</p>
        <input type="file" accept=".json,application/json" aria-label="Berkas data-import.json" onChange={(e) => void baca(e.target.files?.[0])} />
        {data && (
          <p>Siap impor: <b>{data.wallets.length}</b> wallet, <b>{data.categories.length}</b> kategori, <b>{data.transactions.length}</b> transaksi.</p>
        )}
        <button disabled={!data || !kosong || sibuk} onClick={() => void jalan()} className="h-12 w-full rounded-2xl bg-accent font-bold text-on-accent disabled:opacity-40">Impor sekarang</button>
        {pesan && <p role="status" className="font-bold">{pesan}</p>}
      </section>
    </>
  )
}
