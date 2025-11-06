// Smart Card Types for Employment Agreement Generator

export type CardState = 'empty' | 'suggested' | 'filled' | 'warning' | 'error';

export type CardType =
  | 'person'
  | 'role'
  | 'compensation'
  | 'date'
  | 'location'
  | 'legal'
  | 'benefit'
  | 'custom';

export type CardCategory =
  | 'basics'
  | 'compensation'
  | 'legal'
  | 'termination'
  | 'benefits';

export interface AISuggestion {
  confidence: number; // 0-1
  source: 'linkedin' | 'market-data' | 'similar-agreements' | 'ai-inference';
  reasoning: string;
}

export interface ValidationRule {
  type: 'required' | 'format' | 'conditional';
  message: string;
  validate: (value: string | null) => boolean;
}

export interface SmartCard {
  id: string;
  type: CardType;
  category: CardCategory;
  icon: string; // Lucide icon name
  label: string;
  value: string | null;
  placeholder?: string;
  state: CardState;
  aiSuggestion?: AISuggestion;
  relatedCards?: string[]; // IDs of cards that appear when this is filled
  validationRules?: ValidationRule[];
  clauseTemplate?: string; // Maps to contract section
  order: number; // Display order within category
  required: boolean;
}

export interface CardCluster {
  id: string;
  title: string;
  category: CardCategory;
  cards: SmartCard[];
  completionPercentage: number;
  required: boolean;
  icon: string;
}

export interface ContractData {
  clusters: CardCluster[];
  overallCompletion: number;
  missingRequired: string[]; // Card IDs
  warnings: string[]; // Card IDs with warnings
}

export interface ClauseTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: CardCategory;
  usageRate: number; // Percentage of agreements that use this
  rating: number; // 1-5 stars
  requiredCards: string[]; // Card IDs needed to populate this clause
  tags: string[];
}

export interface DocumentSection {
  id: string;
  title: string;
  order: number;
  content: string;
  sourceCards: string[]; // Which cards contributed to this section
  isComplete: boolean;
}

export interface GeneratedDocument {
  sections: DocumentSection[];
  generatedAt: Date;
  version: string;
  completionPercentage: number;
}
