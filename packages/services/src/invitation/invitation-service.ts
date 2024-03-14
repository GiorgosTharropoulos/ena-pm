import { err, ok } from "neverthrow";

import { invitationTokenPayloadSchema } from "@ena/validators";

import type { InvitationNotificationService } from "../invitation-notification";
import type { TokenService } from "../token-service";
import type { UnitOfWork } from "../unit-of-work";
import type { CreateInvitationCommand } from "./commands";

export class InvitationService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly notificationService: InvitationNotificationService,
    private readonly tokenService: TokenService,
  ) {}

  async invite(command: CreateInvitationCommand) {
    const { inviterRef, teamRef, to } = command;
    return await this.uow.transaction(async (tx) => {
      const teamResult = await tx.repository.team.find(teamRef);
      if (teamResult.isErr()) {
        return teamResult.mapErr(() => "Team not found" as const);
      }

      const inviterResult = await tx.repository.user.find(inviterRef);
      if (inviterResult.isErr()) {
        return inviterResult.mapErr(() => "Inviter not found" as const);
      }

      const team = teamResult.value;
      const inviter = inviterResult.value;
      const tokenPayload = { to, teamRef: team.id, inviterRef: inviter.id };
      const token = await this.tokenService.sign(tokenPayload);
      const notificationResult = await this.notificationService.notify({
        to,
        inviter,
        callbackUrl: this.generateTokenURL(token),
        team,
      });

      if (notificationResult.isErr()) {
        return notificationResult.mapErr(
          () => "Failed to notify the recipient" as const,
        );
      }

      const { externalId } = notificationResult.value;
      const email = { externalId, inviterId: inviter.id, to };
      await tx.repository.email.insert(email);

      return ok(undefined);
    });
  }

  async validateInvitation(token: string) {
    const verificationResult = await this.tokenService.verify(token);

    if (verificationResult.isErr()) {
      return verificationResult;
    }

    const payload = invitationTokenPayloadSchema.safeParse(
      verificationResult.value,
    );

    if (!payload.success)
      return err({
        kind: "INVALID_INVITATION_TOKEN_PAYLOAD",
        message: "Invalid payload",
      } as const);

    return ok(payload.data);
  }

  private generateTokenURL(token: string) {
    const url = new URL("https://ena.dev/invitation");
    url.search = new URLSearchParams({ token }).toString();
    return url.toString();
  }
}
