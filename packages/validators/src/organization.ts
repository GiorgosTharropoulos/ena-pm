import { z } from "zod";

const organizationSelectSchema = z.object({
  key: z.number(),
  ref: z.string(),
  createdAt: z.date(),
  title: z.string().max(255, "Name must be less than 255 characters"),
  description: z.string().nullable(),
});

const organizationInsertSchema = z.object({
  title: z.string().max(255, "Name must be less than 255 characters"),
  description: z.string().nullable(),
});

const organizationUpdateSchema = z
  .object({
    title: z.string().max(255, "Name must be less than 255 characters"),
    description: z.string().nullish(),
  })
  .partial();

type OrganizationForSelect = z.infer<typeof organizationSelectSchema>;
type OrganizationForInsert = z.infer<typeof organizationInsertSchema>;
type OrganizationForUpdate = z.infer<typeof organizationUpdateSchema>;

export type {
  OrganizationForInsert,
  OrganizationForUpdate,
  OrganizationForSelect,
};
export {
  organizationInsertSchema,
  organizationUpdateSchema,
  organizationSelectSchema,
};
