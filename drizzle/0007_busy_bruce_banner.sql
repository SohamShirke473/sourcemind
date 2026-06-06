ALTER TABLE "artifacts" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."artifact_type";--> statement-breakpoint
CREATE TYPE "public"."artifact_type" AS ENUM('infographic', 'audio', 'mindmap', 'flashcard', 'quiz', 'report');--> statement-breakpoint
ALTER TABLE "artifacts" ALTER COLUMN "type" SET DATA TYPE "public"."artifact_type" USING "type"::"public"."artifact_type";