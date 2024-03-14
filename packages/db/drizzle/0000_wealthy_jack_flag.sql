CREATE TABLE IF NOT EXISTS "ena_pm_email" (
	"key" serial PRIMARY KEY NOT NULL,
	"ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"to" text NOT NULL,
	"from_key" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_invitation" (
	"key" serial PRIMARY KEY NOT NULL,
	"ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"to" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"team_key" integer NOT NULL,
	"inviter_key" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_organization" (
	"key" serial PRIMARY KEY NOT NULL,
	"ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_team" (
	"key" serial PRIMARY KEY NOT NULL,
	"ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"organization_key" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_user" (
	"key" serial PRIMARY KEY NOT NULL,
	"ref" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invitation_ref_idx" ON "ena_pm_invitation" ("ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_id_idx" ON "ena_pm_invitation" ("team_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inviter_id_idx" ON "ena_pm_invitation" ("inviter_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organization_ref_idx" ON "ena_pm_organization" ("ref");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "team_ref_idx" ON "ena_pm_team" ("ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organization_id_idx" ON "ena_pm_team" ("organization_key");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_email" ADD CONSTRAINT "ena_pm_email_from_key_ena_pm_user_key_fk" FOREIGN KEY ("from_key") REFERENCES "ena_pm_user"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_invitation" ADD CONSTRAINT "ena_pm_invitation_team_key_ena_pm_team_key_fk" FOREIGN KEY ("team_key") REFERENCES "ena_pm_team"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_invitation" ADD CONSTRAINT "ena_pm_invitation_inviter_key_ena_pm_user_key_fk" FOREIGN KEY ("inviter_key") REFERENCES "ena_pm_user"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ena_pm_team" ADD CONSTRAINT "ena_pm_team_organization_key_ena_pm_organization_key_fk" FOREIGN KEY ("organization_key") REFERENCES "ena_pm_organization"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
