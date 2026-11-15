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
    // No tests exist until the nutrition domain module (M2). Remove then.
    passWithNoTests: true,
  },
});
