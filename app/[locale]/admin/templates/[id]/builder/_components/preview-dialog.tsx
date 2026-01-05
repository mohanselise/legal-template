"use client";

import { useState } from "react";
import { Eye, Loader2, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateSlug: string;
  locale: string;
  previewToken: string | null;
  onTokenGenerated: (token: string) => void;
}

export function PreviewDialog({
  open,
  onOpenChange,
  templateId,
  templateSlug,
  locale,
  previewToken,
  onTokenGenerated,
}: PreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateToken = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/preview-token`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate preview token");
      }

      const data = await response.json();
      onTokenGenerated(data.previewToken);
      toast.success("Preview link generated successfully");
    } catch (error) {
      console.error("Error generating preview token:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate preview token"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const previewUrl = previewToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/templates/${templateSlug}/generate?preview=${previewToken}`
    : "";

  const handleCopyLink = async () => {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("Preview link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenPreview = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
            <DialogTitle>Preview Template</DialogTitle>
          </div>
          <DialogDescription>
            Generate a shareable preview link for team review. This link allows access to draft templates without making them publicly available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {previewToken ? (
            <>
              <div className="space-y-2">
                <Label>Preview URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={previewUrl}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copy preview link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Share this link with your team for internal review. The link will stop working if you revoke it or publish the template.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleOpenPreview}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Open Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateToken}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[hsl(var(--selise-blue))]/5 border border-[hsl(var(--selise-blue))]/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-[hsl(var(--selise-blue))] mt-0.5" />
                  <div>
                    <p className="font-medium text-[hsl(var(--fg))]">No preview link generated</p>
                    <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
                      Generate a preview link to share this draft template with your team for review and feedback.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleGenerateToken}
                disabled={isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Generate Preview Link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

