import { faker } from "@faker-js/faker";

import type {
  EmailInsertSchema,
  EmailSelectSchema,
  OrganizationForInsert,
  OrganizationForSelect,
  OrganizationForUpdate,
  TeamForInsert,
  TeamForSelect,
  TeamForUpdate,
  UserForSelect,
} from "@ena/validators";

import type { Clock } from "../../utils/time-provider";
import type { EmailRepository } from "../email-repository";
import type { OrganizationRepository } from "../organization-repository";
import type { TeamRepository } from "../team-repository";
import type { UserRepository } from "../user-repository";
import { FakeRepository } from "./fake-repository";

export class FakeEmailRepository
  extends FakeRepository<EmailSelectSchema, EmailInsertSchema, void>
  implements EmailRepository
{
  private lastId = 0;
  public constructor(
    seed?: EmailSelectSchema[],
    private readonly clock?: Clock,
  ) {
    super({
      seed,
      mapInsertValue: (data) => ({
        ...data,
        id: faker.string.uuid(),
        createdAt: this.clock?.now() ?? new Date(),
        key: ++this.lastId,
      }),
    });
  }
}

export class FakeOrganizationRepository
  extends FakeRepository<
    OrganizationForSelect,
    OrganizationForInsert,
    OrganizationForUpdate
  >
  implements OrganizationRepository
{
  private lastId = 0;
  public constructor(
    seed?: OrganizationForSelect[],
    private readonly clock?: Clock,
  ) {
    super({
      seed,
      mapInsertValue: (data) => ({
        ...data,
        id: faker.string.uuid(),
        createdAt: this.clock?.now() ?? new Date(),
      }),
    });
  }
}

export class FakeTeamRepository
  extends FakeRepository<TeamForSelect, TeamForInsert, TeamForUpdate>
  implements TeamRepository
{
  private lastId = 0;
  public constructor(
    seed?: TeamForSelect[],
    private readonly clock?: Clock,
  ) {
    super({
      seed,
      mapInsertValue: (data) => ({
        ...data,
        id: faker.string.uuid(),
        createdAt: this.clock?.now() ?? new Date(),
        description: data.description ?? null,
      }),
    });
  }
}

export class FakeUserRepository
  extends FakeRepository<UserForSelect, void, void>
  implements UserRepository
{
  public constructor(seed?: UserForSelect[]) {
    super({
      seed,
      mapInsertValue: (_data) => {
        throw new Error("Not implemented");
      },
    });
  }
}
