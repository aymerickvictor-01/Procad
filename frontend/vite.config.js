import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En développement, Vite joue le rôle de Nginx : il relaie l'API et les fichiers vers Django.
const target = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
    // Windows + Docker : les modifications de fichiers ne sont pas signalées au conteneur,
    // il faut les détecter par scrutation.
    watch: process.env.VITE_USE_POLLING === "1" ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      "/api": target,
      "/media": target,
      "/static": target,
      "/django-admin": target,
    },
  },
});
