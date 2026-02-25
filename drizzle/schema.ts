import { serial, integer, pgEnum, pgTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/pg-core";

// Define enums for PostgreSQL
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const agentStatusEnum = pgEnum("agent_status", ["available", "busy", "offline"]);
export const sprintStatusEnum = pgEnum("sprint_status", ["planning", "active", "review", "retrospective", "closed"]);
export const taskStatusEnum = pgEnum("task_status", ["backlog", "in_progress", "review", "qa", "done"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high", "critical"]);
export const notificationTypeEnum = pgEnum("notification_type", ["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow() is removed
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
  avatar: varchar("avatar", { length: 512 }),
  skills: text("skills").notNull(), // JSON stringified
  status: agentStatusEnum("status").default("available").notNull(),
  currentWorkload: integer("currentWorkload").default(0).notNull(),
  maxCapacity: integer("maxCapacity").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow() is removed
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow() is removed
});

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = typeof sprints.$inferInsert;

/**
 * Tareas SCRUM con metadatos completos
 */
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  sprintId: integer("sprintId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("backlog").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  requiredSkills: text("requiredSkills").notNull(), // JSON stringified
  estimationHours: decimal("estimationHours", { precision: 5, scale: 2 }),
  assignedAgentId: integer("assignedAgentId"),
  acceptanceCriteria: text("acceptanceCriteria").notNull(), // JSON stringified
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(), // onUpdateNow() is removed
  completedAt: timestamp("completedAt"),
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
