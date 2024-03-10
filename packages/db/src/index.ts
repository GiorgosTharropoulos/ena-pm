import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as invitation from "./schema/invitation";

export const schema = { ...invitation };
export * from "drizzle-orm";

const connectionString = "";

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export type DrizzleDB = typeof db;
