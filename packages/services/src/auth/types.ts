import type { Session } from "@ena/auth";

type PasswordHasher = (password: string) => Promise<string>;
type PasswordVerifier = (options: {
  hashedPassword: string;
  unsafePassword: string;
}) => Promise<boolean>;

export interface AuthService {
  hashPassword: PasswordHasher;
  validatePassword: PasswordVerifier;
  createSession: (userId: string) => Promise<Session>;
  generateUserId: (length: number) => string;
}
