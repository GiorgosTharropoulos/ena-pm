import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";
import { InvitationStatus } from "@ena/domain";
import { invitationTokenPayloadSchema } from "@ena/validators";

import type { SendEmailFail, SendEmailSuccess } from "../email/email-service";
import type { InvitationNotificationService } from "../invitation-notification";
import type {
  InvitationRepository,
  InvitationRepositoryError,
} from "../repository/invitation";
import type { TokenService } from "../token-service/token-service";

const InvitationServiceErrorKind = {
  InvitationAlreadyRevoked: "InvitationAlreadyRevoked",
  NotInProgress: "NotInProgress",
  InviteeHasNoEmail: "InviteeHasNoEmail",
  InviteeAlreadyHasEmail: "InviteeAlreadyHasEmail",
} as const;
export const InvitationServiceError = {
  InvitationAlreadyRevoked: {
    kind: InvitationServiceErrorKind.InvitationAlreadyRevoked,
    message: "Invitation is already Revoked",
  } as const,
  NotInProgress: {
    kind: InvitationServiceErrorKind.NotInProgress,
    message: "Invitation is not in progress",
  },
  InviteeHasNoEmail: {
    kind: InvitationServiceErrorKind.InviteeHasNoEmail,
    message: "Invitee has no email",
  },
  InviteeAlreadyHasEmail: {
    kind: InvitationServiceErrorKind.InviteeAlreadyHasEmail,
    message: "Invitee already has an email",
  },
} as const;

export type CreateInvitationResult = Result<
  {
    invitation: Invitation;
    notificationResult?: Result<SendEmailSuccess, SendEmailFail>;
  },
  InvitationRepositoryError
>;

class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly tokenService: TokenService,
    private readonly notificationService: InvitationNotificationService,
    private readonly getInvitationUrl: (token: string) => string,
  ) {}

  async create(obj: InvitationForCreate): Promise<CreateInvitationResult> {
    const createResult = await this.invitationRepository.create(obj);

    if (createResult.isErr()) {
      return err(createResult.error);
    }

    if (!obj.invitee.email) {
      return ok({ invitation: createResult.value });
    }

    const notificationResult = await this.invite({
      invitation: createResult.value,
      to: obj.invitee.email,
    });

    return ok({ invitation: createResult.value, notificationResult });
  }

  async revoke(
    id: number,
  ): Promise<
    Result<
      undefined,
      | typeof InvitationServiceError.InvitationAlreadyRevoked
      | typeof InvitationServiceError.NotInProgress
      | typeof InvitationRepositoryError.NotFound
    >
  > {
    const invitationResult = await this.invitationRepository.findById(id);

    if (invitationResult.isErr()) {
      return err(invitationResult.error);
    }

    const invitation = invitationResult.value;

    if (invitation.isRevoked) {
      return err(InvitationServiceError.InvitationAlreadyRevoked);
    }

    if (invitation.status !== InvitationStatus.InProgress) {
      return err(InvitationServiceError.NotInProgress);
    }

    return this.invitationRepository.revoke(invitation.id);
  }

  async sendNotification(
    id: number,
  ): Promise<
    Result<
      SendEmailSuccess,
      | typeof InvitationRepositoryError.NotFound
      | typeof InvitationServiceError.NotInProgress
      | typeof InvitationServiceError.InviteeHasNoEmail
      | SendEmailFail
    >
  > {
    const findResult = await this.invitationRepository.findById(id);

    if (findResult.isErr()) {
      return err(findResult.error);
    }

    const invitation = findResult.value;

    if (invitation.status !== InvitationStatus.InProgress) {
      return err(InvitationServiceError.NotInProgress);
    }
    if (!invitation.invitee.email) {
      return err(InvitationServiceError.InviteeHasNoEmail);
    }

    return this.invite({ invitation, to: invitation.invitee.email });
  }

  async setInviteeEmail(
    id: number,
    email: string,
  ): Promise<
    Result<
      undefined,
      | typeof InvitationRepositoryError.NotFound
      | typeof InvitationServiceError.InviteeAlreadyHasEmail
    >
  > {
    const invitationResult = await this.invitationRepository.findById(id);

    if (invitationResult.isErr()) {
      return err(invitationResult.error);
    }

    if (invitationResult.value.invitee.email) {
      return err(InvitationServiceError.InviteeAlreadyHasEmail);
    }

    await this.invitationRepository.setInviteeEmail(
      invitationResult.value.id,
      email,
    );

    return ok(undefined);
  }

  async getInvitationFromToken(token: string) {
    const result = await this.tokenService.verify(token);

    if (result.isErr()) {
      return err(result.error);
    }

    const payload = invitationTokenPayloadSchema.safeParse(result.value);

    if (!payload.success) {
      return err("Invalid token payload");
    }

    return this.invitationRepository.findById(payload.data.id);
  }

  private async invite({
    invitation,
    to,
  }: {
    invitation: Pick<Invitation, "id" | "inviter">;
    to: string;
  }) {
    const { id, inviter } = invitation;

    const token = await this.tokenService.sign({ id });
    const callbackUrl = this.getInvitationUrl(token);
    return await this.notificationService.notify({
      callbackUrl,
      inviter,
      to,
    });
  }
}

export { InvitationService };
