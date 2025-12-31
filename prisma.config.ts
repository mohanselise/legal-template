// Prisma configuration
// Load environment variables from .env.local for local development
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local first, then fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

// Use a dummy DATABASE_URL for build/generation if not set
// This allows prisma generate to work without a real database connection
const databaseUrl = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
