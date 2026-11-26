import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { geserBulan } from './format'
import type { Category, Tx, Wallet } from './types'

export function unduh(nama: string, isi: BlobPart, tipe: string) {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }))
  const a = document.createElement('a')
  a.href = url
  a.download = nama
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Sel teks diberi tanda kutip bila perlu; awalan = + @ dinetralkan agar tidak dibaca sebagai rumus Excel
const esc = (v: string | number, teks = false) => {
  let s = String(v)
  if (teks && /^[=+@]/.test(s)) s = `'${s}`
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function ambilTransaksi(uid: string, bulan: string | null) {
  const c = collection(db, 'users', uid, 'transactions')
  const q = bulan
    ? query(c, where('date', '>=', `${bulan}-01`), where('date', '<', `${geserBulan(bulan, 1)}-01`), orderBy('date', 'asc'))
    : query(c, orderBy('date', 'asc'))
  const s = await getDocs(q)
  return s.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as Tx[]
}

// Format kolom meniru sheet "Transaksi Pribadi" di Excel lama (pemasukan: wallet penerima ada di "Wallet Asal")
export async function eksporCsv(uid: string, bulan: string | null, cats: Category[], wallets: Wallet[]) {
  const txs = (await ambilTransaksi(uid, bulan)).filter((t) => t.status === 'final')
  const cat = (id: string | null) => cats.find((c) => c.id === id)?.name ?? ''
  const wal = (id: string | null) => wallets.find((w) => w.id === id)?.name ?? ''
  const label = { expense: 'Expense', income: 'Income', transfer: 'Transfer', adjustment: 'Adjustment' } as const
  const baris: (string | number)[][] = [['Tanggal', 'Tipe', 'Kategori Expense', 'Kategori Income', 'Wallet Asal', 'Wallet Tujuan (Transfer)', 'Deskripsi', 'Jumlah']]
  for (const t of txs) {
    baris.push([
      t.date, label[t.type], t.type === 'expense' ? cat(t.categoryId) : '', t.type === 'income' ? cat(t.categoryId) : '',
      wal(t.type === 'income' ? t.walletToId : t.walletFromId), t.type === 'transfer' ? wal(t.walletToId) : '', t.description, t.amount,
    ])
  }
  // Pemisah titik koma + BOM UTF-8 agar terbaca benar di Excel dengan pengaturan regional Indonesia
  const csv = '\uFEFF' + baris.map((r, i) => r.map((v, j) => esc(v, i > 0 && j >= 2 && j <= 6)).join(';')).join('\r\n')
  unduh(`transaksi-${bulan ?? 'semua'}.csv`, csv, 'text/csv;charset=utf-8')
  return txs.length
}

// Pengingat harian sebagai berkas kalender (.ics): jalan di HP tanpa server
export function buatIcs(jam: string, url: string, tanggalMulai: string) {
  const [h, m] = jam.split(':')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Keuanganku//ID', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:keuanganku-pengingat-${Date.now()}@keuanganku`, `DTSTAMP:${stamp}`,
    `DTSTART:${tanggalMulai.replace(/-/g, '')}T${h}${m}00`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY',
    'SUMMARY:Catat pengeluaran hari ini', `DESCRIPTION:Buka Keuanganku: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Catat pengeluaran hari ini', 'TRIGGER:PT0S', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}
