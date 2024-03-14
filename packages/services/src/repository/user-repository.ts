import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type { UserForSelect } from "@ena/validators";

import type { InsertFailedRepositoryError, Repository } from "./types";
import { NotFoundRepositoryError } from "./types";

export type UserRepository = Repository<UserForSelect, void, void>;

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleDB) {}

  insert(): Promise<Result<UserForSelect, InsertFailedRepositoryError>> {
    throw new Error("Not implemented");
  }

  update(): Promise<Result<UserForSelect, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  remove(): Promise<Result<void, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  async find(
    ref: string,
  ): Promise<Result<UserForSelect, NotFoundRepositoryError>> {
    const user = await this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ref),
    });

    if (!user) return err(NotFoundRepositoryError);
    return ok(user);
  }
}
