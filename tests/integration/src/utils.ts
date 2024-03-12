import { fileURLToPath } from "node:url";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";

import { getDrizzle } from "@ena/db";
import { getMigrationClient } from "@ena/db/utils";

const currentURL = import.meta.url;
export async function migrateDB(container: StartedPostgreSqlContainer) {
  const sql = getMigrationClient(container.getConnectionUri());
  const migrationDb = getDrizzle(sql);
  const migrationsFolder = fileURLToPath(
    new URL("../../../packages/db/drizzle", currentURL),
  );
  await migrate(migrationDb, { migrationsFolder });
  await sql.end();
}
