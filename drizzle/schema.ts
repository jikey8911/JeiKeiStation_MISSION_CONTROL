import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, serial, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agentes AI con perfiles de habilidades
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatar: varchar("avatar", { length: 512 }), // URL del avatar
  skills: text("skills").notNull(), // JSON stringified: ["FRONTEND", "BACKEND", "QA", "DISEÑO", "ANÁLISIS", "DB"]
  status: mysqlEnum("status", ["available", "busy", "offline"]).default("available").notNull(),
  currentWorkload: int("currentWorkload").default(0).notNull(), // Número de tareas asignadas
  maxCapacity: int("maxCapacity").default(10).notNull(), // Máximo de tareas simultáneas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Sprints SCRUM
 */
export const sprints = mysqlTable("sprints", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planning", "active", "review", "retrospective", "closed"]).default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  plannedVelocity: int("plannedVelocity").default(0),
  actualVelocity: int("actualVelocity").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = typeof sprints.$inferInsert;

/**
 * Tareas SCRUM con metadatos completos
 */
export const tasks = mysqlTable("tasks", {
  id: serial("id").primaryKey(),
  sprintId: int("sprint_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("todo"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  requiredSkills: json("required_skills"),
  estimationHours: int("estimation_hours"),
  assignedAgentId: int("assigned_agent_id"),
  acceptanceCriteria: json("acceptance_criteria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  completedAt: timestamp("completed_at"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Dependencias entre tareas
 */
export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  dependsOnTaskId: int("dependsOnTaskId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Historial de transiciones de tareas para auditoría
 */
export const taskHistory = mysqlTable("taskHistory", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  fromStatus: varchar("fromStatus", { length: 50 }),
  toStatus: varchar("toStatus", { length: 50 }).notNull(),
  agentId: int("agentId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;

/**
 * Notificaciones del sistema
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  taskId: int("taskId"),
  sprintId: int("sprintId"),
  read: boolean("read").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
