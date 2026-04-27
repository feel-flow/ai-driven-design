import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["docs-template/scripts/ace/**/*.test.ts"],
  },
});
