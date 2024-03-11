import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { Invitation } from "@ena/domain";
import type { InvitationForCreate } from "@ena/validators";
import { InvitationStatus } from "@ena/domain";

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

    const token = this.tokenService.sign({ id: createResult.value.id });
    const setTokenResult = await this.invitationRepository.setToken(
      createResult.value.id,
      token,
    );

    if (setTokenResult.isErr()) {
      return err(setTokenResult.error);
    }

    if (!obj.invitee.email) {
      return ok({ invitation: setTokenResult.value });
    }

    const invitationUrl = this.getInvitationUrl(token);
    const notificationResult = await this.notificationService.notify({
      callbackUrl: invitationUrl,
      inviter: obj.inviter,
      to: obj.invitee.email,
    });

    return ok({ invitation: setTokenResult.value, notificationResult });
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

    if (invitation.revoked) {
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
      | typeof InvitationRepositoryError.FailedToUpdateToken
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

    const to = invitation.invitee.email;
    const token = this.tokenService.sign({ id: invitation.id });
    const setTokenResult = await this.invitationRepository.setToken(
      invitation.id,
      token,
    );

    if (setTokenResult.isErr()) {
      return err(setTokenResult.error);
    }

    const callbackUrl = this.getInvitationUrl(token);
    const notificationResult = await this.notificationService.notify({
      callbackUrl,
      inviter: invitation.inviter,
      to,
    });

    return notificationResult;
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
}

export { InvitationService };
