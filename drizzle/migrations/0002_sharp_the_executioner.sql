ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "character_action" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN IF NOT EXISTS "lighting_mood" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN IF EXISTS "clothing";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "camera_angle";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "narration";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "notes";--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "media_generated";
