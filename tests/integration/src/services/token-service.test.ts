import * as jose from "jose";
import { describe, expect, it, vi } from "vitest";

import { err, ok } from "@ena/services";
import { actualTimeProvider } from "@ena/services/clock";
import { JoseTokenService, TokenServiceError } from "@ena/services/token";

describe("JoseTokenService", () => {
  it("should sign and verify the token", async () => {
    const tokenService = new JoseTokenService({
      key: "NOT_SO_SECRET",
      clock: actualTimeProvider,
      expirationTime: "1h",
    });

    const token = await tokenService.sign({ id: 1 });
    const payload = await tokenService.verify(token);

    expect(payload).toMatchObject(ok({ id: 1 }));
  });

  it("should return an error when verifying a token signed with another signature", async () => {
    const tokenService = new JoseTokenService({
      key: "NOT_SO_SECRET",
      clock: actualTimeProvider,
      expirationTime: "1h",
    });

    const jwt = await new jose.SignJWT({ id: 1 })
      .setProtectedHeader({ alg: "HS256" })
      .sign(new TextEncoder().encode("another"));

    const payload = await tokenService.verify(jwt);

    expect(payload).toEqual(
      err(TokenServiceError.Verification.UnknownSignatureError),
    );
  });

  it("should return an error when the token is expired", async () => {
    // Arrange
    const tokenService = new JoseTokenService({
      key: "NOT_SO_SECRET",
      clock: actualTimeProvider,
      expirationTime: "2d",
    });
    const jwt = await tokenService.sign({ id: 1 });

    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    vi.useFakeTimers();
    vi.setSystemTime(threeDaysLater);

    // Act
    const payload = await tokenService.verify(jwt);

    vi.useRealTimers();

    // Assert
    expect(payload).toEqual(err(TokenServiceError.Verification.TokenExpired));
  });
});
