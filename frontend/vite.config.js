import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // proxy the api endpoint to the backend
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // proxy all google auth subpaths (/auth/google, /callback, /exchange)
      "/auth/google": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
