import { serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import type { InvitationStatus } from "@ena/domain";

import { pgTable } from "./_table";

export const invitation = pgTable("invitation", {
  id: serial("id").primaryKey(),
  inviteeEmail: text("email_invitee"),
  inviterEmail: text("email_inviter").notNull(),
  inviterUsername: text("username_inviter").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  status: varchar("status", { length: 255 })
    .$type<InvitationStatus>()
    .notNull(),
});
