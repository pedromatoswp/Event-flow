import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "5000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",

  apiPrefix: process.env.API_PREFIX ?? "/api",

  db: {
    host: requireEnv("DB_HOST"),
    port: parseInt(requireEnv("DB_PORT"), 10),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: requireEnv("DB_NAME")
  },

  jwt: {
    accessSecret: requireEnv("JWT_SECRET"),
    accessExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",

    refreshSecret: requireEnv("REFRESH_TOKEN_SECRET"),
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d"
  }
} as const;

