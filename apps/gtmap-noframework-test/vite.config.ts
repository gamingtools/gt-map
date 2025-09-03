import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: false,
    // WSL/NTFS: use polling to detect changes under /mnt
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
  resolve: {
    alias: {
      '@gtmap': resolve(__dirname, '../../packages/gtmap/src'),
    },
  },
  optimizeDeps: {
    // Treat the local package as source, not a pre-bundled dep
    exclude: ['@gtmap'],
  },
});
