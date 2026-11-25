import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import { Beranda, Profil, Segera } from './pages/Pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/masuk" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Beranda />} />
          <Route path="dompet" element={<Segera t="Dompet" s="Atur semua sumber uangmu." />} />
          <Route path="transaksi" element={<Segera t="Transaksi" s="Ke mana uangmu pergi?" />} />
          <Route path="tambah" element={<Segera t="Catat transaksi" s="Layar input cepat." />} />
          <Route path="profil" element={<Profil />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
