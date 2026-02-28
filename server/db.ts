import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser, users, agents, tasks, sprints,
  taskDependencies, taskHistory, notifications,
  Agent, Task, Sprint, TaskDependency
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    console.log("[Database] Initializing connection...");
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        console.log("[Database] Connecting to PostgreSQL...");
        const pool = new pg.Pool({
          connectionString: dbUrl,
        });
        const db = drizzle(pool);
        // Test connection
        await pool.query('SELECT 1');
        _db = db;
        console.log("[Database] Drizzle initialized with PostgreSQL.");
      } catch (error) {
        console.error("[Database] Failed to connect to PostgreSQL:", error);
        throw error; // No fallback to mock
      }
    } else {
      throw new Error("DATABASE_URL not found");
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach(field => {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    updateSet.updatedAt = new Date(); // Manual update for Postgres

    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== AGENTES ====================

export async function createAgent(data: {
  name: string;
  description?: string;
  avatar?: string;
  skills: string[];
  maxCapacity?: number;
}) {
  const db = await getDb();

  const result = await db.insert(agents).values({
    name: data.name,
    description: data.description,
    avatar: data.avatar,
    skills: data.skills,
    maxCapacity: data.maxCapacity || 10,
    status: "available",
    currentWorkload: 0,
  }).returning();

  return result[0];
}

export async function getAgents() {
  const db = await getDb();
  return await db.select().from(agents);
}

export async function getAgentById(id: number) {
  const db = await getDb();
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAgentWorkload(agentId: number, workload: number) {
  const db = await getDb();
  await db.update(agents).set({
    currentWorkload: workload,
    updatedAt: new Date()
  }).where(eq(agents.id, agentId));
}

// ==================== SPRINTS ====================

export async function createSprint(data: {
  name: string;
  description?: string;
  plannedVelocity?: number;
}) {
  const db = await getDb();
  const result = await db.insert(sprints).values({
    name: data.name,
    description: data.description,
    plannedVelocity: data.plannedVelocity || 0,
    status: "planning",
  }).returning();

  return result[0];
}

export async function getSprints() {
  const db = await getDb();
  return await db.select().from(sprints).orderBy(desc(sprints.createdAt));
}

export async function getSprintById(id: number) {
  const db = await getDb();
  const result = await db.select().from(sprints).where(eq(sprints.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSprintStatus(sprintId: number, status: string) {
  const db = await getDb();
  await db.update(sprints).set({
    status: status as any,
    updatedAt: new Date()
  }).where(eq(sprints.id, sprintId));
}

// ==================== TAREAS ====================

export async function createTask(data: {
  sprintId?: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
  requiredSkills: string[];
  estimationHours?: number;
  acceptanceCriteria?: string[];
}) {
  const db = await getDb();
  const result = await db.insert(tasks).values({
    sprintId: data.sprintId,
    title: data.title,
    description: data.description,
    priority: data.priority || "medium",
    requiredSkills: data.requiredSkills,
    estimationHours: data.estimationHours,
    acceptanceCriteria: data.acceptanceCriteria || [],
    status: "todo",
  }).returning();

  return result[0];
}

export async function getTasks(sprintId?: number) {
  const db = await getDb();
  
  if (sprintId) {
    return await db.select().from(tasks).where(eq(tasks.sprintId, sprintId)).orderBy(desc(tasks.createdAt));
  }
  return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTaskStatus(taskId: number, status: string, agentId?: number) {
  const db = await getDb();

  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const completedAt = status === "done" ? new Date() : null;
  await db.update(tasks).set({
    status,
    completedAt,
    updatedAt: new Date()
  }).where(eq(tasks.id, taskId));

  if (agentId) {
    await db.insert(taskHistory).values({
      taskId,
      fromStatus: task.status,
      toStatus: status,
      agentId,
    });
  }
}

export async function assignTaskToAgent(taskId: number, agentId: number) {
  const db = await getDb();
  await db.update(tasks).set({
    assignedAgentId: agentId,
    updatedAt: new Date()
  }).where(eq(tasks.id, taskId));
}

// ==================== DEPENDENCIAS ====================

export async function createTaskDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  const result = await db.insert(taskDependencies).values({ taskId, dependsOnTaskId }).returning();
  return result[0];
}

export async function getTaskDependencies(taskId: number) {
  const db = await getDb();
  return await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
}

export async function getAllDependencies() {
  const db = await getDb();
  return await db.select().from(taskDependencies);
}

export async function getBlockingTasks(taskId: number) {
  const db = await getDb();
  const deps = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
  if (deps.length === 0) return [];
  const blockingIds = deps.map(d => d.dependsOnTaskId);
  return await db.select().from(tasks).where(inArray(tasks.id, blockingIds));
}

export async function deleteDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  await db.delete(taskDependencies).where(and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)));
}

// ==================== NOTIFICACIONES ====================

export async function createNotification(data: {
  userId: number;
  type: "approval_pending" | "task_blocked" | "qa_completed" | "sprint_closed" | "task_assigned";
  title: string;
  message?: string;
  taskId?: number;
  sprintId?: number;
}) {
  const db = await getDb();
  const result = await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId,
    sprintId: data.sprintId,
  }).returning();

  return result[0];
}

export async function getNotifications(userId: number, unreadOnly?: boolean, includeArchived?: boolean, type?: string) {
  const db = await getDb();
  
  let conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.read, false));
  if (!includeArchived) conditions.push(eq(notifications.archived, false));
  if (type) conditions.push(eq(notifications.type, type as any));

  return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  const result = await db.update(notifications).set({ read: true }).where(eq(notifications.id, id)).returning();
  return result[0];
}

export async function markNotificationsAsRead(ids: number[]) {
  const db = await getDb();
  if (ids.length === 0) return undefined;
  const result = await db.update(notifications).set({ read: true }).where(inArray(notifications.id, ids)).returning();
  return result;
}

export async function archiveNotification(id: number) {
  const db = await getDb();
  const result = await db.update(notifications).set({ archived: true }).where(eq(notifications.id, id)).returning();
  return result[0];
}

export async function archiveNotifications(ids: number[]) {
  const db = await getDb();
  if (ids.length === 0) return undefined;
  const result = await db.update(notifications).set({ archived: true }).where(inArray(notifications.id, ids)).returning();
  return result;
}

export async function getNotificationsByType(userId: number, type: string) {
  return await getNotifications(userId, false, false, type);
}
