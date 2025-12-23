/**
 * Shared Layout Configuration
 * 
 * This file acts as the Single Source of Truth for positioning elements
 * on the Signature Page. Both the PDF Renderer (visuals) and the 
 * Metadata Generator (interactive fields) import from here.
 * 
 * KEY INSIGHT: Because both PDF rendering and overlay positioning use
 * these same constants, signature fields will ALWAYS align correctly
 * regardless of how many signatories the AI returns.
 * 
 * FIXED-HEIGHT BLOCKS: Each signatory block has a fixed height to ensure
 * deterministic positioning. This eliminates cumulative positioning errors
 * that occurred when variable-height content caused overlay drift.
 */

export const SIG_PAGE_LAYOUT = {
  PAGE_WIDTH: 612, // US Letter Width (pt)
  PAGE_HEIGHT: 792, // US Letter Height (pt)
  MARGIN_X: 72, // 1 inch margins
  
  // Header Positioning
  HEADER_Y: 72,
  HEADER_HEIGHT: 60,
  
  // Block Layout - FIXED HEIGHT for deterministic overlay positioning
  // These values MUST match the styles in SignaturePage.tsx
  BLOCK_START_Y: 140,   // Fixed start position for first signature block
  BLOCK_HEIGHT: 160,    // Fixed height per signatory block (SignaturePage.signatureBlock.height)
  BLOCK_GAP: 40,        // Gap between blocks (SignaturePage.signatureBlock.marginBottom)
  
  // Internal Element Offsets (Relative to Block Top)
  // Used for reference - actual positioning is done by React-PDF flow layout
  LABEL_Y: 0,           // Party label (e.g., "EMPLOYER", "DISCLOSING PARTY")
  NAME_Y: 14,           // Signatory Name
  DETAILS_Y: 30,        // Details section (title, company, email, address)
  
  // Visual Lines (The underline) position within fixed block
  LINE_Y: 110,          // Signature line position from block top
  FIELD_LABEL_Y: 116,   // "Signature" text below line
  
  // Interactive Field Zones (The "Invisible" Boxes for Overlay)
  // These coordinates are used by both PDF and overlay systems
  // SIG_BOX_Y_OFFSET positions the overlay at the signature line within the fixed block
  SIG_BOX_X_OFFSET: 0,  // Aligned with left edge of content
  SIG_BOX_Y_OFFSET: 150, // Position at signature line (adjusted to align with actual rendered line)
  SIG_BOX_HEIGHT: 45,
  SIG_BOX_WIDTH: 220,
  
  DATE_BOX_X_OFFSET: 260, // SIG_BOX_WIDTH + 40 (gap)
  DATE_BOX_WIDTH: 120,
  
  // Maximum signatories per page (for pagination)
  // With BLOCK_HEIGHT: 160 + BLOCK_GAP: 40 = 200pt per block
  // Available space: PAGE_HEIGHT - HEADER - margins ≈ 600pt
  // 600 / 200 = 3 signatories per page
  MAX_SIGNATORIES_PER_PAGE: 3,
};

export const CONTENT_WIDTH = SIG_PAGE_LAYOUT.PAGE_WIDTH - (SIG_PAGE_LAYOUT.MARGIN_X * 2);

/**
 * Calculates the absolute Y position for a specific signatory block.
 * 
 * This is the CRITICAL function that ensures PDF and overlay alignment.
 * Both SignaturePage.tsx and signature-field-metadata.ts use this same function.
 * 
 * @param index 0-based index of the signatory
 * @returns Absolute Y position in points from top of page
 * 
 * @example
 * getSignatureBlockPosition(0) // → 160 (first signatory)
 * getSignatureBlockPosition(1) // → 330 (second signatory)
 * getSignatureBlockPosition(2) // → 500 (third signatory)
 */
export const getSignatureBlockPosition = (index: number): number => {
  // Handle pagination - wrap to next page if needed
  const indexOnPage = index % SIG_PAGE_LAYOUT.MAX_SIGNATORIES_PER_PAGE;
  return SIG_PAGE_LAYOUT.BLOCK_START_Y + (indexOnPage * (SIG_PAGE_LAYOUT.BLOCK_HEIGHT + SIG_PAGE_LAYOUT.BLOCK_GAP));
};

/**
 * Calculates which page a signatory's signature block will appear on.
 * @param index 0-based index of the signatory
 * @param totalContentPages Total pages of document content before signature pages
 * @returns 1-based page number
 */
export const getSignaturePageNumber = (index: number, totalContentPages: number): number => {
  const signatoryPageIndex = Math.floor(index / SIG_PAGE_LAYOUT.MAX_SIGNATORIES_PER_PAGE);
  return totalContentPages + 1 + signatoryPageIndex;
};

/**
 * Calculate total signature pages needed
 * @param signatoryCount Number of signatories
 * @returns Number of pages needed for signatures
 */
export const calculateSignaturePages = (signatoryCount: number): number => {
  return Math.ceil(signatoryCount / SIG_PAGE_LAYOUT.MAX_SIGNATORIES_PER_PAGE);
};
