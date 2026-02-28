import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  InsertUser, users, agents, tasks, sprints, taskDependencies, taskHistory, notifications
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;

// ENV mockup for role assignment
const ENV = {
  ownerOpenId: process.env.OWNER_OPENID || "dev_user_id"
};

export async function getDb() {
  if (!_db) {
    console.log("[Database] Initializing connection pool...");
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        console.log("[Database] Connecting to PostgreSQL...");
        _pool = new pg.Pool({
          connectionString: dbUrl,
        });

        const db = drizzle(_pool);
        // Test connection
        await db.execute(sql`SELECT 1`);
        _db = db;
        console.log("[Database] Drizzle initialized with PostgreSQL.");
      } catch (error) {
        console.error("[Database] Failed to connect to PostgreSQL:", error);
        throw error;
      }
    } else {
      throw new Error("[Database] No valid DATABASE_URL found");
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
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL uses onConflictDoUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet as any,
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

  // En PostgreSQL skills es text (JSON stringified) o podría ser jsonb.
  // En el esquema lo dejé como text para mantener compatibilidad con la lógica actual de stringify,
  // pero lo ideal sería jsonb. Vamos a mantener text por ahora como estaba en MySQL pero ajustado.
  const result = await db.insert(agents).values({
    name: data.name,
    description: data.description,
    avatar: data.avatar,
    skills: JSON.stringify(data.skills),
    maxCapacity: data.maxCapacity || 10,
    status: "available",
    currentWorkload: 0,
  }).returning();

  return result;
}

export async function getAgents() {
  const db = await getDb();

  const result = await db.select().from(agents);
  return result.map(agent => ({
    ...agent,
    skills: JSON.parse(agent.skills || "[]") as string[],
  }));
}

export async function getAgentById(id: number) {
  const db = await getDb();

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  if (result.length === 0) return null;

  return {
    ...result[0],
    skills: JSON.parse(result[0].skills || "[]") as string[],
  };
}

export async function updateAgentWorkload(agentId: number, workload: number) {
  const db = await getDb();

  await db.update(agents).set({ currentWorkload: workload }).where(eq(agents.id, agentId));
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

  return result;
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

  const result = await db.insert(tasks).values({
    sprintId: data.sprintId,
    title: data.title,
    description: data.description,
    priority: data.priority || "medium",
    requiredSkills: data.requiredSkills,
    estimationHours: data.estimationHours,
    acceptanceCriteria: data.acceptanceCriteria || [],
    status: "backlog",
  }).returning();

  return result;
}

export async function getTasks(sprintId?: number) {
  const db = await getDb();

  let query = db.select().from(tasks);
  if (sprintId) {
    query = query.where(eq(tasks.sprintId, sprintId)) as any;
  }

  const result = await query.orderBy(desc(tasks.createdAt));
  return result.map(task => ({
    ...task,
    requiredSkills: (task.requiredSkills || []) as string[],
    acceptanceCriteria: (task.acceptanceCriteria || []) as string[],
  }));
}

export async function getTaskById(id: number) {
  const db = await getDb();

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (result.length === 0) return null;

  return {
    ...result[0],
    requiredSkills: (result[0].requiredSkills || []) as string[],
    acceptanceCriteria: (result[0].acceptanceCriteria || []) as string[],
  };
}

export async function updateTaskStatus(taskId: number, status: string, agentId?: number) {
  const db = await getDb();

  const task = await getTaskById(taskId);
  if (!task) throw new Error("Task not found");

  const completedAt = status === "done" ? new Date() : null;

  await db.update(tasks).set({
    status: status as any,
    completedAt: completedAt,
  }).where(eq(tasks.id, taskId));

  // Registrar en historial
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

  await db.update(tasks).set({ assignedAgentId: agentId }).where(eq(tasks.id, taskId));
}

// ==================== DEPENDENCIAS ====================

export async function createTaskDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();

  return await db.insert(taskDependencies).values({
    taskId,
    dependsOnTaskId,
  }).returning();
}

export async function getTaskDependencies(taskId: number) {
  const db = await getDb();

  return await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
}

export async function getAllDependencies() {
  const db = await getDb();

  return await db.select().from(taskDependencies);
}

export async function deleteDependency(taskId: number, dependsOnTaskId: number) {
  const db = await getDb();

  return await db.delete(taskDependencies).where(
    and(
      eq(taskDependencies.taskId, taskId),
      eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
    )
  );
}

export async function getBlockingTasks(taskId: number) {
  const db = await getDb();

  const deps = await db.select().from(taskDependencies).where(eq(taskDependencies.taskId, taskId));
  const blockingTaskIds = deps.map(d => d.dependsOnTaskId);

  if (blockingTaskIds.length === 0) return [];

  const result = await db.select().from(tasks).where(inArray(tasks.id, blockingTaskIds));
  return result.map(task => ({
    ...task,
    requiredSkills: (task.requiredSkills || []) as string[],
    acceptanceCriteria: (task.acceptanceCriteria || []) as string[],
  }));
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

  return await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId,
    sprintId: data.sprintId,
    read: false,
  }).returning();
}

export async function getNotifications(userId: number, unreadOnly = false, notArchived = false, type?: string) {
  const db = await getDb();

  const conditions: any[] = [eq(notifications.userId, userId)];

  if (unreadOnly) {
    conditions.push(eq(notifications.read, false));
  }

  if (notArchived) {
    conditions.push(eq(notifications.archived, false));
  }

  if (type) {
    conditions.push(eq(notifications.type, type as any));
  }

  return await db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();

  return await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

export async function markNotificationsAsRead(notificationIds: number[]) {
  const db = await getDb();

  if (notificationIds.length === 0) return;

  return await db.update(notifications)
    .set({ read: true })
    .where(inArray(notifications.id, notificationIds));
}

export async function archiveNotification(notificationId: number) {
  const db = await getDb();

  return await db.update(notifications)
    .set({ archived: true })
    .where(eq(notifications.id, notificationId));
}

export async function archiveNotifications(notificationIds: number[]) {
  const db = await getDb();

  if (notificationIds.length === 0) return;

  return await db.update(notifications)
    .set({ archived: true })
    .where(inArray(notifications.id, notificationIds));
}

export async function getNotificationsByType(userId: number, type: string) {
  const db = await getDb();

  return await db.select().from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.type, type as any), eq(notifications.archived, false)))
    .orderBy(desc(notifications.createdAt));
}
