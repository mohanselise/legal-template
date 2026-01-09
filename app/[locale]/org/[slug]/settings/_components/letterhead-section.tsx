"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileImage, Plus, Upload } from "lucide-react";
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
      {initialLetterheads.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--selise-blue))]/10 flex items-center justify-center mx-auto mb-4">
                <FileImage className="w-8 h-8 text-[hsl(var(--selise-blue))]" />
              </div>
              <h3 className="font-semibold text-lg text-[hsl(var(--fg))] mb-2">
                No letterheads yet
              </h3>
              <p className="text-sm text-[hsl(var(--globe-grey))] mb-6 max-w-sm mx-auto">
                Upload your company letterhead to automatically apply branding to all generated documents.
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Letterhead
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              {initialLetterheads.length} letterhead{initialLetterheads.length !== 1 ? 's' : ''} uploaded
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Letterhead
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {initialLetterheads.map((letterhead) => (
              <LetterheadCard
                key={letterhead.id}
                letterhead={letterhead}
                orgId={orgId}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </div>
      )}

      <LetterheadUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleUpdate}
        orgId={orgId}
      />
    </>
  );
}
