import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useCol } from './data'
import type { Aset, Goal, NWLog, Settings, Summary } from './types'

export const DEFAULT_SETTINGS: Settings = { tahunAktif: new Date().getFullYear(), targetSavingRate: 0.2, targetEmergencyFundBulan: 6, targetInvestmentRatio: 0.3, targetDebtRatioMaks: 0.4 }
type Koleksi = 'assets' | 'liabilities' | 'goals'

export function useFin(uid: string) {
  const [error, setError] = useState<string | null>(null)
  const a = useCol<Aset>(uid, 'assets', setError)
  const l = useCol<Aset>(uid, 'liabilities', setError)
  const g = useCol<Goal>(uid, 'goals', setError)
  const s = useCol<Summary>(uid, 'monthlySummaries', setError)
  const n = useCol<NWLog>(uid, 'netWorthLogs', setError)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  useEffect(
    () => onSnapshot(doc(db, 'users', uid, 'settings', 'main'), (d) => setSettings({ ...DEFAULT_SETTINGS, ...(d.data() as Partial<Settings> | undefined) }), () => {}),
    [uid],
  )
  return {
    assets: a.items, liabilities: l.items, goals: g.items, summaries: s.items,
    logs: [...n.items].sort((x, y) => y.id.localeCompare(x.id)), settings, error,
    ready: a.ready && l.ready && g.ready && s.ready && n.ready,
  }
}

export const tambahDoc = (uid: string, k: Koleksi, data: Record<string, unknown>) => addDoc(collection(db, 'users', uid, k), data)
export const ubahNilai = (uid: string, k: Koleksi, id: string, value: number) => updateDoc(doc(db, 'users', uid, k, id), { value })
export const hapusDoc = (uid: string, k: Koleksi, id: string) => deleteDoc(doc(db, 'users', uid, k, id))
export const simpanSnapshot = (uid: string, bulan: string, d: { totalAsset: number; totalLiability: number; netWorth: number }) =>
  setDoc(doc(db, 'users', uid, 'netWorthLogs', bulan), d)
