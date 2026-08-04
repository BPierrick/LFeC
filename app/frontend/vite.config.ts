import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
        target: `http://localhost:5001,
        changeOrigin: true,
      },
    },
  },
});
