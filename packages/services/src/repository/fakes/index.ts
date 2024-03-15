import type { Result } from "neverthrow";
import { faker } from "@faker-js/faker";
import { err, ok } from "neverthrow";

import type {
  EmailInsertSchema,
  EmailSelectSchema,
  OrganizationForInsert,
  OrganizationForSelect,
  OrganizationForUpdate,
  TeamForInsert,
  TeamForSelect,
  TeamForUpdate,
  UserForInsert,
  UserForSelect,
} from "@ena/validators";

import type { Clock } from "../../utils/time-provider";
import type { EmailRepository } from "../email-repository";
import type { OrganizationRepository } from "../organization-repository";
import type { TeamRepository } from "../team-repository";
import type { UserInsertionError, UserRepository } from "../user-repository";
import { NotFoundRepositoryError } from "../types";
import { EmailAlreadyUsedError } from "../user-repository";
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

export class FakeUserRepository implements UserRepository {
  readonly db: Map<string, UserForSelect>;
  public constructor(seed?: UserForSelect[]) {
    this.db = new Map(seed?.map((u) => [u.id, u]) ?? []);
  }

  find(
    ref: string,
  ): Promise<Result<{ id: string; email: string }, NotFoundRepositoryError>> {
    const user = this.db.get(ref);
    if (!user) {
      return Promise.resolve(err(NotFoundRepositoryError));
    }
    return Promise.resolve(ok(user));
  }
  update(
    _ref: string,
    _data: void,
  ): Promise<
    Result<
      { id: string; email: string },
      {
        readonly kind: "NOT_FOUND_REPOSITORY_ERROR ";
        readonly message: "Not found";
      }
    >
  > {
    throw new Error("Method not implemented.");
  }
  remove(_ref: string): Promise<
    Result<
      void,
      {
        readonly kind: "NOT_FOUND_REPOSITORY_ERROR ";
        readonly message: "Not found";
      }
    >
  > {
    throw new Error("Method not implemented.");
  }

  insert(
    data: UserForInsert,
  ): Promise<Result<UserForSelect, UserInsertionError>> {
    const user = Array.from(this.db.values()).find(
      (u) => u.email === data.email,
    );
    if (user) {
      return Promise.resolve(err(EmailAlreadyUsedError));
    }

    const newUser = data;
    this.db.set(newUser.id, newUser);
    const { password: _, ...rest } = newUser;

    return Promise.resolve(ok(rest));
  }
}
