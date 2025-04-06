import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Helper function to create proxy config with header forwarding
function createProxyConfig(target) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq, req) => {
        // Forward the Authorization header if it exists
        if (req.headers['authorization']) {
          proxyReq.setHeader('authorization', req.headers['authorization']);
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['tailwind-scrollbar'] // Changed from include to exclude
  },
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "./src/styles/scrollbar.css";`
      }
    }
  },
  server: {
    proxy: {
      '/users': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/chats': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/files': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/messages': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/visualsummary': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/files/list': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/quiz': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/chat_with_memory': createProxyConfig('https://web-production-8cb2.up.railway.app'),
      '/api': createProxyConfig('https://web-production-8cb2.up.railway.app')
    }
  },
  build: {
    outDir: 'dist'
  }
});
