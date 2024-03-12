import type { Root } from "../../root";
import type { Invitee, Inviter } from "./value-objects";
import { InvitationStatus } from "./value-objects";

interface InviteFactoryArgs {
  id: number;
  invitee: Invitee;
  inviter: Inviter;
  createdAt: Date;
  updatedAt: Date | null;
  status: InvitationStatus;
}

class Invitation implements Root {
  constructor(
    public readonly id: number,
    public readonly invitee: Invitee,
    public readonly inviter: Inviter,
    public readonly createdAt: Date,
    public readonly updatedAt: Date | null,
    public readonly status: InvitationStatus,
  ) {}

  static from(options: InviteFactoryArgs): Invitation {
    const { id, invitee, inviter, createdAt, updatedAt, status } = options;
    return new Invitation(id, invitee, inviter, createdAt, updatedAt, status);
  }

  get isRevoked(): boolean {
    return this.status === InvitationStatus.Revoked;
  }
}

export { Invitation };
