DO $$
BEGIN
  IF to_regclass('public.projects') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY,
        "title" text NOT NULL DEFAULT '未命名',
        "script" text NOT NULL DEFAULT '',
        "video_mode" text,
        "aspect_ratio" text,
        "visual_style" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'title'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "title" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'script'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "script" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'video_mode'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "video_mode" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'aspect_ratio'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "aspect_ratio" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'visual_style'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "visual_style" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "created_at" timestamptz';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" ADD COLUMN "updated_at" timestamptz';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'projects'
      AND column_name = 'gradient'
  ) THEN
    EXECUTE 'ALTER TABLE "projects" DROP COLUMN "gradient"';
  END IF;

  IF to_regclass('public.projects_updated_at_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at")';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "projects"
SET
  "title" = COALESCE("title", '未命名'),
  "script" = COALESCE("script", ''),
  "created_at" = COALESCE("created_at", now()),
  "updated_at" = COALESCE("updated_at", now());
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "title" SET DEFAULT '未命名';
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "script" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DEFAULT now();
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.project_steps') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE "project_steps" (
        "id" uuid PRIMARY KEY,
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
        "step_key" text NOT NULL,
        "completed" boolean NOT NULL DEFAULT false,
        "content" text NOT NULL DEFAULT ''
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'project_steps'
      AND column_name = 'completed'
  ) THEN
    EXECUTE 'ALTER TABLE "project_steps" ADD COLUMN "completed" boolean';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'project_steps'
      AND column_name = 'content'
  ) THEN
    EXECUTE 'ALTER TABLE "project_steps" ADD COLUMN "content" text';
  END IF;

  IF to_regclass('public.project_steps_unique_project_step') IS NULL THEN
    EXECUTE 'CREATE UNIQUE INDEX "project_steps_unique_project_step" ON "project_steps" ("project_id", "step_key")';
  END IF;

  IF to_regclass('public.project_steps_project_id_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "project_steps_project_id_idx" ON "project_steps" USING btree ("project_id")';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "project_steps"
SET
  "completed" = COALESCE("completed", false),
  "content" = COALESCE("content", '');
--> statement-breakpoint
ALTER TABLE "project_steps" ALTER COLUMN "completed" SET DEFAULT false;
--> statement-breakpoint
ALTER TABLE "project_steps" ALTER COLUMN "content" SET DEFAULT '';
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.characters') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE "characters" (
        "id" uuid PRIMARY KEY,
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
        "name" text NOT NULL,
        "appearance" text NOT NULL DEFAULT '',
        "description" text NOT NULL DEFAULT '',
        "media_url" text
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'characters'
      AND column_name = 'appearance'
  ) THEN
    EXECUTE 'ALTER TABLE "characters" ADD COLUMN "appearance" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'characters'
      AND column_name = 'description'
  ) THEN
    EXECUTE 'ALTER TABLE "characters" ADD COLUMN "description" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'characters'
      AND column_name = 'media_url'
  ) THEN
    EXECUTE 'ALTER TABLE "characters" ADD COLUMN "media_url" text';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'characters'
      AND column_name = 'clothing'
  ) THEN
    EXECUTE 'ALTER TABLE "characters" DROP COLUMN "clothing"';
  END IF;

  IF to_regclass('public.characters_project_id_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "characters_project_id_idx" ON "characters" USING btree ("project_id")';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "characters"
SET
  "appearance" = COALESCE("appearance", ''),
  "description" = COALESCE("description", '');
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "appearance" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "description" SET DEFAULT '';
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.shots') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE "shots" (
        "id" uuid PRIMARY KEY,
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
        "shot_number" integer NOT NULL,
        "scene_type" text NOT NULL DEFAULT '',
        "character_id" uuid REFERENCES "characters"("id") ON DELETE set null,
        "dialogue" text NOT NULL DEFAULT '',
        "character_action" text NOT NULL DEFAULT '',
        "lighting_mood" text NOT NULL DEFAULT '',
        "media_url" text
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'scene_type'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "scene_type" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'character_id'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "character_id" uuid';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'dialogue'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "dialogue" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'character_action'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "character_action" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'lighting_mood'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "lighting_mood" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'media_url'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" ADD COLUMN "media_url" text';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'description'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" DROP COLUMN "description"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'camera_angle'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" DROP COLUMN "camera_angle"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'narration'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" DROP COLUMN "narration"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'notes'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" DROP COLUMN "notes"';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'shots'
      AND column_name = 'media_generated'
  ) THEN
    EXECUTE 'ALTER TABLE "shots" DROP COLUMN "media_generated"';
  END IF;

  IF to_regclass('public.shots_project_id_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "shots_project_id_idx" ON "shots" USING btree ("project_id")';
  END IF;

  IF to_regclass('public.shots_project_id_shot_number_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "shots_project_id_shot_number_idx" ON "shots" USING btree ("project_id", "shot_number")';
  END IF;

  IF to_regclass('public.shots_character_id_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "shots_character_id_idx" ON "shots" USING btree ("character_id")';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "shots"
SET
  "scene_type" = COALESCE("scene_type", ''),
  "dialogue" = COALESCE("dialogue", ''),
  "character_action" = COALESCE("character_action", ''),
  "lighting_mood" = COALESCE("lighting_mood", '');
--> statement-breakpoint
ALTER TABLE "shots" ALTER COLUMN "scene_type" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "shots" ALTER COLUMN "dialogue" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "shots" ALTER COLUMN "character_action" SET DEFAULT '';
--> statement-breakpoint
ALTER TABLE "shots" ALTER COLUMN "lighting_mood" SET DEFAULT '';
--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.video_clips') IS NULL THEN
    EXECUTE $sql$
      CREATE TABLE "video_clips" (
        "id" uuid PRIMARY KEY,
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
        "clip_type" text NOT NULL,
        "start_sec" real NOT NULL,
        "end_sec" real NOT NULL,
        "label" text NOT NULL DEFAULT '',
        "media_url" text,
        "subtitle_text" text
      )
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'label'
  ) THEN
    EXECUTE 'ALTER TABLE "video_clips" ADD COLUMN "label" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'media_url'
  ) THEN
    EXECUTE 'ALTER TABLE "video_clips" ADD COLUMN "media_url" text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'subtitle_text'
  ) THEN
    EXECUTE 'ALTER TABLE "video_clips" ADD COLUMN "subtitle_text" text';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'url'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'media_url'
  ) THEN
    EXECUTE 'ALTER TABLE "video_clips" RENAME COLUMN "url" TO "media_url"';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'url'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'video_clips'
      AND column_name = 'media_url'
  ) THEN
    EXECUTE 'UPDATE "video_clips" SET "media_url" = COALESCE("media_url", "url")';
    EXECUTE 'ALTER TABLE "video_clips" DROP COLUMN "url"';
  END IF;

  IF to_regclass('public.video_clips_project_id_idx') IS NULL THEN
    EXECUTE 'CREATE INDEX "video_clips_project_id_idx" ON "video_clips" USING btree ("project_id")';
  END IF;
END $$;
--> statement-breakpoint
UPDATE "video_clips"
SET "label" = COALESCE("label", '');
--> statement-breakpoint
ALTER TABLE "video_clips" ALTER COLUMN "label" SET DEFAULT '';
