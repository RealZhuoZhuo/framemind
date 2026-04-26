CREATE TABLE IF NOT EXISTS "shot_dialogue_speakers" (
  "shot_id" uuid NOT NULL REFERENCES "shots"("id") ON DELETE cascade,
  "asset_id" uuid NOT NULL REFERENCES "project_assets"("id") ON DELETE cascade,
  CONSTRAINT "shot_dialogue_speakers_unique_shot_asset" UNIQUE("shot_id", "asset_id")
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "shot_dialogue_speakers_shot_id_idx" ON "shot_dialogue_speakers" USING btree ("shot_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shot_dialogue_speakers_asset_id_idx" ON "shot_dialogue_speakers" USING btree ("asset_id");
--> statement-breakpoint

INSERT INTO "shot_dialogue_speakers" ("shot_id", "asset_id")
SELECT DISTINCT "shots"."id", "project_assets"."id"
FROM "shots"
JOIN LATERAL regexp_split_to_table("shots"."dialogue_speaker", '[、,，]') AS "speaker_name"("name") ON true
JOIN "project_assets"
  ON "project_assets"."project_id" = "shots"."project_id"
  AND "project_assets"."type" = 'character'
  AND lower(regexp_replace("project_assets"."name", '\s+', '', 'g')) = lower(regexp_replace("speaker_name"."name", '\s+', '', 'g'))
WHERE COALESCE("shots"."dialogue_speaker", '') <> ''
ON CONFLICT ("shot_id", "asset_id") DO NOTHING;
