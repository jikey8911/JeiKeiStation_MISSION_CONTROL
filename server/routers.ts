import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { observable } from "@trpc/server/observable";
import { serviceProcedure } from "./serviceAuth";
import { z } from "zod";
import * as db from "./db";
import fs from "fs";
import path from "path";
import { parseMarkdownTasks, findBestAgent, hasCyclicDependency } from "./utils";
import { eventEmitter } from "./ee";
import { notificationsRouter } from "./notificationsRouter";
import { webhooksRouter } from "./webhooksRouter";
import { projectOwnerRouter } from "./projectOwnerRouter";

async function getLocalOpenClawAgents() {
  try {
    const skillsDir = path.resolve(import.meta.dirname, "../openclaw/skills");
    if (!fs.existsSync(skillsDir)) return [];

    const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    let idx = 1000;

    return dirs.map((dir) => {
      const normalized = dir.toLowerCase();
      const isDevOp = normalized.includes("devops");
      const isProductOwner = normalized.includes("mission_control") || normalized.includes("owner") || normalized.includes("jeikei");

      return {
        id: idx++,
        name: isDevOp ? "DevOp" : isProductOwner ? "Product Owner" : dir.replace(/[_-]/g, " "),
        description: `OpenClaw skill: ${dir}`,
        avatar: null,
        skills: [dir],
        status: "connected",
        currentWorkload: 0,
        maxCapacity: 10,
        source: "openclaw",
      };
    });
  } catch {
    return [];
  }
}

function getAgentPresets() {
  try {
    const presetsDir = path.resolve(import.meta.dirname, "../openclaw/agent-presets");
    if (!fs.existsSync(presetsDir)) return [];

    const files = fs.readdirSync(presetsDir).filter(f => f.endsWith('.json'));
    return files.map((f, i) => {
      const raw = fs.readFileSync(path.join(presetsDir, f), 'utf-8');
      const json = JSON.parse(raw);
      return {
        id: i + 1,
        key: f.replace('.json', ''),
        ...json,
      };
    });
  } catch {
    return [];
  }
}

export const appRouter = router({
  system: systemRouter,
  webhooks: webhooksRouter,
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
      const dbAgents = await db.getAgents();
      const openclawAgents = await getLocalOpenClawAgents();

      const merged = [...dbAgents];
      for (const oa of openclawAgents) {
        const exists = merged.some((a: any) => String(a.name || "").toLowerCase() === String(oa.name).toLowerCase());
        if (!exists) merged.push(oa as any);
      }

      return merged;
    }),

    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgentById(input.id);
      }),

    presets: publicProcedure.query(async () => {
      return getAgentPresets();
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

    createFromPreset: protectedProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ input }) => {
        const preset = getAgentPresets().find((p: any) => p.key === input.key);
        if (!preset) throw new Error("Preset no encontrado");
        return await db.createAgent({
          name: preset.name,
          description: preset.description,
          avatar: preset.avatar,
          skills: preset.skills || [],
          maxCapacity: preset.maxCapacity || 10,
        });
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

    getDependencyGraph: publicProcedure
      .input(z.object({ sprintId: z.number() }))
      .query(async ({ input }) => {
        const tasksInSprint = await db.getTasks(input.sprintId);
        const allDeps = await db.getAllDependencies();
        
        const taskIds = new Set(tasksInSprint.map(t => t.id));
        const dependenciesInSprint = allDeps.filter(
          dep => taskIds.has(dep.taskId) && taskIds.has(dep.dependsOnTaskId)
        );

        return {
          tasks: tasksInSprint,
          dependencies: dependenciesInSprint,
        };
      }),

    getHealthMetrics: publicProcedure
      .input(z.object({ sprintId: z.number() }))
      .query(async ({ input }) => {
        const tasksInSprint = await db.getTasks(input.sprintId);
        const totalTasks = tasksInSprint.length;
        const completedTasks = tasksInSprint.filter(t => t.status === "done").length;
        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const skillDistribution: Record<string, number> = {};
        tasksInSprint.forEach(task => {
          (task.requiredSkills || []).forEach((skill: string) => {
            skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
          });
        });

        return {
          completionPercentage,
          totalTasks,
          completedTasks,
          skillDistribution: Object.entries(skillDistribution).map(([skill, count]) => ({ skill, count })),
        };
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
        const updatedTask = await db.getTaskById(input.taskId);
        eventEmitter.emit("taskUpdated", updatedTask);
        return { success: true };
      }),

    assignToAgent: protectedProcedure
      .input(z.object({ taskId: z.number(), agentId: z.number() }))
      .mutation(async ({ input }) => {
        await db.assignTaskToAgent(input.taskId, input.agentId);
        const agent = await db.getAgentById(input.agentId);
        if (agent) {
          await db.updateAgentWorkload(input.agentId, agent.currentWorkload + 1);
        }
        const assignedTask = await db.getTaskById(input.taskId);
        eventEmitter.emit("taskUpdated", assignedTask);
        return { success: true };
      }),

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
            skills: a.skills as string[],
            currentWorkload: a.currentWorkload,
            maxCapacity: a.maxCapacity,
            status: a.status as "available" | "busy" | "offline",
          })),
          task.requiredSkills as string[]
        );

        if (!bestAgent) throw new Error("No available agent with required skills");

        await db.assignTaskToAgent(input.taskId, bestAgent.id);
        await db.updateAgentWorkload(bestAgent.id, bestAgent.currentWorkload + 1);
        const assignedTask = await db.getTaskById(input.taskId);
        eventEmitter.emit("taskUpdated", assignedTask);
        return { agentId: bestAgent.id, agentName: bestAgent.name };
      }),

    serviceAutoAssign: serviceProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        const task = await db.getTaskById(input.taskId);
        if (!task) throw new Error("Task not found");

        const agents = await db.getAgents();
        const bestAgent = findBestAgent(
          agents.map(a => ({
            id: a.id,
            name: a.name,
            skills: a.skills as string[],
            currentWorkload: a.currentWorkload,
            maxCapacity: a.maxCapacity,
            status: a.status as "available" | "busy" | "offline",
          })),
          task.requiredSkills as string[]
        );

        if (!bestAgent) throw new Error("No available agent with required skills");

        await db.assignTaskToAgent(input.taskId, bestAgent.id);
        await db.updateAgentWorkload(bestAgent.id, bestAgent.currentWorkload + 1);
        const assignedTask = await db.getTaskById(input.taskId);
        eventEmitter.emit("taskUpdated", assignedTask);
        return { agentId: bestAgent.id, agentName: bestAgent.name };
      }),

    onUpdate: publicProcedure.subscription(() => {
      return observable<any>(emit => {
        const onTaskUpdate = (task: any) => {
          emit.next(task);
        };
        eventEmitter.on("taskUpdated", onTaskUpdate);
        return () => {
          eventEmitter.removeListener("taskUpdated", onTaskUpdate);
        };
      });
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
        const allDeps = await db.getAllDependencies();
        if (hasCyclicDependency(allDeps, input.taskId, input.dependsOnTaskId)) {
          throw new Error("Ciclo circular detectado. No se puede agregar la dependencia.");
        }
        return await db.createTaskDependency(input.taskId, input.dependsOnTaskId);
      }),

    delete: protectedProcedure
      .input(z.object({ taskId: z.number(), dependsOnTaskId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteDependency(input.taskId, input.dependsOnTaskId);
      }),
  }),

  // ==================== NOTIFICACIONES ====================
  notifications: notificationsRouter,

  // ==================== PROJECT OWNER ====================
  projectOwner: projectOwnerRouter,
});

export type AppRouter = typeof appRouter;
