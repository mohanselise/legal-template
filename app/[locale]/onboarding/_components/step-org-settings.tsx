"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

interface OrgData {
  name: string;
  logoUrl: string;
}

interface StepOrgSettingsProps {
  orgId: string | null;
  data: OrgData;
  onChange: (data: OrgData) => void;
  onComplete: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function StepOrgSettings({
  orgId,
  data,
  onChange,
  onComplete,
  onSkip,
  isLoading,
}: StepOrgSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      onComplete();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update organization settings
      const response = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to update organization");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof OrgData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--brand-surface))]">
          <Building2 className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-aptos)] text-xl font-semibold text-[hsl(var(--fg))]">
          Organization Settings
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Configure your organization details
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-[hsl(var(--crimson))]/20 bg-[hsl(var(--crimson))]/10 p-3 text-sm text-[hsl(var(--crimson))]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            type="text"
            value={data.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Acme Corporation"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            This is how your organization will appear to team members
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isSaving || isLoading}
        >
          Skip for now
        </Button>
        <Button
          type="submit"
          disabled={isSaving || isLoading}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
