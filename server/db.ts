import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, tasks, sprints, taskDependencies, taskHistory, notifications, Agent, Task, Sprint, TaskDependency } from "../drizzle/schema";
import { ENV } from './_core/env';
import { mockDb } from './db.mock';

let _db: ReturnType<typeof drizzle> | null = null;
let _useMock = false;

export async function getDb() {
  if (!_db && !_useMock) {
    console.log("[Database] Initializing connection...");
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes("user:pass@localhost")) {
      try {
        console.log("[Database] Connecting to DATABASE_URL...");
        const db = drizzle(dbUrl);
        await db.execute(sql`SELECT 1`);
        _db = db;
        console.log("[Database] Drizzle initialized.");
      } catch (error) {
        console.warn("[Database] Failed to connect, falling back to mock:", error);
        _useMock = true;
        _db = null;
      }
    } else {
      console.warn("[Database] No valid DATABASE_URL found, using mock database");
      _useMock = true;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    return mockDb.users.upsert(user);
  }

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
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return mockDb.users.find(openId);
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
  if (!db) return mockDb.agents.create(data) as any;

  return await db.insert(agents).values({
    name: data.name,
    description: data.description,
    avatar: data.avatar,
    skills: data.skills,
    maxCapacity: data.maxCapacity || 10,
    status: "available",
    currentWorkload: 0,
  });
}

export async function getAgents() {
  const db = await getDb();
  if (!db) return mockDb.agents.list().map(a => ({ ...a, skills: JSON.parse(a.skills || "[]") }));
  return await db.select().from(agents);
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) {
    const agent = mockDb.agents.get(id);
    return agent ? { ...agent, skills: JSON.parse(agent.skills || "[]") } : null;
  }
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAgentWorkload(agentId: number, workload: number) {
  const db = await getDb();
  if (!db) return mockDb.agents.updateWorkload(agentId, workload);
  await db.update(agents).set({ currentWorkload: workload }).where(eq(agents.id, agentId));
}

// ==================== SPRINTS ====================

export async function createSprint(data: {
  name: string;
  description?: string;
  plannedVelocity?: number;
}) {
  const db = await getDb();
  if (!db) return mockDb.sprints.create(data) as any;
  return await db.insert(sprints).values({
    name: data.name,
    description: data.description,
    plannedVelocity: data.plannedVelocity || 0,
    status: "planning",
  });
}

export async function getSprints() {
  const db = await getDb();
  if (!db) return mockDb.sprints.list();
  return await db.select().from(sprints).orderBy(desc(sprints.createdAt));
}

export async function getSprintById(id: number) {
  const db = await getDb();
  if (!db) return mockDb.sprints.get(id) || null;
  const result = await db.select().from(sprints).where(eq(sprints.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSprintStatus(sprintId: number, status: string) {
  const db = await getDb();
  if (!db) return mockDb.sprints.updateStatus(sprintId, status);
  await db.update(sprints).set({ status: status as any }).where(eq(sprints.id, sprintId));
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
  if (!db) return mockDb.tasks.create(data) as any;
  return await db.insert(tasks).values({
    sprintId: data.sprintId,
    title: data.title,
    description: data.description,
    priority: data.priority || "medium",
    requiredSkills: data.requiredSkills,
    estimationHours: data.estimationHours,
    acceptanceCriteria: data.acceptanceCriteria || [],
    status: "todo",
  });
}

export async function getTasks(sprintId?: number) {
  const db = await getDb();
  if (!db) return mockDb.tasks.list(sprintId).map(t => ({ ...t, requiredSkills: JSON.parse(t.requiredSkills || "[]"), acceptanceCriteria: JSON.parse(t.acceptanceCriteria || "[]") }));
  
  let query = db.select().from(tasks);
  if (sprintId) query = query.where(eq(tasks.sprintId, sprintId)) as any;
  return await query.orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) {
    const task = mockDb.tasks.get(id);
    return task ? { ...task, requiredSkills: JSON.parse(task.requiredSkills || "[]"), acceptanceCriteria: JSON.parse(task.acceptanceCriteria || "[]") } : null;
  }
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateTaskStatus(taskId: number, status: string, agentId?: number) {
  const db = await getDb();
  if (!db) return mockDb.tasks.updateStatus(taskId, status);

  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const completedAt = status === "done" ? new Date() : null;
  await db.update(tasks).set({ status, completedAt }).where(eq(tasks.id, taskId));

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
  if (!db) return mockDb.tasks.assign(taskId, agentId);
  await db.update(tasks).set({ assignedAgentId: agentId }).where(eq(tasks.id, taskId));
}

// ==================== DEPENDENCIAS ====================

export async function createTaskDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  if (!db) return mockDb.dependencies.create(taskId, dependsOnTaskId) as any;
  return await db.insert(taskDependencies).values({ taskId, dependsOnTaskId });
}

export async function getTaskDependencies(taskId: number) {
  const db = await getDb();
  if (!db) return mockDb.dependencies.list(taskId);
  return await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
}

export async function getAllDependencies() {
  const db = await getDb();
  if (!db) return mockDb.dependencies.list();
  return await db.select().from(taskDependencies);
}

export async function getBlockingTasks(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  const deps = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
  if (deps.length === 0) return [];
  const blockingIds = deps.map(d => d.dependsOnTaskId);
  return await db.select().from(tasks).where(inArray(tasks.id, blockingIds));
}

export async function deleteDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  if (!db) return;
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
  if (!db) return;
  return await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId,
    sprintId: data.sprintId,
  });
}

export async function getNotifications(userId: number, unreadOnly?: boolean, includeArchived?: boolean, type?: string) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.read, false));
  if (!includeArchived) conditions.push(eq(notifications.archived, false));
  if (type) conditions.push(eq(notifications.type, type as any));

  return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function markNotificationsAsRead(ids: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ read: true }).where(inArray(notifications.id, ids));
}

export async function archiveNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ archived: true }).where(eq(notifications.id, id));
}

export async function archiveNotifications(ids: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ archived: true }).where(inArray(notifications.id, ids));
}

export async function getNotificationsByType(userId: number, type: string) {
  return await getNotifications(userId, false, false, type);
}
