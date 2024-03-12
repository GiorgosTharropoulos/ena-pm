import { render } from "@react-email/render";
import { ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Invitation, InvitationStatus } from "@ena/domain";

import type { SendEmailOptions } from "../../email/email-service";
import { FakeEmailService } from "../../email/email-service";
import { InvitationNotifier } from "../invitation-notification-service";

vi.mock("@react-email/render");

describe("InvitationNotifier", () => {
  let invitationNotifier: InvitationNotifier;
  let emailService: FakeEmailService;

  beforeEach(() => {
    emailService = new FakeEmailService();
    invitationNotifier = new InvitationNotifier(emailService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send an invitation email", async () => {
    vi.mocked(render).mockReturnValue("<p>email</p>");

    const to = "to@example.com";
    const callbackUrl = "https://example.com";
    const invitation = Invitation.from({
      createdAt: new Date(),
      id: 1,
      invitee: { email: to },
      inviter: { email: "sender@example.com", username: "sender" },
      status: InvitationStatus.InProgress,
      updatedAt: new Date(),
    });

    const actual = await invitationNotifier.notify({
      callbackUrl,
      inviter: invitation.inviter,
      to,
    });

    expect(actual).toEqual(ok({ externalId: "email-id-1", id: 1 }));
    expect(emailService.emailOptions).toHaveLength(1);
    expect(emailService.emailOptions.at(0)).toEqual<SendEmailOptions>({
      from: InvitationNotifier.FROM,
      html: "<p>email</p>",
      sender: invitation.inviter.email,
      subject: InvitationNotifier.SUBJECT,
      to,
    });
  });
});
