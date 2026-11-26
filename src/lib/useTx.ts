import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { db } from './firebase'
import { geserBulan } from './format'
import type { Tx } from './types'

export function useMonthTx(uid: string, bulan: string) {
  const [state, setState] = useState<{ bulan: string; items: Tx[] } | null>(null)
  useEffect(() => {
    if (!uid) return
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      where('date', '>=', `${bulan}-01`), where('date', '<', `${geserBulan(bulan, 1)}-01`), orderBy('date', 'desc'),
    )
    return onSnapshot(q, (s) => setState({ bulan, items: s.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as Tx[] }), () => setState({ bulan, items: [] }))
  }, [uid, bulan])
  return { items: state?.bulan === bulan ? state.items : [], loading: state?.bulan !== bulan }
}
