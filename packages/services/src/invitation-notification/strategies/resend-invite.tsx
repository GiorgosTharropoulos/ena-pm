import type { Invitation } from "@ena/domain";
import type { Resend } from "resend";
import * as React from "react";
import { InvitationEmail } from "@ena/email-templates";

import type { InviteNotificationStrategy } from "./type";

class ResendNotification implements InviteNotificationStrategy {
  static FROM = "welcome@gtharopoulos.dev";
  static SUBJECT = "Welcome to ENA!";

  constructor(private readonly resend: Resend) {}

  async notify(invitation: Invitation): Promise<void> {
    if (!invitation.invitee.email) {
      return;
    }

    const { inviter } = invitation;
    const email = invitation.invitee.email;

    await this.resend.emails.send({
      from: ResendNotification.FROM,
      to: email,
      subject: ResendNotification.SUBJECT,
      react: (
        <InvitationEmail
          inviter={inviter}
          inviteLink="http://localhost:3000/accept-invite"
          email={email}
          previewText="You have been invited to join ENA!"
          teamImage="https://upload.wikimedia.org/wikipedia/commons/e/e6/Ena_Channel_Kavala_logo.png"
          teamName="ENA"
        />
      ),
    });
  }
}

export { ResendNotification };
