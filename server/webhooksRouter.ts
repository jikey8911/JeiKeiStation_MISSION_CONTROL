import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";

// Almacenamiento temporal de URLs de webhooks (en producción iría a DB)
const webhookUrls: string[] = [];

export const webhooksRouter = router({
  register: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
      if (!webhookUrls.includes(input.url)) {
        webhookUrls.push(input.url);
      }
      return { success: true, count: webhookUrls.length };
    }),

  list: protectedProcedure.query(() => webhookUrls),

  // Función interna para disparar eventos
  trigger: publicProcedure
    .input(z.object({ event: z.string(), data: z.any() }))
    .mutation(async ({ input }) => {
      const results = await Promise.allSettled(
        webhookUrls.map(url => axios.post(url, {
          event: input.event,
          payload: input.data,
          timestamp: new Date().toISOString()
        }, { timeout: 5000 }))
      );
      
      return {
        total: webhookUrls.length,
        success: results.filter(r => r.status === 'fulfilled').length,
        failed: results.filter(r => r.status === 'rejected').length
      };
    })
});

/**
 * Helper para notificar cambios de estado críticos
 */
export async function notifyOpenClaw(event: string, data: any) {
  // En una implementación real, esto se llamaría desde los routers o DB hooks
  console.log(`[Webhook] Triggering event: ${event}`, data);
  // Por simplicidad en este MVP, los dispararemos manualmente cuando sea necesario
}
