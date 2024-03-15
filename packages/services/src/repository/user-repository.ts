import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import type { UserForInsert, UserForSelect } from "@ena/validators";
import { PostgresError, schema } from "@ena/db";

import type { UnknownError } from "../errors";
import type { Repository } from "./types";
import { createUnknownError } from "../errors";
import { InsertFailedRepositoryError, NotFoundRepositoryError } from "./types";

export interface UserRepository
  extends Omit<Repository<UserForSelect, UserForInsert, void>, "insert"> {
  insert(
    data: UserForInsert,
  ): Promise<Result<UserForSelect, UserInsertionError>>;
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

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleDB) {}

  async insert(
    data: UserForInsert,
  ): Promise<Result<UserForSelect, UserInsertionError>> {
    try {
      const rows = await this.db.insert(schema.user).values(data).returning({
        id: schema.user.id,
        email: schema.user.email,
      });
      const row = rows[0];

      if (!row) return err(InsertFailedRepositoryError);
      return ok(row);
    } catch (error) {
      if (error instanceof PostgresError && error.code === "23505") {
        return err(EmailAlreadyUsedError);
      }
      return err(createUnknownError(error));
    }
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
