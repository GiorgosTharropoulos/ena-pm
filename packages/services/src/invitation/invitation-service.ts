import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";

import type { InvitationNotificationService } from "../invitation-notification/types";
import type { InvitationRepository } from "../repository/invitation";
import type { TokenService } from "../token-service/types";

class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly tokenService: TokenService,
    private readonly notificationService: InvitationNotificationService,
  ) {}

  async createInvitation(obj: InvitationForCreate): Promise<Invitation> {
    const { id } = await this.invitationRepository.create(obj);
    const token = this.tokenService.sing({ id });
    const invitation = await this.invitationRepository.setToken(id, token);
    await this.notificationService.notify(invitation);

    return invitation;
  }
}

export { InvitationService };
