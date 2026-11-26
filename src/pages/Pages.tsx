import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTheme, type ModePref, type Palette } from '../lib/theme'

export function Judul({ t, s }: { t: string; s: string }) {
  return (
    <header className="mb-4">
      <h1 className="text-3xl font-bold tracking-tight">{t}</h1>
      <p className="text-muted">{s}</p>
    </header>
  )
}

export function Segera({ t, s }: { t: string; s: string }) {
  return (
    <>
      <Judul t={t} s={s} />
      <div className="card text-muted">Segera hadir di tahap berikutnya.</div>
    </>
  )
}

function Seg<T extends string>(p: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-line p-1">
      {p.options.map((o) => (
        <button
          key={o.v}
          aria-pressed={p.value === o.v}
          onClick={() => p.onChange(o.v)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${p.value === o.v ? 'bg-surface text-ink' : 'text-muted'}`}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Profil() {
  const { user, signOut } = useAuth()
  const { palette, mode, setPalette, setMode } = useTheme()
  return (
    <>
      <Judul t="Profil" s={user?.email ?? ''} />
      <section className="card mb-3 space-y-3">
        <p className="kicker">Warna</p>
        <Seg<Palette> value={palette} onChange={setPalette} options={[{ v: 'pink', l: 'Pink Pastel' }, { v: 'neon', l: 'Neon' }]} />
        <p className="kicker">Mode</p>
        <Seg<ModePref> value={mode} onChange={setMode} options={[{ v: 'system', l: 'Ikuti sistem' }, { v: 'light', l: 'Terang' }, { v: 'dark', l: 'Gelap' }]} />
      </section>
      <Link to="/pengaturan" className="card mb-3 block text-center font-bold">Kelola wallet & kategori</Link>
      <Link to="/cadangan" className="card mb-3 block text-center font-bold">Ekspor & cadangan</Link>
      <button onClick={() => void signOut()} className="h-12 w-full rounded-2xl border border-line bg-surface font-bold">
        Keluar
      </button>
    </>
  )
}
