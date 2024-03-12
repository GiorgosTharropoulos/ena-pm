import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DrizzleDB, SelectInvitation } from "@ena/db";
import { eq, getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { Invitation, InvitationStatus } from "@ena/domain";
import { err } from "@ena/services";
import { fakeTimeProvider } from "@ena/services/clock";
import {
  InvitationDrizzleRepository,
  InvitationRepositoryError,
} from "@ena/services/repository/invitation";

import { migrateDB } from "../utils";

describe("InvitationRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: DrizzleDB;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    await migrateDB(container);
    db = getDrizzle(getPgClient(container.getConnectionUri()));
  });

  afterAll(async () => {
    await container.stop();
  });

  it("should create an invitation", async () => {
    const now = new Date();
    now.setMilliseconds(0);

    const repository = new InvitationDrizzleRepository(
      db,
      fakeTimeProvider(now),
    );

    const invitation = await repository.create({
      invitee: { email: "to@example.com" },
      inviter: { email: "from@example.com", username: "from" },
    });

    const invitationsInDb = await db.select().from(schema.invitation);

    expect(invitation.isOk()).toBe(true);
    expect(invitationsInDb).toHaveLength(1);
    expect(invitationsInDb).toEqual<SelectInvitation[]>([
      {
        createdAt: now,
        id: 1,
        inviteeEmail: "to@example.com",
        inviterEmail: "from@example.com",
        inviterUsername: "from",
        updatedAt: null,
        status: InvitationStatus.InProgress,
      },
    ]);
  });

  it("should be able to retrieve a created invitation", async () => {
    const now = new Date();
    now.setMilliseconds(0);

    const expected = {
      createdAt: now,
      invitee: { email: "to@example.com" },
      inviter: { email: "from@example.com", username: "from" },
      revoked: false,
      status: InvitationStatus.InProgress,
      token: null,
    };

    const [inserted] = await db
      .insert(schema.invitation)
      .values({
        createdAt: expected.createdAt,
        inviterEmail: expected.inviter.email,
        inviterUsername: expected.inviter.username,
        inviteeEmail: expected.invitee.email,
        status: expected.status,
      })
      .returning({ id: schema.invitation.id });

    const { id } = inserted ?? {};

    const repository = new InvitationDrizzleRepository(
      db,
      fakeTimeProvider(now),
    );

    const retrieved = await repository.findById(id!);

    expect(retrieved.isOk()).toBe(true);
    expect(retrieved._unsafeUnwrap()).toEqual(
      Invitation.from({
        createdAt: expected.createdAt,
        id: id!,
        invitee: expected.invitee,
        inviter: expected.inviter,
        status: expected.status,
        updatedAt: null,
      }),
    );
  });

  describe("when revoking an invitation", () => {
    it("should be able to revoke a created invitation", async () => {
      const now = new Date();
      now.setMilliseconds(0);

      const objIn = {
        createdAt: now,
        inviterEmail: "from@example.com",
        inviterUsername: "from",
        inviteeEmail: "to@example.com",
        status: InvitationStatus.InProgress,
      };
      const [inserted] = await db
        .insert(schema.invitation)
        .values(objIn)
        .returning({ id: schema.invitation.id });

      const { id } = inserted ?? {};

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const repository = new InvitationDrizzleRepository(
        db,
        fakeTimeProvider(tomorrow),
      );

      await repository.revoke(id!);

      const retrieved = await db.query.invitation.findFirst({
        where: eq(schema.invitation.id, id!),
      });

      expect(retrieved).toBeDefined();
      expect(retrieved).toEqual<SelectInvitation>({
        id: id!,
        ...objIn,
        updatedAt: tomorrow,
        status: InvitationStatus.Revoked,
      });
    });

    it("should return an error when revoking an invitation that does not exist", async () => {
      const now = new Date();
      const repository = new InvitationDrizzleRepository(
        db,
        fakeTimeProvider(now),
      );

      const actual = await repository.revoke(999999);

      expect(actual).toEqual(err(InvitationRepositoryError.NotFound));
    });
  });
});
