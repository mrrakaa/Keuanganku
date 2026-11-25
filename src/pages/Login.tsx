import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { configError } from '../lib/firebase'

function pesan(e: unknown): string | null {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return null
  if (code === 'auth/operation-not-allowed') return 'Metode Google belum diaktifkan di Firebase Authentication.'
  if (code === 'auth/unauthorized-domain') return 'Domain ini belum diizinkan di Authentication → Settings → Authorized domains.'
  return 'Gagal masuk. Coba lagi.'
}

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  if (!loading && user) return <Navigate to="/" replace />

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-on-accent">K.</div>
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Keuanganku</h1>
        <p className="mt-2 text-muted">Catat pengeluaran dalam hitungan detik.</p>
      </div>
      {configError && <p role="alert" className="card text-bahaya">{configError}</p>}
      {error && <p role="alert" className="card text-bahaya">{error}</p>}
      <button
        disabled={!!configError}
        onClick={() => signIn().catch((e) => setError(pesan(e)))}
        className="h-14 rounded-2xl bg-hero font-bold text-white disabled:opacity-50"
      >
        Masuk dengan Google
      </button>
    </main>
  )
}
