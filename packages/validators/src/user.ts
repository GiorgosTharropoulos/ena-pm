import { z } from "zod";

const userSelectSchema = z.object({
  key: z.number(),
  ref: z.string(),
  email: z.string().email(),
});

type UserForSelect = z.infer<typeof userSelectSchema>;
export type { UserForSelect };
export { userSelectSchema };
