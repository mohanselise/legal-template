"use client";

import { useState, useEffect } from "react";
import { Loader2, UserCog, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { SerializedUser } from "./users-admin-client";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SerializedUser | null;
  onConfirm: (role: UserRole) => Promise<void>;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: EditRoleDialogProps) {
  const [role, setRole] = useState<UserRole>("editor");
  const [isSaving, setIsSaving] = useState(false);

  // Reset role when user changes
  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === user?.role) {
      toast.info("No changes to save");
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      await onConfirm(role);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSaving) {
      onOpenChange(newOpen);
    }
  };

  const userName =
    user?.firstName || user?.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user?.email;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--selise-blue))]/10">
                <UserCog className="size-5 text-[hsl(var(--selise-blue))]" />
              </div>
              <DialogTitle>Change User Role</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Update the role for{" "}
              <span className="font-semibold text-[hsl(var(--fg))]">
                {userName}
              </span>
              . This will change their access permissions immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isSaving}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <UserCog className="size-4 text-[hsl(var(--lime-green))]" />
                      <span>Editor</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-[hsl(var(--selise-blue))]" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="rounded-lg border border-[hsl(var(--border))] p-3 mt-3">
                <p className="text-sm font-medium text-[hsl(var(--fg))] mb-2">
                  {role === "admin" ? "Admin Access" : "Editor Access"}
                </p>
                <ul className="text-xs text-[hsl(var(--globe-grey))] space-y-1">
                  {role === "admin" ? (
                    <>
                      <li>• Full access to all admin features</li>
                      <li>• Manage templates and analytics</li>
                      <li>• Manage users and permissions</li>
                      <li>• Configure system settings</li>
                    </>
                  ) : (
                    <>
                      <li>• Access to templates management</li>
                      <li>• Access to analytics dashboard</li>
                      <li>• No access to user management</li>
                      <li>• No access to system settings</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

