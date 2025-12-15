/**
 * Text-to-Block Mapper Utility
 * 
 * Maps PDF text content to DocumentBlocks for inline editing.
 * This allows us to identify which block a user clicked on in the PDF.
 */

import type { LegalDocument, DocumentBlock } from '@/app/api/templates/employment-agreement/schema';
import type { BlockType } from '@/app/api/templates/employment-agreement/schema';

export interface TextBlockMapping {
  blockId: string;
  blockPath: number[]; // Path to nested block [articleIdx, sectionIdx, ...]
  text: string;
  type: BlockType;
  isLeaf: boolean; // True for editable leaf nodes (paragraph, list_item, etc.)
  isTitle: boolean; // True if this is a title property, not text
}

/** Block types that are editable leaf nodes */
const LEAF_BLOCK_TYPES: BlockType[] = ['paragraph', 'list_item', 'table_cell', 'definition_item'];

/** Block types that have editable titles */
const TITLED_BLOCK_TYPES: BlockType[] = ['article', 'section'];

/**
 * Recursively builds a flat index of all editable text content from document blocks
 * Prioritizes leaf nodes (paragraphs) over containers for precise editing
 */
function buildTextIndex(
  blocks: DocumentBlock[],
  path: number[] = [],
  index: TextBlockMapping[] = []
): TextBlockMapping[] {
  blocks.forEach((block, idx) => {
    const currentPath = [...path, idx];
    const blockId = block.id || `block-${currentPath.join('-')}`;
    
    // Index leaf nodes with direct text content (most common edit target)
    if (block.text && LEAF_BLOCK_TYPES.includes(block.type)) {
      index.push({
        blockId,
        blockPath: currentPath,
        text: block.text,
        type: block.type,
        isLeaf: true,
        isTitle: false,
      });
    }
    
    // Index article/section titles (for editing headings)
    if (TITLED_BLOCK_TYPES.includes(block.type) && block.props?.title) {
      index.push({
        blockId,
        blockPath: currentPath,
        text: block.props.title,
        type: block.type,
        isLeaf: false,
        isTitle: true,
      });
    }
    
    // Recursively process children
    if (block.children && block.children.length > 0) {
      buildTextIndex(block.children, currentPath, index);
    }
  });
  
  return index;
}

/**
 * Builds a complete text index from a LegalDocument
 */
export function buildDocumentTextIndex(document: LegalDocument): TextBlockMapping[] {
  return buildTextIndex(document.content);
}

/**
 * Normalize text for comparison (lowercase, collapse whitespace)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Finds the best matching block for a given text snippet
 * Prioritizes leaf nodes (paragraphs) for precise editing
 */
export function findBlockByText(
  clickedText: string,
  document: LegalDocument
): TextBlockMapping | null {
  if (!clickedText || clickedText.trim().length === 0) {
    return null;
  }
  
  const index = buildDocumentTextIndex(document);
  const normalizedClicked = normalizeText(clickedText);
  
  // Score each mapping based on how well it matches the clicked text
  const scoredMatches = index.map(mapping => {
    const normalizedBlock = normalizeText(mapping.text);
    let score = 0;
    
    // Exact match - highest priority
    if (normalizedBlock === normalizedClicked) {
      score = 100;
    }
    // Clicked text is contained in block text
    else if (normalizedBlock.includes(normalizedClicked)) {
      // Prefer shorter blocks (more precise match)
      score = 80 - (normalizedBlock.length - normalizedClicked.length) / 100;
    }
    // Block text is contained in clicked text
    else if (normalizedClicked.includes(normalizedBlock)) {
      score = 70 - (normalizedClicked.length - normalizedBlock.length) / 100;
    }
    // Partial word overlap
    else {
      const clickedWords = normalizedClicked.split(/\s+/).filter(w => w.length > 2);
      const blockWords = normalizedBlock.split(/\s+/);
      
      if (clickedWords.length > 0) {
        const matchingWords = clickedWords.filter(word => 
          blockWords.some(bw => bw.includes(word) || word.includes(bw))
        );
        score = (matchingWords.length / clickedWords.length) * 50;
      }
    }
    
    // Boost score for leaf nodes (we want to edit specific paragraphs, not containers)
    if (mapping.isLeaf) {
      score += 10;
    }
    
    return { mapping, score };
  });
  
  // Sort by score descending and return best match
  scoredMatches.sort((a, b) => b.score - a.score);
  
  const bestMatch = scoredMatches[0];
  if (bestMatch && bestMatch.score >= 20) {
    return bestMatch.mapping;
  }
  
  return null;
}

/**
 * Gets a block at a specific path in the document
 */
export function getBlockAtPath(
  document: LegalDocument,
  path: number[]
): DocumentBlock | null {
  let current: DocumentBlock[] | DocumentBlock = document.content;
  
  for (const idx of path) {
    if (Array.isArray(current)) {
      if (idx < 0 || idx >= current.length) return null;
      current = current[idx];
    } else {
      if (!current.children || idx < 0 || idx >= current.children.length) return null;
      current = current.children[idx];
    }
  }
  
  return Array.isArray(current) ? null : current;
}

/**
 * Updates text in a block at a specific path
 * Handles both .text property (for paragraphs) and .props.title (for articles/sections)
 */
export function updateBlockText(
  document: LegalDocument,
  path: number[],
  newText: string,
  isTitle: boolean = false
): LegalDocument {
  // Deep clone the document to avoid mutating the original
  const updated = JSON.parse(JSON.stringify(document)) as LegalDocument;
  
  if (path.length === 0) {
    return updated;
  }
  
  // Navigate to the parent of the target block
  let current: DocumentBlock[] = updated.content;
  
  for (let i = 0; i < path.length - 1; i++) {
    const idx = path[i];
    if (idx < 0 || idx >= current.length) {
      console.error('Invalid path index:', idx, 'at position', i);
      return updated;
    }
    
    const block = current[idx];
    if (!block.children) {
      console.error('Block at path', path.slice(0, i + 1), 'has no children');
      return updated;
    }
    
    current = block.children;
  }
  
  // Update the target block
  const finalIdx = path[path.length - 1];
  if (finalIdx >= 0 && finalIdx < current.length) {
    const targetBlock = current[finalIdx];
    
    if (isTitle) {
      // Update the title in props
      if (!targetBlock.props) {
        targetBlock.props = {};
      }
      targetBlock.props.title = newText;
    } else {
      // Update the text content
      targetBlock.text = newText;
    }
  } else {
    console.error('Invalid final path index:', finalIdx, 'for path', path);
  }
  
  return updated;
}
