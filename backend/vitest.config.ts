import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node environment (not browser/jsdom)
    environment: "node",
    // Load test env vars from .env.test
    env: { NODE_ENV: "test" },
    // Where to look for tests
    include: ["src/tests/**/*.test.ts"],
    // Run tests sequentially (avoids DB race conditions in integration tests)
    sequence: { concurrent: false },
    // Sensible timeout for integration tests
    testTimeout: 15000,
    // Coverage configuration
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/db/seed-client.ts"],
    },
  },
});
