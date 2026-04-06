import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const buildTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
const buildLabel = `v${packageJson.version} · ${buildTimestamp}`;

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_BUILD_LABEL__: JSON.stringify(buildLabel),
  },
});
