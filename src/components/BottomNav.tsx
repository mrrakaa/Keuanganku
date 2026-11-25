import { Link, NavLink } from 'react-router-dom'

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-2xl px-3 py-2.5 text-xs font-bold ${isActive ? 'bg-line text-ink' : 'text-muted'}`

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-4 mx-auto flex h-[68px] max-w-md items-center justify-around rounded-full border border-line bg-surface shadow-lg"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <NavLink to="/" end className={tab}>Beranda</NavLink>
      <NavLink to="/dompet" className={tab}>Dompet</NavLink>
      <Link
        to="/tambah"
        aria-label="Tambah transaksi"
        className="-mt-9 flex size-[60px] items-center justify-center rounded-full border-[6px] border-bg bg-accent text-3xl text-on-accent"
      >
        +
      </Link>
      <NavLink to="/transaksi" className={tab}>Transaksi</NavLink>
      <NavLink to="/profil" className={tab}>Profil</NavLink>
    </nav>
  )
}
