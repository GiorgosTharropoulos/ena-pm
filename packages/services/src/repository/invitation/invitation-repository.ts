import type { DrizzleDB, InferSelectModel } from "@ena/db";
import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";
import { eq, schema } from "@ena/db";
import { InvitationStatus } from "@ena/domain";

import type { Clock } from "../../utils/time-provider";
import type { InvitationRepository } from "./types";

class InvitationDrizzleRepository implements InvitationRepository {
  constructor(
    private readonly db: DrizzleDB,
    private readonly clock: Clock,
  ) {}

  async setToken(id: number, token: string): Promise<Invitation> {
    const res = await this.db
      .update(schema.invitation)
      .set({
        updatedAt: this.clock.now(),
        token,
      })
      .returning();

    const invitationInDb = res.at(0);

    if (!invitationInDb) {
      throw new Error(`Could not set token for invitation with id ${id}`);
    }

    return this.fromDb(invitationInDb);
  }

  async create(invitationIn: InvitationForCreate): Promise<Invitation> {
    const result = await this.db
      .insert(schema.invitation)
      .values({
        revoked: false,
        status: InvitationStatus.InProgress,
        createdAt: this.clock.now(),
        inviterEmail: invitationIn.inviter.email,
        inviterUsername: invitationIn.inviter.username,
        inviteeEmail: invitationIn.invitee.email,
      })
      .returning();

    const invitationInDb = result.at(0);

    if (!invitationInDb) {
      throw new Error("Failed to create invitation");
    }

    return this.fromDb(invitationInDb);
  }
  async findById(id: number): Promise<Invitation | undefined> {
    const result = await this.db.query.invitation.findFirst({
      where: eq(schema.invitation.id, id),
    });

    if (!result) return undefined;

    return this.fromDb(result);
  }

  private fromDb(
    dbModel: InferSelectModel<typeof schema.invitation>,
  ): Invitation {
    return {
      id: dbModel.id,
      createdAt: dbModel.createdAt,
      invitee: {
        email: dbModel.inviteeEmail,
      },
      inviter: {
        email: dbModel.inviterEmail,
        username: dbModel.inviterUsername,
      },
      revoked: dbModel.revoked,
      status: dbModel.status,
      updatedAt: dbModel.updatedAt,
      token: dbModel.token,
    };
  }
}

export { InvitationDrizzleRepository };
