CREATE TABLE IF NOT EXISTS "project_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
  "type" text NOT NULL,
  "name" text NOT NULL,
  "appearance" text DEFAULT '' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "media_url" text
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "project_assets_project_id_idx" ON "project_assets" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_assets_project_id_type_idx" ON "project_assets" USING btree ("project_id", "type");
--> statement-breakpoint

DO $$
BEGIN
  IF to_regclass('public.characters') IS NOT NULL THEN
    INSERT INTO "project_assets" ("id", "project_id", "type", "name", "appearance", "description", "media_url")
    SELECT "id", "project_id", 'character', "name", COALESCE("appearance", ''), COALESCE("description", ''), "media_url"
    FROM "characters"
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shot_assets" (
  "shot_id" uuid NOT NULL REFERENCES "shots"("id") ON DELETE cascade,
  "asset_id" uuid NOT NULL REFERENCES "project_assets"("id") ON DELETE cascade,
  CONSTRAINT "shot_assets_unique_shot_asset" UNIQUE("shot_id", "asset_id")
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "shot_assets_shot_id_idx" ON "shot_assets" USING btree ("shot_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shot_assets_asset_id_idx" ON "shot_assets" USING btree ("asset_id");
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shots'
      AND column_name = 'character_id'
  ) THEN
    INSERT INTO "shot_assets" ("shot_id", "asset_id")
    SELECT "id", "character_id"
    FROM "shots"
    WHERE "character_id" IS NOT NULL
    ON CONFLICT ("shot_id", "asset_id") DO NOTHING;
  END IF;
END $$;
--> statement-breakpoint

UPDATE "project_steps" SET "step_key" = 'assets' WHERE "step_key" = 'character';
--> statement-breakpoint

ALTER TABLE "shots" DROP CONSTRAINT IF EXISTS "shots_character_id_characters_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "shots_character_id_idx";
--> statement-breakpoint
ALTER TABLE "shots" DROP COLUMN IF EXISTS "character_id";
--> statement-breakpoint

DROP TABLE IF EXISTS "characters";
