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
      '/users': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/chats': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/files': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/messages': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/visualsummary': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/files/list': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/quiz': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/chat_with_memory': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049'),
      '/api': createProxyConfig(process.env.VITE_API_URL || 'http://localhost:5049')
    }
  },
  build: {
    outDir: 'dist'
  }
});
