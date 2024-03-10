import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";
import { InvitationStatus } from "@ena/domain";

import type { Clock } from "../../utils/time-provider";
import type { InvitationRepository } from "./types";

class InvitationInMemoryRepository implements InvitationRepository {
  private lastId = 0;
  private db = new Map<number, Invitation>();

  constructor(private readonly clock: Clock) {}

  setToken(id: number, token: string): Promise<Invitation> {
    const invitation = this.db.get(id);

    if (!invitation) {
      throw new Error(`Invitation with id ${id} not found`);
    }

    const updatedInvitation = {
      ...invitation,
      token,
      updatedAt: this.clock.now(),
    };

    this.db.set(id, updatedInvitation);

    return Promise.resolve(this.db.get(id)!);
  }

  findById(id: number): Promise<Invitation | undefined> {
    return Promise.resolve(this.db.get(id));
  }

  create(invitationIn: InvitationForCreate): Promise<Invitation> {
    const invitation: Invitation = {
      id: ++this.lastId,
      createdAt: this.clock.now(),
      revoked: false,
      status: InvitationStatus.InProgress,
      updatedAt: null,
      token: null,
      ...invitationIn,
    };

    this.db.set(invitation.id, invitation);

    return Promise.resolve(invitation);
  }
}

export { InvitationInMemoryRepository };
