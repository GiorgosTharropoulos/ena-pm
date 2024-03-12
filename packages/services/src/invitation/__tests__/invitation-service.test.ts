import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { InvitationForCreate } from "@ena/validators";
import { Invitation, InvitationStatus } from "@ena/domain";

import { FakeInvitationNotificationService } from "../../invitation-notification";
import {
  FakeInvitationRepository,
  InvitationRepositoryError,
} from "../../repository/invitation";
import { FakeTokenService } from "../../token-service";
import { fakeTimeProvider } from "../../utils/time-provider";
import {
  InvitationService,
  InvitationServiceError,
} from "../invitation-service";

const DATE_NOW = new Date("2021-01-01T00:00:00Z");
const getInvitationUrl = vi.fn(
  (token: string) => `http://example.com/invite/${token}`,
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("InvitationService", () => {
  let invitationService: InvitationService;
  let invitationRepository: FakeInvitationRepository;
  let tokenService: FakeTokenService;
  let notificationService: FakeInvitationNotificationService;

  beforeEach(() => {
    tokenService = new FakeTokenService();
    invitationRepository = new FakeInvitationRepository(
      fakeTimeProvider(DATE_NOW),
    );
    notificationService = new FakeInvitationNotificationService();
    invitationService = new InvitationService(
      invitationRepository,
      tokenService,
      notificationService,
      getInvitationUrl,
    );
  });

  describe("when creating an invite", () => {
    it("should return the create invitation error if it fails to create the invitation", async () => {
      // Arrange
      const notifySpy = vi.spyOn(notificationService, "notify");
      const invitationForCreate: InvitationForCreate = {
        invitee: { email: "to@example.com" },
        inviter: {
          email: "shouldFail@example.com",
          username: "from",
        },
      };

      // Act
      const result = await invitationService.create(invitationForCreate);

      // Assert
      expect(result).toEqual(
        err(InvitationRepositoryError.FailedToCreateInvitation),
      );
      expect(invitationRepository.db.size).toEqual(0);
      expect(getInvitationUrl).not.toHaveBeenCalled();
      expect(notifySpy).not.toHaveBeenCalled();
    });
    it("should return just the invitation if the invitee has no email", async () => {
      // Arrange
      const notifySpy = vi.spyOn(notificationService, "notify");
      const invitationForCreate: InvitationForCreate = {
        invitee: { email: null },
        inviter: {
          email: "from@example.com",
          username: "from",
        },
      };
      const invitation = Invitation.from({
        createdAt: DATE_NOW,
        id: 1,
        status: InvitationStatus.InProgress,
        updatedAt: null,
        ...invitationForCreate,
      });

      // Act
      const result = await invitationService.create(invitationForCreate);

      // Assert
      expect(result).toEqual(ok({ invitation }));
      expect(getInvitationUrl).not.toHaveBeenCalled();
      expect(notifySpy).not.toHaveBeenCalled();
    });
    it("should create the invitation and notify the invitee has an email", async () => {
      // Arrange
      const invitationForCreate: InvitationForCreate = {
        invitee: { email: "to@example.com" },
        inviter: {
          email: "from@example.com",
          username: "from",
        },
      };
      const invitation = Invitation.from({
        createdAt: DATE_NOW,
        id: 1,
        status: InvitationStatus.InProgress,
        updatedAt: null,
        ...invitationForCreate,
      });
      const notificationResult = ok({
        externalId: `fake-external-id-1`,
        id: 1,
      });

      // Act
      const result = await invitationService.create(invitationForCreate);

      // Assert
      expect(result).toEqual(ok({ invitation, notificationResult }));
    });
  });

  describe("when revoking an invitation", () => {
    it("should error if the invitation does not exist", async () => {
      const result = await invitationService.revoke(1);

      expect(result).toEqual(err(InvitationRepositoryError.NotFound));
    });

    it("should error if the invitation is already revoked", async () => {
      // Arrange
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.Revoked,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      // Act
      const result = await invitationService.revoke(1);

      // Assert
      expect(result).toEqual(
        err(InvitationServiceError.InvitationAlreadyRevoked),
      );
    });

    it("should error if the invitation is not in progress", async () => {
      // Arrange
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.Accepted,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );
      invitationRepository.db.set(
        2,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 2,
          status: InvitationStatus.Expired,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      // Act
      const result1 = await invitationService.revoke(1);
      const result2 = await invitationService.revoke(2);

      // Assert
      expect(result1).toEqual(err(InvitationServiceError.NotInProgress));
      expect(result2).toEqual(err(InvitationServiceError.NotInProgress));
    });

    it("should revoke the invitation otherwise", async () => {
      // Arrange
      const invitation = Invitation.from({
        createdAt: DATE_NOW,
        id: 1,
        status: InvitationStatus.InProgress,
        updatedAt: DATE_NOW,
        invitee: { email: "to@example.com" },
        inviter: { email: "from@example.com", username: "from" },
      });
      invitationRepository.db.set(1, invitation);

      // Act
      const result = await invitationService.revoke(1);

      // Assert
      expect(result).toEqual(ok(undefined));
    });
  });

  describe("sendNotification", () => {
    it("should error if the invitation does not exits", async () => {
      const result = await invitationService.sendNotification(1);

      expect(result).toEqual(err(InvitationRepositoryError.NotFound));
    });
    it("should error if the invitation does not have a status of InProgress", async () => {
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.Accepted,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );
      invitationRepository.db.set(
        2,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 2,
          status: InvitationStatus.Expired,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );
      invitationRepository.db.set(
        3,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 3,
          status: InvitationStatus.Revoked,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      const result1 = await invitationService.sendNotification(1);
      const result2 = await invitationService.sendNotification(2);
      const result3 = await invitationService.sendNotification(3);

      expect(result1).toEqual(err(InvitationServiceError.NotInProgress));
      expect(result2).toEqual(err(InvitationServiceError.NotInProgress));
      expect(result3).toEqual(err(InvitationServiceError.NotInProgress));
    });
    it("should error if the invitee has no email", async () => {
      // Arrange
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.InProgress,
          updatedAt: DATE_NOW,
          invitee: { email: null },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      // Act
      const result = await invitationService.sendNotification(1);

      // Assert
      expect(result).toEqual(err(InvitationServiceError.InviteeHasNoEmail));
    });
    it("should notify the invitee and return the notification result", async () => {
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.InProgress,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      // Act
      const result = await invitationService.sendNotification(1);

      // Assert
      expect(result).toEqual(ok({ externalId: "fake-external-id-1", id: 1 }));
    });
  });

  describe("setInvitee", () => {
    it("should error if the invitation is not found", async () => {
      const result = await invitationService.setInviteeEmail(
        1,
        "to@example.com",
      );

      expect(result).toEqual(err(InvitationRepositoryError.NotFound));
    });

    it("should error if the invitee of the invitation already has an email", async () => {
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.InProgress,
          updatedAt: DATE_NOW,
          invitee: { email: "to@example.com" },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      const result = await invitationService.setInviteeEmail(
        1,
        "update@example.com",
      );

      expect(result).toEqual(
        err(InvitationServiceError.InviteeAlreadyHasEmail),
      );
    });

    it("should return ok result if the invitee email is set", async () => {
      invitationRepository.db.set(
        1,
        Invitation.from({
          createdAt: DATE_NOW,
          id: 1,
          status: InvitationStatus.InProgress,
          updatedAt: DATE_NOW,
          invitee: { email: null },
          inviter: { email: "from@example.com", username: "from" },
        }),
      );

      const result = await invitationService.setInviteeEmail(
        1,
        "update@example.com",
      );

      expect(result).toEqual(ok(undefined));
    });
  });
});

// patakia lastixo 47E
// bros pisw 70E
// kalyma 75E lastixo
// 1648406780  42E
