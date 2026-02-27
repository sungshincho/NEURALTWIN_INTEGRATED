import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("node_modules/react-router-dom")) return "vendor-react";
          if (id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/@tanstack/react-query")) return "vendor-data";
          if (id.includes("node_modules/@supabase/supabase-js")) return "vendor-data";
          if (id.includes("node_modules/three/") || id.includes("node_modules/@react-three/")) return "vendor-three";
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/pdfjs-dist")) return "vendor-pdf";
          if (id.includes("node_modules/xlsx") || id.includes("node_modules/docx")) return "vendor-office";

          // Simulation feature chunk (lazy-loaded via Studio)
          if (id.includes("features/simulation/")) return "studio-simulation";
        },
      },
    },
  },
}));
