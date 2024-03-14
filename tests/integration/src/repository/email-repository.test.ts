/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import { getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { DrizzleEmailRepository } from "@ena/services/repository";

import { migrateDB } from "../utils";

describe("EmailRepository", () => {
  let container: StartedPostgreSqlContainer;
  let db: DrizzleDB;

  async function createUser() {
    const r = await db
      .insert(schema.user)
      .values({
        email: "from@example.com",
      })
      .returning();
    return r[0]!;
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    await migrateDB(container);
    db = getDrizzle(getPgClient(container.getConnectionUri()));
  }, 60_000);

  afterAll(async () => {
    await container.stop();
  }, 60_000);

  it("should insert an email", async () => {
    const repository = new DrizzleEmailRepository(db);

    const user = await createUser();

    const email = {
      externalId: "123",
      fromKey: user.key,
      to: "to@example.com",
    };
    const insert = await repository.insert(email);

    const emailsInDb = await db.select().from(schema.email);

    expect(insert.isOk()).toBe(true);
    expect(emailsInDb).toHaveLength(1);
    expect(emailsInDb[0]).toEqual<(typeof emailsInDb)[number]>({
      createdAt: expect.any(Date),
      externalId: email.externalId,
      fromKey: user.key,
      key: 1,
      ref: expect.any(String),
      to: email.to,
    });
  });
});
