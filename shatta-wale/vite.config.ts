import { defineConfig } from 'vite';

export default defineConfig({
  base: '/shatta-wale/',
  build: {
    outDir: '../dist/shatta-wale',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
