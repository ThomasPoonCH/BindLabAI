import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // Next resolves this marker through the react-server export condition.
      // Vitest runs in Node and needs an inert equivalent for server unit tests.
      "server-only": fileURLToPath(new URL("test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"]
  }
});
