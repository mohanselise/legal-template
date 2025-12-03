import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { openrouter, CONTRACT_GENERATION_MODEL, createCompletionWithTracking } from "@/lib/openrouter";
import { getSessionId } from "@/lib/analytics/session";
import { validateTurnstileToken } from "next-turnstile";
import { EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON } from "@/lib/openai";
import type { LegalDocument, SignatoryData } from "@/app/api/templates/employment-agreement/schema";
import { SIGNATORY_FIELD_NAMES } from "@/lib/templates/signatory-mapper";
import {
  ADDITIONAL_SIGNATORIES_FIELD_NAME,
  AdditionalSignatoryInput,
  ensureAdditionalSignatoryArray,
  formatAdditionalSignatoriesForPrompt,
  SIGNATORY_PARTY_OPTIONS,
} from "@/lib/templates/signatory-fields";
import type { SignatoryEntry } from "@/lib/templates/signatory-config";

type RouteParams = {
  params: Promise<{ templateId: string }>;
};

/**
 * POST /api/templates/[templateId]/generate
 * Generate a legal document from form data using AI
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const startTime = Date.now();
  console.log("🚀 [Dynamic Generate API] Request received");

  try {
    const { templateId } = await params;
    const body = await request.json();
    const { formData, turnstileToken } = body;

    if (!formData) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400 }
      );
    }

    // Validate Turnstile token
    if (!turnstileToken || typeof turnstileToken !== "string" || !turnstileToken.trim()) {
      return NextResponse.json(
        {
          error: "Human verification is required before generating the document.",
          details: "Please complete the Turnstile verification.",
        },
        { status: 400 }
      );
    }

    const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

    if (!TURNSTILE_SECRET_KEY) {
      console.error("⚠️ [Dynamic Generate API] TURNSTILE_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Turnstile secret key not set" },
        { status: 500 }
      );
    }

    try {
      const validationResponse = await validateTurnstileToken({
        token: turnstileToken,
        secretKey: TURNSTILE_SECRET_KEY,
        sandbox: false, // Using production keys
      });

      if (!validationResponse.success) {
        const errorCodes = (validationResponse as any)["error-codes"] || (validationResponse as any).error_codes || [];
        console.error("❌ [Dynamic Generate API] Turnstile validation failed:", errorCodes);
        return NextResponse.json(
          {
            error: "Invalid or expired verification token",
            details: errorCodes.length > 0 ? `Error codes: ${errorCodes.join(", ")}` : undefined,
          },
          { status: 403 }
        );
      }
    } catch (validationError) {
      console.error("❌ [Dynamic Generate API] Turnstile validation error:", validationError);
      return NextResponse.json(
        {
          error: "Failed to validate verification token",
          details: validationError instanceof Error ? validationError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Fetch template with system prompt
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        slug: true,
        title: true,
        systemPromptRole: true,
        systemPrompt: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Fetch settings (AI model and common instructions)
    const [aiModelSetting, commonInstructions] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: "documentGenerationAiModel" } }),
      prisma.systemSettings.findUnique({ where: { key: "commonPromptInstructions" } }),
    ]);
    
    // Use configured model or fallback to default
    const aiModel = aiModelSetting?.value || CONTRACT_GENERATION_MODEL;

    // Build system prompt by combining role + prompt + common instructions
    const parts: string[] = [];

    // 1. Role (if provided)
    if (template.systemPromptRole) {
      parts.push(`You are ${template.systemPromptRole}.`);
    } else {
      // Default role if not specified
      parts.push(`You are an expert legal drafter specializing in ${template.title} documents.`);
    }

    // 2. Template-specific prompt (if provided)
    if (template.systemPrompt) {
      parts.push(template.systemPrompt);
    } else {
      // Fallback to default prompt if none provided
      parts.push(EMPLOYMENT_AGREEMENT_SYSTEM_PROMPT_JSON || `Generate a comprehensive, legally sound ${template.title} document based on the provided information.`);
    }

    // 3. Common instructions from settings (if available)
    if (commonInstructions?.value) {
      parts.push("\n\n" + commonInstructions.value);
    }

    const systemPrompt = parts.join("\n\n");

    // Build user prompt from form data
    const userPrompt = buildUserPrompt(formData, template.title);

    console.log("🤖 [Dynamic Generate API] Calling OpenRouter with model:", aiModel);
    const apiCallStart = Date.now();

    // Get session ID for analytics
    const sessionId = await getSessionId();

    const completion = await createCompletionWithTracking({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 16000,
    }, {
      sessionId,
      templateSlug: template.slug,
      endpoint: `/api/templates/${template.slug}/generate`,
    });

    const apiCallDuration = Date.now() - apiCallStart;
    console.log("✅ [Dynamic Generate API] Response received in", apiCallDuration, "ms");

    const documentContent = completion.choices[0]?.message?.content || "";

    if (!documentContent) {
      throw new Error("No content generated");
    }

    // Parse and validate JSON
    let document: LegalDocument;
    try {
      const parsed = JSON.parse(documentContent);

      // Ensure it matches LegalDocument structure
      if (!parsed.metadata || !parsed.content) {
        throw new Error("Invalid document structure");
      }

      // Set document type and metadata
      parsed.metadata.documentType = template.slug;
      parsed.metadata.title = parsed.metadata.title || template.title;
      parsed.metadata.generatedAt = new Date().toISOString();

      // Always set signatories from form data to ensure accuracy
      // The AI might generate signatories but they may not match user input
      const extractedSignatories = extractSignatoriesFromFormData(formData);
      if (extractedSignatories.length > 0) {
        parsed.signatories = extractedSignatories;
      } else if (!parsed.signatories) {
        // Fallback: empty array if no signatories found
        parsed.signatories = [];
      }

      document = parsed as LegalDocument;
    } catch (parseError) {
      console.error("❌ [Dynamic Generate API] JSON parse error:", parseError);
      throw new Error("Failed to parse generated document");
    }

    const totalDuration = Date.now() - startTime;
    console.log("✅ [Dynamic Generate API] Document generated in", totalDuration, "ms");
    console.log("💰 [Dynamic Generate API] Tokens:", completion.usage);

    return NextResponse.json({
      document,
      formData,
      usage: completion.usage,
      duration: totalDuration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ [Dynamic Generate API] Error after", duration, "ms:", error);

    return NextResponse.json(
      {
        error: "Failed to generate document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Build user prompt from form data
 * Simply combines all form data into a structured format without hardcoded groupings
 */
