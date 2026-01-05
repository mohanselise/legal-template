"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { SerializedUser } from "./users-admin-client";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SerializedUser | null;
  onConfirm: () => Promise<void>;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const userName =
    user?.firstName || user?.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user?.email;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--destructive))]/10">
              <AlertTriangle className="size-5 text-[hsl(var(--destructive))]" />
            </div>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[hsl(var(--fg))]">
              {userName}
            </span>
            ? This will permanently remove their account and they will lose
            access to the system. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive))]/90"
          >
            {isDeleting && <Loader2 className="size-4 animate-spin mr-2" />}
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

