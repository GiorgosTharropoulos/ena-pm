import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface InvitationEmailProps {
  inviter: { email: string };
  to: string;
  teamName: string;
  teamImage: string;
  inviteLink: string;
  previewText: string;
}

export function InvitationEmail({
  inviter,
  teamName,
  teamImage,
  inviteLink,
  previewText,
  to,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]"></Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              Join <strong>{teamName}</strong> on <strong>Ena PM</strong>
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hello {to},
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              <strong>{inviter.email}</strong> (
              <Link
                href={`mailto:${inviter.email}`}
                className="text-blue-600 no-underline"
              >
                {inviter.email}
              </Link>
              ) has invited you to the <strong>{teamName}</strong> team on{" "}
              <strong>Ena PM</strong>.
            </Text>
            <Section>
              <Row>
                <Column align="center">
                  <Img
                    className="rounded-full"
                    src={teamImage}
                    width="64"
                    height="64"
                  />
                </Column>
              </Row>
            </Section>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Join the team
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              or copy and paste this URL into your browser:{" "}
              <Link href={inviteLink} className="text-blue-600 no-underline">
                {inviteLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              This invitation was intended for{" "}
              <span className="text-black">{to}</span>. If you were not
              expecting this invitation, you can ignore this email. If you are
              concerned about your account&apos;s safety, please get in touch
              with us.{" "}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default InvitationEmail;
