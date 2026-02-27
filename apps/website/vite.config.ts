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
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-data": [
            "@tanstack/react-query",
            "@supabase/supabase-js",
          ],
          "vendor-three": [
            "three",
            "@react-three/fiber",
            "@react-three/drei",
          ],
          "vendor-pdf": ["jspdf", "pdfjs-dist"],
          "vendor-office": ["xlsx", "docx"],
        },
      },
    },
  },
}));
