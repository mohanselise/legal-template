"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Loader2, Check, Trash2, ExternalLink, Shield, CheckCircle2 } from "lucide-react";

interface IntegrationsSettingsProps {
  orgId: string;
  hasSeliseCredentials: boolean;
}

export function IntegrationsSettings({ orgId, hasSeliseCredentials }: IntegrationsSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingCredentials, setIsRemovingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [credentials, setCredentials] = useState({
    seliseClientId: "",
    seliseClientSecret: "",
  });

  const handleSaveCredentials = async () => {
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
      setTimeout(() => setSuccess(false), 3000);
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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRemovingCredentials(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SELISE Signature Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--oxford-blue))] flex items-center justify-center shadow-sm">
                <Image
                  src="/signature-black.svg"
                  alt="SELISE Signature"
                  width={28}
                  height={28}
                  className="invert"
                />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  SELISE Signature
                  {hasSeliseCredentials && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))]">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Electronic signature service for legally binding documents
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
            <Shield className="h-5 w-5 text-[hsl(var(--globe-grey))] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[hsl(var(--fg))]">
                {hasSeliseCredentials
                  ? "Using organization credentials"
                  : "Using system default credentials"}
              </p>
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                {hasSeliseCredentials
                  ? "Documents are sent from your organization's SELISE account for better tracking and branding."
                  : "Configure your own credentials to track documents in your organization's SELISE account."}
              </p>
            </div>
          </div>

          {/* Guide for getting credentials */}
          <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
            <p className="text-sm font-medium text-[hsl(var(--fg))] mb-3">
              How to get your API credentials
            </p>
            <ol className="text-sm text-[hsl(var(--globe-grey))] space-y-2">
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] text-xs font-medium shrink-0">1</span>
                <span>
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
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] text-xs font-medium shrink-0">2</span>
                <span>Sign in with your SELISE account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] text-xs font-medium shrink-0">3</span>
                <span>Click &quot;Generate&quot; to create a new API key pair</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] text-xs font-medium shrink-0">4</span>
                <span>Copy the Client ID and Client Secret below</span>
              </li>
            </ol>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-[hsl(var(--lime-green))]/10 text-[hsl(var(--poly-green))] text-sm">
              <Check className="h-4 w-4" />
              Credentials updated successfully
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-[hsl(var(--crimson))]/10 text-[hsl(var(--crimson))] text-sm">
              {error}
            </div>
          )}

          {!showCredentialForm ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="button"
                onClick={() => setShowCredentialForm(true)}
              >
                {hasSeliseCredentials
                  ? "Update Credentials"
                  : "Configure Credentials"}
              </Button>
              {hasSeliseCredentials && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-[hsl(var(--crimson))] border-[hsl(var(--crimson))]/30 hover:bg-[hsl(var(--crimson))]/10 hover:text-[hsl(var(--crimson))]"
                  onClick={handleRemoveCredentials}
                  disabled={isRemovingCredentials}
                >
                  {isRemovingCredentials ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove Credentials
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4 rounded-lg border border-[hsl(var(--selise-blue))]/20 bg-[hsl(var(--selise-blue))]/5">
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
                Your credentials are encrypted and stored securely. Documents signed from this organization will use these credentials.
              </p>

              <div className="flex gap-2 pt-2">
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

      {/* Placeholder for future integrations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-dashed opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center">
                <span className="text-lg">+</span>
              </div>
              <div>
                <CardTitle className="text-base">More Integrations</CardTitle>
                <CardDescription className="text-xs">
                  Additional integrations coming soon
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
