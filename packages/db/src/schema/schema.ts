import { relations } from "drizzle-orm";
import { index, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import type { InvitationStatus } from "@ena/domain";

import { pgTable } from "./_table";

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
});

export const userRelations = relations(user, ({ many }) => ({
  invitations: many(invitation),
  emails: many(email, { relationName: "sender" }),
}));

export const organization = pgTable("organization", {
  id: uuid("ref").defaultRandom().notNull().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  title: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  teams: many(team),
}));

export const team = pgTable(
  "team",
  {
    id: uuid("ref").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    organizationId: uuid("organization_id")
      .references(() => organization.id)
      .notNull(),
  },
  (table) => {
    return {
      organizationIdx: index("organization_id_idx").on(table.organizationId),
    };
  },
);

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  invitations: many(invitation),
}));

export const invitation = pgTable(
  "invitation",
  {
    id: uuid("ref").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),
    to: varchar("to", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 })
      .$type<InvitationStatus>()
      .notNull(),

    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => ({
    teamIdx: index("team_id_idx").on(table.teamId),
    inviterIdx: index("inviter_id_idx").on(table.inviterId),
  }),
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  team: one(team, {
    fields: [invitation.teamId],
    references: [team.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const email = pgTable("email", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id").notNull(),
  to: text("to").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailRelations = relations(email, ({ one }) => ({
  from: one(user, {
    fields: [email.inviterId],
    references: [user.id],
  }),
}));
