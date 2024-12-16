import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/questions': {
        target: 'https://tune-backend-opj9.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/games': {
        target: 'https://tune-backend-opj9.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/match': {
        target: 'https://tune-backend-opj9.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});