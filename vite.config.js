import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We register the service worker ourselves (see src/pwa.js) so Electron's file:// build skips it.
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['revision-mark.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nihongo Revision Suite',
        short_name: 'Nihongo',
        description: 'Kanji words, writing and grammar revision with saved progress and offline study.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2463eb',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache fonts and bundled Japanese stroke data before offline use.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2,txt}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  base: './',
  server: { watch: { awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 30 } } },
})
