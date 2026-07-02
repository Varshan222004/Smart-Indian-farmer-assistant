import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Smart Indian Farmer Assistant',
        short_name: 'Farmer Assistant',
        description: 'AI-powered agricultural assistant for crop recommendations, disease detection, fertilizer suggestions, and farming advice',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Crop Recommendation',
            short_name: 'Crop Reco',
            description: 'Get crop recommendations based on soil conditions',
            url: '/crop-recommendation',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Disease Detection',
            short_name: 'Disease',
            description: 'Detect plant diseases from leaf images',
            url: '/disease-detection',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Fertilizer Recommendation',
            short_name: 'Fertilizer',
            description: 'Get fertilizer recommendations for your crops',
            url: '/fertilizer-recommendation',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'AI Chat',
            short_name: 'Chat',
            description: 'Chat with AI farming assistant',
            url: '/chat',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          }
        ],
        categories: ['agriculture', 'productivity', 'education']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/translate\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'translate-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^http:\/\/localhost:5001\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5000,
    host: true, // Expose on network for mobile access
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/ml': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});

