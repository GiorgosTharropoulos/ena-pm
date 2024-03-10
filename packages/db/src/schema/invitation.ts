import type { InvitationStatus } from "@ena/domain";
import { boolean, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { pgTable } from "./_table";

export const invitation = pgTable("invitation", {
  id: serial("id").primaryKey(),
  inviteeSms: varchar("sms_invitee", { length: 255 }),
  inviteeEmail: text("email_invitee"),
  inviteeUrl: text("url_invitee"),
  inviterEmail: text("email_inviter").notNull(),
  inviterUsername: text("username_inviter").notNull(),
  revoked: boolean("revoked").notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at"),
  status: varchar("status", { length: 255 })
    .$type<InvitationStatus>()
    .notNull(),
  token: text("token"),
});
