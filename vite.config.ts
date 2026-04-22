import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@assets", replacement: path.resolve(__dirname, "./attached_assets") },
      { find: "@shared", replacement: path.resolve(__dirname, "./shared") },
      { find: "@", replacement: path.resolve(__dirname, "./client/src") },
    ],
  },
  root: "client",
  publicDir: "../public",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
