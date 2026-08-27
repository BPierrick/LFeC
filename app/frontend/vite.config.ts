import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@shared": fileURLToPath(new URL("../backend/shared", import.meta.url)),
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: parseInt(env.VITE_API_PORT) || 5173,
      // Évite un 403 "Blocked request" si tu accèdes au dev server via une URL
      // différente de localhost (IP locale, domaine de prévisualisation, tunnel...).
      // À restreindre à une liste précise de domaines en environnement partagé,
      // et de toute façon sans impact en production (ceci ne concerne que `vite dev`).
      allowedHosts: true,
      proxy: {
        // Toutes les requêtes /api sont redirigées vers le backend Express
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5001",
          changeOrigin: true,
        },
      },
    },
  }
});
