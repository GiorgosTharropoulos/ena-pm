import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { getDrizzle } from "@ena/db";
import { getMigrationClient } from "@ena/db/utils";

export async function migrateDB(
  container: StartedPostgreSqlContainer,
  migrationsDir: string,
) {
  const sql = getMigrationClient(container.getConnectionUri());
  const migrationDb = getDrizzle(sql);
  await migrate(migrationDb, { migrationsFolder: migrationsDir });
  await sql.end();
}
