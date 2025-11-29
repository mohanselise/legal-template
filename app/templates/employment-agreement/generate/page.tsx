import { SmartFlowV2 } from './_components/SmartFlowV2';

// Force dynamic rendering to avoid prerender issues
export const dynamic = 'force-dynamic';

/**
 * Employment Agreement Generation Page
 *
 * AI-powered smart flow with dynamic question adaptation:
 * 1. Background AI enrichment for jurisdiction and job intelligence
 * 2. Smart defaults based on market standards
 * 3. "Use Market Standard" quick-fill buttons
 * 4. Real-time validation and benchmarking
 * 5. 7 contextual screens with progressive disclosure
 * 6. Auto-save progress to localStorage
 * 7. Brand-aligned, trustworthy, and accessible design
 */
export default function GeneratePage() {
  return <SmartFlowV2 />;
}
