import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: false,
  },
  resolve: {
    alias: {
      '@gtmap': resolve(__dirname, 'packages/gtmap/src'),
    },
  },
});
