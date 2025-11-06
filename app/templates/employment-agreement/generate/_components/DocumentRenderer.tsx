'use client';

import React from 'react';
import { FileText, Hash } from 'lucide-react';

interface DocumentRendererProps {
  document: string;
  title?: string;
}

export function DocumentRenderer({ document, title = 'Employment Agreement' }: DocumentRendererProps) {
  // Parse document into structured sections
  const sections = parseDocument(document);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Document Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-blue-100 text-sm">AI-Generated Legal Document</p>
          </div>
        </div>
      </div>

      {/* Document Body */}
      <div className="p-8 md:p-12">
        <div className="max-w-none prose prose-lg dark:prose-invert">
          {sections.map((section, index) => (
            <Section key={index} {...section} />
          ))}
        </div>
      </div>

      {/* Document Footer */}
      <div className="bg-gray-50 dark:bg-gray-900 px-8 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-[hsl(var(--brand-muted))]">
          This document was generated using AI. Please review with a qualified attorney before use.
        </p>
      </div>
    </div>
  );
}

type SectionType = {
  type: 'heading' | 'paragraph' | 'clause' | 'signature';
  content: string;
  level?: number;
  number?: string;
};

function Section({ type, content, level, number }: SectionType) {
  if (type === 'heading') {
    const HeadingTag = `h${level || 2}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return (
      <HeadingTag className="font-bold text-[hsl(var(--fg))] mt-8 mb-4 flex items-center gap-2">
        {number && <Hash className="w-5 h-5 text-[hsl(var(--brand-primary))]" />}
        <span>{content}</span>
      </HeadingTag>
    );
  }

  if (type === 'clause') {
    return (
      <div className="my-4 pl-8 border-l-4 border-[hsl(var(--brand-primary))]/20">
        <p className="text-[hsl(var(--fg))] leading-relaxed">{content}</p>
      </div>
    );
  }

  if (type === 'signature') {
    return (
      <div className="my-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-[hsl(var(--fg))] font-medium">{content}</p>
      </div>
    );
  }

  return <p className="text-[hsl(var(--fg))] leading-relaxed my-4">{content}</p>;
}

function parseDocument(document: string): SectionType[] {
  const lines = document.split('\n');
  const sections: SectionType[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if it's a main heading (all caps)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 0 && trimmed.length < 100) {
      sections.push({
        type: 'heading',
        content: trimmed,
        level: 2,
      });
      continue;
    }

    // Check if it's a numbered section
    const numberedMatch = trimmed.match(/^(\d+\.)\s+(.+)/);
    if (numberedMatch) {
      sections.push({
        type: 'heading',
        content: numberedMatch[2],
        level: 3,
        number: numberedMatch[1],
      });
      continue;
    }

    // Check if it's a sub-clause (e.g., (a), (i))
    const subClauseMatch = trimmed.match(/^[\(]?[a-z][\)]?\s+(.+)/i);
    if (subClauseMatch) {
      sections.push({
        type: 'clause',
        content: trimmed,
      });
      continue;
    }

    // Check if it's signature-related
    if (trimmed.toLowerCase().includes('signature') || trimmed.includes('_____')) {
      sections.push({
        type: 'signature',
        content: trimmed,
      });
      continue;
    }

    // Default to paragraph
    sections.push({
      type: 'paragraph',
      content: trimmed,
    });
  }

  return sections;
}
