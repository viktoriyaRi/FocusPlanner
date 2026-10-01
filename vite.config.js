import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "iOS >= 12", "Android >= 7", "not IE 11"],
      modernPolyfills: true,
    }),
  ],
  optimizeDeps: {
    // Keep Vite from crawling generated Capacitor HTML entrypoints under ios/android.
    entries: ["index.html"],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep stable framework and device integrations in cacheable files.
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          motion: ["framer-motion"],
          capacitor: ["@capacitor/core", "@capacitor/local-notifications"],
          confetti: ["canvas-confetti"],
        },
      },
    },
  },
  server: {
    watch: {
      ignored: ["**/ios/**", "**/android/**", "**/dist/**"],
    },
  },
  base: mode === "mobile" ? "./" : "/focusflow/",
}));
