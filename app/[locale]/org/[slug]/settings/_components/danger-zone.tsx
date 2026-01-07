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
import { Loader2, AlertTriangle } from "lucide-react";

interface DangerZoneProps {
  orgId: string;
  orgName: string;
}

export function DangerZone({ orgId, orgName }: DangerZoneProps) {
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
    <Card className="border-[hsl(var(--crimson))]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--crimson))]">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions that can affect your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg border border-[hsl(var(--crimson))]/30 bg-[hsl(var(--crimson))]/5">
          <div>
            <h4 className="font-medium">Delete Organization</h4>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Permanently delete this organization and all its templates
            </p>
          </div>

          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Organization</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    This action cannot be undone. This will permanently delete
                    the <strong>{orgName}</strong> organization and all
                    associated data including:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>All organization templates</li>
                    <li>All team member associations</li>
                    <li>All pending invitations</li>
                  </ul>
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">
                      Type <strong>{orgName}</strong> to confirm:
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={orgName}
                    />
                  </div>
                  {error && (
                    <p className="text-[hsl(var(--crimson))] text-sm">
                      {error}
                    </p>
                  )}
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
                  Delete Organization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
