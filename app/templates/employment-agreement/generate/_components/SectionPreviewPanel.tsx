"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Clock3, FileText, Loader2 } from "lucide-react";

export type SectionKey = "basics" | "compensation" | "workTerms" | "legalTerms";

export type SectionState = {
  content?: string;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
};

interface SectionPreviewPanelProps {
  sections: Record<SectionKey, SectionState>;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  basics: "Header, Parties & Recitals",
  compensation: "Compensation & Benefits",
  workTerms: "Position, Duties & Work",
  legalTerms: "Legal Provisions & Signatures",
};

export function SectionPreviewPanel({ sections }: SectionPreviewPanelProps) {
  return (
    <aside className="sticky top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
          <h3 className="text-base font-semibold text-[hsl(var(--fg))]">Live Preview</h3>
        </div>
        <p className="text-xs text-[hsl(var(--brand-muted))] mb-4">
          Sections appear here as you complete each step. You can keep filling the next step while a section is being generated.
        </p>

        <div className="space-y-6">
          {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => {
            const section = sections[key];
            return (
              <div key={key} className="border rounded-xl border-[hsl(var(--border))] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/40">
                  <div className="text-sm font-medium text-[hsl(var(--fg))]">
                    {SECTION_LABELS[key]}
                  </div>
                  <div className="text-xs">
                    {section.status === "done" && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" /> Ready
                      </span>
                    )}
                    {section.status === "generating" && (
                      <span className="inline-flex items-center gap-1 text-[hsl(var(--brand-primary))]">
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating
                      </span>
                    )}
                    {section.status === "idle" && (
                      <span className="inline-flex items-center gap-1 text-[hsl(var(--brand-muted))]">
                        <Clock3 className="w-4 h-4" /> Pending
                      </span>
                    )}
                    {section.status === "error" && (
                      <span className="inline-flex items-center gap-1 text-red-600">Error</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3">
                  {section.status === "generating" && (
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  )}

                  {section.status === "done" && !!section.content && (
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {section.status === "idle" && (
                    <p className="text-xs text-[hsl(var(--brand-muted))]">
                      Complete this step to generate this section.
                    </p>
                  )}

                  {section.status === "error" && (
                    <p className="text-xs text-red-600">{section.error || "Failed to generate."}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
