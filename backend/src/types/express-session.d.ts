import "express-session";
import type { AuthUser } from "@limitrausch/contracts";

declare module "express-session" {
  interface SessionData {
    authUser?: AuthUser;
    discordOAuthState?: string; // Store the state parameter for CSRF protection
  }
}

//TODO: postgresql session store für dauerhafte login sessions
