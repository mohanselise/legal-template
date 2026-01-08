"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Upload, FileUp, Check } from "lucide-react";
import {
  pdfToImage,
  imageToDataUrl,
  getImageDimensions,
} from "@/lib/pdf/letterhead-utils";
import { UploadDropzone } from "@/lib/uploadthing";

interface LetterheadUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: string;
}

type Step = "upload" | "configure";
type ProcessingStatus = "idle" | "uploading" | "processing" | "detecting" | "complete";

interface FileInfo {
  url: string;
  key: string;
  name: string;
  type: string;
}

// Default 1-inch margin (approximately 12% of page width for standard letter size)
const DEFAULT_HORIZONTAL_MARGIN_PERCENT = 0.12;

export function LetterheadUploadDialog({
  open,
  onClose,
  onSuccess,
  orgId,
}: LetterheadUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentArea, setContentArea] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [letterheadName, setLetterheadName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Editor state
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialArea, setInitialArea] = useState<typeof contentArea>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate scale for preview
  useEffect(() => {
    if (!imageDimensions) return;
    const maxWidth = 380;
    const maxHeight = 480;
    const scaleX = maxWidth / imageDimensions.width;
    const scaleY = maxHeight / imageDimensions.height;
    setScale(Math.min(scaleX, scaleY, 1));
  }, [imageDimensions]);

  const getStatusMessage = () => {
    switch (processingStatus) {
      case "uploading":
        return "Uploading file...";
      case "processing":
        return "Processing image...";
      case "detecting":
        return "Detecting content area...";
      default:
        return "";
    }
  };

  const handleUploadComplete = async (res: { url: string; key: string; name: string; type: string }[]) => {
    if (res.length === 0) return;

    const file = res[0];
    setFileInfo({
      url: file.url,
      key: file.key,
      name: file.name,
      type: file.type,
    });
    setProcessingStatus("processing");
    setError(null);

    try {
      // Fetch the file and convert to data URL for processing
      const response = await fetch(file.url);
      const blob = await response.blob();
      const fileObj = new File([blob], file.name, { type: file.type });

      let dataUrl: string;
      let dimensions: { width: number; height: number };

      if (file.type === "application/pdf") {
        dataUrl = await pdfToImage(fileObj);
        dimensions = await getImageDimensions(dataUrl);
      } else if (file.type.startsWith("image/")) {
        dataUrl = await imageToDataUrl(fileObj);
        dimensions = await getImageDimensions(dataUrl);
      } else {
        throw new Error("Unsupported file type");
      }

      setImageDataUrl(dataUrl);
      setImageDimensions(dimensions);

      // Auto-detect content area
      setProcessingStatus("detecting");
      await detectContentArea(dataUrl, dimensions);
    } catch (err) {
      console.error("Error processing file:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
      setProcessingStatus("idle");
    }
  };

  const detectContentArea = async (
    dataUrl: string,
    dims: { width: number; height: number }
  ) => {
    try {
      const formData = new FormData();
      formData.append("imageDataUrl", dataUrl);
      formData.append("width", dims.width.toString());
      formData.append("height", dims.height.toString());

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
      } else {
        throw new Error("No content area detected");
      }
    } catch (err) {
      console.error("Error detecting content area:", err);
      // Fallback to default content area
      setContentArea({
        x: dims.width * 0.1,
        y: dims.height * 0.15,
        width: dims.width * 0.8,
        height: dims.height * 0.7,
      });
    } finally {
      setProcessingStatus("complete");
      setStep("configure");
    }
  };

  const handleSave = async () => {
    if (!fileInfo || !contentArea || !imageDimensions || !letterheadName.trim()) {
      setError("Please enter a name for the letterhead");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${orgId}/letterheads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: letterheadName.trim(),
          fileUrl: fileInfo.url,
          fileKey: fileInfo.key,
          fileName: fileInfo.name,
          fileType: fileInfo.type,
          pageWidth: imageDimensions.width,
          pageHeight: imageDimensions.height,
          contentArea,
          isDefault,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save letterhead");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error saving letterhead:", err);
      setError(err instanceof Error ? err.message : "Failed to save letterhead");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setProcessingStatus("idle");
    setFileInfo(null);
    setImageDataUrl(null);
    setContentArea(null);
    setImageDimensions(null);
    setLetterheadName("");
    setIsDefault(false);
    setError(null);
    onClose();
  };

  // Content area drag handling
  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStartY(e.clientY);
    setInitialArea(contentArea);
  };

  useEffect(() => {
    if (!isDragging || !initialArea || !imageDimensions) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageContainerRef.current) return;

      const deltaY = (e.clientY - dragStartY) / scale;
      let newArea = { ...initialArea };

      if (dragHandle === 'n') {
        const newY = Math.max(0, Math.min(initialArea.y + deltaY, initialArea.y + initialArea.height - 50));
        newArea.height = initialArea.y + initialArea.height - newY;
        newArea.y = newY;
      } else if (dragHandle === 's') {
        newArea.height = Math.max(50, Math.min(initialArea.height + deltaY, imageDimensions.height - initialArea.y));
      }

      setContentArea(newArea);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragHandle, dragStartY, initialArea, scale, imageDimensions]);

  const scaledArea = contentArea && imageDimensions ? {
    x: contentArea.x * scale,
    y: contentArea.y * scale,
    width: contentArea.width * scale,
    height: contentArea.height * scale,
  } : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === "configure" ? "max-w-4xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? "Upload Letterhead" : "Configure Letterhead"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload"
              ? "Upload a PDF or image of your company letterhead"
              : "Adjust the content area and name your letterhead"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            {processingStatus !== "idle" ? (
              <div className="border-2 border-[hsl(var(--selise-blue))]/30 rounded-lg p-8 bg-[hsl(var(--selise-blue))]/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-[hsl(var(--selise-blue))] animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-[hsl(var(--fg))]">
                      {getStatusMessage()}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This may take a few seconds
                    </p>
                  </div>
                  {/* Progress steps */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`flex items-center gap-1.5 text-xs ${
                      processingStatus === "uploading" ? "text-[hsl(var(--selise-blue))]" : "text-muted-foreground"
                    }`}>
                      {processingStatus !== "uploading" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                      )}
                      Upload
                    </div>
                    <div className="w-4 h-px bg-border" />
                    <div className={`flex items-center gap-1.5 text-xs ${
                      processingStatus === "processing" ? "text-[hsl(var(--selise-blue))]" :
                      processingStatus === "detecting" || processingStatus === "complete" ? "text-muted-foreground" : "text-muted-foreground/50"
                    }`}>
                      {processingStatus === "detecting" || processingStatus === "complete" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : processingStatus === "processing" ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current/50" />
                      )}
                      Process
                    </div>
                    <div className="w-4 h-px bg-border" />
                    <div className={`flex items-center gap-1.5 text-xs ${
                      processingStatus === "detecting" ? "text-[hsl(var(--selise-blue))]" :
                      processingStatus === "complete" ? "text-muted-foreground" : "text-muted-foreground/50"
                    }`}>
                      {processingStatus === "complete" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : processingStatus === "detecting" ? (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current/50" />
                      )}
                      Detect
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <UploadDropzone
                endpoint="letterheadUploader"
                config={{ mode: "auto" }}
                onUploadBegin={() => setProcessingStatus("uploading")}
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(err) => {
                  setError(err.message);
                  setProcessingStatus("idle");
                }}
                appearance={{
                  container:
                    "border-2 border-dashed border-[hsl(var(--border))] rounded-lg hover:border-[hsl(var(--selise-blue))]/50 hover:bg-[hsl(var(--selise-blue))]/5 transition-all cursor-pointer ut-uploading:border-[hsl(var(--selise-blue))]",
                  label: "text-[hsl(var(--fg))] font-medium",
                  allowedContent: "text-muted-foreground text-sm",
                  button:
                    "bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--selise-blue))]/90 text-white font-medium ut-uploading:bg-[hsl(var(--selise-blue))]/80 ut-ready:bg-[hsl(var(--selise-blue))]",
                  uploadIcon: "text-[hsl(var(--selise-blue))] w-12 h-12",
                }}
                content={{
                  label: "Drop your letterhead here or click to browse",
                  allowedContent: "PDF, PNG, or JPG (max 4MB)",
                }}
              />
            )}
          </div>
        )}

        {step === "configure" && imageDataUrl && contentArea && imageDimensions && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr,280px] gap-6">
            {/* Preview with content area editor */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Drag the handles to adjust where document content will appear
              </div>
              <div
                className="relative border rounded-lg bg-[hsl(var(--muted))]/30 p-4 flex items-center justify-center"
                style={{ minHeight: '400px' }}
              >
                <div
                  ref={imageContainerRef}
                  className="relative shadow-lg"
                  style={{
                    width: imageDimensions.width * scale,
                    height: imageDimensions.height * scale,
                  }}
                >
                  <img
                    src={imageDataUrl}
                    alt="Letterhead preview"
                    className="block rounded"
                    style={{
                      width: imageDimensions.width * scale,
                      height: imageDimensions.height * scale,
                    }}
                    draggable={false}
                  />

                  {/* Content area overlay */}
                  {scaledArea && (
                    <div
                      className="absolute border-2 border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 pointer-events-none"
                      style={{
                        left: scaledArea.x,
                        top: scaledArea.y,
                        width: scaledArea.width,
                        height: scaledArea.height,
                      }}
                    >
                      {/* Top handle */}
                      <div
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[hsl(var(--selise-blue))] rounded cursor-ns-resize flex items-center justify-center pointer-events-auto hover:bg-[hsl(var(--selise-blue))]/80 transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, 'n')}
                      >
                        <div className="w-10 h-0.5 bg-white/80 rounded" />
                      </div>
                      {/* Bottom handle */}
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[hsl(var(--selise-blue))] rounded cursor-ns-resize flex items-center justify-center pointer-events-auto hover:bg-[hsl(var(--selise-blue))]/80 transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, 's')}
                      >
                        <div className="w-10 h-0.5 bg-white/80 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings panel */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="letterheadName">Letterhead Name</Label>
                <Input
                  id="letterheadName"
                  value={letterheadName}
                  onChange={(e) => setLetterheadName(e.target.value)}
                  placeholder="e.g., Main Office"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  A name to identify this letterhead
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked === true)}
                />
                <Label
                  htmlFor="isDefault"
                  className="text-sm font-normal cursor-pointer"
                >
                  Set as default letterhead
                </Label>
              </div>

              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Content Area</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Header excluded:</span>
                    <span className="font-mono">{Math.round(contentArea.y)}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Footer excluded:</span>
                    <span className="font-mono">{Math.round(imageDimensions.height - contentArea.y - contentArea.height)}px</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !letterheadName.trim()}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Letterhead"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
