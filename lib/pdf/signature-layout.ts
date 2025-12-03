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
 */

export const SIG_PAGE_LAYOUT = {
  PAGE_WIDTH: 612, // US Letter Width (pt)
  PAGE_HEIGHT: 792, // US Letter Height (pt)
  MARGIN_X: 72, // 1 inch margins
  
  // Header Positioning
  HEADER_Y: 72,
  HEADER_HEIGHT: 60,
  
  // Block Layout - Dynamically positions N signatories
  BLOCK_START_Y: 160, // Fixed start position for first signature block
  BLOCK_HEIGHT: 130,  // Fixed height per signatory
  BLOCK_GAP: 40,      // Fixed gap between blocks
  
  // Internal Element Offsets (Relative to Block Top)
  LABEL_Y: 0,         // Party label (e.g., "EMPLOYER", "DISCLOSING PARTY")
  NAME_Y: 15,         // Signatory Name
  TITLE_Y: 30,        // Signatory Title/Company
  
  // Visual Lines (The underline)
  LINE_Y: 80,         
  FIELD_LABEL_Y: 86,  // "Signature" text below line
  
  // Interactive Field Zones (The "Invisible" Boxes for Overlay)
  // These coordinates are used by both PDF and overlay systems
  SIG_BOX_X_OFFSET: 44,
  SIG_BOX_Y_OFFSET: 45, 
  SIG_BOX_HEIGHT: 45,
  SIG_BOX_WIDTH: 220,
  
  DATE_BOX_X_OFFSET: 304, // SIG_BOX_X_OFFSET + SIG_BOX_WIDTH + 40 (gap)
  DATE_BOX_WIDTH: 120,
  
  // Maximum signatories per page (for pagination)
  MAX_SIGNATORIES_PER_PAGE: 4,
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
