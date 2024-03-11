CREATE TABLE IF NOT EXISTS "ena_pm_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"to" text NOT NULL,
	"from" text NOT NULL,
	"initiator" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ena_pm_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_invitee" text,
	"email_inviter" text NOT NULL,
	"username_inviter" text NOT NULL,
	"revoked" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"status" varchar(255) NOT NULL,
	"token" text
);