function buildUserPrompt(formData: Record<string, any>, templateTitle: string): string {
  const sections: string[] = [];

  sections.push(`Generate a ${templateTitle} document with the following information:\n`);

  // Collect all non-empty form fields
  const formEntries: string[] = [];

  for (const [key, value] of Object.entries(formData)) {
    // Skip empty values
    if (value === null || value === undefined || value === "") continue;

    // Format the value based on its type
    let formattedValue: string;
    if (typeof value === "object" && !Array.isArray(value)) {
      // For objects, stringify with pretty formatting
      formattedValue = JSON.stringify(value, null, 2);
    } else if (Array.isArray(value)) {
      if (key === ADDITIONAL_SIGNATORIES_FIELD_NAME) {
        const entries = ensureAdditionalSignatoryArray(value);
        formattedValue = formatAdditionalSignatoriesForPrompt(entries);
      } else {
        const arePrimitives = value.every(
          (item) => item === null || ["string", "number", "boolean"].includes(typeof item)
        );
        formattedValue = arePrimitives ? value.join(", ") : JSON.stringify(value, null, 2);
      }
    } else {
      // For primitives, convert to string
      formattedValue = String(value);
    }

    if (formattedValue) {
      formEntries.push(`${key}: ${formattedValue}`);
    }
  }

  // Add all form entries
  if (formEntries.length > 0) {
    sections.push(formEntries.join("\n"));
    sections.push("");
  }

  sections.push("Please generate a complete, professional legal document incorporating all the above information.");

  return sections.join("\n");
}

