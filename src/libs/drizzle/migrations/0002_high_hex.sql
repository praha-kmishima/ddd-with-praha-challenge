ALTER TABLE "tasks" ADD COLUMN "owner_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "progress_status" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "done";