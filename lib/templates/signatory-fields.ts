const randomId = () => {
  const globalCrypto = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `sig-${Math.random().toString(36).slice(2, 10)}`;
};

export type SignatoryFieldType = "text" | "email" | "select";

export interface StandardSignatoryField {
  id: string;
  name: string;
  label: string;
  type: SignatoryFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export const SIGNATORY_PARTY_OPTIONS = [
  "employer",
  "employee",
  "witness",
  "other",
] as const;

export type SignatoryPartyOption = (typeof SIGNATORY_PARTY_OPTIONS)[number];

export interface AdditionalSignatoryInput {
  id?: string;
  party: SignatoryPartyOption;
  name: string;
  email: string;
  title?: string;
  phone?: string;
}

export const STANDARD_SIGNATORY_FIELDS: StandardSignatoryField[] = [
  {
    id: "party",
    name: "party",
    label: "Party",
    type: "select",
    required: true,
    options: [...SIGNATORY_PARTY_OPTIONS],
  },
  {
    id: "name",
    name: "name",
    label: "Full Name",
    type: "text",
    required: true,
    placeholder: "John Doe",
  },
  {
    id: "email",
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    placeholder: "john@example.com",
  },
  {
    id: "title",
    name: "title",
    label: "Title/Role",
    type: "text",
    required: false,
    placeholder: "CEO, Employee, etc.",
  },
  {
    id: "phone",
    name: "phone",
    label: "Phone",
    type: "text",
    required: false,
    placeholder: "+1 (555) 123-4567",
  },
];

export const ADDITIONAL_SIGNATORIES_FIELD_NAME = "additionalSignatories" as const;

export const ADDITIONAL_SIGNATORIES_FIELD_LABEL = "Additional Signatories";

export const ADDITIONAL_SIGNATORIES_FIELD_HELP =
  "Enable this to repeat the standard signatory fields for as many parties as needed.";

export function createBlankAdditionalSignatory(): AdditionalSignatoryInput {
  return {
    id: randomId(),
    party: "other",
    name: "",
    email: "",
    title: "",
    phone: "",
  };
}

export function ensureAdditionalSignatoryArray(
  value: unknown
): AdditionalSignatoryInput[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeAdditionalSignatory(entry))
      .filter(Boolean) as AdditionalSignatoryInput[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return ensureAdditionalSignatoryArray(parsed);
    } catch (error) {
      console.warn("Failed to parse additional signatories string", error);
    }
  }

  if (typeof value === "object") {
    return ensureAdditionalSignatoryArray([value]);
  }

  return [];
}

export function normalizeAdditionalSignatory(
  value: unknown
): AdditionalSignatoryInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Partial<AdditionalSignatoryInput> & Record<string, unknown>;

  const normalized: AdditionalSignatoryInput = {
    id: typeof entry.id === "string" ? entry.id : randomId(),
    party: SIGNATORY_PARTY_OPTIONS.includes(entry.party as SignatoryPartyOption)
      ? (entry.party as SignatoryPartyOption)
      : "other",
    name: typeof entry.name === "string" ? entry.name : "",
    email: typeof entry.email === "string" ? entry.email : "",
    title: typeof entry.title === "string" ? entry.title : undefined,
    phone: typeof entry.phone === "string" ? entry.phone : undefined,
  };

  return normalized;
}

export function formatAdditionalSignatoriesForPrompt(
  entries: AdditionalSignatoryInput[]
): string {
  if (entries.length === 0) return "None";

  return entries
    .map((entry, index) => {
      const parts = [
        `#${index + 1} (${entry.party})`,
        `Name: ${entry.name || "Unknown"}`,
        `Email: ${entry.email || "N/A"}`,
      ];

      if (entry.title) parts.push(`Title: ${entry.title}`);
      if (entry.phone) parts.push(`Phone: ${entry.phone}`);

      return parts.join(", ");
    })
    .join("\n");
}

