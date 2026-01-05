"use client";

import { useState } from "react";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { UserRole } from "@/lib/auth/roles";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (email: string, role: UserRole) => Promise<void>;
}

export function InviteDialog({
  open,
  onOpenChange,
  onConfirm,
}: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsInviting(true);
    try {
      await onConfirm(email, role);
      setEmail("");
      setRole("editor");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isInviting) {
      if (!newOpen) {
        setEmail("");
        setRole("editor");
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10">
                <UserPlus className="size-5 text-[hsl(var(--selise-blue))]" />
              </div>
              <DialogTitle>Invite New User</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Send an invitation email to add a new team member. They will
              receive an email with instructions to set up their account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[hsl(var(--globe-grey))]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  disabled={isInviting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isInviting}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <span>Editor</span>
                      <span className="text-xs text-[hsl(var(--globe-grey))]">
                        — Templates & Analytics
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <span>Admin</span>
                      <span className="text-xs text-[hsl(var(--globe-grey))]">
                        — Full access
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[hsl(var(--globe-grey))]">
                {role === "admin"
                  ? "Admins have full access to all features including user management."
                  : "Editors can manage templates and view analytics."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isInviting || !email}>
              {isInviting && <Loader2 className="size-4 animate-spin mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

