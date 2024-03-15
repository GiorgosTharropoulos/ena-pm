import { ok } from "neverthrow";

import type { Session } from "@ena/auth";
import type { CreateUserSchema } from "@ena/validators";

import type { UnitOfWork } from "../unit-of-work";

type UserIdGenerator = (length: number) => string;
type PasswordHasher = (password: string) => Promise<string>;

export interface SessionService {
  createSession(userId: string): Session;
}

export class UserService {
  private readonly userIdGenerator: UserIdGenerator;
  private readonly hash: PasswordHasher;
  private readonly uow: UnitOfWork;
  private readonly sessionService: SessionService;

  constructor(options: {
    userIdGenerator: UserIdGenerator;
    uow: UnitOfWork;
    hash: PasswordHasher;
    sessionService: SessionService;
  }) {
    this.userIdGenerator = options.userIdGenerator;
    this.uow = options.uow;
    this.hash = options.hash;
    this.sessionService = options.sessionService;
  }

  async signupWithPassword(command: CreateUserSchema) {
    const hashedPassword = await this.hash(command.unsafePassword);
    const userId = this.userIdGenerator(15);
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

    const session = this.sessionService.createSession(userId);

    return ok({ session, user: userResult.value });
  }
}
