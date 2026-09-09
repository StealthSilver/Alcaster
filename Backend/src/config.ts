import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set.`);
  }
  return value;
}

function requiredInProduction(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) {
    throw new Error(`${name} must be set in production.`);
  }
  return fallback;
}

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim() || "http://localhost:5173";
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function parseCookieSameSite(): "lax" | "none" | "strict" {
  const raw = process.env.COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "none" || raw === "lax" || raw === "strict") {
    return raw;
  }
  // Frontend (Vercel) and API (Render) are different sites, so production
  // cookies must be SameSite=None; Secure to be sent on fetch().
  return isProduction ? "none" : "lax";
}

const cookieSameSite = parseCookieSameSite();

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  jwtSecret: requiredInProduction(
    "JWT_SECRET",
    "alcaster-dev-jwt-secret-change-me",
  ),
  jwtExpiresIn: "7d" as const,
  corsOrigins: parseCorsOrigins(),
  cookieName: "alcaster_session",
  cookieSameSite,
  cookieSecure: isProduction || cookieSameSite === "none",
  mongoUri: required("MONGODB_URI"),
  demo: {
    name: "Rajat",
    email: process.env.DEMO_EMAIL?.trim().toLowerCase() || "rajat@alcaster.com",
    password: process.env.DEMO_PASSWORD || "Alcaster@2026",
    role: "Organization Manager",
    organizationName: "Alcaster Energy",
  },
};
