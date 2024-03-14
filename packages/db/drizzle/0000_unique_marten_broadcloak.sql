CREATE TABLE IF NOT EXISTS "ena_pm_email" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"to" text NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_invitation" (
	"ref" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"to" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"team_id" uuid NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_organization" (
	"ref" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_team" (
	"ref" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "ena_pm_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_id_idx" ON "ena_pm_invitation" ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inviter_id_idx" ON "ena_pm_invitation" ("inviter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_id_idx" ON "ena_pm_team" ("organization_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_email" ADD CONSTRAINT "ena_pm_email_inviter_id_ena_pm_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "ena_pm_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_invitation" ADD CONSTRAINT "ena_pm_invitation_team_id_ena_pm_team_ref_fk" FOREIGN KEY ("team_id") REFERENCES "ena_pm_team"("ref") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_invitation" ADD CONSTRAINT "ena_pm_invitation_inviter_id_ena_pm_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "ena_pm_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_session" ADD CONSTRAINT "ena_pm_session_user_id_ena_pm_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "ena_pm_user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_team" ADD CONSTRAINT "ena_pm_team_organization_id_ena_pm_organization_ref_fk" FOREIGN KEY ("organization_id") REFERENCES "ena_pm_organization"("ref") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
