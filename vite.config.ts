import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Factory Central',
        short_name: 'Factory',
        description: 'Factory Central — Apps, services & Claude Chat',
        theme_color: '#1a1a2e',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/factory-central/#/chat',
        icons: [
          { src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  base: process.env.VITE_BASE_PATH || '/factory-central/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shell': path.resolve(__dirname, './src/shell'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@digest': path.resolve(__dirname, './src/apps/delivery-digest'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
