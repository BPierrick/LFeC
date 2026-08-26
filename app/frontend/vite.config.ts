import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../backend/shared", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Évite un 403 "Blocked request" si tu accèdes au dev server via une URL
    // différente de localhost (IP locale, domaine de prévisualisation, tunnel...).
    // À restreindre à une liste précise de domaines en environnement partagé,
    // et de toute façon sans impact en production (ceci ne concerne que `vite dev`).
    allowedHosts: true,
    proxy: {
      // Toutes les requêtes /api sont redirigées vers le backend Express
      "/api": {
        target: "https://lfec-production.up.railway.app:5001",
        changeOrigin: true,
      },
    },
  },
});
