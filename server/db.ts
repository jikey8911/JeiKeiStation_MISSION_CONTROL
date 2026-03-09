import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool, Pool } from "mysql2/promise";
import { InsertUser, users, agents, tasks, sprints, taskDependencies, taskHistory, notifications } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

export async function getDb() {
  if (_db) return _db;

  if (!ENV.databaseUrl) {
    console.warn("[Database] No DATABASE_URL found. Running in Mock Mode.");
    return null;
  }

  try {
    console.log("[Database] Attempting to connect to the database...");
    _pool = createPool({ uri: ENV.databaseUrl });
    _db = drizzle(_pool);
    
    await _pool.query("SELECT 1");
    console.log("[Database] Connection successful!");
    return _db;
  } catch (error) {
    console.error("[Database] CRITICAL: Failed to connect to the database.", error);
    _db = null;
    _pool = null;
    return null;
  }
}

// ==================== USUARIOS ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, any> = {};

    ["name", "email", "loginMethod"].forEach(field => {
      if ((user as any)[field] !== undefined) {
        (values as any)[field] = (user as any)[field] ?? null;
        updateSet[field] = (user as any)[field] ?? null;
      }
    });

    if (user.lastSignedIn) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[DB:upsertUser] Error:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB:getUserByOpenId] Error:", error);
    return null;
  }
}

// ==================== AGENTES ====================

export async function createAgent(data: any) {
  const db = await getDb();
  if (!db) return { id: Date.now(), ...data };
  try {
    const [result] = await db.insert(agents).values({
      ...data,
      status: "available",
      currentWorkload: 0,
    });
    return { id: (result as any).insertId, ...data };
  } catch (error) {
    console.error("[DB:createAgent] Error:", error);
    return null;
  }
}

export async function getAgents() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(agents);
  } catch (error) {
    console.error("[DB:getAgents] Error:", error);
    return [];
  }
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB:getAgentById] Error:", error);
    return null;
  }
}

export async function updateAgentWorkload(agentId: number, workload: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(agents).set({ currentWorkload: workload }).where(eq(agents.id, agentId));
  } catch (error) {
    console.error("[DB:updateAgentWorkload] Error:", error);
  }
}

// ==================== SPRINTS ====================

export async function createSprint(data: any) {
  const db = await getDb();
  if (!db) return { id: Date.now(), ...data };
  try {
    const [result] = await db.insert(sprints).values({
      ...data,
      status: "planning",
    });
    return { id: (result as any).insertId, ...data };
  } catch (error) {
    console.error("[DB:createSprint] Error:", error);
    return null;
  }
}

export async function getSprints() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(sprints).orderBy(desc(sprints.createdAt));
  } catch (error) {
    console.error("[DB:getSprints] Error:", error);
    return [];
  }
}

export async function getSprintById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(sprints).where(eq(sprints.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB:getSprintById] Error:", error);
    return null;
  }
}

export async function updateSprintStatus(sprintId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(sprints).set({ status: status as any }).where(eq(sprints.id, sprintId));
  } catch (error) {
    console.error("[DB:updateSprintStatus] Error:", error);
  }
}

// ==================== TAREAS ====================

export async function createTask(data: any) {
  const db = await getDb();
  if (!db) return { id: Date.now(), ...data };
  try {
    const [result] = await db.insert(tasks).values({
      ...data,
      status: "todo",
    });
    return { id: (result as any).insertId, ...data };
  } catch (error) {
    console.error("[DB:createTask] Error:", error);
    return null;
  }
}

export async function getTasks(sprintId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    let query = db.select().from(tasks);
    if (sprintId) query = query.where(eq(tasks.sprintId, sprintId)) as any;
    return await query.orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error("[DB:getTasks] Error:", error);
    return [];
  }
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB:getTaskById] Error:", error);
    return null;
  }
}

export async function updateTaskStatus(taskId: number, status: string, agentId?: number) {
  const db = await getDb();
  if (!db) return;
  try {
    const task = await getTaskById(taskId);
    if (!task) return;
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
  } catch (error) {
    console.error("[DB:updateTaskStatus] Error:", error);
  }
}

export async function assignTaskToAgent(taskId: number, agentId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(tasks).set({ assignedAgentId: agentId }).where(eq(tasks.id, taskId));
  } catch (error) {
    console.error("[DB:assignTaskToAgent] Error:", error);
  }
}

// ==================== DEPENDENCIAS ====================

export async function createTaskDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(taskDependencies).values({ taskId, dependsOnTaskId });
  } catch (error) {
    console.error("[DB:createTaskDependency] Error:", error);
  }
}

export async function getTaskDependencies(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
  } catch (error) {
    console.error("[DB:getTaskDependencies] Error:", error);
    return [];
  }
}

export async function getAllDependencies() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(taskDependencies);
  } catch (error) {
    console.error("[DB:getAllDependencies] Error:", error);
    return [];
  }
}

export async function getBlockingTasks(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const deps = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
    if (deps.length === 0) return [];
    const blockingIds = deps.map(d => d.dependsOnTaskId);
    return await db.select().from(tasks).where(inArray(tasks.id, blockingIds));
  } catch (error) {
    console.error("[DB:getBlockingTasks] Error:", error);
    return [];
  }
}

export async function deleteDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.delete(taskDependencies).where(and(eq(taskDependencies.taskId, taskId), eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)));
  } catch (error) {
    console.error("[DB:deleteDependency] Error:", error);
  }
}

// ==================== NOTIFICACIONES ====================

export async function createNotification(data: any) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error("[DB:createNotification] Error:", error);
  }
}

export async function getNotifications(userId: number, unreadOnly?: boolean, includeArchived?: boolean, type?: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    let conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) conditions.push(eq(notifications.read, false));
    if (!includeArchived) conditions.push(eq(notifications.archived, false));
    if (type) conditions.push(eq(notifications.type, type as any));
    return await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("[DB:getNotifications] Error:", error);
    return [];
  }
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  } catch (error) {
    console.error("[DB:markNotificationAsRead] Error:", error);
  }
}

export async function markNotificationsAsRead(ids: number[]) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ read: true }).where(inArray(notifications.id, ids));
  } catch (error) {
    console.error("[DB:markNotificationsAsRead] Error:", error);
  }
}

export async function archiveNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ archived: true }).where(eq(notifications.id, id));
  } catch (error) {
    console.error("[DB:archiveNotification] Error:", error);
  }
}

export async function archiveNotifications(ids: number[]) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ archived: true }).where(inArray(notifications.id, ids));
  } catch (error) {
    console.error("[DB:archiveNotifications] Error:", error);
  }
}
