import { pgTable, serial, text, varchar, timestamp, pgEnum, boolean, integer, jsonb } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agentes AI con perfiles de habilidades
 */
export const agentStatusEnum = pgEnum("agent_status", ["available", "busy", "offline"]);

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatar: varchar("avatar", { length: 512 }),
  skills: jsonb("skills").notNull(),
  status: agentStatusEnum("status").default("available").notNull(),
  currentWorkload: integer("current_workload").default(0).notNull(),
  maxCapacity: integer("max_capacity").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Sprints SCRUM
 */
export const sprintStatusEnum = pgEnum("sprint_status", ["planning", "active", "review", "retrospective", "closed"]);

export const sprints = pgTable("sprints", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: sprintStatusEnum("status").default("planning").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plannedVelocity: integer("planned_velocity").default(0),
  actualVelocity: integer("actual_velocity").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const taskDependencies = pgTable("task_dependencies", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  dependsOnTaskId: integer("depends_on_task_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Historial de transiciones de tareas para auditoría
 */
export const taskHistory = pgTable("task_history", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  agentId: integer("agent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;

/**
 * Notificaciones del sistema
 */
export const notificationTypeEnum = pgEnum("notification_type", ["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  taskId: integer("task_id"),
  sprintId: integer("sprint_id"),
  read: boolean("read").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
