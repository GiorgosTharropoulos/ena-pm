import { fileURLToPath } from "node:url";
import type { DrizzleDB, SelectInvitation } from "@ena/db";
import type { Invitation } from "@ena/domain";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq, getDrizzle, schema } from "@ena/db";
import { getMigrationClient, getPgClient } from "@ena/db/utils";
import { InvitationStatus } from "@ena/domain";
import { err } from "@ena/services";
import { fakeTimeProvider } from "@ena/services/clock";
import {
  InvitationDrizzleRepository,
  InvitationRepositoryError,
} from "@ena/services/repository/invitation";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("InvitationRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: DrizzleDB;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    const sql = getMigrationClient(container.getConnectionUri());
    const migrationDb = getDrizzle(sql);
    const migrationsFolder = fileURLToPath(
      new URL("../../../packages/db/drizzle", import.meta.url),
    );
    await migrate(migrationDb, { migrationsFolder });
    await sql.end();
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
        revoked: false,
        updatedAt: null,
        status: InvitationStatus.InProgress,
        token: null,
      },
    ]);
  });

  describe("when setting a token to an invitation", () => {
    it("should return a not found error when the invitation does not exist", async () => {
      const now = new Date();
      const repository = new InvitationDrizzleRepository(
        db,
        fakeTimeProvider(now),
      );

      const actual = await repository.setToken(999999, "token");

      expect(actual).toEqual(
        err(InvitationRepositoryError.FailedToUpdateToken),
      );
    });

    it("should set the token if the invitation exists", async () => {
      const now = new Date();
      now.setMilliseconds(0);

      const [inserted] = await db
        .insert(schema.invitation)
        .values({
          createdAt: now,
          inviterEmail: "from@example.com",
          inviterUsername: "from",
          inviteeEmail: "to@example.com",
          revoked: false,
          status: InvitationStatus.InProgress,
          token: null,
        })
        .returning({ id: schema.invitation.id });

      const { id } = inserted ?? {};

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const repository = new InvitationDrizzleRepository(
        db,
        fakeTimeProvider(tomorrow),
      );

      await repository.setToken(id!, "token");

      const retrieved = await db.query.invitation.findFirst({
        where: eq(schema.invitation.id, id!),
      });

      expect(retrieved).toBeDefined();
      expect(retrieved).toMatchObject<Partial<SelectInvitation>>({
        updatedAt: tomorrow,
        id: id!,
        token: "token",
      });
    });
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
        revoked: expected.revoked,
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
    expect(retrieved._unsafeUnwrap()).toEqual<Invitation>({
      createdAt: expected.createdAt,
      id: id!,
      invitee: expected.invitee,
      inviter: expected.inviter,
      revoked: expected.revoked,
      status: expected.status,
      updatedAt: null,
      token: null,
    });
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
        revoked: false,
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
        revoked: true,
        status: InvitationStatus.Revoked,
        token: null,
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
