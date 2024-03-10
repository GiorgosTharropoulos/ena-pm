import type { Invitation } from "@ena/domain";

export interface InviteNotificationStrategy {
  notify(invitation: Invitation): Promise<void>;
}
