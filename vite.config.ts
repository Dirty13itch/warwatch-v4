import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@client": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4311",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");

          if (normalized.includes("node_modules/maplibre-gl")) {
            return "maplibre-vendor";
          }

          if (normalized.includes("node_modules/chart.js") || normalized.includes("node_modules/react-chartjs-2")) {
            return "chart-vendor";
          }

          if (normalized.includes("node_modules/react") || normalized.includes("node_modules/react-dom")) {
            return "react-vendor";
          }

          return undefined;
        }
      }
    }
  }
});
