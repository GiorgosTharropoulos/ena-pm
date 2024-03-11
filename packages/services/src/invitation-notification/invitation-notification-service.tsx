import type { Result } from "neverthrow";
import React from "react";
import { render } from "@react-email/render";
import { ok } from "neverthrow";

import type { Inviter } from "@ena/domain";
import { InvitationEmail } from "@ena/email-templates";

import type {
  EmailService,
  SendEmailFail,
  SendEmailSuccess,
} from "../email/email-service";

export interface InvitationNotificationCommand {
  inviter: Inviter;
  to: string;
  callbackUrl: string;
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
    const { to, inviter, callbackUrl } = command;

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
          previewText="You have been invited to join ENA!"
          teamImage="https://upload.wikimedia.org/wikipedia/commons/e/e6/Ena_Channel_Kavala_logo.png"
          teamName="ENA"
        />,
      ),
    });
  }
}

export class FakeInvitationNotificationService
  implements InvitationNotificationService
{
  private lastId = 1;

  public commands = new Map<number, InvitationNotificationCommand>();

  notify(
    _command: InvitationNotificationCommand,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>> {
    this.commands = this.commands.set(this.lastId, _command);
    return Promise.resolve(
      ok({
        externalId: `fake-external-id-${this.lastId}`,
        id: this.lastId++,
      }),
    );
  }
}
