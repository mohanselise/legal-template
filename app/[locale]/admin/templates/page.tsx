"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TemplateTable } from "./_components/template-table";
import { DeleteDialog } from "./_components/delete-dialog";
import type { Template } from "@/lib/db";

export default function TemplatesAdminPage() {
  const params = useParams();
  const locale = params.locale as string;
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Fetch templates
  const fetchTemplates = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    }
    try {
      const response = await fetch("/api/admin/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle delete
  const handleOpenDelete = (template: Template) => {
    setSelectedTemplate(template);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;

    const response = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete template");
    }

    toast.success("Template deleted successfully");
    setSelectedTemplate(null);
    fetchTemplates();
  };

  // Stats
  const availableCount = templates.filter((t) => t.available).length;
  const comingSoonCount = templates.filter((t) => !t.available).length;
  const popularCount = templates.filter((t) => t.popular).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--fg))] font-heading">
            Template Manager
          </h1>
          <p className="text-[hsl(var(--globe-grey))] mt-1">
            Create and manage legal document templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTemplates(true)}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/${locale}/admin/templates/new`}>
              <Plus className="size-4" />
              Add Template
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--lime-green))]/10">
                <FileText className="size-6 text-[hsl(var(--lime-green))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    availableCount
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--globe-grey))]/10">
                <FileText className="size-6 text-[hsl(var(--globe-grey))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    comingSoonCount
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Coming Soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/10">
                <FileText className="size-6 text-[hsl(var(--selise-blue))]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[hsl(var(--fg))]">
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    popularCount
                  )}
                </div>
                <p className="text-sm text-[hsl(var(--globe-grey))]">
                  Popular
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-96" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <TemplateTable
          templates={templates}
          onDelete={handleOpenDelete}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        template={selectedTemplate}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

