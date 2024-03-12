import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { fileURLToPath } from "node:url";

import { getDrizzle } from "@ena/db";
import { getMigrationClient } from "@ena/db/utils";

export async function migrateDB(container: StartedPostgreSqlContainer) {
  const sql = getMigrationClient(container.getConnectionUri());
  const migrationDb = getDrizzle(sql);
  const migrationsFolder = fileURLToPath(
    new URL("../../../packages/db/drizzle", import.meta.url),
  );
  await migrate(migrationDb, { migrationsFolder });
  await sql.end();
}
