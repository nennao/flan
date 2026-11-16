import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the "@/*" alias from tsconfig.json.
  plugins: [tsconfigPaths()],
  test: {
    // Domain and server logic only, for now. Add jsdom + React Testing Library
    // when component tests are needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
