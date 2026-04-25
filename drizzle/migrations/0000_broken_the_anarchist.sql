CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"appearance" text DEFAULT '' NOT NULL,
	"clothing" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"media_url" text
);
--> statement-breakpoint
CREATE TABLE "project_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	CONSTRAINT "project_steps_unique_project_step" UNIQUE("project_id","step_key")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT '未命名' NOT NULL,
	"video_mode" text,
	"aspect_ratio" text,
	"visual_style" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"shot_number" integer NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"scene_type" text DEFAULT '' NOT NULL,
	"camera_angle" text DEFAULT '' NOT NULL,
	"narration" text DEFAULT '' NOT NULL,
	"character_id" uuid,
	"dialogue" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"media_generated" boolean DEFAULT false NOT NULL,
	"media_url" text
);
--> statement-breakpoint
CREATE TABLE "video_clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"clip_type" text NOT NULL,
	"start_sec" real NOT NULL,
	"end_sec" real NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"media_url" text,
	"subtitle_text" text
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_steps" ADD CONSTRAINT "project_steps_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_clips" ADD CONSTRAINT "video_clips_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;