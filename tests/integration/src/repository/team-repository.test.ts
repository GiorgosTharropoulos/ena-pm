/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { faker } from "@faker-js/faker";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import { eq, getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { err, ok } from "@ena/services";
import {
  DrizzleTeamRepository,
  NotFoundRepositoryError,
} from "@ena/services/repository";

import { migrateDB } from "../utils";

let container: StartedPostgreSqlContainer;
let db: DrizzleDB;

async function createOrganization() {
  return await db
    .insert(schema.organization)
    .values({
      title: "title",
      createdAt: new Date(),
      description: "description",
    })
    .returning()
    .then((row) => row.at(0))
    .then((row) => row!);
}

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  await migrateDB(container);
  db = getDrizzle(getPgClient(container.getConnectionUri()));
}, 60_000);

afterAll(async () => {
  await container.stop();
}, 60_000);

it("should insert a team", async () => {
  const organization = await createOrganization();

  const repo = new DrizzleTeamRepository(db);

  const team = {
    organizationKey: organization.key,
    title: "title",
    description: "description",
  };

  const inserted = await repo.insert(team);

  const retrieved = await db.query.team.findMany();

  expect(inserted.isOk()).toBe(true);
  expect(retrieved).toHaveLength(1);
  expect(retrieved[0]).toEqual({
    key: expect.any(Number),
    ref: expect.any(String),
    createdAt: expect.any(Date),
    ...team,
  });
});

describe("when updating a team", () => {
  it("should update a team if the team exists", async () => {
    const organization = await createOrganization();
    const team = await db
      .insert(schema.team)
      .values({
        organizationKey: organization.key,
        title: "title",
      })
      .returning()
      .then((r) => r.at(0)!);

    const repo = new DrizzleTeamRepository(db);

    const updatedValues = {
      title: "new title",
      description: "new description",
    };
    const updated = await repo.update(team.ref, updatedValues);

    const retrieved = await db.query.team.findFirst({
      where: eq(schema.team.key, team.key),
    });

    expect(updated.isOk()).toBe(true);
    expect(retrieved).toEqual<typeof retrieved>({
      createdAt: expect.any(Date),
      key: team.key,
      organizationKey: team.organizationKey,
      ref: team.ref,
      description: updatedValues.description,
      title: updatedValues.title,
    });
  });

  it("should return not found error if the team does not exist", async () => {
    const repo = new DrizzleTeamRepository(db);

    const updated = await repo.update(faker.string.uuid(), {
      title: "new title",
      description: "new description",
    });

    expect(updated).toEqual(err(NotFoundRepositoryError));
  });
});

describe("when finding a team", () => {
  it("should return not found error if the team does not exist", async () => {
    const repo = new DrizzleTeamRepository(db);

    const found = await repo.find(faker.string.uuid());

    expect(found).toEqual(err(NotFoundRepositoryError));
  });

  it("should return the team if it exists", async () => {
    const organizationId = await createOrganization();
    const team = await db
      .insert(schema.team)
      .values({
        organizationKey: organizationId.key,
        title: "title",
      })
      .returning()
      .then((r) => r.at(0)!);

    const repo = new DrizzleTeamRepository(db);

    const retrieved = await repo.find(team.ref);

    expect(retrieved).toEqual(ok(team));
  });
});
