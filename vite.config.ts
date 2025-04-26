import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { tempo } from "tempo-devtools/dist/vite";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "development"
      ? "/"
      : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/components/**/*"],
  },
  plugins: [react(), tempo()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Group core React dependencies together
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Group UI components together
          "ui-components": ["@/components/ui"],
          // Group dashboard components together
          dashboard: ["@/components/dashboard"],
          // Group auth components together
          auth: ["@/components/auth", "@/supabase/auth"],
          // Group feedback components together
          feedback: ["@/components/feedback"],
        },
      },
    },
    // Improve chunk size reporting during build
    reportCompressedSize: true,
    // Set chunk size warning limit (in kBs)
    chunkSizeWarningLimit: 1000,
  },
});
