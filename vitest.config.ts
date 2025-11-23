import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'tests/integration', 'tests/functional'],
    passWithNoTests: true, // Don't fail if no tests are found
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types/',
      ],
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, './app/api'),
      '@': path.resolve(__dirname, './'),
    },
  },
});
