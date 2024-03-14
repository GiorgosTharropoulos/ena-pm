import type { Result } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type { UserForSelect } from "@ena/validators";

import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "./types";
import { ModelRepository } from "./model-repository";

export type UserRepository = Repository<UserForSelect, void, void>;

export class DrizzleUserRepository implements UserRepository {
  modelRepository: ModelRepository<"user">;

  constructor(private readonly db: DrizzleDB) {
    this.modelRepository = new ModelRepository(db, "user");
  }

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
    return this.modelRepository.find(ref);
  }
}
