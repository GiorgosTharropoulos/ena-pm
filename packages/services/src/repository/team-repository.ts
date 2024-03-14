import type { Result } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type {
  TeamForInsert,
  TeamForSelect,
  TeamForUpdate,
} from "@ena/validators";

import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "./types";
import { ModelRepository } from "./model-repository";

export type TeamRepository = Repository<
  TeamForSelect,
  TeamForInsert,
  TeamForUpdate
>;

export class DrizzleTeamRepository implements TeamRepository {
  modelRepository: ModelRepository<"team">;

  constructor(private readonly db: DrizzleDB) {
    this.modelRepository = new ModelRepository(db, "team");
  }

  async insert(
    data: TeamForInsert,
  ): Promise<Result<TeamForSelect, InsertFailedRepositoryError>> {
    return this.modelRepository.insert(data);
  }

  async update(
    ref: string,
    data: TeamForUpdate,
  ): Promise<Result<TeamForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.update(ref, data);
  }

  async find(
    ref: string,
  ): Promise<Result<TeamForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.find(ref);
  }

  async remove(ref: string): Promise<Result<void, NotFoundRepositoryError>> {
    return this.modelRepository.remove(ref);
  }
}
