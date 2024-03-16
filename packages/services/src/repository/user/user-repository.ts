import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DrizzleDB } from "@ena/db";
import { eq, PostgresError, schema } from "@ena/db";

import type {
  InsertUserModel,
  SelectUserModel,
  UserInsertionError,
  UserRepository,
} from "./types";
import { createUnknownError } from "../../errors";
import { InsertFailedRepositoryError, NotFoundRepositoryError } from "../types";
import { EmailAlreadyUsedError } from "./types";

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: DrizzleDB) {}

  async insert(
    data: InsertUserModel,
  ): Promise<Result<SelectUserModel, UserInsertionError>> {
    try {
      const rows = await this.db.insert(schema.user).values(data).returning();
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

  update(): Promise<Result<SelectUserModel, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  remove(): Promise<Result<void, NotFoundRepositoryError>> {
    throw new Error("Not implemented");
  }

  async find(
    id: string,
  ): Promise<Result<SelectUserModel, NotFoundRepositoryError>> {
    const user = await this.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, id),
    });

    if (!user) return err(NotFoundRepositoryError);
    return ok(user);
  }

  async findByEmail(
    email: string,
  ): Promise<Result<SelectUserModel, NotFoundRepositoryError>> {
    const user = await this.db
      .select({
        id: schema.user.id,
        password: schema.user.password,
        email: schema.user.email,
      })
      .from(schema.user)
      .where(eq(schema.user.email, email))
      .limit(1)
      .then((r) => r[0]);

    if (!user) return err(NotFoundRepositoryError);
    return ok(user);
  }
}
