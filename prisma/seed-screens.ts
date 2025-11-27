import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient, FieldType } from "../lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set");
}

const adapter = new PrismaNeonHttp(connectionString, {
  fullResults: true,
});
const prisma = new PrismaClient({ adapter });

// Define the screens and fields structure
const formConfig = {
  screens: [
    {
      title: "Company Information",
      description: "Tell us about the company",
      order: 0,
      fields: [
        {
          name: "companyName",
          label: "Company Name",
          type: "text" as FieldType,
          required: true,
          placeholder: "Enter company name",
          helpText: "Legal name of the company",
          order: 0,
        },
        {
          name: "companyAddress",
          label: "Company Address",
          type: "text" as FieldType,
          required: true,
          placeholder: "Enter full address",
          helpText: "Registered business address",
          order: 1,
        },
        {
          name: "companyEmail",
          label: "Company Email",
          type: "email" as FieldType,
          required: true,
          placeholder: "company@example.com",
          helpText: "Primary contact email",
          order: 2,
        },
      ],
    },
    {
      title: "Role Details",
      description: "Information about the position",
      order: 1,
      fields: [
        {
          name: "jobTitle",
          label: "Job Title",
          type: "text" as FieldType,
          required: true,
          placeholder: "e.g., Software Engineer",
          helpText: "The official job title for this position",
          order: 0,
        },
        {
          name: "jobResponsibilities",
          label: "Key Responsibilities",
          type: "text" as FieldType,
          required: false,
          placeholder: "Describe main duties and responsibilities",
          helpText: "Brief description of job responsibilities",
          order: 1,
        },
        {
          name: "department",
          label: "Department",
          type: "text" as FieldType,
          required: false,
          placeholder: "e.g., Engineering",
          helpText: "Department or team name",
          order: 2,
        },
      ],
    },
    {
      title: "Employee Information",
      description: "Details about the employee",
      order: 2,
      fields: [
        {
          name: "employeeName",
          label: "Employee Full Name",
          type: "text" as FieldType,
          required: true,
          placeholder: "Enter employee's full legal name",
          order: 0,
        },
        {
          name: "employeeAddress",
          label: "Employee Address",
          type: "text" as FieldType,
          required: true,
          placeholder: "Enter full address",
          order: 1,
        },
        {
          name: "employeeEmail",
          label: "Employee Email",
          type: "email" as FieldType,
          required: true,
          placeholder: "employee@example.com",
          order: 2,
        },
        {
          name: "startDate",
          label: "Start Date",
          type: "date" as FieldType,
          required: true,
          helpText: "When will employment begin?",
          order: 3,
        },
      ],
    },
    {
      title: "Work Arrangement",
      description: "Configure work schedule and location",
      order: 3,
      fields: [
        {
          name: "workArrangement",
          label: "Work Arrangement",
          type: "select" as FieldType,
          required: true,
          options: ["On-site", "Remote", "Hybrid"],
          helpText: "Primary work arrangement",
          order: 0,
        },
        {
          name: "workLocation",
          label: "Work Location",
          type: "text" as FieldType,
          required: false,
          placeholder: "Office address or 'Remote'",
          helpText: "Primary work location (if applicable)",
          order: 1,
        },
        {
          name: "workHoursPerWeek",
          label: "Hours per Week",
          type: "number" as FieldType,
          required: true,
          placeholder: "40",
          helpText: "Standard weekly working hours",
          order: 2,
        },
      ],
    },
    {
      title: "Compensation",
      description: "Salary and payment details",
      order: 4,
      fields: [
        {
          name: "salaryAmount",
          label: "Salary Amount",
          type: "number" as FieldType,
          required: true,
          placeholder: "e.g., 85000",
          helpText: "Base salary amount",
          order: 0,
        },
        {
          name: "salaryCurrency",
          label: "Currency",
          type: "select" as FieldType,
          required: true,
          options: ["USD", "EUR", "GBP", "CHF", "CAD", "AUD"],
          order: 1,
        },
        {
          name: "salaryPeriod",
          label: "Pay Period",
          type: "select" as FieldType,
          required: true,
          options: ["Annual", "Monthly", "Bi-weekly", "Weekly"],
          order: 2,
        },
        {
          name: "paidTimeOff",
          label: "Paid Time Off (days/year)",
          type: "number" as FieldType,
          required: false,
          placeholder: "e.g., 20",
          helpText: "Annual PTO allowance in days",
          order: 3,
        },
      ],
    },
    {
      title: "Legal Terms",
      description: "Legal clauses and jurisdiction",
      order: 5,
      fields: [
        {
          name: "governingLaw",
          label: "Governing Law",
          type: "text" as FieldType,
          required: true,
          placeholder: "e.g., State of California, USA",
          helpText: "Jurisdiction that governs this agreement",
          order: 0,
        },
        {
          name: "noticePeriod",
          label: "Notice Period",
          type: "text" as FieldType,
          required: false,
          placeholder: "e.g., 30 days",
          helpText: "Required notice period for termination",
          order: 1,
        },
        {
          name: "probationPeriod",
          label: "Probation Period",
          type: "text" as FieldType,
          required: false,
          placeholder: "e.g., 3 months",
          helpText: "Initial probation/trial period",
          order: 2,
        },
        {
          name: "includeConfidentiality",
          label: "Include Confidentiality Clause",
          type: "checkbox" as FieldType,
          required: false,
          helpText: "Add NDA provisions to the agreement",
          order: 3,
        },
        {
          name: "includeNonCompete",
          label: "Include Non-Compete Clause",
          type: "checkbox" as FieldType,
          required: false,
          helpText: "Add non-compete restrictions (check local enforceability)",
          order: 4,
        },
      ],
    },
    {
      title: "Signing Information",
      description: "Details for document signing",
      order: 6,
      fields: [
        {
          name: "companyRepName",
          label: "Company Representative Name",
          type: "text" as FieldType,
          required: true,
          placeholder: "Name of person signing for company",
          order: 0,
        },
        {
          name: "companyRepTitle",
          label: "Representative Title",
          type: "text" as FieldType,
          required: true,
          placeholder: "e.g., CEO, HR Director",
          order: 1,
        },
        {
          name: "companyRepEmail",
          label: "Representative Email",
          type: "email" as FieldType,
          required: true,
          placeholder: "signer@company.com",
          helpText: "Email for signature request",
          order: 2,
        },
      ],
    },
  ],
};

