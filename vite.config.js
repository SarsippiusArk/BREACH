import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      // chiptune3.js lives in public/ and is loaded at runtime via dynamic import.
      // Tell Rollup not to try to bundle it.
      external: ['/lib/chiptune3/chiptune3.js'],
    },
  },
});
