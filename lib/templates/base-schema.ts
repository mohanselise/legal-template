/**
 * Base schemas for common fields across all legal document templates
 * 
 * These schemas define reusable validation patterns for parties, addresses,
 * signing information, and other common contract elements.
 */

import { z } from 'zod';
import type { StructuredAddress } from '@/lib/utils/address-formatting';

// ==========================================
// ADDRESS SCHEMAS
// ==========================================

/**
 * Structured address schema with all optional fields
 */
export const structuredAddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  raw: z.string().optional(),
}).optional();

/**
 * Simple address string (for basic forms)
 */
export const addressStringSchema = z.string().min(1, 'Address is required');

// ==========================================
// PARTY SCHEMAS
// ==========================================

/**
 * Base party schema - used for any party in a contract
 * Can be extended by templates for specific party types
 */
export const basePartySchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
  address: z.string().min(1, 'Address is required'),
  addressStructured: z.custom<StructuredAddress>().optional(),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
});

export type BaseParty = z.infer<typeof basePartySchema>;

/**
 * Party with representative/signing authority info
 * Used when someone signs on behalf of an organization
 */
export const partyWithRepresentativeSchema = basePartySchema.extend({
  representativeName: z.string().optional(),
  representativeTitle: z.string().optional(),
  representativeEmail: z.string().email('Valid email is required').optional().or(z.literal('')),
  representativePhone: z.string().optional(),
});

export type PartyWithRepresentative = z.infer<typeof partyWithRepresentativeSchema>;

/**
 * Company/Organization party schema
 * Includes additional business-specific fields
 */
export const companyPartySchema = partyWithRepresentativeSchema.extend({
  state: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
});

export type CompanyParty = z.infer<typeof companyPartySchema>;

/**
 * Individual party schema
 * For natural persons (employees, founders, etc.)
 */
export const individualPartySchema = basePartySchema.extend({
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  idNumber: z.string().optional(),
});

export type IndividualParty = z.infer<typeof individualPartySchema>;

// ==========================================
// SIGNING SCHEMAS
// ==========================================

/**
 * Signing information for a party
 */
export const signingInfoSchema = z.object({
  signerName: z.string().min(1, 'Signer name is required'),
  signerTitle: z.string().optional(),
  signerEmail: z.string().email('Valid email is required'),
  signerPhone: z.string().optional(),
});

export type SigningInfo = z.infer<typeof signingInfoSchema>;

// ==========================================
// DATE SCHEMAS
// ==========================================

/**
 * Date string in ISO format (YYYY-MM-DD)
 */
export const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

/**
 * Optional date with validation
 */
export const optionalDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()
  .or(z.literal(''));

/**
 * Date that must be in the future
 */
export const futureDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }, 'Date must be today or in the future');

// ==========================================
// DURATION SCHEMAS
// ==========================================

/**
 * Duration period unit
 */
export const durationUnitSchema = z.enum(['days', 'weeks', 'months', 'years']);

/**
 * Duration with value and unit
 */
export const durationSchema = z.object({
  value: z.number().min(1),
  unit: durationUnitSchema,
});

export type Duration = z.infer<typeof durationSchema>;

/**
 * Duration as a simple string (e.g., "30 days", "6 months")
 */
export const durationStringSchema = z.string().optional();

// ==========================================
// LEGAL CLAUSE SCHEMAS
// ==========================================

/**
 * Common legal clause toggles
 */
export const legalClausesSchema = z.object({
  includeConfidentiality: z.boolean().default(true),
  includeIpAssignment: z.boolean().default(false),
  includeNonCompete: z.boolean().default(false),
  nonCompeteDuration: z.string().optional(),
  nonCompeteRadius: z.string().optional(),
  includeNonSolicitation: z.boolean().default(false),
  nonSolicitationDuration: z.string().optional(),
  includeIndemnification: z.boolean().default(false),
  includeLimitationOfLiability: z.boolean().default(false),
});

export type LegalClauses = z.infer<typeof legalClausesSchema>;

/**
 * Dispute resolution options
 */
export const disputeResolutionSchema = z.enum(['arbitration', 'mediation', 'court', 'negotiation']);

/**
 * Governing law configuration
 */
export const governingLawSchema = z.object({
  jurisdiction: z.string().min(1, 'Governing law jurisdiction is required'),
  disputeResolution: disputeResolutionSchema.default('arbitration'),
  venue: z.string().optional(),
});

export type GoverningLaw = z.infer<typeof governingLawSchema>;

// ==========================================
// CURRENCY & COMPENSATION SCHEMAS
// ==========================================

/**
 * Common currency codes
 */
export const currencyCodeSchema = z.string().length(3).default('USD');

/**
 * Pay frequency/period
 */
export const payFrequencySchema = z.enum(['hourly', 'weekly', 'bi-weekly', 'monthly', 'annual']);

/**
 * Monetary amount with currency
 */
export const monetaryAmountSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  currency: currencyCodeSchema,
  period: payFrequencySchema.optional(),
});

export type MonetaryAmount = z.infer<typeof monetaryAmountSchema>;

// ==========================================
// COMMON FIELD SCHEMAS
// ==========================================

/**
 * Email validation with empty string allowed
 */
export const emailOrEmptySchema = z.string()
  .email('Valid email is required')
  .optional()
  .or(z.literal(''));

/**
 * URL validation with empty string allowed
 */
export const urlOrEmptySchema = z.string()
  .url('Valid URL is required')
  .optional()
  .or(z.literal(''));

/**
 * Phone number (basic validation)
 */
export const phoneSchema = z.string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

// ==========================================
// SCHEMA COMPOSITION HELPERS
// ==========================================

/**
 * Create a party schema with custom required fields
 */
export function createPartySchema(options: {
  requireEmail?: boolean;
  requirePhone?: boolean;
  requireRepresentative?: boolean;
} = {}) {
  let schema: z.ZodObject<any> = basePartySchema;
  
  if (options.requireEmail) {
    schema = schema.omit({ email: true }).extend({
      email: z.string().email('Valid email is required'),
    }) as z.ZodObject<any>;
  }
  
  if (options.requirePhone) {
    schema = schema.omit({ phone: true }).extend({
      phone: z.string().min(1, 'Phone number is required'),
    }) as z.ZodObject<any>;
  }
  
  if (options.requireRepresentative) {
    return partyWithRepresentativeSchema.omit({ 
      representativeName: true,
      representativeTitle: true,
      representativeEmail: true,
    }).extend({
      representativeName: z.string().min(1, 'Representative name is required'),
      representativeTitle: z.string().min(1, 'Representative title is required'),
      representativeEmail: z.string().email('Valid email is required'),
    }) as z.ZodObject<any>;
  }
  
  return schema;
}

/**
 * Merge multiple schemas into one
 * Useful for composing template-specific schemas from base schemas
 */
export function mergeSchemas<T extends z.ZodRawShape, U extends z.ZodRawShape>(
  base: z.ZodObject<T>,
  extension: z.ZodObject<U>
): z.ZodObject<T & U> {
  return base.merge(extension) as z.ZodObject<T & U>;
}

