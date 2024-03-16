import type { Session } from "@ena/auth";

import type { AuthService } from "./types";

export class FakeAuthService implements AuthService {
  readonly sessions: Session[];
  constructor(sessions?: Session[]) {
    this.sessions = sessions ?? [];
  }
  hashPassword(password: string): Promise<string> {
    return Promise.resolve(`${password}-hashed`);
  }

  async validatePassword(options: {
    hashedPassword: string;
    unsafePassword: string;
  }) {
    const { hashedPassword, unsafePassword } = options;
    const rehashed = await this.hashPassword(unsafePassword);
    return rehashed === hashedPassword;
  }

  createSession(userId: string) {
    const session = {
      expiresAt: new Date(),
      fresh: true,
      id: "session-id",
      userId,
    };
    this.sessions.push(session);
    return Promise.resolve(session);
  }

  generateUserId(_length: number) {
    return "user-id-generated";
  }
}
