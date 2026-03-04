import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, serial, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
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
  avatar: varchar("avatar", { length: 512 }),
  skills: json("skills").notNull(), // Cambiado a json real para MySQL
  status: mysqlEnum("status", ["available", "busy", "offline"]).default("available").notNull(),
  currentWorkload: int("current_workload").default(0).notNull(),
  maxCapacity: int("max_capacity").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
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
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  plannedVelocity: int("planned_velocity").default(0),
  actualVelocity: int("actual_velocity").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
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
export const taskDependencies = mysqlTable("task_dependencies", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("task_id").notNull(),
  dependsOnTaskId: int("depends_on_task_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Historial de transiciones de tareas para auditoría
 */
export const taskHistory = mysqlTable("task_history", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("task_id").notNull(),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  agentId: int("agent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;

/**
 * Notificaciones del sistema
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["approval_pending", "task_blocked", "qa_completed", "sprint_closed", "task_assigned"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  taskId: int("task_id"),
  sprintId: int("sprint_id"),
  read: boolean("read").default(false).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
