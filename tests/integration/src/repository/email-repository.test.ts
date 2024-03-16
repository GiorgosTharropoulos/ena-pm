/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeAll, describe, expect, inject, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import type { EmailInsertSchema } from "@ena/validators";
import { getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { DrizzleEmailRepository } from "@ena/services/repository";

describe("EmailRepository", () => {
  let db: DrizzleDB;

  async function createUser() {
    const r = await db
      .insert(schema.user)
      .values({
        id: "hello",
        email: "from@example.com",
      })
      .returning();
    return r[0]!;
  }

  beforeAll(() => {
    db = getDrizzle(getPgClient(inject("dbConnectionUri")));
  });

  it("should insert an email", async () => {
    const repository = new DrizzleEmailRepository(db);

    const user = await createUser();

    const email: EmailInsertSchema = {
      externalId: "123",
      to: "to@example.com",
      inviterId: user.id,
    };

    const insert = await repository.insert(email);

    const emailsInDb = await db.select().from(schema.email);

    expect(insert.isOk()).toBe(true);
    expect(emailsInDb).toHaveLength(1);
    expect(emailsInDb[0]).toEqual<(typeof emailsInDb)[number]>({
      createdAt: expect.any(Date),
      externalId: email.externalId,
      inviterId: user.id,
      to: email.to,
      id: expect.any(String),
    });
  });
});
