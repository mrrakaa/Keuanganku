export const formatRp = (n: number) => `${n < 0 ? '-' : ''}Rp${Math.abs(Math.trunc(n)).toLocaleString('id-ID')}`

export function kompak(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}rb`
  return String(n)
}

// Tanggal hari ini di WIB (YYYY-MM-DD), tidak bergeser oleh zona waktu perangkat
export const todayWIB = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())

export function geserBulan(k: string, d: number) {
  const [y, m] = k.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7)
}
export const labelBulan = (k: string) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${k}-01T00:00:00Z`))
export const labelHari = (d: string) =>
  d === todayWIB() ? 'Hari ini'
  : new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`))
