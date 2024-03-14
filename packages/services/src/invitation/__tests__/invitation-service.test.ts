import { err } from "neverthrow";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FakeInvitationNotificationService } from "../../invitation-notification";
import {
  FakeEmailRepository,
  FakeTeamRepository,
  FakeUserRepository,
} from "../../repository/fakes";
import { FakeTokenService } from "../../token-service";
import { FakeUnitOfWork } from "../../unit-of-work/fake-unit-of-work";
import { InvitationService } from "../invitation-service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("when inviting a user", () => {
  it("should error when the team does not exist", async () => {
    const uow = new FakeUnitOfWork();
    const notificationService = new FakeInvitationNotificationService();
    const tokenService = new FakeTokenService();

    const service = new InvitationService(
      uow,
      notificationService,
      tokenService,
    );

    const result = await service.invite({
      teamRef: "team-ref",
      inviterRef: "inviter-ref",
      to: "to",
    });

    expect(result).toEqual(err("Team not found"));
  });

  it("should error when the inviter does not exist", async () => {
    const team = {
      ref: "team-ref",
      createdAt: new Date(),
      description: "description",
      key: 1,
      organizationKey: 1,
      title: "title",
    };
    const uow = new FakeUnitOfWork({
      team: new FakeTeamRepository([team]),
    });
    const notificationService = new FakeInvitationNotificationService();
    const tokenService = new FakeTokenService();

    const service = new InvitationService(
      uow,
      notificationService,
      tokenService,
    );

    const result = await service.invite({
      teamRef: team.ref,
      inviterRef: "inviter-ref",
      to: "to",
    });

    expect(result).toEqual(err("Inviter not found"));
  });

  it("should return an error when the notification service fails", async () => {
    const team = {
      ref: "team-ref",
      createdAt: new Date(),
      description: "description",
      key: 1,
      organizationKey: 1,
      title: "title",
    };
    const user = {
      email: "from@example.com",
      key: 1,
      ref: "user-ref",
    };
    const uow = new FakeUnitOfWork({
      team: new FakeTeamRepository([team]),
      user: new FakeUserRepository([user]),
    });
    const notificationService = new FakeInvitationNotificationService();
    const tokenService = new FakeTokenService();
    vi.spyOn(notificationService, "notify").mockResolvedValueOnce(
      err({
        kind: "EMAIL_NOT_SEND",
        message: "Failed to send email",
      }),
    );

    const service = new InvitationService(
      uow,
      notificationService,
      tokenService,
    );

    const result = await service.invite({
      teamRef: team.ref,
      inviterRef: user.ref,
      to: "to",
    });

    expect(result).toEqual(err("Failed to notify the recipient"));
  });

  it("should return ok even if the email is not inserted", async () => {
    const team = {
      ref: "team-ref",
      createdAt: new Date(),
      description: "description",
      key: 1,
      organizationKey: 1,
      title: "title",
    };
    const user = {
      email: "from@example.com",
      key: 1,
      ref: "user-ref",
    };
    const fakeEmailRepository = new FakeEmailRepository();
    const uow = new FakeUnitOfWork({
      team: new FakeTeamRepository([team]),
      user: new FakeUserRepository([user]),
      email: fakeEmailRepository,
    });
    const notificationService = new FakeInvitationNotificationService();
    const tokenService = new FakeTokenService();
    const spy = vi.spyOn(fakeEmailRepository, "insert").mockResolvedValueOnce(
      err({
        kind: "INSERTION_FAILED_REPOSITORY_ERROR",
        message: "Insert Failed",
      }),
    );

    const service = new InvitationService(
      uow,
      notificationService,
      tokenService,
    );

    const result = await service.invite({
      teamRef: team.ref,
      inviterRef: user.ref,
      to: "to",
    });

    expect(result._unsafeUnwrap()).toEqual(undefined);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should return ok if no errors occur", async () => {
    // Arrange
    const team = {
      ref: "team-ref",
      createdAt: new Date(),
      description: "description",
      key: 1,
      organizationKey: 1,
      title: "title",
    };
    const user = {
      email: "from@example.com",
      key: 1,
      ref: "user-ref",
    };
    const fakeEmailRepository = new FakeEmailRepository();
    const uow = new FakeUnitOfWork({
      team: new FakeTeamRepository([team]),
      user: new FakeUserRepository([user]),
      email: fakeEmailRepository,
    });
    const notificationService = new FakeInvitationNotificationService();
    const tokenService = new FakeTokenService();
    const to = "to@example.com";

    // Act
    const service = new InvitationService(
      uow,
      notificationService,
      tokenService,
    );

    const result = await service.invite({
      teamRef: team.ref,
      inviterRef: user.ref,
      to,
    });

    // Assert
    const expectedToken = JSON.stringify({
      to,
      teamRef: team.ref,
      inviterRef: user.ref,
    });
    const expectedUrl = new URL("https://ena.dev/invitation");
    expectedUrl.search = new URLSearchParams({
      token: expectedToken,
    }).toString();

    const notifyCommand = Array.from(notificationService.commands)[0];
    expect(notificationService.commands.size).toBe(1);
    expect(notifyCommand).toMatchObject({
      inviter: { email: user.email },
      to,
      team: { title: team.title },
      callbackUrl: expectedUrl,
    });

    const savedEmail = Array.from(fakeEmailRepository.db.values())[0];
    expect(fakeEmailRepository.db.size).toBe(1);
    expect(savedEmail).toMatchObject({
      fromKey: user.key,
      to,
      externalId: notifyCommand?.fakeId,
    });
    expect(result._unsafeUnwrap()).toEqual(undefined);
  });
});

describe("when validating a token", () => {
  it("should return an error if the token service fails", async () => {
    const tokenService = new FakeTokenService();
    const service = new InvitationService(
      new FakeUnitOfWork(),
      new FakeInvitationNotificationService(),
      tokenService,
    );

    vi.spyOn(tokenService, "verify").mockResolvedValueOnce(
      err({
        kind: "TokenExpired",
        message: "Token has expired",
      }),
    );

    const result = await service.validateInvitation("token");

    expect(result).toEqual(
      err({
        kind: "TokenExpired",
        message: "Token has expired",
      }),
    );
  });

  it("should return an error if the token payload is invalid", async () => {
    const service = new InvitationService(
      new FakeUnitOfWork(),
      new FakeInvitationNotificationService(),
      new FakeTokenService(),
    );

    const result = await service.validateInvitation(JSON.stringify("token"));

    expect(result).toEqual(
      err({
        kind: "INVALID_INVITATION_TOKEN_PAYLOAD",
        message: "Invalid payload",
      }),
    );
  });

  it("should return the payload if the token is valid", async () => {
    const tokenService = new FakeTokenService();
    const service = new InvitationService(
      new FakeUnitOfWork(),
      new FakeInvitationNotificationService(),
      tokenService,
    );
    const payload = {
      to: "to@example.com",
      teamRef: "team-ref",
      inviterRef: "inviter-ref",
    };
    const token = JSON.stringify(payload);

    const result = await service.validateInvitation(token);

    expect(result._unsafeUnwrap()).toEqual(payload);
  });
});
