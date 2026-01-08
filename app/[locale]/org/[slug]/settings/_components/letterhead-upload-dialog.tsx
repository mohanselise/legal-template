"use client";

import { useState, useRef } from "react";
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
import { Loader2, Upload, FileImage, ArrowLeft } from "lucide-react";
import { ContentAreaEditor } from "@/components/template-review/ContentAreaEditor";
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

type Step = "upload" | "detect" | "edit" | "name";

interface FileInfo {
  url: string;
  key: string;
  name: string;
  type: string;
}

export function LetterheadUploadDialog({
  open,
  onClose,
  onSuccess,
  orgId,
}: LetterheadUploadDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
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

  const handleUploadComplete = async (res: { url: string; key: string; name: string; type: string }[]) => {
    if (res.length === 0) return;

    const file = res[0];
    setFileInfo({
      url: file.url,
      key: file.key,
      name: file.name,
      type: file.type,
    });
    setIsProcessing(true);
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
      setStep("detect");
      setIsProcessing(false);

      // Auto-detect content area
      await detectContentArea(dataUrl, dimensions);
    } catch (err) {
      console.error("Error processing file:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
      setIsProcessing(false);
    }
  };

  const detectContentArea = async (
    dataUrl: string,
    dims: { width: number; height: number }
  ) => {
    setIsDetecting(true);
    setError(null);

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
        setStep("edit");
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
      setStep("edit");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleContentAreaConfirm = () => {
    setStep("name");
  };

  const handleSave = async () => {
    if (!fileInfo || !contentArea || !imageDimensions || !letterheadName.trim()) {
      setError("Please fill in all required fields");
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
    setFileInfo(null);
    setImageDataUrl(null);
    setContentArea(null);
    setImageDimensions(null);
    setLetterheadName("");
    setIsDefault(false);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (step === "edit") {
      setStep("detect");
      if (imageDataUrl && imageDimensions) {
        detectContentArea(imageDataUrl, imageDimensions);
      }
    } else if (step === "name") {
      setStep("edit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Upload Letterhead"}
            {step === "detect" && "Processing Letterhead"}
            {step === "edit" && "Adjust Content Area"}
            {step === "name" && "Name Your Letterhead"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a PDF or image of your company letterhead."}
            {step === "detect" &&
              "Detecting the content area where text should be placed..."}
            {step === "edit" &&
              "Drag the top or bottom edge to adjust where document text will appear."}
            {step === "name" &&
              "Give your letterhead a name to identify it easily."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
              {error}
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-4">
              {isProcessing ? (
                <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--selise-blue))] animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Processing your file...
                  </p>
                </div>
              ) : (
                <UploadDropzone
                  endpoint="letterheadUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(err) => {
                    setError(err.message);
                  }}
                  appearance={{
                    container:
                      "border-2 border-dashed border-[hsl(var(--border))] rounded-lg ut-uploading:border-[hsl(var(--selise-blue))]",
                    label: "text-[hsl(var(--fg))]",
                    allowedContent: "text-muted-foreground text-sm",
                    button:
                      "bg-[hsl(var(--button-primary))] hover:bg-[hsl(var(--button-primary-hover))] text-white ut-uploading:bg-[hsl(var(--selise-blue))]/80",
                  }}
                />
              )}
              <p className="text-xs text-center text-muted-foreground">
                Supported formats: PDF, PNG, JPG (max 4MB)
              </p>
            </div>
          )}

          {step === "detect" && (
            <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
              {isDetecting ? (
                <>
                  <Loader2 className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--selise-blue))] animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    AI is detecting the content area...
                  </p>
                </>
              ) : (
                <>
                  <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Ready to detect content area
                  </p>
                  <Button
                    onClick={() => {
                      if (imageDataUrl && imageDimensions) {
                        detectContentArea(imageDataUrl, imageDimensions);
                      }
                    }}
                  >
                    Detect Content Area
                  </Button>
                </>
              )}
            </div>
          )}

          {step === "edit" && imageDataUrl && contentArea && imageDimensions && (
            <ContentAreaEditor
              imageUrl={imageDataUrl}
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              initialContentArea={contentArea}
              onContentAreaChange={setContentArea}
              onConfirm={handleContentAreaConfirm}
              onCancel={handleClose}
            />
          )}

          {step === "name" && (
            <div className="space-y-4">
              {imageDataUrl && (
                <div className="relative">
                  <img
                    src={imageDataUrl}
                    alt="Letterhead preview"
                    className="w-full max-h-48 object-contain border rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="letterheadName">Letterhead Name</Label>
                <Input
                  id="letterheadName"
                  value={letterheadName}
                  onChange={(e) => setLetterheadName(e.target.value)}
                  placeholder="e.g., Main Office, Legal Department"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  A name to help you identify this letterhead
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
                  Set as default letterhead for this organization
                </Label>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !letterheadName.trim()}
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
