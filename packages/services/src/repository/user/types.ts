import type { Result } from "neverthrow";

import type { InferInsertModel, InferSelectModel, schema } from "@ena/db";

import type { UnknownError } from "../../errors";
import type {
  InsertFailedRepositoryError,
  NotFoundRepositoryError,
  Repository,
} from "../types";

export type InsertUserModel = InferInsertModel<typeof schema.user>;
export type SelectUserModel = InferSelectModel<typeof schema.user>;

export interface UserRepository
  extends Omit<Repository<SelectUserModel, InsertUserModel, void>, "insert"> {
  insert(
    data: InsertUserModel,
  ): Promise<Result<InferSelectModel<typeof schema.user>, UserInsertionError>>;

  findByEmail(
    email: string,
  ): Promise<Result<SelectUserModel, NotFoundRepositoryError>>;
}

export const EmailAlreadyUsedError = {
  kind: "EMAIL_ALREADY_USED",
  message: "Email is already in use",
} as const;
type EmailAlreadyUsedError = typeof EmailAlreadyUsedError;

export type UserInsertionError =
  | EmailAlreadyUsedError
  | InsertFailedRepositoryError
  | UnknownError;