async function main() {
  console.log("🌱 Seeding screens and fields for templates...\n");

  // Get all templates
  const templates = await prisma.template.findMany();
  console.log(`📋 Found ${templates.length} templates\n`);

  for (const template of templates) {
    console.log(`\n📝 Processing template: ${template.title} (${template.slug})`);

    // Check if template already has screens
    const existingScreens = await prisma.templateScreen.findMany({
      where: { templateId: template.id },
    });

    if (existingScreens.length > 0) {
      console.log(`   ⏩ Already has ${existingScreens.length} screens, skipping...`);
      continue;
    }

    // Create screens and fields for this template
    for (const screenConfig of formConfig.screens) {
      console.log(`   📄 Creating screen: ${screenConfig.title}`);

      const screen = await prisma.templateScreen.create({
        data: {
          templateId: template.id,
          title: screenConfig.title,
          description: screenConfig.description,
          order: screenConfig.order,
        },
      });

      // Create fields for this screen
      for (const fieldConfig of screenConfig.fields) {
        await prisma.templateField.create({
          data: {
            screenId: screen.id,
            name: fieldConfig.name,
            label: fieldConfig.label,
            type: fieldConfig.type,
            required: fieldConfig.required,
            placeholder: fieldConfig.placeholder || null,
            options: "options" in fieldConfig ? fieldConfig.options : [],
            order: fieldConfig.order,
          },
        });
      }

      console.log(`      ✅ Created ${screenConfig.fields.length} fields`);
    }

    console.log(`   ✅ Template "${template.title}" configured with ${formConfig.screens.length} screens`);
  }

  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
