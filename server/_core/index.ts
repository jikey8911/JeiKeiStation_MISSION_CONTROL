import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // WebSocket Server for tRPC
  const wss = new WebSocketServer({
    noServer: true,
    path: "/api/trpc",
  });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url ?? "", `http://${request.headers.host}`);

    if (pathname === "/api/trpc") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  applyWSSHandler({
    wss,
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, req: opts.req as any, res: {} as any }),
  });

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback
  registerOAuthRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // En desarrollo, si es el proceso de la API (puerto 3001), no necesitamos Vite
  // Si es el proceso del Frontend (puerto 3000), usamos Vite
    const port = parseInt(process.env.PORT || "3000");

    // Limpiar caché de Vite para forzar recarga de .env
    if (process.env.NODE_ENV === "development" && port === 3000) {
      const viteCache = path.resolve(import.meta.dirname, "../../node_modules/.vite");
      if (fs.existsSync(viteCache)) {
        console.log("[Vite] Cleaning cache...");
        fs.rmSync(viteCache, { recursive: true, force: true });
      }
    }

  if (process.env.NODE_ENV === "development") {
    if (port === 3000) {
      await setupVite(app, server);
    } else {
      console.log("[API] Running in API-only mode");
    }
  } else {
    serveStatic(app);
  }

  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    wss.close();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    console.log(`WebSocket Server running on ws://0.0.0.0:${port}/api/trpc`);
  });
}

startServer().catch(console.error);
