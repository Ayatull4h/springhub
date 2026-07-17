import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["lib/**/*.test.ts", "lib/**/*.spec.ts", "components/**/*.test.ts", "components/**/*.spec.ts", "app/**/*.test.ts", "app/**/*.spec.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**", ".opencode/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["app/**/*.ts", "app/**/*.tsx", "lib/**/*.ts", "lib/**/*.tsx", "components/**/*.ts", "components/**/*.tsx"],
      exclude: ["node_modules", ".next", "app/api/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
