import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Preview uses the same security headers as Netlify so production behaviour can be checked locally.
const csp = readFileSync(new URL('./netlify.toml', import.meta.url), 'utf8').match(/Content-Security-Policy = "([^"]+)"/)?.[1] ?? '';

export default defineConfig({
  plugins: [react()],
  preview: { headers: { 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
        },
      },
    },
  },
});
