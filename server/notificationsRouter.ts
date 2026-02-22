import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional(), type: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      return await db.getNotifications(ctx.user.id, input.unreadOnly, true, input.type);
    }),

  create: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]),
        title: z.string(),
        message: z.string().optional(),
        taskId: z.number().optional(),
        sprintId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.createNotification(input);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return await db.markNotificationAsRead(input.notificationId);
    }),

  markMultipleAsRead: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return await db.markNotificationsAsRead(input.notificationIds);
    }),

  archive: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      return await db.archiveNotification(input.notificationId);
    }),

  archiveMultiple: protectedProcedure
    .input(z.object({ notificationIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return await db.archiveNotifications(input.notificationIds);
    }),

  getByType: protectedProcedure
    .input(z.object({ type: z.string() }))
    .query(async ({ input, ctx }) => {
      return await db.getNotificationsByType(ctx.user.id, input.type);
    }),

  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const notifications = await db.getNotifications(ctx.user.id, true, true);
      return { count: notifications.length };
    }),
});
