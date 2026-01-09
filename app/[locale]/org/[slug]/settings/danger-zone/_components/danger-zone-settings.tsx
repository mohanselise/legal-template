"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";

interface DangerZoneSettingsProps {
  orgId: string;
  orgName: string;
}

export function DangerZoneSettings({ orgId, orgName }: DangerZoneSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== orgName) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${orgId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete organization");
      }

      // Redirect to home after deletion
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-4 p-4 rounded-lg border border-[hsl(var(--crimson))]/30 bg-[hsl(var(--crimson))]/5">
        <AlertTriangle className="h-6 w-6 text-[hsl(var(--crimson))] shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-[hsl(var(--crimson))]">
            Proceed with caution
          </p>
          <p className="text-sm text-[hsl(var(--globe-grey))] mt-1">
            Actions in this section are permanent and cannot be undone. Make sure you understand the consequences before proceeding.
          </p>
        </div>
      </div>

      {/* Delete Organization Card */}
      <Card className="border-[hsl(var(--crimson))]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-[hsl(var(--crimson))]" />
            Delete Organization
          </CardTitle>
          <CardDescription>
            Permanently delete this organization and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-[hsl(var(--globe-grey))] space-y-2">
              <p>Deleting this organization will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Remove all organization templates</li>
                <li>Remove all team member associations</li>
                <li>Cancel all pending invitations</li>
                <li>Delete all uploaded letterheads</li>
                <li>Remove all saved API credentials</li>
              </ul>
            </div>

            <AlertDialog open={open} onOpenChange={setOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Organization
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-[hsl(var(--crimson))]">
                    <AlertTriangle className="h-5 w-5" />
                    Delete &quot;{orgName}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4">
                      <p>
                        This action cannot be undone. This will permanently delete
                        the organization and all associated data.
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[hsl(var(--fg))]">
                          Type <span className="font-mono bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">{orgName}</span> to confirm:
                        </p>
                        <Input
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder={orgName}
                          className="font-mono"
                        />
                      </div>
                      {error && (
                        <p className="text-[hsl(var(--crimson))] text-sm">
                          {error}
                        </p>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmText !== orgName || isLoading}
                    className="bg-[hsl(var(--crimson))] hover:bg-[hsl(var(--crimson))]/90"
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
