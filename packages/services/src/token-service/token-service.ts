import type { Result } from "neverthrow";
import { errors as joseErrors, jwtVerify, SignJWT } from "jose";
import { err, ok } from "neverthrow";

import type { Clock } from "../utils/time-provider";

const TokenExpiredError = {
  kind: "TokenExpired",
  message: "Token has expired",
} as const;

const UnknownSignatureError = {
  kind: "UnknownSignature",
  message: "Signature verification failed",
} as const;

const unknownTokenVerifyError = (error: unknown) =>
  ({
    kind: "UnknownTokenVerificationError",
    message: "Unknown error occurred while validating token",
    error,
  }) as const;

type TokenVerificationError =
  | typeof TokenExpiredError
  | typeof UnknownSignatureError
  | ReturnType<typeof unknownTokenVerifyError>;

export const TokenServiceError = {
  Verification: {
    TokenExpired: TokenExpiredError,
    UnknownSignatureError: UnknownSignatureError,
    Unknown: unknownTokenVerifyError,
  },
} as const;

export interface TokenService {
  sign(payload: Record<string, unknown>): Promise<string>;
  verify<T>(token: string): Promise<Result<T, TokenVerificationError>>;
}

export class FakeTokenService implements TokenService {
  sign(payload: Record<string, unknown>): Promise<string> {
    return Promise.resolve(JSON.stringify(payload));
  }

  verify<T>(token: string): Promise<Result<T, TokenVerificationError>> {
    return Promise.resolve(ok(JSON.parse(token) as T));
  }
}

export class JoseTokenService implements TokenService {
  private readonly key: Uint8Array;
  private readonly clock: Clock;
  private static readonly Algorithm = "HS256";
  private readonly expirationTime: string;

  constructor(args: { key: string; clock: Clock; expirationTime: string }) {
    this.key = new TextEncoder().encode(args.key);
    this.clock = args.clock;
    this.expirationTime = args.expirationTime;
  }

  sign(payload: Record<string, unknown>): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: JoseTokenService.Algorithm })
      .setIssuedAt(this.clock.now())
      .setExpirationTime(this.expirationTime)
      .sign(this.key);
  }

  async verify<T>(token: string): Promise<Result<T, TokenVerificationError>> {
    try {
      const { payload } = await jwtVerify<T>(token, this.key, {
        currentDate: this.clock.now(),
      });

      return ok(payload);
    } catch (error) {
      switch (true) {
        case error instanceof joseErrors.JWTExpired:
          return err(TokenExpiredError);
        case error instanceof joseErrors.JWSSignatureVerificationFailed:
          return err(UnknownSignatureError);
        default:
          return err(unknownTokenVerifyError(error));
      }
    }
  }
}
