/**
 * Prisma Client Singleton with Neon Adapter
 *
 * This module provides a singleton instance of Prisma Client configured
 * with the Neon HTTP adapter for reliable connections in Next.js
 * serverless environments.
 *
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
 */

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/prisma/client";

// Singleton pattern for Prisma Client
// Prevents multiple instances during Next.js hot-reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Please add it to your .env.local file."
    );
  }

  // PrismaNeonHttp expects the connection string and options
  const adapter = new PrismaNeonHttp(connectionString, {
    // Enable full results for better type inference
    fullResults: true,
  });

  return new PrismaClient({
    adapter,
    log: ["error"], // Only log errors, not queries
  });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

// Export types for convenience
export type {
  Template,
  TemplateScreen,
  TemplateField,
  SystemSettings,
  TemplatePage,
  Organization,
} from "./generated/prisma/client";

// Export enums
export { FieldType, ScreenType } from "./generated/prisma/client";

// Export Prisma namespace for type utilities
export { Prisma } from "./generated/prisma/client";

