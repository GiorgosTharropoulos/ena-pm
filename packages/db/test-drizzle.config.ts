import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema",
  out: process.env.DRIZZLE_OUT,
  driver: "pg",
  tablesFilter: ["ena_pm_*"],
} satisfies Config;
