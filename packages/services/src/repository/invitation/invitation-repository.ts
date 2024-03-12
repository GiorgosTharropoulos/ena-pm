import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DrizzleDB, InferSelectModel } from "@ena/db";
import type { InvitationForCreate } from "@ena/validators";
import { eq, schema } from "@ena/db";
import { Invitation, InvitationStatus } from "@ena/domain";

import type { Clock } from "../../utils/time-provider";

const InvitationRepositoryErrorKind = {
  FailedToCreateInvitation: "FailedToCreateInvitation",
  NotFound: "InvitationNotFound",
} as const;
export type InvitationRepositoryErrorKind =
  (typeof InvitationRepositoryErrorKind)[keyof typeof InvitationRepositoryErrorKind];

export const InvitationRepositoryError = {
  [InvitationRepositoryErrorKind.FailedToCreateInvitation]: {
    kind: InvitationRepositoryErrorKind.FailedToCreateInvitation,
    message: "Failed to create invitation",
  },
  NotFound: {
    kind: InvitationRepositoryErrorKind.NotFound,
    message: "Invitation not found",
  },
} as const;
export type InvitationRepositoryError =
  (typeof InvitationRepositoryError)[keyof typeof InvitationRepositoryError];

export interface InvitationRepository {
  findById(
    id: number,
  ): Promise<Result<Invitation, typeof InvitationRepositoryError.NotFound>>;
  create(
    invitationIn: InvitationForCreate,
  ): Promise<
    Result<
      Invitation,
      typeof InvitationRepositoryError.FailedToCreateInvitation
    >
  >;
  revoke(
    id: number,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>>;
  setInviteeEmail(
    id: number,
    email: string,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>>;
}

class InvitationDrizzleRepository implements InvitationRepository {
  constructor(
    private readonly db: DrizzleDB,
    private readonly clock: Clock,
  ) {}

  async revoke(
    id: number,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>> {
    const res = await this.db
      .update(schema.invitation)
      .set({
        updatedAt: this.clock.now(),
        status: InvitationStatus.Revoked,
      })
      .where(eq(schema.invitation.id, id))
      .returning({ id: schema.invitation.id });

    if (res.length === 0) {
      return err(InvitationRepositoryError.NotFound);
    }

    return ok(undefined);
  }

  async create(
    invitationIn: InvitationForCreate,
  ): Promise<
    Result<
      Invitation,
      typeof InvitationRepositoryError.FailedToCreateInvitation
    >
  > {
    const result = await this.db
      .insert(schema.invitation)
      .values({
        status: InvitationStatus.InProgress,
        createdAt: this.clock.now(),
        inviterEmail: invitationIn.inviter.email,
        inviterUsername: invitationIn.inviter.username,
        inviteeEmail: invitationIn.invitee.email,
      })
      .returning();

    const invitationInDb = result.at(0);

    if (!invitationInDb) {
      return err(InvitationRepositoryError.FailedToCreateInvitation);
    }

    return ok(this.fromDb(invitationInDb));
  }
  async findById(
    id: number,
  ): Promise<Result<Invitation, typeof InvitationRepositoryError.NotFound>> {
    const result = await this.db.query.invitation.findFirst({
      where: eq(schema.invitation.id, id),
    });

    if (!result) return err(InvitationRepositoryError.NotFound);

    return ok(this.fromDb(result));
  }

  private fromDb(
    dbModel: InferSelectModel<typeof schema.invitation>,
  ): Invitation {
    return Invitation.from({
      id: dbModel.id,
      createdAt: dbModel.createdAt,
      invitee: {
        email: dbModel.inviteeEmail,
      },
      inviter: {
        email: dbModel.inviterEmail,
        username: dbModel.inviterUsername,
      },
      status: dbModel.status,
      updatedAt: dbModel.updatedAt,
    });
  }

  async setInviteeEmail(
    id: number,
    email: string,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>> {
    const result = await this.db
      .update(schema.invitation)
      .set({
        inviteeEmail: email,
        updatedAt: this.clock.now(),
      })
      .where(eq(schema.invitation.id, id))
      .returning();

    if (result.length === 0) {
      return err(InvitationRepositoryError.NotFound);
    }

    return ok(undefined);
  }
}

class FakeInvitationRepository implements InvitationRepository {
  private lastId = 0;
  public readonly db = new Map<number, Invitation>();

  constructor(private readonly clock: Clock) {}
  revoke(
    id: number,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>> {
    const invitation = this.db.get(id);

    if (!invitation) {
      return Promise.resolve(err(InvitationRepositoryError.NotFound));
    }

    const updatedInvitation = Invitation.from({
      ...invitation,
      updatedAt: this.clock.now(),
      status: InvitationStatus.Revoked,
    });

    this.db.set(invitation.id, updatedInvitation);

    return Promise.resolve(ok(undefined));
  }

  findById(
    id: number,
  ): Promise<Result<Invitation, typeof InvitationRepositoryError.NotFound>> {
    if (!this.db.has(id)) {
      return Promise.resolve(err(InvitationRepositoryError.NotFound));
    }
    return Promise.resolve(ok(this.db.get(id)!));
  }

  create(
    invitationIn: InvitationForCreate,
  ): Promise<
    Result<
      Invitation,
      typeof InvitationRepositoryError.FailedToCreateInvitation
    >
  > {
    if (invitationIn.inviter.email === "shouldFail@example.com") {
      return Promise.resolve(
        err(InvitationRepositoryError.FailedToCreateInvitation),
      );
    }

    const invitation = Invitation.from({
      id: ++this.lastId,
      createdAt: this.clock.now(),
      status: InvitationStatus.InProgress,
      updatedAt: null,
      ...invitationIn,
    });

    this.db.set(invitation.id, invitation);

    return Promise.resolve(ok(invitation));
  }

  setInviteeEmail(
    id: number,
    email: string,
  ): Promise<Result<undefined, typeof InvitationRepositoryError.NotFound>> {
    const invitation = this.db.get(id);

    if (!invitation) {
      return Promise.resolve(err(InvitationRepositoryError.NotFound));
    }

    const updatedInvitation = Invitation.from({
      ...invitation,
      invitee: {
        email,
      },
      updatedAt: this.clock.now(),
    });

    this.db.set(id, updatedInvitation);

    return Promise.resolve(ok(undefined));
  }
}

export { FakeInvitationRepository, InvitationDrizzleRepository };
