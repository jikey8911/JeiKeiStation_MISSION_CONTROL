import { TRPCError } from "@trpc/server";
import { publicProcedure, t } from "./_core/trpc";
import { ENV } from "./_core/env";

/**
 * Middleware para aplicar autenticación por API Key.
 * Permite el acceso programático a los agentes de OpenClaw.
 */
export const enforceServiceAuth = t.middleware(async ({ ctx, next }) => {
  const apiKey = ctx.req.headers["x-api-key"];

  // En un entorno real, la API Key debería estar en una variable de entorno o base de datos.
  // Para este proyecto, usaremos una clave de servicio configurada.
  const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "jk_secret_agent_key_2026";

  if (!apiKey || apiKey !== SERVICE_API_KEY) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or missing API Key for service access.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Podríamos marcar este contexto como 'service-agent'
      isServiceAgent: true,
    },
  });
});

/**
 * Procedimiento protegido para servicios externos (OpenClaw).
 */
export const serviceProcedure = publicProcedure.use(enforceServiceAuth);
