import { z } from "zod";

const emailSelectSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  to: z.string().email(),
  createdAt: z.date(),
  inviterId: z.string(),
});

const emailInsertSchema = z.object({
  inviterId: z.string(),
  externalId: z.string(),
  to: z.string().email(),
});

export type EmailSelectSchema = z.infer<typeof emailSelectSchema>;
export type EmailInsertSchema = z.infer<typeof emailInsertSchema>;

export { emailSelectSchema, emailInsertSchema };
