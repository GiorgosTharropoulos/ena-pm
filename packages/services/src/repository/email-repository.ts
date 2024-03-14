import type { Result } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type { EmailInsertSchema, EmailSelectSchema } from "@ena/validators";

import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "./types";
import { ModelRepository } from "./model-repository";

export type EmailRepository = Repository<
  EmailSelectSchema,
  EmailInsertSchema,
  void
>;

export class DrizzleEmailRepository implements EmailRepository {
  modelRepository: ModelRepository<"email">;

  constructor(private readonly db: DrizzleDB) {
    this.modelRepository = new ModelRepository(db, "email");
  }

  async insert(
    data: EmailInsertSchema,
  ): Promise<Result<EmailSelectSchema, InsertFailedRepositoryError>> {
    return this.modelRepository.insert(data);
  }

  update(): Promise<Result<EmailSelectSchema, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  remove(): Promise<Result<void, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  async find(
    ref: string,
  ): Promise<Result<EmailSelectSchema, NotFoundRepositoryError>> {
    return this.modelRepository.find(ref);
  }
}
