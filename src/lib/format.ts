export const formatRp = (n: number) => `${n < 0 ? '-' : ''}Rp${Math.abs(Math.trunc(n)).toLocaleString('id-ID')}`

export function kompak(n: number) {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}rb`
  return String(n)
}

// Tanggal hari ini di WIB (YYYY-MM-DD), tidak bergeser oleh zona waktu perangkat
export const todayWIB = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
