import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Nilai kosong atau mengandung tanda kutip/koma/spasi = format .env.local salah
export const configError: string | null = Object.entries(config).some(
  ([, v]) => typeof v !== 'string' || v === '' || /["',\s]/.test(v),
)
  ? 'Isi .env.local belum benar: hapus tanda kutip, koma, dan spasi, lalu restart "npm run dev".'
  : null

const app = initializeApp(config)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
// Cache offline: transaksi tetap bisa dicatat tanpa sinyal dan tersinkron nanti
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
