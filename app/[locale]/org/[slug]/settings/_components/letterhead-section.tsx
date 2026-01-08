"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileImage, Plus } from "lucide-react";
import { LetterheadCard } from "./letterhead-card";
import { LetterheadUploadDialog } from "./letterhead-upload-dialog";
import type { OrganizationLetterhead } from "@/lib/generated/prisma/client";

interface LetterheadSectionProps {
  orgId: string;
  initialLetterheads: OrganizationLetterhead[];
}

export function LetterheadSection({
  orgId,
  initialLetterheads,
}: LetterheadSectionProps) {
  const router = useRouter();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center">
                <FileImage className="h-5 w-5 text-[hsl(var(--selise-blue))]" />
              </div>
              <div>
                <CardTitle>Company Letterheads</CardTitle>
                <CardDescription>
                  Upload letterheads for your organization&apos;s documents
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Letterhead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {initialLetterheads.length === 0 ? (
            <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
              <FileImage className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium text-[hsl(var(--fg))] mb-1">
                No letterheads yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your company letterhead to use in generated documents.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Letterhead
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {initialLetterheads.map((letterhead) => (
                <LetterheadCard
                  key={letterhead.id}
                  letterhead={letterhead}
                  orgId={orgId}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LetterheadUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleUpdate}
        orgId={orgId}
      />
    </>
  );
}
