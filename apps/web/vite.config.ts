import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === "true" ? "/EM-Microscope/" : "/",
  resolve: {
    alias: {
      "@emmicro/core": path.resolve(__dirname, "../../packages/core/src/index.ts")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5175
  }
});
