import { z } from "zod";

const inviteeSchema = z.object({
  email: z.string().nullable(),
});

const inviterSchema = z.object({
  email: z.string().email(),
  username: z.string(),
});

const invitationForCreateSchema = z.object({
  invitee: inviteeSchema,
  inviter: inviterSchema,
});

type InvitationForCreate = z.infer<typeof invitationForCreateSchema>;

export { invitationForCreateSchema, inviteeSchema, inviterSchema };
export type { InvitationForCreate };
