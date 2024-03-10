import type { Invitation } from "@ena/domain";

export interface InvitationNotificationService {
  notify(invitation: Invitation): Promise<void>;
}
