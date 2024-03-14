import type { Result } from "neverthrow";
import * as React from "react";
import { render } from "@react-email/render";
import { ok } from "neverthrow";

import { InvitationEmail } from "@ena/email-templates";

import type {
  EmailService,
  SendEmailFail,
  SendEmailSuccess,
} from "../email/email-service";

export interface InvitationNotificationCommand {
  inviter: { email: string };
  to: string;
  callbackUrl: string;
  team: { title: string };
}

export interface InvitationNotificationService {
  notify(
    command: InvitationNotificationCommand,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>>;
}

export class InvitationNotifier implements InvitationNotificationService {
  static FROM = "welcome@gtharopoulos.dev";
  static SUBJECT = "Welcome to ENA!";

  constructor(private readonly emailService: EmailService) {}

  async notify(
    command: InvitationNotificationCommand,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>> {
    const { to, inviter, callbackUrl, team } = command;

    return this.emailService.send({
      from: InvitationNotifier.FROM,
      to,
      subject: InvitationNotifier.SUBJECT,
      sender: inviter.email,
      html: render(
        <InvitationEmail
          inviter={inviter}
          inviteLink={callbackUrl}
          to={to}
          previewText={`You have been invited to join ${team.title}!`}
          teamImage="https://upload.wikimedia.org/wikipedia/commons/e/e6/Ena_Channel_Kavala_logo.png"
          teamName={team.title}
        />,
      ),
    });
  }
}

export class FakeInvitationNotificationService
  implements InvitationNotificationService
{
  private lastId = 0;

  public commands = new Set<
    InvitationNotificationCommand & { fakeId: string }
  >();

  notify(
    command: InvitationNotificationCommand,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>> {
    this.lastId++;
    const externalId = `fake-external-id-${this.lastId}`;
    this.commands.add({
      ...command,
      fakeId: externalId,
    });
    return Promise.resolve(
      ok({
        externalId,
        id: this.lastId++,
      }),
    );
  }
}
