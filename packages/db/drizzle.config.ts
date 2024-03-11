import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema",
  out: "./drizzle",
  driver: "pg",
  tablesFilter: ["ena_pm_*"],
} satisfies Config;
