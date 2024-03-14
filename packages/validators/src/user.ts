import { z } from "zod";

const userSelectSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

type UserForSelect = z.infer<typeof userSelectSchema>;
export type { UserForSelect };
export { userSelectSchema };
