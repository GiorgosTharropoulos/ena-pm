import type { Root } from "../../root";
import type { InvitationStatus, Invitee, Inviter } from "./value-objects";

interface InviteFactoryArgs {
  id: number;
  invitee: Invitee;
  inviter: Inviter;
  createdAt: Date;
  updatedAt: Date;
  revoked: boolean;
  status: InvitationStatus;
  token: string | null;
}

class Invitation implements Root {
  constructor(
    public readonly id: number,
    public readonly invitee: Invitee,
    public readonly inviter: Inviter,
    public readonly createdAt: Date,
    public readonly updatedAt: Date | null,
    public readonly revoked: boolean,
    public readonly status: InvitationStatus,
    public readonly token: string | null,
  ) {}

  static from(options: InviteFactoryArgs): Invitation {
    const {
      id,
      invitee,
      inviter,
      createdAt,
      updatedAt,
      revoked,
      status,
      token,
    } = options;
    return new Invitation(
      id,
      invitee,
      inviter,
      createdAt,
      updatedAt,
      revoked,
      status,
      token,
    );
  }
}

export { Invitation };
