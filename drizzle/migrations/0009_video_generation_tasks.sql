ALTER TABLE "video_clips" ADD COLUMN IF NOT EXISTS "source_shot_id" uuid REFERENCES "shots"("id") ON DELETE set null;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "video_clips_source_shot_id_idx" ON "video_clips" USING btree ("source_shot_id");
--> statement-breakpoint

ALTER TABLE "video_clips"
  ADD CONSTRAINT "video_clips_unique_project_source_shot_type" UNIQUE("project_id", "source_shot_id", "clip_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "video_generation_tasks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "shot_id" uuid NOT NULL REFERENCES "shots"("id") ON DELETE cascade,
  "provider_task_id" text NOT NULL,
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "prompt" text DEFAULT '' NOT NULL,
  "video_url" text,
  "media_url" text,
  "last_frame_url" text,
  "error_code" text,
  "error_message" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "video_generation_tasks_provider_task_id_unique" UNIQUE("provider_task_id")
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "video_generation_tasks_project_id_idx" ON "video_generation_tasks" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_generation_tasks_project_status_idx" ON "video_generation_tasks" USING btree ("project_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "video_generation_tasks_shot_id_idx" ON "video_generation_tasks" USING btree ("shot_id");
