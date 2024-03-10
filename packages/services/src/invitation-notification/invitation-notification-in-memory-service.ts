import type { Invitation } from "@ena/domain";

import type { InvitationNotificationService } from "./types";

class InvitationNotificationInMemoryService
  implements InvitationNotificationService
{
  constructor(public readonly invites: Invitation[]) {}

  notify(invitation: Invitation): Promise<void> {
    this.invites.push(invitation);
    return Promise.resolve();
  }
}

export { InvitationNotificationInMemoryService };
