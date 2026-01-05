"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { TypeformBuilder, type Template, type ScreenWithFields } from "./_components/typeform-builder";

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const locale = params.locale as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [screens, setScreens] = useState<ScreenWithFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [templateRes, screensRes] = await Promise.all([
        fetch(`/api/admin/templates/${templateId}`),
        fetch(`/api/admin/templates/${templateId}/screens`),
      ]);

      if (!templateRes.ok) {
        throw new Error("Failed to fetch template");
      }
      if (!screensRes.ok) {
        throw new Error("Failed to fetch screens");
      }

      const templateData = await templateRes.json();
      const screensData = await screensRes.json();

      // API returns { template } wrapper, extract it
      setTemplate(templateData.template || templateData);
      setScreens(screensData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load builder");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
          <p className="text-sm text-[hsl(var(--globe-grey))]">Loading builder...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--bg))]">
        <div className="text-center max-w-md p-8">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[hsl(var(--destructive))]/10 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-[hsl(var(--destructive))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">
            {error || "Template not found"}
          </h2>
          <p className="text-sm text-[hsl(var(--globe-grey))] mb-6">
            Unable to load the template builder. Please try again.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg bg-[hsl(var(--selise-blue))] text-white font-medium hover:bg-[hsl(var(--oxford-blue))] transition-colors"
          >
              Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <TypeformBuilder
      template={template}
      initialScreens={screens}
      locale={locale}
    />
  );
}
