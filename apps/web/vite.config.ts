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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (normalized.includes("/node_modules/react/") || normalized.includes("/node_modules/react-dom/")) return "vendor-react";
          if (normalized.includes("/node_modules/lucide-react/")) return "vendor-icons";
          if (normalized.includes("/apps/web/src/maxwell/MaxwellPanel.tsx")) return "maxwell-panel";
          if (normalized.includes("/apps/web/src/explainability/") || normalized.includes("/apps/web/src/explainabilityContent.ts")) return "explainability";
          if (normalized.endsWith("/packages/core/src/index.ts")) return "core-index";
          if (normalized.includes("/packages/core/src/scene/")) return "core-base";
          if (normalized.includes("/packages/core/src/fdtd/") || normalized.includes("/packages/core/src/maxwell/")) return "core-maxwell";
          if (normalized.includes("/packages/core/src/validation/")) return "core-validation";
          if (normalized.includes("/packages/core/src/measurement/")) return "core-measurement";
          if (normalized.includes("/packages/core/src/workspace/")) return "core-workspace";
          if (normalized.includes("/packages/core/src/imageQuality/")) return "core-image-quality";
          if (normalized.includes("/packages/core/src/wave/") || normalized.includes("/packages/core/src/math/")) return "core-wave";
          if (normalized.includes("/packages/core/src/")) return "core-foundation";
        }
      }
    }
  }
});
