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
      '/api': {
        target: 'https://pixels-war.fly.dev', 
        changeOrigin: true, 
        secure: false, 
        cookieDomainRewrite: { "*": "" } 
      }
    }
  }
})