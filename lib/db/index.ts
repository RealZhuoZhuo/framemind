import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pgPool: postgres.Sql | undefined;
  var __pgPoolConnectionString: string | undefined;
  var __dbSchemaReady: Promise<void> | undefined;
}

const DEFAULT_DB_URL = "postgresql://framemind:framemind@127.0.0.1:5432/framemind";
const DEV_DB_URL = process.env.FRAMEMIND_DB_URL?.trim() || DEFAULT_DB_URL;
const PROD_DB_URL =
  process.env.FRAMEMIND_DB_URL?.trim() ||
  process.env.DB_URL?.trim() ||
  DEFAULT_DB_URL;
const connectionString = process.env.NODE_ENV === "production" ? PROD_DB_URL : DEV_DB_URL;

if (globalThis.__pgPool && globalThis.__pgPoolConnectionString !== connectionString) {
  void globalThis.__pgPool.end({ timeout: 0 });
  globalThis.__pgPool = undefined;
  globalThis.__dbSchemaReady = undefined;
}

const pool = globalThis.__pgPool ?? postgres(connectionString, { max: 10 });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
  globalThis.__pgPoolConnectionString = connectionString;
}

export const db = drizzle(pool, { schema });

const SCHEMA_STATEMENTS = [
  `create table if not exists projects (
    id uuid primary key,
    title text not null default '未命名',
    gradient text not null default 'from-slate-800 via-slate-700 to-slate-900',
    video_mode text,
    aspect_ratio text,
    visual_style text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `alter table projects add column if not exists title text`,
  `alter table projects add column if not exists gradient text`,
  `alter table projects add column if not exists video_mode text`,
  `alter table projects add column if not exists aspect_ratio text`,
  `alter table projects add column if not exists visual_style text`,
  `alter table projects add column if not exists created_at timestamptz`,
  `alter table projects add column if not exists updated_at timestamptz`,
  `update projects
    set
      title = coalesce(title, '未命名'),
      gradient = coalesce(gradient, 'from-slate-800 via-slate-700 to-slate-900'),
      created_at = coalesce(created_at, now()),
      updated_at = coalesce(updated_at, now())`,
  `alter table projects alter column title set default '未命名'`,
  `alter table projects alter column gradient set default 'from-slate-800 via-slate-700 to-slate-900'`,
  `alter table projects alter column created_at set default now()`,
  `alter table projects alter column updated_at set default now()`,
  `create table if not exists project_steps (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    step_key text not null,
    completed boolean not null default false,
    content text not null default ''
  )`,
  `alter table project_steps add column if not exists completed boolean`,
  `alter table project_steps add column if not exists content text`,
  `update project_steps
    set
      completed = coalesce(completed, false),
      content = coalesce(content, '')`,
  `alter table project_steps alter column completed set default false`,
  `alter table project_steps alter column content set default ''`,
  `create unique index if not exists project_steps_unique_project_step on project_steps (project_id, step_key)`,
  `create table if not exists characters (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    name text not null,
    appearance text not null default '',
    clothing text not null default '',
    description text not null default '',
    media_url text
  )`,
  `alter table characters add column if not exists appearance text`,
  `alter table characters add column if not exists clothing text`,
  `alter table characters add column if not exists description text`,
  `alter table characters add column if not exists media_url text`,
  `update characters
    set
      appearance = coalesce(appearance, ''),
      clothing = coalesce(clothing, ''),
      description = coalesce(description, '')`,
  `alter table characters alter column appearance set default ''`,
  `alter table characters alter column clothing set default ''`,
  `alter table characters alter column description set default ''`,
  `create table if not exists shots (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    shot_number integer not null,
    description text not null default '',
    scene_type text not null default '',
    camera_angle text not null default '',
    narration text not null default '',
    character_id uuid references characters(id) on delete set null,
    dialogue text not null default '',
    notes text not null default '',
    media_generated boolean not null default false,
    media_url text
  )`,
  `alter table shots add column if not exists description text`,
  `alter table shots add column if not exists scene_type text`,
  `alter table shots add column if not exists camera_angle text`,
  `alter table shots add column if not exists narration text`,
  `alter table shots add column if not exists character_id uuid`,
  `alter table shots add column if not exists dialogue text`,
  `alter table shots add column if not exists notes text`,
  `alter table shots add column if not exists media_generated boolean`,
  `alter table shots add column if not exists media_url text`,
  `update shots
    set
      description = coalesce(description, ''),
      scene_type = coalesce(scene_type, ''),
      camera_angle = coalesce(camera_angle, ''),
      narration = coalesce(narration, ''),
      dialogue = coalesce(dialogue, ''),
      notes = coalesce(notes, ''),
      media_generated = coalesce(media_generated, false)`,
  `alter table shots alter column description set default ''`,
  `alter table shots alter column scene_type set default ''`,
  `alter table shots alter column camera_angle set default ''`,
  `alter table shots alter column narration set default ''`,
  `alter table shots alter column dialogue set default ''`,
  `alter table shots alter column notes set default ''`,
  `alter table shots alter column media_generated set default false`,
  `create table if not exists video_clips (
    id uuid primary key,
    project_id uuid not null references projects(id) on delete cascade,
    clip_type text not null,
    start_sec real not null,
    end_sec real not null,
    label text not null default '',
    url text,
    subtitle_text text
  )`,
  `alter table video_clips add column if not exists label text`,
  `alter table video_clips add column if not exists url text`,
  `alter table video_clips add column if not exists subtitle_text text`,
  `update video_clips set label = coalesce(label, '')`,
  `alter table video_clips alter column label set default ''`,
] as const;

async function bootstrapSchema() {
  await pool.begin(async (sql) => {
    for (const statement of SCHEMA_STATEMENTS) {
      await sql.unsafe(statement);
    }
  });
}

export async function ensureDatabaseSchema() {
  if (!globalThis.__dbSchemaReady) {
    globalThis.__dbSchemaReady = bootstrapSchema().catch((error) => {
      globalThis.__dbSchemaReady = undefined;
      throw error;
    });
  }

  await globalThis.__dbSchemaReady;
}
