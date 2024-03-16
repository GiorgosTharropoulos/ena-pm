import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { GlobalSetupContext } from "vitest/node";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

import { migrateDB } from "../src/utils";

let teardown = false;

export default async function ({ provide }: GlobalSetupContext) {
  const migrationsDir = await fs.promises.mkdtemp(`${os.tmpdir()}${path.sep}`);
  execSync(`DRIZZLE_OUT=${migrationsDir} pnpm -w run db:generate:test`, {
    stdio: "inherit",
  });

  const container = await new PostgreSqlContainer().start();

  await migrateDB(container, migrationsDir);

  provide("dbConnectionUri", container.getConnectionUri());

  return async () => {
    if (teardown) {
      throw new Error("Teardown called twice");
    }
    teardown = true;
    await fs.promises.rm(migrationsDir, { recursive: true });
    await container.stop();
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    dbConnectionUri: string;
  }
}
