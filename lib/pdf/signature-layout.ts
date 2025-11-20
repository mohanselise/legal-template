/**
 * Shared Layout Configuration
 * 
 * This file acts as the Single Source of Truth for positioning elements
 * on the Signature Page. Both the PDF Renderer (visuals) and the 
 * Metadata Generator (interactive fields) import from here.
 */

export const SIG_PAGE_LAYOUT = {
  PAGE_WIDTH: 612, // US Letter Width (pt)
  PAGE_HEIGHT: 792, // US Letter Height (pt)
  MARGIN_X: 72, // 1 inch margins
  
  // Header Positioning
  HEADER_Y: 72,
  HEADER_HEIGHT: 60,
  
  // Block Layout
  BLOCK_START_Y: 160, // Fixed start position for first signature block
  BLOCK_HEIGHT: 130,  // Fixed height per signatory
  BLOCK_GAP: 40,      // Fixed gap between blocks
  
  // Internal Element Offsets (Relative to Block Top)
  LABEL_Y: 0,         // "EMPLOYER" label
  NAME_Y: 15,         // Signatory Name
  TITLE_Y: 30,        // Signatory Title
  
  // Visual Lines (The underline)
  LINE_Y: 80,         
  FIELD_LABEL_Y: 86,  // "Signature" text below line
  
  // Interactive Field Zones (The "Invisible" Boxes for Overlay)
  // Matches visual line position + space for drawing
  // We want the box to be around the line, maybe slightly above to contain the signature
  // Centered horizontally: Total width of sig + gap + date = 220 + 40 + 120 = 380
  // Content width = 468, so center offset = (468 - 380) / 2 = 44
  SIG_BOX_X_OFFSET: 44, // Centered: (CONTENT_WIDTH - (SIG_BOX_WIDTH + 40 + DATE_BOX_WIDTH)) / 2
  SIG_BOX_Y_OFFSET: 45, 
  SIG_BOX_HEIGHT: 45,
  SIG_BOX_WIDTH: 220,
  
  DATE_BOX_X_OFFSET: 304, // SIG_BOX_X_OFFSET + SIG_BOX_WIDTH + 40 (gap)
  DATE_BOX_WIDTH: 120,
};

export const CONTENT_WIDTH = SIG_PAGE_LAYOUT.PAGE_WIDTH - (SIG_PAGE_LAYOUT.MARGIN_X * 2);

/**
 * Calculates the absolute Y position for a specific signatory block.
 * @param index 0-based index of the signatory
 */
export const getSignatureBlockPosition = (index: number) => {
  return SIG_PAGE_LAYOUT.BLOCK_START_Y + (index * (SIG_PAGE_LAYOUT.BLOCK_HEIGHT + SIG_PAGE_LAYOUT.BLOCK_GAP));
};

