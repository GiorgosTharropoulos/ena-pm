import type { Table } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import type postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema/schema";

export function getDrizzle(sql: postgres.Sql) {
  return drizzle(sql, { schema });
}

export type Schema = typeof schema;
export type SchemaTables = {
  [K in keyof Schema as Schema[K] extends Table ? K : never]: Schema[K];
};
export type SchemaTable = SchemaTables[keyof SchemaTables];
export type { PgUpdateSetSource };

export * from "drizzle-orm";
export * from "drizzle-orm/postgres-js";
export * from "drizzle-zod";
export { PostgresError } from "postgres";
export { schema };
export type DrizzleDB = ReturnType<typeof getDrizzle>;
