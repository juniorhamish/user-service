import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      exclude: ['api/generated'],
      reporter: ['text', 'json-summary', 'json', 'html', 'clover', 'lcov'],
      reportOnFailure: true,
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'node',
    globals: true,
  },
});
