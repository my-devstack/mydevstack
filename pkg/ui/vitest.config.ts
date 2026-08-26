import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.stories.ts', 'src/main.ts', 'src/env.d.ts', 'src/api/client.ts', 'src/vite-env.d.ts', 'src/api/services/index.ts', 'src/api/types/aws.ts', 'src/components/layout/index.ts', 'src/App.vue'],
      thresholds: {
        statements: 90,
        branches: 84,
        functions: 73,
        lines: 90,
      },
    },
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    onConsoleLog(log) {
      if (log.includes('[Vue warn]:')) return false;
    }
  }
});