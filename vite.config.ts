import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    {
      name: 'mock-send-menu',
      configureServer(server) {
        server.middlewares.use('/api/send-menu', (req, res) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              console.log('[Mock] Send menu:', body)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, id: 'mock-' + Date.now() }))
            })
          } else {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
          }
        })
      }
    },
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '今天吃啥',
        short_name: '吃啥',
        description: '快速决定今天吃什么',
        theme_color: '#FDF6E3',
        background_color: '#FDF6E3',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
})
