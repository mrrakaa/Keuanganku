import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import BottomNav from './BottomNav'

export default function Layout() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6 text-muted">Memuat…</p>
  if (!user) return <Navigate to="/masuk" replace />
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-5 pb-36">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
