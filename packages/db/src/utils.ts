import postgres from "postgres";

export function getMigrationClient(connectionString: string) {
  return postgres(connectionString, { max: 1 });
}

export function getPgClient(connectionString: string) {
  return postgres(connectionString, { prepare: false });
}
