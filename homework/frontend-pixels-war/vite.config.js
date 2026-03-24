import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: './pixels-war.html',
    },
  },
  server: {
    open: '/pixels-war.html',
    proxy: {
      // This matches any request starting with /api
      '/api': {
        target: 'https://pixels-war.fly.dev',
        changeOrigin: true,
        secure: true,
        // No rewrite function needed here
      }
    }
  }
})
