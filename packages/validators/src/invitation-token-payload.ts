import { z } from "zod";

export const invitationTokenPayloadSchema = z.object({
  id: z.number(),
});
