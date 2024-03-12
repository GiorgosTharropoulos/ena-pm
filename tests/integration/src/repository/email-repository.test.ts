import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import { getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { fakeTimeProvider } from "@ena/services/clock";
import { DrizzleEmailRepository } from "@ena/services/repository/email";

import { migrateDB } from "../utils";

describe("EmailRepository", () => {
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

  it("should insert an email", async () => {
    const now = new Date();
    now.setMilliseconds(0);

    const repository = new DrizzleEmailRepository(db, fakeTimeProvider(now));

    const email = await repository.save({
      externalId: "123",
      from: "from",
      sender: "sender",
      to: "to",
    });

    const emailsInDb = await db.select().from(schema.email);

    expect(email.isOk()).toBe(true);
    expect(emailsInDb).toHaveLength(1);
    expect(emailsInDb).toEqual([
      {
        id: 1,
        createdAt: now,
        externalId: "123",
        from: "from",
        sender: "sender",
        to: "to",
      },
    ]);
  });
});
