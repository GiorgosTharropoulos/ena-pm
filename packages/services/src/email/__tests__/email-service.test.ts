import { err, ok } from "neverthrow";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resend } from "../../lib/resend";
import { EmailSendErrorKind, ResendEmailService } from "../email-service";

describe("ResendEmailService", () => {
  let service: ResendEmailService;

  beforeEach(() => {
    service = new ResendEmailService(resend);
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

  it("should return the external id", async () => {
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
        externalId: "email-id",
      }),
    );
  });
});
