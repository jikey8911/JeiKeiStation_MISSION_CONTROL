import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [react(), tailwindcss(), jsxLocPlugin()];

// Detectar si estamos en GitHub Codespaces
const isCodespace = !!process.env.CODESPACES || !!process.env.GITHUB_CODESPACE_TOKEN || (typeof process.env.VITE_HMR_HOST === 'string' && process.env.VITE_HMR_HOST.includes('github.dev'));

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      // Configuración robusta para HMR en Codespaces
      // En Codespaces, el cliente (navegador) debe conectar vía puerto 443 (HTTPS/WSS)
      // del proxy de GitHub, no directamente al puerto 3000 o 5173 del contenedor.
      host: process.env.VITE_HMR_HOST || undefined,
      clientPort: isCodespace ? 443 : 3000,
      protocol: isCodespace ? "wss" : "ws",
    },
    allowedHosts: [
      "all",
      ".github.dev",
      ".app.github.dev"
    ],
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true, // Habilitar proxy para WebSockets en la ruta /api si se usa tRPC con WS
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      usePolling: true,
    }
  },
});
