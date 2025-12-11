/**
 * Conditional Visibility Logic for Dynamic SmartFlow
 *
 * Enables screens and fields to be shown/hidden based on previous form responses.
 * Supports multiple operators and logical AND/OR combinations.
 */

/**
 * Supported comparison operators for condition rules
 */
export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "isEmpty"
  | "isNotEmpty"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "startsWith"
  | "endsWith";

/**
 * A single condition rule that checks one field against a value
 */
export interface ConditionRule {
  /** Form field name to check (supports dot notation for nested fields) */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Expected value (not needed for isEmpty/isNotEmpty) */
  value?: unknown;
}

/**
 * A group of condition rules combined with AND or OR logic
 */
export interface ConditionGroup {
  /** How to combine the rules: 'and' requires all rules to pass, 'or' requires at least one */
  operator: "and" | "or";
  /** Array of condition rules to evaluate */
  rules: ConditionRule[];
}

/**
 * Get a value from an object using dot notation path
 * e.g., getNestedValue({a: {b: 1}}, "a.b") returns 1
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Evaluate a single condition rule against form data
 */
function evaluateRule(rule: ConditionRule, formData: Record<string, unknown>): boolean {
  const fieldValue = getNestedValue(formData, rule.field);
  const compareValue = rule.value;

  switch (rule.operator) {
    case "equals":
      // Handle boolean/string comparisons in both directions
      if (typeof compareValue === "boolean") {
        if (fieldValue === "true" || fieldValue === true) return compareValue === true;
        if (fieldValue === "false" || fieldValue === false) return compareValue === false;
      }
      if (compareValue === "true" || compareValue === "false") {
        const boolCompare = compareValue === "true";
        if (fieldValue === true || fieldValue === "true") return boolCompare === true;
        if (fieldValue === false || fieldValue === "false") return boolCompare === false;
      }
      return fieldValue === compareValue;

    case "notEquals":
      if (typeof compareValue === "boolean") {
        if (fieldValue === "true" || fieldValue === true) return compareValue !== true;
        if (fieldValue === "false" || fieldValue === false) return compareValue !== false;
      }
      if (compareValue === "true" || compareValue === "false") {
        const boolCompare = compareValue === "true";
        if (fieldValue === true || fieldValue === "true") return boolCompare !== true;
        if (fieldValue === false || fieldValue === "false") return boolCompare !== false;
      }
      return fieldValue !== compareValue;

    case "contains":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(compareValue);
      }
      return false;

    case "notContains":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return !fieldValue.toLowerCase().includes(compareValue.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(compareValue);
      }
      return true;

    case "isEmpty":
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case "isNotEmpty":
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== "" &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case "greaterThan":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue > compareValue;
      }
      return false;

    case "lessThan":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue < compareValue;
      }
      return false;

    case "greaterThanOrEqual":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue >= compareValue;
      }
      return false;

    case "lessThanOrEqual":
      if (typeof fieldValue === "number" && typeof compareValue === "number") {
        return fieldValue <= compareValue;
      }
      return false;

    case "in":
      if (Array.isArray(compareValue)) {
        return compareValue.includes(fieldValue);
      }
      return false;

    case "notIn":
      if (Array.isArray(compareValue)) {
        return !compareValue.includes(fieldValue);
      }
      return true;

    case "startsWith":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue.toLowerCase().startsWith(compareValue.toLowerCase());
      }
      return false;

    case "endsWith":
      if (typeof fieldValue === "string" && typeof compareValue === "string") {
        return fieldValue.toLowerCase().endsWith(compareValue.toLowerCase());
      }
      return false;

    default:
      console.warn(`Unknown condition operator: ${rule.operator}`);
      return true;
  }
}

/**
 * Evaluate a condition group (AND/OR combination of rules) against form data
 *
 * @param conditions - The condition group to evaluate, or null/undefined
 * @param formData - Current form data to check against
 * @returns true if the conditions are met (or if no conditions), false otherwise
 *
 * @example
 * // Show field only if employmentType is "full-time"
 * evaluateConditions(
 *   { operator: "and", rules: [{ field: "employmentType", operator: "equals", value: "full-time" }] },
 *   { employmentType: "full-time" }
 * ) // returns true
 *
 * @example
 * // Show field if salary > 50000 OR has equity
 * evaluateConditions(
 *   {
 *     operator: "or",
 *     rules: [
 *       { field: "salary", operator: "greaterThan", value: 50000 },
 *       { field: "hasEquity", operator: "equals", value: true }
 *     ]
 *   },
 *   { salary: 40000, hasEquity: true }
 * ) // returns true (hasEquity matches)
 */
export function evaluateConditions(
  conditions: ConditionGroup | string | null | undefined,
  formData: Record<string, unknown>
): boolean {
  // No conditions = always visible
  if (!conditions) return true;

  // Parse JSON string if needed
  let conditionGroup: ConditionGroup;
  if (typeof conditions === "string") {
    try {
      conditionGroup = JSON.parse(conditions);
    } catch (error) {
      console.error("Failed to parse conditions JSON:", error);
      return true; // Default to visible on parse error
    }
  } else {
    conditionGroup = conditions;
  }

  // Empty rules = always visible
  if (!conditionGroup.rules || conditionGroup.rules.length === 0) {
    return true;
  }

  // Evaluate all rules
  const results = conditionGroup.rules.map((rule) => evaluateRule(rule, formData));

  // Combine results based on operator
  return conditionGroup.operator === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}

/**
 * Parse conditions from a database field (string JSON) to a ConditionGroup
 */
export function parseConditions(conditionsJson: string | null | undefined): ConditionGroup | null {
  if (!conditionsJson) return null;

  try {
    return JSON.parse(conditionsJson) as ConditionGroup;
  } catch (error) {
    console.error("Failed to parse conditions JSON:", error);
    return null;
  }
}

/**
 * Serialize a ConditionGroup to JSON string for database storage
 */
export function serializeConditions(conditions: ConditionGroup | null): string | null {
  if (!conditions) return null;
  return JSON.stringify(conditions);
}
