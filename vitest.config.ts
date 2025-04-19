import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.js', '.mjs', '.ts', '.mts'],
  },
  test: {
    coverage: {
      exclude: ['api/generated', ...coverageConfigDefaults.exclude],
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportOnFailure: true,
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    globals: true,
  },
});
