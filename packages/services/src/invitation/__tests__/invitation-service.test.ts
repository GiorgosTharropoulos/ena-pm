import { InvitationStatus } from "@ena/domain";
import { faker } from "@faker-js/faker";
import { expect, it } from "vitest";

import type { TokenService } from "../../token-service/types";
import { InvitationNotificationInMemoryService } from "../../invitation-notification/invitation-notification-in-memory-service";
import { InvitationInMemoryRepository } from "../../repository/invitation";
import { fakeTimeProvider } from "../../utils/time-provider";
import { InvitationService } from "../invitation-service";

const NOW_DATE = new Date("2022-01-01T00:00:00Z");
const clock = fakeTimeProvider(NOW_DATE);

const repo = new InvitationInMemoryRepository(clock);
const tokenService: TokenService = {
  sign(_payload: unknown): string {
    return "token";
  },
  verify(_token: string): unknown {
    return { id: 1 };
  },
};

const notificationService = new InvitationNotificationInMemoryService([]);

function getInvitationForCreation() {
  return {
    invitee: {
      email: faker.internet.email(),
      sms: faker.phone.number(),
      url: faker.internet.url(),
    },
    inviter: {
      email: faker.internet.email(),
      username: faker.internet.userName(),
    },
  };
}

it("should create invitation", async () => {
  const service = new InvitationService(
    repo,
    tokenService,
    notificationService,
  );
  const invitationForCreation = getInvitationForCreation();
  const expected = {
    createdAt: NOW_DATE,
    invitee: invitationForCreation.invitee,
    inviter: invitationForCreation.inviter,
    revoked: false,
    status: InvitationStatus.InProgress,
    token: "token",
    updatedAt: NOW_DATE,
  };

  const invitation = await service.createInvitation(invitationForCreation);

  expect(invitation).toMatchObject(expected);
  expect(notificationService.invites).toHaveLength(1);
  expect(notificationService.invites[0]).toMatchObject(expected);
});
