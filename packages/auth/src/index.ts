import type { Session as LuciaSession, SessionCookieOptions } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";

import type { DrizzleDB } from "@ena/db";
import { schema } from "@ena/db";

import type { CookieStore } from "./types";

export function createLucia(options: {
  db: DrizzleDB;
  cookieOptions: Omit<SessionCookieOptions, "name">;
}) {
  const { db, cookieOptions } = options;
  const adapter = new DrizzlePostgreSQLAdapter(db, schema.session, schema.user);
  const lucia = new Lucia(adapter, {
    sessionCookie: {
      ...cookieOptions,
      attributes: {
        secure: process.env.NODE_ENV === "production",
        ...cookieOptions.attributes,
      },
    },
    getUserAttributes: (attrs) => ({
      email: attrs.email,
    }),
  });
  return lucia;
}

export function createRequestValidator(cookieStore: CookieStore) {
  const validator = async (lucia: EnaLucia) => {
    const sessionId = cookieStore.get(lucia.sessionCookieName);
    if (!sessionId) {
      return { user: null, session: null };
    }

    const result = await lucia.validateSession(sessionId);
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookieStore.set(
          lucia.sessionCookieName,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookieStore.set(
          lucia.sessionCookieName,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch (error) {
      /* empty */
    }

    return result;
  };

  return validator;
}

export type EnaLucia = ReturnType<typeof createLucia>;
export type Session = LuciaSession;
export type * from "./types";

declare module "lucia" {
  interface Register {
    Lucia: EnaLucia;
    DatabaseUserAttributes: { email: string };
  }
}
