import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as email from "./schema/email";
import * as invitation from "./schema/invitation";
import { getPgClient } from "./utils";

export const schema = { ...invitation, ...email };
export * from "drizzle-orm";

export type InsertEmail = InferInsertModel<typeof schema.email>;
export type SelectEmail = InferSelectModel<typeof schema.email>;
export type InsertInvitation = InferInsertModel<typeof schema.invitation>;
export type SelectInvitation = InferSelectModel<typeof schema.invitation>;

const connectionString = process.env.DATABASE_URL!;
const sql = getPgClient(connectionString);

export function getDrizzle(sql: postgres.Sql) {
  return drizzle(sql, { schema });
}
export const db = getDrizzle(sql);
export type DrizzleDB = typeof db;