/**
 * Extract signatories from form data
 * 
 * Priority order:
 * 1. NEW Signatory Screen format (formData.signatories array from SignatoryScreenRenderer)
 * 2. Form builder signatory fields (name, email, party, title, phone)
 * 3. Additional signatories repeater
 * 4. Numbered signatory_* fields
 * 5. Legacy hardcoded field names (companyRepName, employeeName, etc.)
 */
function extractSignatoriesFromFormData(formData: Record<string, any>): SignatoryData[] {
  const signatories: SignatoryData[] = [];

  const normalizeParty = (value: unknown): SignatoryData["party"] => {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (SIGNATORY_PARTY_OPTIONS.includes(lower as typeof SIGNATORY_PARTY_OPTIONS[number])) {
        return lower as SignatoryData["party"];
      }
    }
    return "other";
  };

  const normalizeText = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const appendSignatory = (data: {
    name?: string;
    email?: string;
    party?: unknown;
    title?: string;
    phone?: string;
  }) => {
    const name = normalizeText(data.name);
    const email = normalizeText(data.email);
    if (!name || !email) return;

    signatories.push({
      party: normalizeParty(data.party),
      name,
      email,
      title: normalizeText(data.title),
      phone: normalizeText(data.phone),
    });
  };

  // 1. NEW Signatory Screen format (formData.signatories array from SignatoryScreenRenderer)
  if (Array.isArray(formData.signatories) && formData.signatories.length > 0) {
    (formData.signatories as SignatoryEntry[]).forEach((entry) => {
      appendSignatory({
        party: entry.partyType,
        name: entry.name,
        email: entry.email,
        title: entry.title,
        phone: entry.phone,
      });
    });
    // If we have signatories from the new format, return early
    if (signatories.length > 0) {
      return signatories;
    }
  }

  // 2. Primary signatory fields from the signatory screen (legacy)
  appendSignatory({
    party: formData[SIGNATORY_FIELD_NAMES.PARTY],
    name: formData[SIGNATORY_FIELD_NAMES.NAME],
    email: formData[SIGNATORY_FIELD_NAMES.EMAIL],
    title: formData[SIGNATORY_FIELD_NAMES.TITLE],
    phone: formData[SIGNATORY_FIELD_NAMES.PHONE],
  });

  // 3. Additional signatories captured via repeater
  const additionalEntries = ensureAdditionalSignatoryArray(
    formData[ADDITIONAL_SIGNATORIES_FIELD_NAME]
  );
  additionalEntries.forEach((entry: AdditionalSignatoryInput) => {
    appendSignatory(entry);
  });

  // 3. Pattern-based fields (signatory_1_name, signatory_2_name, etc.)
  let signatoryIndex = 1;
  while (formData[`signatory_${signatoryIndex}_name`]) {
    appendSignatory({
      party: formData[`signatory_${signatoryIndex}_party`],
      name: formData[`signatory_${signatoryIndex}_name`],
      email: formData[`signatory_${signatoryIndex}_email`],
      title: formData[`signatory_${signatoryIndex}_title`],
      phone: formData[`signatory_${signatoryIndex}_phone`],
    });
    signatoryIndex++;
  }

  if (signatories.length > 0) {
    return signatories;
  }

  // 4. Fallback: Legacy hardcoded field names for backward compatibility
  // Look for company representative
  if (formData.companyRepName || formData.companyName) {
    signatories.push({
      party: "employer",
      name: formData.companyRepName || formData.companyName || "Company Representative",
      title: formData.companyRepTitle || "Authorized Representative",
      email: formData.companyRepEmail || formData.companyEmail || "",
      phone: formData.companyRepPhone || formData.companyPhone || undefined,
    });
  }

  // Look for employee
  if (formData.employeeName) {
    signatories.push({
      party: "employee",
      name: formData.employeeName,
      title: formData.jobTitle || "Employee",
      email: formData.employeeEmail || "",
      phone: formData.employeePhone || undefined,
    });
  }

  return signatories;
}
