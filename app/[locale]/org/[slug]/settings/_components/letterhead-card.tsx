"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import type { OrganizationLetterhead } from "@/lib/generated/prisma/client";

interface LetterheadCardProps {
  letterhead: OrganizationLetterhead;
  orgId: string;
  onUpdate: () => void;
}

export function LetterheadCard({
  letterhead,
  orgId,
  onUpdate,
}: LetterheadCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState(letterhead.name);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/org/${orgId}/letterheads/${letterhead.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete letterhead");
      }

      onUpdate();
    } catch (error) {
      console.error("Error deleting letterhead:", error);
      alert(error instanceof Error ? error.message : "Failed to delete letterhead");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSetDefault = async () => {
    if (letterhead.isDefault) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/org/${orgId}/letterheads/${letterhead.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isDefault: true }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set as default");
      }

      onUpdate();
    } catch (error) {
      console.error("Error setting default:", error);
      alert(error instanceof Error ? error.message : "Failed to set as default");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim() || editName.trim() === letterhead.name) {
      setShowEditDialog(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/org/${orgId}/letterheads/${letterhead.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update name");
      }

      onUpdate();
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating name:", error);
      alert(error instanceof Error ? error.message : "Failed to update name");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="group relative border rounded-lg overflow-hidden bg-[hsl(var(--card))] hover:border-[hsl(var(--selise-blue))]/50 transition-colors">
        {/* Thumbnail */}
        <div className="relative aspect-[8.5/11] bg-[hsl(var(--muted))]">
          <img
            src={letterhead.fileUrl}
            alt={letterhead.name}
            className="w-full h-full object-contain"
          />
          {letterhead.isDefault && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-[hsl(var(--selise-blue))] text-white text-xs rounded-full">
              <Star className="w-3 h-3 fill-current" />
              Default
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-[hsl(var(--fg))] truncate pr-2">
              {letterhead.name}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUpdating || isDeleting}
                >
                  {isUpdating || isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                {!letterhead.isDefault && (
                  <DropdownMenuItem onClick={handleSetDefault}>
                    <Star className="w-4 h-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-[hsl(var(--crimson))] focus:text-[hsl(var(--crimson))]"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {letterhead.fileName}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Letterhead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{letterhead.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Name Dialog */}
      <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Letterhead</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for this letterhead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="editName" className="sr-only">
              Letterhead Name
            </Label>
            <Input
              id="editName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Letterhead name"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isUpdating}
              onClick={() => setEditName(letterhead.name)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateName}
              disabled={isUpdating || !editName.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
