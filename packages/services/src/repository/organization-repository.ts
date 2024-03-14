import type { Result } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type {
  OrganizationForInsert,
  OrganizationForSelect,
  OrganizationForUpdate,
} from "@ena/validators";

import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "./types";
import { ModelRepository } from "./model-repository";

export type OrganizationRepository = Repository<
  OrganizationForSelect,
  OrganizationForInsert,
  OrganizationForUpdate
>;

export class DrizzleOrganizationRepository implements OrganizationRepository {
  modelRepository: ModelRepository<"organization">;

  constructor(private readonly db: DrizzleDB) {
    this.modelRepository = new ModelRepository(db, "organization");
  }

  async insert(
    data: OrganizationForInsert,
  ): Promise<Result<OrganizationForSelect, InsertFailedRepositoryError>> {
    return this.modelRepository.insert(data);
  }

  async update(
    ref: string,
    data: OrganizationForUpdate,
  ): Promise<Result<OrganizationForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.update(ref, data);
  }

  async find(
    ref: string,
  ): Promise<Result<OrganizationForSelect, NotFoundRepositoryError>> {
    return this.modelRepository.find(ref);
  }

  async remove(ref: string): Promise<Result<void, NotFoundRepositoryError>> {
    return this.modelRepository.remove(ref);
  }
}
