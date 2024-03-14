import { z } from "zod";

export const invitationTokenPayloadSchema = z.object({
  to: z.string().email(),
  teamRef: z.string(),
  inviterRef: z.string(),
});

export type InvitationTokenPayload = z.infer<
  typeof invitationTokenPayloadSchema
>;
