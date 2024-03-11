import type { Result } from "neverthrow";
import type { Resend } from "resend";
import { err, ok } from "neverthrow";

import type { SelectEmail } from "@ena/db";

import type { EmailRepository } from "../repository/emails";

/**
 * Options for sending an email.
 */
export interface SendEmailOptions {
  /**
   * Blind carbon copy recipient email address. For multiple addresses, send as an array of strings.
   */
  bcc?: string | string[];
  /**
   * Carbon copy recipient email address. For multiple addresses, send as an array of strings.
   */
  cc?: string | string[];
  /**
   * Sender email address. To include a friendly name, use the format `"Your Name <sender@domain.com>"`
   */
  from: string;
  /**
   * Email subject.
   */
  subject: string;
  /**
   * Recipient email address. For multiple addresses, send as an array of strings. Max 50.
   */
  to: string | string[];
  /**
   * The HTML content of the email.
   */
  html: string;
  /**
   * The plain text version of the message
   */
  text?: string;
  /**
   * The email address that initiated the email.
   */
  sender: string;
}

export const EmailSendErrorKind = {
  EmailSendButNotSaved: "EMAIL_SEND_BUT_NOT_SAVED",
  EmailNotSend: "EMAIL_NOT_SEND",
  EmailSendButNoDataReturned: "EMAIL_SEND_BUT_NO_DATA_RETURNED",
} as const;
export type EmailSendErrorKind =
  (typeof EmailSendErrorKind)[keyof typeof EmailSendErrorKind];

export const EmailServiceError = {
  EmailSentButNotSaved: {
    kind: EmailSendErrorKind.EmailSendButNotSaved,
    message: "Email was sent, but it could not be saved",
  } as const,
  EmailNotSend: (message: string) =>
    ({
      kind: EmailSendErrorKind.EmailNotSend,
      message,
    }) as const,
  EmailSendButNoDataReturned: {
    kind: EmailSendErrorKind.EmailSendButNoDataReturned,
    message: "No email data returned, even though there was no error.",
  } as const,
} as const;

export type SendEmailSuccess = Pick<SelectEmail, "id" | "externalId">;
export type SendEmailFail =
  | typeof EmailServiceError.EmailSentButNotSaved
  | ReturnType<typeof EmailServiceError.EmailNotSend>
  | typeof EmailServiceError.EmailSendButNoDataReturned;

export interface EmailService {
  send(
    options: SendEmailOptions,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>>;
}

export class ResendEmailService implements EmailService {
  constructor(
    private readonly resend: Resend,
    private readonly emailRepository: EmailRepository,
  ) {}

  async send(
    options: SendEmailOptions,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>> {
    const { data, error } = await this.resend.emails.send(options);

    if (error) return err(EmailServiceError.EmailNotSend(error.message));
    if (!data) return err(EmailServiceError.EmailSendButNoDataReturned);

    const saveEmailResult = await this.emailRepository.save({
      externalId: data.id,
      to: Array.isArray(options.to) ? options.to.join(",") : options.to,
      from: options.from,
      sender: options.sender,
    });

    return saveEmailResult
      .map((email) => ({
        id: email.id,
        externalId: email.externalId,
      }))
      .mapErr(() => EmailServiceError.EmailSentButNotSaved);
  }
}

export class FakeEmailService implements EmailService {
  private idCounter = 1;

  emailOptions: SendEmailOptions[] = [];

  send(
    options: SendEmailOptions,
  ): Promise<Result<SendEmailSuccess, SendEmailFail>> {
    if (options.to.includes("fail@example.com")) {
      return Promise.resolve(
        err(EmailServiceError.EmailNotSend("Failed to send email")),
      );
    }

    this.emailOptions.push(options);

    return Promise.resolve(
      ok({
        externalId: `email-id-${this.idCounter}`,
        id: this.idCounter++,
      }),
    );
  }
}
