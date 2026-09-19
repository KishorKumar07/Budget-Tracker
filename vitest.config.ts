import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // "server-only" throws when imported outside Next's server runtime,
      // which includes plain Vitest. Service files import it as a guard
      // against accidental client bundling — safe to no-op under test.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
