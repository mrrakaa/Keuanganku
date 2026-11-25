import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: { navigateFallbackDenylist: [/^\/__\//] },
      manifest: {
        name: 'Keuanganku',
        short_name: 'Keuanganku',
        description: 'Catatan keuangan pribadi',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        background_color: '#FDF4F6',
        theme_color: '#FDF4F6',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
