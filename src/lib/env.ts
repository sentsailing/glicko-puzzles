/**
 * Environment variable validation (server-side only).
 * Import this module early to fail fast on missing config.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Check your .env file or deployment configuration.`
    );
  }
  return value;
}

// Guard: only validate on the server
if (typeof window === "undefined") {
  requireEnv("DATABASE_URL");
  requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID");
  requireEnv("FIREBASE_PROJECT_ID");
  requireEnv("FIREBASE_CLIENT_EMAIL");
  requireEnv("FIREBASE_PRIVATE_KEY");
}
