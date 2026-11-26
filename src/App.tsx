import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import { Profil } from './pages/Pages'
import Beranda from './pages/Beranda'
import Budget from './pages/Budget'
import AsetPage from './pages/Aset'
import Goals from './pages/Goals'
import Skor from './pages/Skor'
import Dompet from './pages/Dompet'
import Tambah from './pages/Tambah'
import Pengaturan from './pages/Pengaturan'
import Transaksi from './pages/Transaksi'
import EditTx from './pages/EditTx'
import Impor from './pages/Impor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/masuk" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Beranda />} />
          <Route path="budget" element={<Budget />} />
          <Route path="aset" element={<AsetPage />} />
          <Route path="goals" element={<Goals />} />
          <Route path="skor" element={<Skor />} />
          <Route path="dompet" element={<Dompet />} />
          <Route path="transaksi" element={<Transaksi />} />
          <Route path="transaksi/:id" element={<EditTx />} />
          <Route path="impor" element={<Impor />} />
          <Route path="tambah" element={<Tambah />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="profil" element={<Profil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
