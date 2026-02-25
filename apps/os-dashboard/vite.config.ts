import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

//  https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어 (변경 빈도 낮음 → 캐시 효율)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Three.js (3D 페이지에서만 필요, ~600KB)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          // 데이터 계층 (전역 사용)
          'vendor-data': ['@tanstack/react-query', '@supabase/supabase-js'],
        },
      },
    },
  },
}));
