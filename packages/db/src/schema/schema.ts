import { relations } from "drizzle-orm";
import {
  index,
  integer,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type { InvitationStatus } from "@ena/domain";

import { pgTable } from "./_table";

export const user = pgTable("user", {
  key: serial("key").primaryKey(),
  ref: uuid("ref").defaultRandom().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  invitations: many(invitation),
  emails: many(email),
}));

export const organization = pgTable(
  "organization",
  {
    key: serial("key").primaryKey(),
    ref: uuid("ref").defaultRandom().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    title: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
  },
  (table) => {
    return {
      refIdx: uniqueIndex("organization_ref_idx").on(table.ref),
    };
  },
);

export const organizationRelations = relations(organization, ({ many }) => ({
  teams: many(team),
}));

export const team = pgTable(
  "team",
  {
    key: serial("key").primaryKey(),
    ref: uuid("ref").defaultRandom().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),

    organizationKey: integer("organization_key")
      .references(() => organization.key)
      .notNull(),
  },
  (table) => {
    return {
      refIdx: uniqueIndex("team_ref_idx").on(table.ref),
      organizationIdx: index("organization_id_idx").on(table.organizationKey),
    };
  },
);

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationKey],
    references: [organization.key],
  }),
  invitations: many(invitation),
}));

export const invitation = pgTable(
  "invitation",
  {
    key: serial("key").primaryKey(),
    ref: uuid("ref").defaultRandom().notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at"),

    to: varchar("to", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 })
      .$type<InvitationStatus>()
      .notNull(),

    teamKey: integer("team_key")
      .notNull()
      .references(() => team.key),
    inviterKey: integer("inviter_key")
      .notNull()
      .references(() => user.key),
  },
  (table) => ({
    refIdx: uniqueIndex("invitation_ref_idx").on(table.ref),
    teamIdx: index("team_id_idx").on(table.teamKey),
    inviterIdx: index("inviter_id_idx").on(table.inviterKey),
  }),
);

export const invitationRelations = relations(invitation, ({ one }) => ({
  team: one(team, {
    fields: [invitation.teamKey],
    references: [team.key],
  }),
  inviter: one(user, {
    fields: [invitation.inviterKey],
    references: [user.key],
  }),
}));

export const email = pgTable("email", {
  key: serial("key").primaryKey(),
  ref: uuid("ref").defaultRandom().notNull(),
  externalId: text("external_id").notNull(),
  to: text("to").notNull(),
  fromKey: integer("from_key")
    .notNull()
    .references(() => user.key),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailRelations = relations(email, ({ one }) => ({
  from: one(user, {
    fields: [email.fromKey],
    references: [user.key],
  }),
}));
