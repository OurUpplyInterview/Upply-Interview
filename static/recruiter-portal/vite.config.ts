import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // FastAPI recruiter routes
      '/recruiter': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
      // Upply API proxy
      '/proxy': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
