import "express-session";

declare module "express-session" {
  interface SessionData {
    discordUser?: any; // You can replace 'any' with a more specific type if you have one for the Discord user data
    discordOAuthState?: string; // Store the state parameter for CSRF protection
  }
}

//TODO: postgresql session store für dauerhafte login sessions
