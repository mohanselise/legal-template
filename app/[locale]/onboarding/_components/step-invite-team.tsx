"use client";

import { useState } from "react";
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
import { Users, Plus, X, Mail, CheckCircle } from "lucide-react";

interface Invitee {
  email: string;
  role: "org_admin" | "org_editor" | "org_member";
}

interface StepInviteTeamProps {
  orgId: string | null;
  onComplete: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function StepInviteTeam({
  orgId,
  onComplete,
  onSkip,
  isLoading,
}: StepInviteTeamProps) {
  const [invitees, setInvitees] = useState<Invitee[]>([
    { email: "", role: "org_member" },
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const addInvitee = () => {
    setInvitees([...invitees, { email: "", role: "org_member" }]);
  };

  const removeInvitee = (index: number) => {
    setInvitees(invitees.filter((_, i) => i !== index));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateInvitee = (
    index: number,
    field: keyof Invitee,
    value: string
  ) => {
    setInvitees(
      invitees.map((inv, i) =>
        i === index ? { ...inv, [field]: value } : inv
      )
    );
    // Clear error when user starts typing
    if (errors[index]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const sendInvitations = async () => {
    if (!orgId) return;

    // Filter out empty emails
    const validInvitees = invitees.filter((inv) => inv.email.trim());
    if (validInvitees.length === 0) {
      onComplete();
      return;
    }

    setIsSending(true);
    const newErrors: Record<number, string> = {};

    for (let i = 0; i < invitees.length; i++) {
      const inv = invitees[i];
      if (!inv.email.trim()) continue;

      // Skip if already sent
      if (sentInvites.includes(inv.email)) continue;

      try {
        const response = await fetch(`/api/org/${orgId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inv.email,
            role: inv.role,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          newErrors[i] = result.error || "Failed to send invitation";
        } else {
          setSentInvites((prev) => [...prev, inv.email]);
        }
      } catch {
        newErrors[i] = "Network error";
      }
    }

    setErrors(newErrors);
    setIsSending(false);

    // If all invitations were sent successfully, complete the step
    if (Object.keys(newErrors).length === 0) {
      onComplete();
    }
  };

  const roleLabels = {
    org_admin: "Admin",
    org_editor: "Editor",
    org_member: "Member",
  };

  const roleDescriptions = {
    org_admin: "Full access to all features",
    org_editor: "Can create and edit templates",
    org_member: "Can view and use templates",
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--brand-surface))]">
          <Users className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
        </div>
        <h2 className="mt-4 font-[family-name:var(--font-aptos)] text-xl font-semibold text-[hsl(var(--fg))]">
          Invite Your Team
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Add team members to collaborate on legal documents
        </p>
      </div>

      <div className="space-y-4">
        {invitees.map((invitee, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor={`email-${index}`} className="sr-only">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={invitee.email}
                    onChange={(e) =>
                      updateInvitee(index, "email", e.target.value)
                    }
                    placeholder="colleague@company.com"
                    className="pl-10"
                    disabled={sentInvites.includes(invitee.email)}
                  />
                </div>
              </div>

              <div className="w-[140px]">
                <Label htmlFor={`role-${index}`} className="sr-only">
                  Role
                </Label>
                <Select
                  value={invitee.role}
                  onValueChange={(value) =>
                    updateInvitee(
                      index,
                      "role",
                      value as Invitee["role"]
                    )
                  }
                  disabled={sentInvites.includes(invitee.email)}
                >
                  <SelectTrigger id={`role-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col items-start">
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {invitees.length > 1 && !sentInvites.includes(invitee.email) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInvitee(index)}
                  className="h-10 w-10 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--crimson))]"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {sentInvites.includes(invitee.email) && (
                <div className="flex h-10 w-10 items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--lime-green))]" />
                </div>
              )}
            </div>

            {errors[index] && (
              <p className="text-sm text-[hsl(var(--crimson))]">
                {errors[index]}
              </p>
            )}

            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {roleDescriptions[invitee.role]}
            </p>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addInvitee}
          className="w-full"
          disabled={isSending}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add another
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isSending || isLoading}
        >
          Skip for now
        </Button>
        <Button
          type="button"
          onClick={sendInvitations}
          disabled={isSending || isLoading}
          className="min-w-[140px]"
        >
          {isSending ? "Sending..." : "Send Invitations"}
        </Button>
      </div>
    </div>
  );
}
