import { z } from "zod";

import { InvitationStatus } from "@ena/domain";

const invitationSelectSchema = z.object({
  key: z.number(),
  ref: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  to: z.string().email(),
  status: z.nativeEnum(InvitationStatus),
  teamKey: z.number(),
  inviterKey: z.number(),
});

const invitationInsertSchema = z.object({
  to: z.string().max(255).email(),
  teamKey: z.number(),
  inviterKey: z.number(),
  status: z.nativeEnum(InvitationStatus),
});

const invitationUpdateSchema = z.object({
  status: z.nativeEnum(InvitationStatus),
});

type InvitationForCreate = z.infer<typeof invitationInsertSchema>;
type InvitationForUpdate = z.infer<typeof invitationUpdateSchema>;
type InvitationForSelect = z.infer<typeof invitationSelectSchema>;

export {
  invitationSelectSchema,
  invitationInsertSchema,
  invitationUpdateSchema,
};
export type { InvitationForCreate, InvitationForUpdate, InvitationForSelect };
