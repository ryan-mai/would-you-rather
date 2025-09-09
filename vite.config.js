import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // proxy any request starting with /api to your backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});