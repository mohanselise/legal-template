/**
 * Utilities for letterhead processing and PDF conversion
 */

// pdfjs-dist is loaded dynamically to avoid server-side evaluation errors
// (DOMMatrix is not defined in Node.js environment)

/**
 * Convert PDF file to image (first page only)
 * @param file - PDF file
 * @returns Base64 data URL of the first page as image
 */
export async function pdfToImage(file: File): Promise<string> {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('pdfToImage can only be used in browser environment');
  }

  // Dynamic import to avoid server-side evaluation
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configure worker
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1); // Get first page only
  
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    throw new Error('Failed to get canvas context');
  }
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;
  
  // Convert canvas to base64 data URL
  return canvas.toDataURL('image/png');
}

/**
 * Convert image file to base64 data URL
 * @param file - Image file (PNG, JPG, etc.)
 * @returns Base64 data URL
 */
export async function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from data URL
 * @param dataUrl - Base64 data URL
 * @returns Promise with width and height
 */
export async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Convert pixels to points (72 DPI)
 * @param pixels - Pixel value
 * @param dpi - DPI of source (default: 96 for screen)
 * @returns Points value
 */
export function pixelsToPoints(pixels: number, dpi: number = 96): number {
  return (pixels / dpi) * 72;
}

/**
 * Convert points to pixels
 * @param points - Points value
 * @param dpi - Target DPI (default: 96 for screen)
 * @returns Pixels value
 */
export function pointsToPixels(points: number, dpi: number = 96): number {
  return (points / 72) * dpi;
}

/**
 * Scale content area from image dimensions to PDF page size
 * @param contentArea - Content area in image coordinates
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param pdfPageWidth - Target PDF page width in points
 * @param pdfPageHeight - Target PDF page height in points
 * @returns Scaled content area in PDF points
 */
export function scaleContentAreaToPDF(
  contentArea: { x: number; y: number; width: number; height: number },
  imageWidth: number,
  imageHeight: number,
  pdfPageWidth: number,
  pdfPageHeight: number
): { x: number; y: number; width: number; height: number } {
  const scaleX = pdfPageWidth / imageWidth;
  const scaleY = pdfPageHeight / imageHeight;
  
  return {
    x: contentArea.x * scaleX,
    y: contentArea.y * scaleY,
    width: contentArea.width * scaleX,
    height: contentArea.height * scaleY,
  };
}

