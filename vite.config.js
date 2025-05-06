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
      '/users': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/chats': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/files': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/messages': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/visualsummary': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/files/list': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/quiz': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/chat_with_memory': createProxyConfig('https://geni-backend-5l8z.onrender.com'),
      '/api': createProxyConfig('https://geni-backend-5l8z.onrender.com')
    }
  },
  build: {
    outDir: 'dist'
  }
});
