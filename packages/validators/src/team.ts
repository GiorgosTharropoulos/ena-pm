import { z } from "zod";

const teamSelectSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  title: z.string().max(255, "Title must be less than 255 characters"),
  description: z.string().nullable(),
  organizationId: z.string(),
});

const teamInsertSchema = z.object({
  title: z.string().max(255, "Title must be less than 255 characters"),
  description: z.string().nullish(),
  organizationId: z.string(),
});

const teamUpdateSchema = z
  .object({
    title: z.string().max(255, "Title must be less than 255 characters"),
    description: z.string().nullish(),
  })
  .partial();

type TeamForSelect = z.infer<typeof teamSelectSchema>;
type TeamForInsert = z.infer<typeof teamInsertSchema>;
type TeamForUpdate = z.infer<typeof teamUpdateSchema>;

export type { TeamForInsert, TeamForUpdate, TeamForSelect };
export { teamInsertSchema, teamUpdateSchema, teamSelectSchema };
