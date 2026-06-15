import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/renderer'),
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@platforms': path.resolve(__dirname, 'platforms'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
  base: './',
});
