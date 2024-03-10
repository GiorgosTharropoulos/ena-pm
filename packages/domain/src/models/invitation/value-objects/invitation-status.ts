export const InvitationStatus = {
  None: "None",
  InProgress: "InProgress",
  Revoked: "Revoked",
  Accepted: "Accepted",
  Expired: "Expired",
} as const;
export type InvitationStatus =
  (typeof InvitationStatus)[keyof typeof InvitationStatus];
