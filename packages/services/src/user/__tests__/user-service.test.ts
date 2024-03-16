import { err, ok } from "neverthrow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FakeAuthService } from "../../auth/fake-auth-service";
import { createUnknownError } from "../../errors";
import { InsertFailedRepositoryError } from "../../repository";
import { FakeUserRepository } from "../../repository/fakes";
import { FakeUnitOfWork } from "../../unit-of-work/fake-unit-of-work";
import { IncorrectEmailOrPassword, UserService } from "../user-service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("when signing up with a password", () => {
  it("should return an error if the insertion fails", async () => {
    // Arrange
    const userRepo = new FakeUserRepository();
    const service = new UserService({
      uow: new FakeUnitOfWork({ user: userRepo }),
      auth: new FakeAuthService(),
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
      uow: new FakeUnitOfWork({ user: userRepo }),
      auth: new FakeAuthService(),
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
    const auth = new FakeAuthService();
    const userRepo = new FakeUserRepository();
    const service = new UserService({
      uow: new FakeUnitOfWork({ user: userRepo }),
      auth,
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
    expect(auth.sessions).toEqual([expectedSession]);
  });
});

describe("when signing-in with a password", () => {
  it("should error if the user does not exists", async () => {
    const userRepo = new FakeUserRepository();
    const auth = new FakeAuthService();
    const service = new UserService({
      auth: auth,
      uow: new FakeUnitOfWork({ user: userRepo }),
    });

    const result = await service.loginWithPassword({
      email: "example@domain.com",
      unsafePassword: "PaSSwOrd!",
    });
    expect(result).toEqual(err(IncorrectEmailOrPassword));
  });

  it("should error if the password is incorrect", async () => {
    const savedUser = {
      email: "example@domain.com",
      id: "user-id",
      password: "hashed-password",
    };
    const userRepo = new FakeUserRepository([savedUser]);
    const auth = new FakeAuthService();
    const uow = new FakeUnitOfWork({ user: userRepo });
    const service = new UserService({ auth, uow });

    const result = await service.loginWithPassword({
      email: savedUser.email,
      unsafePassword: "incorrect-password",
    });

    expect(result).toEqual(err(IncorrectEmailOrPassword));
  });

  it("should error if the user created without a password", async () => {
    const user = {
      id: "user-id",
      email: "example@domain.com",
      password: null,
    };
    const userRepo = new FakeUserRepository([user]);
    const auth = new FakeAuthService();
    const uow = new FakeUnitOfWork({ user: userRepo });
    const service = new UserService({ auth, uow });

    const result = await service.loginWithPassword({
      email: "example@domain.com",
      unsafePassword: "password",
    });

    expect(result).toEqual(err(IncorrectEmailOrPassword));
  });

  it("should return the user and the session if the password is correct", async () => {
    const auth = new FakeAuthService();
    const fakePassword = await auth.hashPassword("password");
    const user = {
      id: "user-id",
      email: "example@domain.com",
      password: fakePassword,
    };
    const userRepo = new FakeUserRepository([user]);
    const uow = new FakeUnitOfWork({ user: userRepo });
    const service = new UserService({ auth, uow });
    const expectedUser = {
      id: user.id,
      email: user.email,
    };
    const expectedSession = {
      id: "session-id",
      userId: user.id,
      fresh: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresAt: expect.any(Date),
    };

    const result = await service.loginWithPassword({
      email: "example@domain.com",
      unsafePassword: "password",
    });

    expect(result).toEqual(
      ok({ user: expectedUser, session: expectedSession }),
    );
  });
});
