import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/auth'
import type { Tx } from '../lib/types'
import Tambah from './Tambah'

export default function EditTx() {
  const { id } = useParams()
  const { user } = useAuth()
  const [tx, setTx] = useState<Tx | null | undefined>(undefined)
  useEffect(() => {
    if (!user || !id) return
    let ok = true
    getDoc(doc(db, 'users', user.uid, 'transactions', id))
      .then((s) => { if (ok) setTx(s.exists() ? ({ id: s.id, ...s.data() } as unknown as Tx) : null) })
      .catch(() => { if (ok) setTx(null) })
    return () => { ok = false }
  }, [user, id])
  if (tx === undefined) return <p className="text-muted">Memuat…</p>
  if (tx === null) return <p className="card text-muted">Transaksi tidak ditemukan. <Link to="/transaksi" className="font-bold text-ink underline">Kembali</Link></p>
  return <Tambah key={tx.id} awal={tx} />
}
