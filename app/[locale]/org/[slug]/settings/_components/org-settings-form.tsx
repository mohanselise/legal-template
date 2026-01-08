"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, KeyRound, Info, Trash2, ExternalLink } from "lucide-react";

interface OrgSettingsFormProps {
  orgId: string;
  initialData: {
    name: string;
    slug: string;
    logoUrl: string | null;
    hasSeliseCredentials?: boolean;
  };
}

export function OrgSettingsForm({ orgId, initialData }: OrgSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingCredentials, setIsRemovingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData.name,
    slug: initialData.slug,
  });

  // Separate state for credentials (not shown in main form)
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [credentials, setCredentials] = useState({
    seliseClientId: "",
    seliseClientSecret: "",
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCredentials = async () => {
    // Validate both fields are provided
    if (!credentials.seliseClientId || !credentials.seliseClientSecret) {
      setError("Both Client ID and Client Secret are required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seliseClientId: credentials.seliseClientId,
          seliseClientSecret: credentials.seliseClientSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save credentials");
      }

      setSuccess(true);
      setShowCredentialForm(false);
      setCredentials({ seliseClientId: "", seliseClientSecret: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    setIsRemovingCredentials(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seliseClientId: "",
          seliseClientSecret: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove credentials");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRemovingCredentials(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your organization&apos;s basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--globe-grey))]">
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
                />
              </div>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* SELISE Signature Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
            </div>
            <div>
              <CardTitle>SELISE Signature Integration</CardTitle>
              <CardDescription>
                Configure organization-specific e-signing credentials. Documents will be sent from your organization&apos;s SELISE account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--bg-muted))]">
            <Info className="h-4 w-4 text-[hsl(var(--globe-grey))] shrink-0" />
            <span className="text-sm text-[hsl(var(--globe-grey))]">
              {initialData.hasSeliseCredentials
                ? "Using organization-specific credentials. Documents are sent from your organization's SELISE account."
                : "Using system default credentials. Configure your own to track documents in your organization's SELISE account."}
            </span>
          </div>

          {/* Guide for getting credentials */}
          <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
            <p className="text-sm text-[hsl(var(--fg))] font-medium mb-2">
              How to get your API credentials:
            </p>
            <ol className="text-sm text-[hsl(var(--globe-grey))] space-y-1 list-decimal list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://selise.app/developers/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[hsl(var(--selise-blue))] hover:underline inline-flex items-center gap-1"
                >
                  SELISE Developer Portal
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Sign in with your SELISE account</li>
              <li>Click &quot;Generate&quot; to create a new API key pair</li>
              <li>Copy the Client ID and Client Secret below</li>
            </ol>
          </div>

          {!showCredentialForm ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCredentialForm(true)}
              >
                {initialData.hasSeliseCredentials
                  ? "Update Credentials"
                  : "Configure Custom Credentials"}
              </Button>
              {initialData.hasSeliseCredentials && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[hsl(var(--crimson))] hover:text-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/10"
                  onClick={handleRemoveCredentials}
                  disabled={isRemovingCredentials}
                >
                  {isRemovingCredentials ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove &amp; Use System Defaults
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
              <div className="space-y-2">
                <Label htmlFor="seliseClientId">SELISE Client ID</Label>
                <Input
                  id="seliseClientId"
                  type="password"
                  placeholder="Enter SELISE Client ID"
                  value={credentials.seliseClientId}
                  onChange={(e) =>
                    setCredentials({ ...credentials, seliseClientId: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seliseClientSecret">SELISE Client Secret</Label>
                <Input
                  id="seliseClientSecret"
                  type="password"
                  placeholder="Enter SELISE Client Secret"
                  value={credentials.seliseClientSecret}
                  onChange={(e) =>
                    setCredentials({ ...credentials, seliseClientSecret: e.target.value })
                  }
                />
              </div>

              <p className="text-xs text-[hsl(var(--globe-grey))]">
                Both Client ID and Client Secret are required. Documents signed from this organization will use these credentials.
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Credentials
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCredentialForm(false);
                    setCredentials({ seliseClientId: "", seliseClientSecret: "" });
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global error/success messages */}
      {error && (
        <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-md bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] text-sm">
          Settings updated successfully
        </div>
      )}
    </div>
  );
}
