import { z } from "zod";

const userSelectSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  unsafePassword: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(255, "Password must be at most 255 characters long"),
});

const insertUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().nullish(),
});

type UserForSelect = z.infer<typeof userSelectSchema>;
type UserForInsert = z.infer<typeof insertUserSchema>;
type CreateUserSchema = z.infer<typeof createUserSchema>;

export type { UserForSelect, UserForInsert, CreateUserSchema };
export { userSelectSchema, createUserSchema, insertUserSchema };
