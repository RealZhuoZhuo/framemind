CREATE INDEX "characters_project_id_idx" ON "characters" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_steps_project_id_idx" ON "project_steps" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "shots_project_id_idx" ON "shots" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "shots_project_id_shot_number_idx" ON "shots" USING btree ("project_id","shot_number");--> statement-breakpoint
CREATE INDEX "shots_character_id_idx" ON "shots" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "video_clips_project_id_idx" ON "video_clips" USING btree ("project_id");