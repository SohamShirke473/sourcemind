ALTER TABLE "artifacts" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
CREATE INDEX "artifacts_workspace_id_idx" ON "artifacts" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "chats_workspace_id_idx" ON "chats" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "sources_workspace_id_idx" ON "sources" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_user_id_updated_at_idx" ON "workspaces" USING btree ("user_id","updated_at");