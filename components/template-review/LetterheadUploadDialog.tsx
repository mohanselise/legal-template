"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload, X, FileImage } from "lucide-react";
import { ContentAreaEditor } from "./ContentAreaEditor";
import { pdfToImage, imageToDataUrl, getImageDimensions, pixelsToPoints } from "@/lib/pdf/letterhead-utils";
import type { LetterheadConfig } from "@/app/api/templates/employment-agreement/schema";

interface LetterheadUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: LetterheadConfig) => void;
  existingLetterhead?: LetterheadConfig;
}

export function LetterheadUploadDialog({
  open,
  onClose,
  onConfirm,
  existingLetterhead,
}: LetterheadUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    existingLetterhead?.imageDataUrl || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [contentArea, setContentArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(
    existingLetterhead
      ? {
          x: existingLetterhead.contentArea.x,
          y: existingLetterhead.contentArea.y,
          width: existingLetterhead.contentArea.width,
          height: existingLetterhead.contentArea.height,
        }
      : null
  );
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(
    existingLetterhead
      ? {
          width: existingLetterhead.pageWidth,
          height: existingLetterhead.pageHeight,
        }
      : null
  );
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      let dataUrl: string;
      let dimensions: { width: number; height: number };

      if (selectedFile.type === "application/pdf") {
        // Convert PDF to image
        dataUrl = await pdfToImage(selectedFile);
        dimensions = await getImageDimensions(dataUrl);
      } else if (selectedFile.type.startsWith("image/")) {
        // Convert image to data URL
        dataUrl = await imageToDataUrl(selectedFile);
        dimensions = await getImageDimensions(dataUrl);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or image file.");
      }

      setImageDataUrl(dataUrl);
      setImageDimensions(dimensions);
      setIsProcessing(false);

      // Auto-detect content area - pass dimensions directly since state update is async
      await detectContentArea(dataUrl, dimensions);
    } catch (error) {
      console.error("Error processing file:", error);
      alert(error instanceof Error ? error.message : "Failed to process file");
      setIsProcessing(false);
    }
  };

  const detectContentArea = async (dataUrl: string, dims?: { width: number; height: number }) => {
    setIsDetecting(true);
    // Use passed dimensions or fall back to state
    const dimensions = dims || imageDimensions;
    try {
      const formData = new FormData();
      formData.append("imageDataUrl", dataUrl);
      // Include dimensions for accurate AI detection
      if (dimensions) {
        formData.append("width", dimensions.width.toString());
        formData.append("height", dimensions.height.toString());
      }

      const response = await fetch("/api/letterhead/detect-content-area", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to detect content area");
      }

      const result = await response.json();
      if (result.success && result.contentArea) {
        setContentArea(result.contentArea);
        setShowEditor(true);
      }
    } catch (error) {
      console.error("Error detecting content area:", error);
      // Fallback to default content area using passed dimensions or state
      const fallbackDims = dims || imageDimensions;
      if (fallbackDims) {
        setContentArea({
          x: fallbackDims.width * 0.1, // 10% margin
          y: fallbackDims.height * 0.15, // 15% top margin
          width: fallbackDims.width * 0.8, // 80% width
          height: fallbackDims.height * 0.7, // 70% height
        });
        setShowEditor(true);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConfirm = () => {
    if (!imageDataUrl || !contentArea || !imageDimensions) {
      return;
    }

    // Convert pixels to points (assuming 96 DPI for images, 72 DPI for PDF)
    // For PDF page size (LETTER = 8.5" x 11" = 612 x 792 points)
    const PDF_PAGE_WIDTH = 612; // US Letter width in points
    const PDF_PAGE_HEIGHT = 792; // US Letter height in points

    // Scale content area from image pixels to PDF points
    const scaleX = PDF_PAGE_WIDTH / imageDimensions.width;
    const scaleY = PDF_PAGE_HEIGHT / imageDimensions.height;

    const letterheadConfig: LetterheadConfig = {
      imageDataUrl,
      pageWidth: PDF_PAGE_WIDTH,
      pageHeight: PDF_PAGE_HEIGHT,
      contentArea: {
        x: contentArea.x * scaleX,
        y: contentArea.y * scaleY,
        width: contentArea.width * scaleX,
        height: contentArea.height * scaleY,
      },
    };

    onConfirm(letterheadConfig);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setImageDataUrl(existingLetterhead?.imageDataUrl || null);
    setContentArea(
      existingLetterhead
        ? {
            x: existingLetterhead.contentArea.x,
            y: existingLetterhead.contentArea.y,
            width: existingLetterhead.contentArea.width,
            height: existingLetterhead.contentArea.height,
          }
        : null
    );
    setImageDimensions(
      existingLetterhead
        ? {
            width: existingLetterhead.pageWidth,
            height: existingLetterhead.pageHeight,
          }
        : null
    );
    setShowEditor(false);
    onClose();
  };

  const handleRemove = () => {
    setFile(null);
    setImageDataUrl(null);
    setContentArea(null);
    setImageDimensions(null);
    setShowEditor(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Company Letterhead</DialogTitle>
          <DialogDescription>
            Upload a PDF or image of your company letterhead. We'll automatically detect the content area where text should be placed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imageDataUrl ? (
            <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    handleFileSelect(selectedFile);
                  }
                }}
              />
              <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a PDF or image file (PNG, JPG)
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isDetecting}
              >
                {isProcessing || isDetecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          ) : showEditor && contentArea && imageDimensions ? (
            <ContentAreaEditor
              imageUrl={imageDataUrl}
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              initialContentArea={contentArea}
              onContentAreaChange={(area) => setContentArea(area)}
              onConfirm={handleConfirm}
              onCancel={handleClose}
            />
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imageDataUrl}
                  alt="Letterhead preview"
                  className="w-full h-auto border rounded-lg"
                />
                {isDetecting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Detecting content area...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRemove}>
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button
                  onClick={() => {
                    if (imageDataUrl && imageDimensions) {
                      detectContentArea(imageDataUrl, imageDimensions);
                    }
                  }}
                  disabled={isDetecting}
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    "Detect Content Area"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

