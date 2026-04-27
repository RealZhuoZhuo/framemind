import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull().default("未命名"),
    script: text("script").notNull().default(""),
    videoMode: text("video_mode"),   // 'drama' | 'narration' | 'talking-head'
    aspectRatio: text("aspect_ratio"), // '16:9' | '9:16' | '1:1'
    visualStyle: text("visual_style"), // 'realistic' | '3d-animation' | 'japanese-anime'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("projects_updated_at_idx").on(table.updatedAt)]
);

export const projectSteps = pgTable(
  "project_steps",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    stepKey: text("step_key").notNull(), // 'script' | 'assets' | 'storyboard' | 'video'
    completed: boolean("completed").notNull().default(false),
    content: text("content").notNull().default(""),
  },
  (table) => [
    unique("project_steps_unique_project_step").on(table.projectId, table.stepKey),
    index("project_steps_project_id_idx").on(table.projectId),
  ]
);

export const projectAssets = pgTable(
  "project_assets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    name: text("name").notNull(),
    appearance: text("appearance").notNull().default(""),
    description: text("description").notNull().default(""),
    mediaUrl: text("media_url"),
  },
  (table) => [
    index("project_assets_project_id_idx").on(table.projectId),
    index("project_assets_project_id_type_idx").on(table.projectId, table.type),
  ]
);

export const shots = pgTable(
  "shots",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    shotNumber: integer("shot_number").notNull(),
    sceneType: text("scene_type").notNull().default(""),
    shotDescription: text("shot_description").notNull().default(""),
    dialogueSpeaker: text("dialogue_speaker").notNull().default(""),
    dialogue: text("dialogue").notNull().default(""),
    characterAction: text("character_action").notNull().default(""),
    lightingMood: text("lighting_mood").notNull().default(""),
    mediaUrl: text("media_url"),
  },
  (table) => [
    index("shots_project_id_idx").on(table.projectId),
    index("shots_project_id_shot_number_idx").on(table.projectId, table.shotNumber),
  ]
);

export const shotAssets = pgTable(
  "shot_assets",
  {
    shotId: uuid("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => projectAssets.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("shot_assets_unique_shot_asset").on(table.shotId, table.assetId),
    index("shot_assets_shot_id_idx").on(table.shotId),
    index("shot_assets_asset_id_idx").on(table.assetId),
  ]
);

export const shotDialogueSpeakers = pgTable(
  "shot_dialogue_speakers",
  {
    shotId: uuid("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => projectAssets.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("shot_dialogue_speakers_unique_shot_asset").on(table.shotId, table.assetId),
    index("shot_dialogue_speakers_shot_id_idx").on(table.shotId),
    index("shot_dialogue_speakers_asset_id_idx").on(table.assetId),
  ]
);

export const videoClips = pgTable(
  "video_clips",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clipType: text("clip_type").notNull(), // 'video' | 'subtitle' | 'audio'
    startSec: real("start_sec").notNull(),
    endSec: real("end_sec").notNull(),
    label: text("label").notNull().default(""),
    mediaUrl: text("media_url"),
    subtitleText: text("subtitle_text"),
    sourceShotId: uuid("source_shot_id").references(() => shots.id, { onDelete: "set null" }),
  },
  (table) => [
    index("video_clips_project_id_idx").on(table.projectId),
    index("video_clips_source_shot_id_idx").on(table.sourceShotId),
    unique("video_clips_unique_project_source_shot_type").on(table.projectId, table.sourceShotId, table.clipType),
  ]
);

export const videoGenerationTasks = pgTable(
  "video_generation_tasks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    shotId: uuid("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    providerTaskId: text("provider_task_id").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    status: text("status").notNull().default("queued"),
    prompt: text("prompt").notNull().default(""),
    videoUrl: text("video_url"),
    mediaUrl: text("media_url"),
    lastFrameUrl: text("last_frame_url"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("video_generation_tasks_provider_task_id_unique").on(table.providerTaskId),
    index("video_generation_tasks_project_id_idx").on(table.projectId),
    index("video_generation_tasks_project_status_idx").on(table.projectId, table.status),
    index("video_generation_tasks_shot_id_idx").on(table.shotId),
  ]
);
