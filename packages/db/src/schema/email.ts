import { serial, text, timestamp } from "drizzle-orm/pg-core";

import { pgTable } from "./_table";

export const email = pgTable("email", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(),
  to: text("to").notNull(),
  from: text("from").notNull(),
  sender: text("initiator").notNull(),
  createdAt: timestamp("created_at").notNull(),
});
