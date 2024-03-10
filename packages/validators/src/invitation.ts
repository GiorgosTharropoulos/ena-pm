import { z } from "zod";

const inviteeSchema = z
  .object({
    email: z.string().nullable(),
    sms: z.string().nullable(),
    url: z.string().nullable(),
  })
  .refine(
    (val) => {
      return !(val.email === null && val.sms === null && val.url === null);
    },
    { message: "At least one of email, sms, or url must be provided" },
  );

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
