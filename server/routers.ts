import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { parseMarkdownTasks, findBestAgent, hasCyclicDependency } from "./utils";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== AGENTES ====================
  agents: router({
    list: publicProcedure.query(async () => {
      return await db.getAgents();
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgentById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          avatar: z.string().optional(),
          skills: z.array(z.string()),
          maxCapacity: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createAgent(input);
      }),

    updateWorkload: protectedProcedure
      .input(z.object({ agentId: z.number(), workload: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateAgentWorkload(input.agentId, input.workload);
        return { success: true };
      }),
  }),

  // ==================== SPRINTS ====================
  sprints: router({
    list: publicProcedure.query(async () => {
      return await db.getSprints();
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSprintById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          plannedVelocity: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createSprint(input);
      }),

    updateStatus: protectedProcedure
      .input(z.object({ sprintId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateSprintStatus(input.sprintId, input.status);
        return { success: true };
      }),
  }),

  // ==================== TAREAS ====================
  tasks: router({
    list: publicProcedure
      .input(z.object({ sprintId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getTasks(input.sprintId);
      }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          sprintId: z.number().optional(),
          title: z.string().min(1),
          description: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "critical"]).optional(),
          requiredSkills: z.array(z.string()),
          estimationHours: z.number().optional(),
          acceptanceCriteria: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTask(input);
      }),

    updateStatus: protectedProcedure
      .input(z.object({ taskId: z.number(), status: z.string(), agentId: z.number().optional() }))
      .mutation(async ({ input }) => {
        await db.updateTaskStatus(input.taskId, input.status, input.agentId);
        return { success: true };
      }),

    assignToAgent: protectedProcedure
      .input(z.object({ taskId: z.number(), agentId: z.number() }))
      .mutation(async ({ input }) => {
        await db.assignTaskToAgent(input.taskId, input.agentId);
        
        // Actualizar carga de trabajo del agente
        const agent = await db.getAgentById(input.agentId);
        if (agent) {
          await db.updateAgentWorkload(input.agentId, agent.currentWorkload + 1);
        }

        return { success: true };
      }),

    // Importar tareas desde Markdown
    importFromMarkdown: protectedProcedure
      .input(z.object({ markdown: z.string(), sprintId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const parsedTasks = parseMarkdownTasks(input.markdown);
        const createdTasks = [];

        for (const task of parsedTasks) {
          const result = await db.createTask({
            sprintId: input.sprintId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            requiredSkills: task.requiredSkills,
            estimationHours: task.estimationHours,
            acceptanceCriteria: task.acceptanceCriteria,
          });

          createdTasks.push(result);
        }

        return { count: createdTasks.length, tasks: createdTasks };
      }),

    // Asignación automática de tareas
    autoAssign: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");

        const agents = await db.getAgents();
        const bestAgent = findBestAgent(
          agents.map(a => ({
            id: a.id,
            name: a.name,
            skills: typeof a.skills === 'string' ? JSON.parse(a.skills) : a.skills,
            currentWorkload: a.currentWorkload,
            maxCapacity: a.maxCapacity,
            status: a.status as "available" | "busy" | "offline",
          })),
          task.requiredSkills
        );

        if (!bestAgent) {
          throw new Error("No available agent with required skills");
        }

        await db.assignTaskToAgent(input.taskId, bestAgent.id);
        await db.updateAgentWorkload(bestAgent.id, bestAgent.currentWorkload + 1);

        return { agentId: bestAgent.id, agentName: bestAgent.name };
      }),
  }),

  // ==================== DEPENDENCIAS ====================
  dependencies: router({
    list: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskDependencies(input.taskId);
      }),

    getBlocking: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBlockingTasks(input.taskId);
      }),

    create: protectedProcedure
      .input(z.object({ taskId: z.number(), dependsOnTaskId: z.number() }))
      .mutation(async ({ input }) => {
        // Verificar ciclos
        const allDeps = await db.getTaskDependencies(input.taskId);
        if (hasCyclicDependency(allDeps, input.taskId, input.dependsOnTaskId)) {
          throw new Error("Adding this dependency would create a cycle");
        }

        return await db.createTaskDependency(input.taskId, input.dependsOnTaskId);
      }),
  }),

  // ==================== NOTIFICACIONES ====================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }))
      .query(async ({ input, ctx }) => {
        return await db.getNotifications(ctx.user.id, input.unreadOnly);
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
  }),
});

export type AppRouter = typeof appRouter;
