/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { faker } from "@faker-js/faker";
import { beforeAll, describe, expect, inject, it } from "vitest";

import type { DrizzleDB } from "@ena/db";
import { eq, getDrizzle, schema } from "@ena/db";
import { getPgClient } from "@ena/db/utils";
import { err, ok } from "@ena/services";
import {
  DrizzleTeamRepository,
  NotFoundRepositoryError,
} from "@ena/services/repository";

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

beforeAll(() => {
  db = getDrizzle(getPgClient(inject("dbConnectionUri")));
});

it("should insert a team", async () => {
  const organization = await createOrganization();

  const repo = new DrizzleTeamRepository(db);

  const team = {
    organizationId: organization.id,
    title: "title",
    description: "description",
  };

  const inserted = await repo.insert(team);

  const retrieved = await db.query.team.findMany();

  expect(inserted.isOk()).toBe(true);
  expect(retrieved).toHaveLength(1);
  expect(retrieved[0]).toEqual<(typeof retrieved)[number]>({
    id: expect.any(String),
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
        organizationId: organization.id,
        title: "title",
      })
      .returning()
      .then((r) => r.at(0)!);

    const repo = new DrizzleTeamRepository(db);

    const updatedValues = {
      title: "new title",
      description: "new description",
    };
    const updated = await repo.update(team.id, updatedValues);

    const retrieved = await db.query.team.findFirst({
      where: eq(schema.team.id, team.id),
    });

    expect(updated.isOk()).toBe(true);
    expect(retrieved).toEqual<typeof retrieved>({
      createdAt: expect.any(Date),
      id: team.id,
      organizationId: team.organizationId,
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
    const organization = await createOrganization();
    const team = await db
      .insert(schema.team)
      .values({
        organizationId: organization.id,
        title: "title",
      })
      .returning()
      .then((r) => r.at(0)!);

    const repo = new DrizzleTeamRepository(db);

    const retrieved = await repo.find(team.id);

    expect(retrieved).toEqual(ok(team));
  });
});
