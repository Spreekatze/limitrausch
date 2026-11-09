import express, { type Express } from "express";
import session from "express-session";

export const httpFetch = globalThis.fetch.bind(globalThis);

export function createAuthenticatedFetch(sessionCookie: string) {
  return async function authenticatedFetch(
    url: string,
    init: RequestInit = {},
    cookie = sessionCookie,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("cookie", cookie);
    return httpFetch(url, { ...init, headers });
  };
}

/**
 * Installs real express-session middleware and helper routes.
 * Only use this in integration-test applications.
 */
export function attachTestSessions(app: Express): void {
  app.use(express.json());
  app.use(
    session({
      secret: "integration-test-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false },
    }),
  );
  app.post("/__test/session", (request, response, next) => {
    Object.assign(request.session, request.body as Record<string, unknown>);
    request.session.save((error) => {
      if (error) {
        next(error);
        return;
      }
      response.sendStatus(204);
    });
  });
  app.get("/__test/session", (request, response) => {
    response.json({
      authUser: request.session.authUser,
      discordOAuthState: request.session.discordOAuthState,
      discordAccessToken: request.session.discordAccessToken,
      discordRefreshToken: request.session.discordRefreshToken,
      discordTokenExpiresAt: request.session.discordTokenExpiresAt,
    });
  });
}

export function getSessionCookie(response: Response): string {
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  if (!cookie) {
    throw new Error("Expected the response to set a session cookie");
  }
  return cookie;
}

export async function createTestSessionCookie(
  baseUrl: string,
  sessionData: Record<string, unknown>,
): Promise<string> {
  const response = await httpFetch(new URL("/__test/session", baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sessionData),
  });
  if (response.status !== 204) {
    throw new Error(`Failed to create test session: ${response.status}`);
  }
  return getSessionCookie(response);
}

export async function readTestSession(
  baseUrl: string,
  cookie: string,
): Promise<Record<string, unknown>> {
  const response = await httpFetch(new URL("/__test/session", baseUrl), {
    headers: { cookie },
  });
  return response.json() as Promise<Record<string, unknown>>;
}
