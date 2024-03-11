import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SelectEmail } from "@ena/db";

import type { SendEmailOptions } from "../email-service";
import { resend } from "../../lib/resend";
import { FakeEmailRepository } from "../../repository/emails";
import { fakeTimeProvider } from "../../utils/time-provider";
import { EmailSendErrorKind, ResendEmailService } from "../email-service";

const NOW_DATE = new Date("2021-01-01T00:00:00Z");

describe("ResendEmailService", () => {
  let service: ResendEmailService;
  let emailRepository: FakeEmailRepository;

  beforeEach(() => {
    emailRepository = new FakeEmailRepository(fakeTimeProvider(NOW_DATE));
    service = new ResendEmailService(resend, emailRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return an error if the sending of email fails", async () => {
    vi.spyOn(resend.emails, "send").mockResolvedValueOnce({
      error: { message: "Failed to send email", name: "internal_server_error" },
      data: null,
    });

    const actual = await service.send({
      from: "from@example.com",
      html: "<p>hello</p>",
      sender: "sender@domain.com",
      subject: "subject",
      to: "delivered@resend.dev",
    });

    expect(actual).toEqual(
      err({
        kind: EmailSendErrorKind.EmailNotSend,
        message: "Failed to send email",
      }),
    );
  });

  it("should return an error if the send email method does not returns neither an error or data", async () => {
    vi.spyOn(resend.emails, "send").mockResolvedValueOnce({
      error: null,
      data: null,
    });

    const actual = await service.send({
      from: "from@example.com",
      html: "<p>hello</p>",
      sender: "sender@domain.com",
      subject: "subject",
      to: "delivered@resend.dev",
    });

    expect(actual).toEqual(
      err({
        kind: EmailSendErrorKind.EmailSendButNoDataReturned,
        message: "No email data returned, even though there was no error.",
      }),
    );
  });

  it("should return an error if the email was sent but could not be saved", async () => {
    vi.spyOn(resend.emails, "send").mockResolvedValueOnce({
      error: null,
      data: { id: "email-id" },
    });

    const actual = await service.send({
      from: "from@example.com",
      html: "<p>hello</p>",
      sender: "sender@domain.com",
      subject: "subject",
      to: "fail@example.com",
    });

    expect(actual).toEqual(
      err({
        kind: EmailSendErrorKind.EmailSendButNotSaved,
        message: "Email was sent, but it could not be saved",
      }),
    );
  });

  it("should return the saved email id and external id", async () => {
    vi.spyOn(resend.emails, "send").mockResolvedValueOnce({
      error: null,
      data: { id: "email-id" },
    });

    const actual = await service.send({
      from: "from@example.com",
      html: "<p>hello</p>",
      sender: "sender@domain.com",
      subject: "subject",
      to: "delivered@resend.dev",
    });

    expect(actual).toEqual(
      ok({
        id: 1,
        externalId: "email-id",
      }),
    );
  });

  it("should join the to field if it is an array", async () => {
    const externalId = "email-id";
    vi.spyOn(resend.emails, "send").mockResolvedValueOnce({
      error: null,
      data: { id: externalId },
    });

    const to = ["delivered1@resend.dev", "delivered2@resend.dev"];
    const options: SendEmailOptions = {
      from: "from@example.com",
      html: "<p>hello</p>",
      sender: "sender@domain.com",
      subject: "subject",
      to,
    };
    const actual = await service.send(options);

    expect(actual).toEqual(
      ok({
        id: 1,
        externalId: "email-id",
      }),
    );
    expect(emailRepository.emails).toHaveLength(1);
    expect(emailRepository.emails.at(0)).toEqual<SelectEmail>({
      createdAt: NOW_DATE,
      externalId,
      from: options.from,
      id: 1,
      sender: options.sender,
      to: to.join(","),
    });
  });
});
