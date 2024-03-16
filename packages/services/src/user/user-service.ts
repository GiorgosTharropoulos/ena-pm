import { err, ok } from "neverthrow";

import type { CreateUserSchema } from "@ena/validators";

import type { AuthService } from "../auth/types";
import type { UnitOfWork } from "../unit-of-work";

export const IncorrectEmailOrPassword = {
  kind: "INCORRECT_EMAIL_OR_PASSWORD",
  message: "Incorrect email or password",
} as const;
export type IncorrectEmailOrPassword = typeof IncorrectEmailOrPassword;

export class UserService {
  private readonly auth: AuthService;
  private readonly uow: UnitOfWork;

  constructor(options: { uow: UnitOfWork; auth: AuthService }) {
    this.uow = options.uow;
    this.auth = options.auth;
  }

  async signupWithPassword(command: Readonly<CreateUserSchema>) {
    const hashedPassword = await this.auth.hashPassword(command.unsafePassword);
    const userId = this.auth.generateUserId(15);
    const userResult = await this.uow.transaction(async (tx) => {
      return await tx.repository.user.insert({
        email: command.email,
        id: userId,
        password: hashedPassword,
      });
    });

    if (userResult.isErr()) {
      return userResult.mapErr((err) => {
        if (err.kind === "UNKNOWN_ERROR") {
          const { kind, message } = err;
          return { kind, message };
        }
        return err;
      });
    }

    const session = await this.auth.createSession(userId);
    const { password: _, ...user } = userResult.value;

    return ok({ session, user });
  }

  async loginWithPassword(command: Readonly<CreateUserSchema>) {
    const userResult = await this.uow.transaction((tx) =>
      tx.repository.user.findByEmail(command.email),
    );

    if (userResult.isErr()) {
      return err(IncorrectEmailOrPassword);
    }

    if (userResult.value.password === null) {
      return err(IncorrectEmailOrPassword);
    }
    const { password: hashedPassword, ...user } = userResult.value;

    const isValid = await this.auth.validatePassword({
      hashedPassword,
      unsafePassword: command.unsafePassword,
    });

    if (!isValid) {
      return err(IncorrectEmailOrPassword);
    }

    const session = await this.auth.createSession(user.id);

    return ok({ session, user });
  }
}
