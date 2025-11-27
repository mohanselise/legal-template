"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemplateScreen } from "@/lib/db";

const screenSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["standard", "signatory"]).default("standard"),
});

type ScreenFormData = z.infer<typeof screenSchema>;

interface ScreenEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  screen: TemplateScreen | null;
  onSaved: () => void;
}

export function ScreenEditor({
  open,
  onOpenChange,
  templateId,
  screen,
  onSaved,
}: ScreenEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScreenFormData>({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "standard",
    },
  });

  // Reset form when dialog opens/closes or screen changes
  useEffect(() => {
    if (open) {
      reset({
        title: screen?.title || "",
        description: screen?.description || "",
        type: (screen as any)?.type || "standard",
      });
      setError(null);
    }
  }, [open, screen, reset]);

  const onSubmit = async (data: ScreenFormData) => {
    setSaving(true);
    setError(null);

    try {
      const url = screen
        ? `/api/admin/templates/${templateId}/screens/${screen.id}`
        : `/api/admin/templates/${templateId}/screens`;

      const response = await fetch(url, {
        method: screen ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save screen");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save screen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {screen ? "Edit Screen" : "Add Screen"}
            </DialogTitle>
            <DialogDescription>
              {screen
                ? "Update the screen title and description."
                : "Create a new screen for the form wizard."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Company Information"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional helper text for this step"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Screen Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value as "standard" | "signatory")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select screen type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="signatory">Signatory Information</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                {watch("type") === "signatory"
                  ? "Special screen for collecting signatory information (name, email, title, etc.)"
                  : "Regular form screen with custom fields"}
              </p>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {screen ? "Save Changes" : "Create Screen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

