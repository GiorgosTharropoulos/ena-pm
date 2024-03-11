import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DrizzleDB, InsertEmail, SelectEmail } from "@ena/db";
import { schema } from "@ena/db";

import type { Clock } from "../../utils/time-provider";

export const EmailRepositoryErrorKind = {
  NotFound: "EmailNotFound",
  InsertError: "InsertEmailError",
} as const;

const InsertError = {
  kind: EmailRepositoryErrorKind.NotFound,
  message: "Failed to insert email",
} as const;

export const EmailRepositoryError = {
  InsertError: InsertError,
} as const;

export interface EmailRepository {
  save(
    email: Omit<InsertEmail, "createdAt">,
  ): Promise<Result<SelectEmail, typeof EmailRepositoryError.InsertError>>;
}

export class DrizzleEmailRepository implements EmailRepository {
  constructor(
    private readonly db: DrizzleDB,
    private readonly clock: Clock,
  ) {}

  async save(
    email: Omit<InsertEmail, "createdAt">,
  ): Promise<Result<SelectEmail, typeof InsertError>> {
    const emailDb = await this.db
      .insert(schema.email)
      .values({ ...email, createdAt: this.clock.now() })
      .returning();

    const result = emailDb.at(0);

    if (!result) return err(EmailRepositoryError.InsertError);

    return ok(result);
  }
}
export class FakeEmailRepository implements EmailRepository {
  public readonly emails: SelectEmail[] = [];
  private idCounter = 1;
  constructor(private readonly clock: Clock) {}

  save(
    email: Omit<InsertEmail, "createdAt">,
  ): Promise<Result<SelectEmail, typeof InsertError>> {
    if (email.to === "fail@example.com") {
      return Promise.resolve(err(InsertError));
    }

    const newEmail: SelectEmail = {
      ...email,
      id: this.idCounter++,
      createdAt: this.clock.now(),
    };

    this.emails.push(newEmail);

    return Promise.resolve(ok(newEmail));
  }
}
