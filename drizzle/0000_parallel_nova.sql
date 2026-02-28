CREATE TYPE "public"."agent_status" AS ENUM('available', 'busy', 'offline');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('approval_pending', 'task_blocked', 'qa_completed', 'sprint_closed', 'task_assigned');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sprint_status" AS ENUM('planning', 'active', 'review', 'retrospective', 'closed');--> statement-breakpoint
CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"avatar" varchar(512),
	"skills" text NOT NULL,
	"status" "agent_status" DEFAULT 'available' NOT NULL,
	"currentWorkload" integer DEFAULT 0 NOT NULL,
	"maxCapacity" integer DEFAULT 10 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text,
	"taskId" integer,
	"sprintId" integer,
	"read" boolean DEFAULT false NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "sprint_status" DEFAULT 'planning' NOT NULL,
	"startDate" timestamp,
	"endDate" timestamp,
	"plannedVelocity" integer DEFAULT 0,
	"actualVelocity" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taskDependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"dependsOnTaskId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taskHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"fromStatus" varchar(50),
	"toStatus" varchar(50) NOT NULL,
	"agentId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"sprint_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'todo',
	"priority" varchar(50) DEFAULT 'medium',
	"required_skills" jsonb,
	"estimation_hours" integer,
	"assigned_agent_id" integer,
	"acceptance_criteria" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
