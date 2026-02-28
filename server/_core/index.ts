import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

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

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: (opts) => createContext({ ...opts, req: opts.req as any, res: {} as any }),
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    wss.close();
    server.close(() => {
      process.exit(0);
    });
    // Fallback exit if server.close hangs
    setTimeout(() => process.exit(0), 1000);
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`WebSocket Server running on ws://localhost:${port}/api/trpc`);
  });
}

startServer().catch(console.error);
