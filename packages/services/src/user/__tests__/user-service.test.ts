import { err, ok } from "neverthrow";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Session } from "@ena/auth";

import { createUnknownError } from "../../errors";
import { InsertFailedRepositoryError } from "../../repository";
import { FakeUserRepository } from "../../repository/fakes";
import { FakeUnitOfWork } from "../../unit-of-work/fake-unit-of-work";
import { UserService } from "../user-service";

const sessionService = {
  sessions: new Array<Session>(),
  createSession(userId: string) {
    const session = {
      expiresAt: new Date(),
      fresh: true,
      id: "session-id",
      userId,
    };
    this.sessions.push(session);
    return session;
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("when signing up with a password", () => {
  it("should return an error if the insertion fails", async () => {
    // Arrange
    const userRepo = new FakeUserRepository();
    const service = new UserService({
      hash: (str) => Promise.resolve(str),
      uow: new FakeUnitOfWork({ user: userRepo }),
      sessionService,
      userIdGenerator: () => "user-id-generated",
    });
    const insertionReturnedValue = err(InsertFailedRepositoryError);

    vi.spyOn(userRepo, "insert").mockResolvedValueOnce(insertionReturnedValue);

    // Act
    const result = await service.signupWithPassword({
      email: "email@example.com",
      unsafePassword: "password",
    });

    // Assert
    expect(result).toEqual(insertionReturnedValue);
  });

  it("should remove the unsafeError in the case where an unknown error is returned", async () => {
    // Arrange
    const userRepo = new FakeUserRepository();
    const service = new UserService({
      hash: (str) => Promise.resolve(str),
      uow: new FakeUnitOfWork({ user: userRepo }),
      sessionService,
      userIdGenerator: () => "user-id-generated",
    });
    const insertionReturnedValue = createUnknownError(
      new Error("unknown error"),
    );

    vi.spyOn(userRepo, "insert").mockResolvedValueOnce(
      err(insertionReturnedValue),
    );

    const { kind, message } = insertionReturnedValue;
    const expected = err({ kind, message });

    // Act
    const result = await service.signupWithPassword({
      email: "email@example.com",
      unsafePassword: "password",
    });

    // Assert
    expect(result).toEqual(expected);
    expect(result._unsafeUnwrapErr).not.toHaveProperty("unsafeError");
  });

  it("should return the user and the session if the insertion is successful", async () => {
    // Arrange
    const userRepo = new FakeUserRepository();
    const service = new UserService({
      hash: (str) => Promise.resolve(`${str}-hashed`),
      uow: new FakeUnitOfWork({ user: userRepo }),
      sessionService,
      userIdGenerator: () => "user-id-generated",
    });
    const command = {
      email: "email@example.com",
      unsafePassword: "password",
    };
    const expectedUser = {
      email: command.email,
      id: "user-id-generated",
    };
    const expectedSession = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresAt: expect.any(Date),
      fresh: true,
      id: "session-id",
      userId: expectedUser.id,
    };

    // Act
    const result = await service.signupWithPassword(command);

    // Assert
    expect(result).toEqual(
      ok({
        session: expectedSession,
        user: expectedUser,
      }),
    );
    expect(userRepo.db.get(expectedUser.id)).toEqual({
      ...expectedUser,
      password: `${command.unsafePassword}-hashed`,
    });
    expect(sessionService.sessions).toEqual([expectedSession]);
  });
});
