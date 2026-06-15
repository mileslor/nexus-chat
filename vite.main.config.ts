import { defineConfig } from 'vite';
import path from 'path';

const nodeBuiltins = ['fs', 'fs/promises', 'path', 'os', 'crypto', 'stream', 'url', 'buffer', 'events', 'util', 'module', 'child_process', 'net', 'tls'];

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@platforms': path.resolve(__dirname, 'platforms'),
    },
  },
  build: {
    rollupOptions: {
      external: ['electron', ...nodeBuiltins],
    },
  },
});
