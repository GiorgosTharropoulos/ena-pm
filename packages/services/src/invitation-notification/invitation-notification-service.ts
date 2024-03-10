import type { Invitation } from "@ena/domain";

import type { InvitationNotificationService } from "./types";

class InvitationNotification implements InvitationNotificationService {
  constructor(
    private readonly strategies: Set<InvitationNotificationService>,
  ) {}
  async notify(invitation: Invitation): Promise<void> {
    await Promise.all(
      Array.from(this.strategies).map((strategy) =>
        strategy.notify(invitation),
      ),
    );
  }
}

export { InvitationNotification };
