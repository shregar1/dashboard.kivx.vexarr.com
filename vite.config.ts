import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      // Proxy `/ipc/*` to the local KivX host during development so the
      // dashboard can talk to the Electron main process over a localhost
      // HTTP bridge instead of the in-process `window.kivAPI`. The
      // packaged build wires the same path via a custom protocol handler.
      '/ipc': {
        target: 'http://127.0.0.1:7711',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ipc/, '')
      }
    }
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist'
  }
});