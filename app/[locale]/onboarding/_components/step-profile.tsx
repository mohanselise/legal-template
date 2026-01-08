"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Briefcase, Building } from "lucide-react";

interface ProfileData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}

interface StepProfileProps {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
  onComplete: () => void;
  isLoading: boolean;
}

export function StepProfile({
  data,
  onChange,
  onComplete,
  isLoading,
}: StepProfileProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save profile to API
      const response = await fetch("/api/onboarding/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle,
          department: data.department,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      onComplete();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isValid = data.firstName.trim() && data.lastName.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--brand-surface))]">
          <User className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-aptos)] text-xl font-semibold text-[hsl(var(--fg))]">
          Your Profile
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              type="text"
              value={data.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              type="text"
              value={data.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Job Title
          </Label>
          <Input
            id="jobTitle"
            type="text"
            value={data.jobTitle}
            onChange={(e) => handleChange("jobTitle", e.target.value)}
            placeholder="e.g., Legal Counsel, Contract Manager"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department" className="flex items-center gap-2">
            <Building className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            Department
          </Label>
          <Input
            id="department"
            type="text"
            value={data.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="e.g., Legal, Operations, HR"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={!isValid || isSaving || isLoading}
          className="min-w-[120px]"
        >
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
