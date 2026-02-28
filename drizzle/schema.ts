import { pgTable, text, timestamp, varchar, boolean, integer, serial, pgEnum, jsonb } from "drizzle-orm/pg-core";

/**
 * Enums para PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const agentStatusEnum = pgEnum("agent_status", ["available", "busy", "offline"]);
export const sprintStatusEnum = pgEnum("sprint_status", ["planning", "active", "review", "retrospective", "closed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // PostgreSQL doesn't have onUpdateNow out of the box like MySQL
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agentes AI con perfiles de habilidades
 */
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatar: varchar("avatar", { length: 512 }), // URL del avatar
  skills: text("skills").notNull(), // JSON stringified: ["FRONTEND", "BACKEND", "QA", "DISEÑO", "ANÁLISIS", "DB"]
  status: agentStatusEnum("status").default("available").notNull(),
  currentWorkload: integer("currentWorkload").default(0).notNull(), // Número de tareas asignadas
  maxCapacity: integer("maxCapacity").default(10).notNull(), // Máximo de tareas simultáneas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Sprints SCRUM
 */
export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: sprintStatusEnum("status").default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  plannedVelocity: integer("plannedVelocity").default(0),
  actualVelocity: integer("actualVelocity").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = typeof sprints.$inferInsert;

/**
 * Tareas SCRUM con metadatos completos
 */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprint_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("todo"),
  priority: varchar("priority", { length: 50 }).default("medium"),
  requiredSkills: jsonb("required_skills"),
  estimationHours: integer("estimation_hours"),
  assignedAgentId: integer("assigned_agent_id"),
  acceptanceCriteria: jsonb("acceptance_criteria"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Dependencias entre tareas
 */
export const taskDependencies = pgTable("taskDependencies", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  dependsOnTaskId: integer("dependsOnTaskId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Historial de transiciones de tareas para auditoría
 */
export const taskHistory = pgTable("taskHistory", {
  id: serial("id").primaryKey(),
  taskId: integer("taskId").notNull(),
  fromStatus: varchar("fromStatus", { length: 50 }),
  toStatus: varchar("toStatus", { length: 50 }).notNull(),
  agentId: integer("agentId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;

/**
 * Notificaciones del sistema
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  taskId: integer("taskId"),
  sprintId: integer("sprintId"),
  read: boolean("read").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
