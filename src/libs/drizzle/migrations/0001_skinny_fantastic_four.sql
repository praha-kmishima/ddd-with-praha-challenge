CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"status" varchar NOT NULL,
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;