import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          liff: ['@line/liff'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
