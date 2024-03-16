import type { EnaLucia } from "@ena/auth";
import type { DrizzleDB } from "@ena/db";
import { Argon2id, createLucia, luciaGenerateId } from "@ena/auth";

import type { AuthService } from "./types";

export class LuciaAuthService implements AuthService {
  private readonly lucia: EnaLucia;
  private readonly argon: Argon2id;
  constructor(private readonly db: DrizzleDB) {
    this.lucia = createLucia({ db, cookieOptions: {} });
    this.argon = new Argon2id();
  }

  hashPassword(password: string): Promise<string> {
    return this.argon.hash(password);
  }

  validatePassword(options: {
    hashedPassword: string;
    unsafePassword: string;
  }) {
    return this.argon.verify(options.hashedPassword, options.unsafePassword);
  }

  createSession(userId: string) {
    return this.lucia.createSession(userId, {});
  }

  generateUserId(length: number) {
    return luciaGenerateId(length);
  }
}
