import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import { Beranda, Profil, Segera } from './pages/Pages'
import Dompet from './pages/Dompet'
import Tambah from './pages/Tambah'
import Pengaturan from './pages/Pengaturan'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/masuk" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Beranda />} />
          <Route path="dompet" element={<Dompet />} />
          <Route path="transaksi" element={<Segera t="Transaksi" s="Ke mana uangmu pergi?" />} />
          <Route path="tambah" element={<Tambah />} />
          <Route path="pengaturan" element={<Pengaturan />} />
          <Route path="profil" element={<Profil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
