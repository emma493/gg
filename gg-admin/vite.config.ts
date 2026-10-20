import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/gg-admin/',
  resolve: {
    alias: {
      '@': '.',
    },
  },
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: '../dist/gg-admin',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
});
