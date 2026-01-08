"use client";

import { useState, useRef, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Pencil, Star, Trash2, Check, Move } from "lucide-react";
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
  const [showContentAreaDialog, setShowContentAreaDialog] = useState(false);
  const [editName, setEditName] = useState(letterhead.name);

  // Content area editor state
  const [contentArea, setContentArea] = useState({
    x: letterhead.contentAreaX,
    y: letterhead.contentAreaY,
    width: letterhead.contentAreaWidth,
    height: letterhead.contentAreaHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialArea, setInitialArea] = useState(contentArea);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Calculate scale for preview
  useEffect(() => {
    const maxWidth = 500;
    const maxHeight = 600;
    const scaleX = maxWidth / letterhead.pageWidth;
    const scaleY = maxHeight / letterhead.pageHeight;
    setScale(Math.min(scaleX, scaleY, 1));
  }, [letterhead.pageWidth, letterhead.pageHeight]);

  // Reset content area when dialog opens
  useEffect(() => {
    if (showContentAreaDialog) {
      setContentArea({
        x: letterhead.contentAreaX,
        y: letterhead.contentAreaY,
        width: letterhead.contentAreaWidth,
        height: letterhead.contentAreaHeight,
      });
      setImageLoaded(false);
    }
  }, [showContentAreaDialog, letterhead]);

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

  const handleUpdateContentArea = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/org/${orgId}/letterheads/${letterhead.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentArea }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update content area");
      }

      onUpdate();
      setShowContentAreaDialog(false);
    } catch (error) {
      console.error("Error updating content area:", error);
      alert(error instanceof Error ? error.message : "Failed to update content area");
    } finally {
      setIsUpdating(false);
    }
  };

  // Content area drag handling
  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragHandle(handle);
    setDragStartY(e.clientY);
    setInitialArea(contentArea);
  };

  useEffect(() => {
    if (!isDragging || !initialArea) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = (e.clientY - dragStartY) / scale;
      let newArea = { ...initialArea };

      if (dragHandle === 'n') {
        const newY = Math.max(0, Math.min(initialArea.y + deltaY, initialArea.y + initialArea.height - 50));
        newArea.height = initialArea.y + initialArea.height - newY;
        newArea.y = newY;
      } else if (dragHandle === 's') {
        newArea.height = Math.max(50, Math.min(initialArea.height + deltaY, letterhead.pageHeight - initialArea.y));
      }

      setContentArea(newArea);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragHandle, dragStartY, initialArea, scale, letterhead.pageHeight]);

  const scaledArea = {
    x: contentArea.x * scale,
    y: contentArea.y * scale,
    width: contentArea.width * scale,
    height: contentArea.height * scale,
  };

  return (
    <>
      <div className={`group relative border-2 rounded-lg overflow-hidden bg-[hsl(var(--card))] transition-all ${
        letterhead.isDefault
          ? "border-[hsl(var(--selise-blue))] ring-2 ring-[hsl(var(--selise-blue))]/20"
          : "border-transparent hover:border-[hsl(var(--border))]"
      }`}>
        {/* Thumbnail */}
        <div className="relative aspect-[8.5/11] bg-[hsl(var(--muted))]/50">
          <img
            src={letterhead.fileUrl}
            alt={letterhead.name}
            className="w-full h-full object-contain"
          />
          {letterhead.isDefault && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-[hsl(var(--selise-blue))] text-white text-xs font-medium rounded-full shadow-sm">
              <Check className="w-3 h-3" />
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
                <DropdownMenuItem onClick={() => setShowContentAreaDialog(true)}>
                  <Move className="w-4 h-4 mr-2" />
                  Edit Content Area
                </DropdownMenuItem>
                {!letterhead.isDefault && (
                  <DropdownMenuItem onClick={handleSetDefault}>
                    <Star className="w-4 h-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
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

      {/* Edit Content Area Dialog */}
      <Dialog open={showContentAreaDialog} onOpenChange={setShowContentAreaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content Area</DialogTitle>
            <DialogDescription>
              Drag the handles to adjust where document content will appear on &quot;{letterhead.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="relative border rounded-lg bg-[hsl(var(--muted))]/30 p-4 flex items-center justify-center"
              style={{ minHeight: '450px' }}
            >
              <div
                ref={imageContainerRef}
                className="relative shadow-lg"
                style={{
                  width: letterhead.pageWidth * scale,
                  height: letterhead.pageHeight * scale,
                }}
              >
                <img
                  src={letterhead.fileUrl}
                  alt={letterhead.name}
                  className="block rounded"
                  style={{
                    width: letterhead.pageWidth * scale,
                    height: letterhead.pageHeight * scale,
                  }}
                  draggable={false}
                  onLoad={() => setImageLoaded(true)}
                />

                {/* Content area overlay */}
                {imageLoaded && (
                  <div
                    className="absolute border-2 border-[hsl(var(--selise-blue))] bg-[hsl(var(--selise-blue))]/10 pointer-events-none"
                    style={{
                      left: scaledArea.x,
                      top: scaledArea.y,
                      width: scaledArea.width,
                      height: scaledArea.height,
                    }}
                  >
                    {/* Top handle */}
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[hsl(var(--selise-blue))] rounded cursor-ns-resize flex items-center justify-center pointer-events-auto hover:bg-[hsl(var(--selise-blue))]/80 transition-colors"
                      onMouseDown={(e) => handleMouseDown(e, 'n')}
                    >
                      <div className="w-10 h-0.5 bg-white/80 rounded" />
                    </div>
                    {/* Bottom handle */}
                    <div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-[hsl(var(--selise-blue))] rounded cursor-ns-resize flex items-center justify-center pointer-events-auto hover:bg-[hsl(var(--selise-blue))]/80 transition-colors"
                      onMouseDown={(e) => handleMouseDown(e, 's')}
                    >
                      <div className="w-10 h-0.5 bg-white/80 rounded" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Header excluded: <span className="font-mono">{Math.round(contentArea.y)}px</span>
              </div>
              <div>
                Footer excluded: <span className="font-mono">{Math.round(letterhead.pageHeight - contentArea.y - contentArea.height)}px</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowContentAreaDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateContentArea}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
