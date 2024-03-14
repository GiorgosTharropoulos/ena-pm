import { z } from "zod";

const emailSelectSchema = z.object({
  key: z.number(),
  ref: z.string(),
  externalId: z.string(),
  to: z.string().email(),
  fromKey: z.number(),
  createdAt: z.date(),
});

const emailInsertSchema = z.object({
  externalId: z.string(),
  to: z.string().email(),
  fromKey: z.number(),
});

export type EmailSelectSchema = z.infer<typeof emailSelectSchema>;
export type EmailInsertSchema = z.infer<typeof emailInsertSchema>;

export { emailSelectSchema, emailInsertSchema };
