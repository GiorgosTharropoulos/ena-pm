import { faker } from "@faker-js/faker";
import { beforeAll, describe, expect, inject, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import { getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { ok } from "@ena/services";
import { DrizzleUserRepository } from "@ena/services/repository";

describe("UserRepository", () => {
  let db: DrizzleDB;

  beforeAll(() => {
    db = getDrizzle(getPgClient(inject("dbConnectionUri")));
  }, 60_000);

  it("should insert a user", async () => {
    const repo = new DrizzleUserRepository(db);
    const userToInsert = {
      email: faker.internet.email(),
      id: faker.string.uuid(),
      password: faker.internet.password(),
    };

    const result = await repo.insert(userToInsert);

    const retrieved = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, userToInsert.id),
    });

    expect(retrieved).toBeDefined();
    expect(retrieved).toEqual(userToInsert);
    expect(result).toEqual(
      ok({
        id: userToInsert.id,
        email: userToInsert.email,
      }),
    );
  });

  it("should find a user by email", async () => {
    const user = await db
      .insert(schema.user)
      .values({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      })
      .returning()
      .then((row) => row[0]!);

    const repo = new DrizzleUserRepository(db);

    const result = await repo.findByEmail(user.email);

    expect(result).toEqual(ok(user));
  });
});
