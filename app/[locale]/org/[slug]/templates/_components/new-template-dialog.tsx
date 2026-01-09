"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Pencil, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface NewTemplateDialogProps {
  locale: string;
  orgSlug: string;
  orgName: string;
  orgId: string;
}

export function NewTemplateDialog({
  locale,
  orgSlug,
  orgName,
  orgId,
}: NewTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestTemplate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/org/${orgId}/template-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "collaboration",
          organizationName: orgName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit request");
      }

      toast.success(
        "Request submitted! Our team will reach out to collaborate on your template."
      );
      setOpen(false);
    } catch (error) {
      console.error("Error submitting template request:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSelf = () => {
    setOpen(false);
    router.push(`/${locale}/org/${orgSlug}/templates/new`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Template</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to create your organization template
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Option 1: Request SELISE Team */}
          <Card
            className="cursor-pointer hover:border-[hsl(var(--selise-blue))] transition-colors group"
            onClick={handleRequestTemplate}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-[hsl(var(--selise-blue))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-[hsl(var(--fg))]">
                      Request SELISE Team
                    </h3>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--selise-blue))]" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-[hsl(var(--globe-grey))] group-hover:text-[hsl(var(--selise-blue))] transition-colors" />
                    )}
                  </div>
                  <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
                    Let our team create a professional template for{" "}
                    <span className="font-medium">{orgName}</span>. We&apos;ll
                    collaborate with you to ensure it meets your exact needs.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                    <span className="text-xs text-[hsl(var(--globe-grey))]">
                      Professional quality
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Option 2: Create Yourself */}
          <Card
            className="cursor-pointer hover:border-[hsl(var(--selise-blue))] transition-colors group"
            onClick={handleCreateSelf}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
                  <Pencil className="h-6 w-6 text-[hsl(var(--globe-grey))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-[hsl(var(--fg))]">
                      Create It Yourself
                    </h3>
                    <ArrowRight className="h-4 w-4 text-[hsl(var(--globe-grey))] group-hover:text-[hsl(var(--selise-blue))] transition-colors" />
                  </div>
                  <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
                    Use our template builder to create your own template from
                    scratch. Full control over screens, fields, and AI
                    configuration.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[hsl(var(--globe-grey))]">
                      DIY approach
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
