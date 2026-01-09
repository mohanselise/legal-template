"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";

interface GeneralSettingsFormProps {
  orgId: string;
  initialData: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

export function GeneralSettingsForm({ orgId, initialData }: GeneralSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData.name,
    slug: initialData.slug,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update organization");
      }

      setSuccess(true);

      // If slug changed, redirect to new URL
      if (formData.slug !== initialData.slug) {
        router.push(`/org/${formData.slug}/settings`);
      } else {
        router.refresh();
      }

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = formData.name !== initialData.name || formData.slug !== initialData.slug;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Inc."
              required
              minLength={2}
            />
            <p className="text-xs text-[hsl(var(--globe-grey))]">
              This is displayed throughout the application
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-0">
              <span className="inline-flex items-center px-3 h-9 rounded-l-md border border-r-0 border-input bg-[hsl(var(--muted))] text-sm text-[hsl(var(--globe-grey))]">
                /org/
              </span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="acme-inc"
                required
                pattern="[a-z0-9-]+"
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-[hsl(var(--globe-grey))]">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] text-sm">
              <Check className="h-4 w-4" />
              Settings saved successfully
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            {hasChanges && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormData({ name: initialData.name, slug: initialData.slug })}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
