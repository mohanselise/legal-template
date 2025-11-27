/**
 * Prisma Database Seed Script
 *
 * This script seeds the database with initial template data from the
 * existing template definitions. Run with: pnpm db:seed
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { PrismaClient } from "../lib/generated/prisma/client";
import { EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from "../lib/openai";

// Template definitions to seed (same as data/templates.ts)
const templateDefinitions = [
  {
    slug: "employment-agreement",
    title: "Employment Agreement",
    description:
      "Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.",
    icon: "FileText",
    available: true,
    popular: true,
    href: "/templates/employment-agreement/generate",
    keywords: [
      "employment",
      "contract",
      "salary",
      "benefits",
      "termination",
      "hiring",
    ],
    estimatedMinutes: 15,
    systemPrompt: EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON,
  },
  {
    slug: "founders-agreement",
    title: "Founders' Agreement",
    description:
      "Define equity splits, roles, responsibilities, and decision-making processes for your startup.",
    icon: "Users",
    available: false,
    popular: false,
    href: "/templates/founders-agreement/generate",
    keywords: ["founders", "startup", "equity", "roles", "vesting"],
    estimatedMinutes: 20,
    systemPrompt: null,
  },
  {
    slug: "nda",
    title: "Non-Disclosure Agreement",
    description:
      "Protect confidential information with bilateral or unilateral NDA templates.",
    icon: "Lock",
    available: false,
    popular: false,
    href: "/templates/nda/generate",
    keywords: [
      "nda",
      "confidential",
      "non-disclosure",
      "secret",
      "proprietary",
    ],
    estimatedMinutes: 10,
    systemPrompt: null,
  },
  {
    slug: "dpa",
    title: "Data Processing Agreement",
    description:
      "GDPR-compliant DPA templates for processor-controller relationships.",
    icon: "Shield",
    available: false,
    popular: false,
    href: "/templates/dpa/generate",
    keywords: ["gdpr", "data", "privacy", "processing", "controller"],
    estimatedMinutes: 25,
    systemPrompt: null,
  },
  {
    slug: "ip-assignment",
    title: "IP Assignment Agreement",
    description:
      "Transfer intellectual property rights with clear terms and comprehensive coverage.",
    icon: "Sparkles",
    available: false,
    popular: false,
    href: "/templates/ip-assignment/generate",
    keywords: [
      "intellectual property",
      "ip",
      "patent",
      "copyright",
      "trademark",
    ],
    estimatedMinutes: 15,
    systemPrompt: null,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("🌱 Starting database seed...\n");

  // Use neon HTTP for scripts (simpler approach)
  const sql = neon(connectionString);
  
  // Use raw SQL queries for seeding (simpler than adapter in Node.js scripts)
  const prisma = {
    template: {
      findMany: async (opts?: { select?: { slug: boolean } }) => {
        const result = await sql`SELECT slug FROM "Template"`;
        return result;
      },
      create: async ({ data }: { data: typeof templateDefinitions[0] }) => {
        await sql`
          INSERT INTO "Template" (id, slug, title, description, icon, available, popular, href, keywords, "estimatedMinutes", "systemPrompt", "createdAt", "updatedAt")
          VALUES (
            ${crypto.randomUUID()},
            ${data.slug},
            ${data.title},
            ${data.description},
            ${data.icon},
            ${data.available},
            ${data.popular},
            ${data.href},
            ${data.keywords},
            ${data.estimatedMinutes},
            ${data.systemPrompt || null},
            NOW(),
            NOW()
          )
        `;
      },
    },
    $disconnect: async () => {},
  };

  try {
    // Check existing templates
    const existingTemplates = await prisma.template.findMany({
      select: { slug: true },
    });
    const existingSlugs = new Set(existingTemplates.map((t) => t.slug));

    console.log(`📊 Found ${existingTemplates.length} existing templates\n`);

    let created = 0;
    let skipped = 0;

    for (const template of templateDefinitions) {
      if (existingSlugs.has(template.slug)) {
        console.log(`⏭️  Skipping "${template.title}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.template.create({
        data: template,
      });
      console.log(`✅ Created "${template.title}"`);
      created++;
    }

    console.log("\n🎉 Seed completed!");
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total:   ${templateDefinitions.length}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

