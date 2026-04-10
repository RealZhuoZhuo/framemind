import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("未命名"),
  gradient: text("gradient").notNull(),
  videoMode: text("video_mode"),   // 'drama' | 'narration' | 'talking-head'
  aspectRatio: text("aspect_ratio"), // '16:9' | '9:16' | '1:1'
  visualStyle: text("visual_style"), // 'realistic' | '3d-animation' | 'japanese-anime'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectSteps = pgTable(
  "project_steps",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    stepKey: text("step_key").notNull(), // 'script' | 'character' | 'storyboard' | 'video'
    completed: boolean("completed").notNull().default(false),
    content: text("content").notNull().default(""),
  },
  (table) => [
    unique("project_steps_unique_project_step").on(table.projectId, table.stepKey),
  ]
);

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  appearance: text("appearance").notNull().default(""),
  clothing: text("clothing").notNull().default(""),
  description: text("description").notNull().default(""),
  mediaUrl: text("media_url"),
});

export const shots = pgTable("shots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  shotNumber: integer("shot_number").notNull(),
  description: text("description").notNull().default(""),
  sceneType: text("scene_type").notNull().default(""),
  cameraAngle: text("camera_angle").notNull().default(""),
  narration: text("narration").notNull().default(""),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "set null" }),
  dialogue: text("dialogue").notNull().default(""),
  notes: text("notes").notNull().default(""),
  mediaGenerated: boolean("media_generated").notNull().default(false),
  mediaUrl: text("media_url"),
});

export const videoClips = pgTable("video_clips", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  clipType: text("clip_type").notNull(), // 'video' | 'subtitle' | 'audio'
  startSec: real("start_sec").notNull(),
  endSec: real("end_sec").notNull(),
  label: text("label").notNull().default(""),
  url: text("url"),
  subtitleText: text("subtitle_text"),
});
