import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";


// ============================================================
// VITE CONFIGURATION
// ============================================================

export default defineConfig({

  plugins: [
    react(),
  ],


  // ==========================================================
  // BACKEND API PROXY
  // ==========================================================

  server: {

    proxy: {

      "/api": {

        target: "http://127.0.0.1:8000",

        changeOrigin: true,

      },

    },

  },

});