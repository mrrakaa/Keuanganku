import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import type { Category, Template, Wallet } from './types'

interface DataCtx { wallets: Wallet[]; categories: Category[]; templates: Template[]; ready: boolean; error: string | null }
const Ctx = createContext<DataCtx | null>(null)

function useCol<T>(uid: string, name: string, onError: (m: string) => void) {
  const [items, setItems] = useState<T[]>([])
  const [ready, setReady] = useState(false)
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'users', uid, name),
        (s) => {
          setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as T[])
          setReady(true)
        },
        () => {
          onError('Gagal membaca data. Pastikan aturan Firestore sudah dipublikasikan.')
          setReady(true)
        },
      ),
    [uid, name, onError],
  )
  return { items, ready }
}

export function DataProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const w = useCol<Wallet>(uid, 'wallets', setError)
  const c = useCol<Category>(uid, 'categories', setError)
  const t = useCol<Template>(uid, 'quickTemplates', setError)
  const value = useMemo<DataCtx>(
    () => ({
      wallets: [...w.items].sort((a, b) => a.name.localeCompare(b.name)),
      categories: [...c.items].sort((a, b) => a.name.localeCompare(b.name)),
      templates: [...t.items].sort((a, b) => b.usageCount - a.usageCount),
      ready: w.ready && c.ready && t.ready,
      error,
    }),
    [w, c, t, error],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData harus di dalam DataProvider')
  return v
}
