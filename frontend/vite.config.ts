import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/questions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/games': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/match': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});