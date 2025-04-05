import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// Helper function to create proxy config with header forwarding
function createProxyConfig(target) {
  return {
    target,
    changeOrigin: true,
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
      '/users': createProxyConfig('http://localhost:5049'),
      '/chats': createProxyConfig('http://localhost:5049'),
      '/files': createProxyConfig('http://localhost:5049'),
      '/messages': createProxyConfig('http://localhost:5049'),
      '/visualsummary': createProxyConfig('http://localhost:5049'),
      '/files/list': createProxyConfig('http://localhost:5049'),
      '/quiz': createProxyConfig('http://localhost:5049'),
      '/chat_with_memory': createProxyConfig('http://localhost:5049'),
      '/api': createProxyConfig('http://localhost:5049'),
    }
  }
});
