'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Scale, Shield, FileText } from 'lucide-react';

interface DocumentRendererProps {
  document: string;
  title?: string;
}

const generateDocumentId = () => {
  if (typeof window !== 'undefined') {
    if (typeof window.crypto?.randomUUID === 'function') {
      return window.crypto
        .randomUUID()
        .replace(/-/g, '')
        .slice(0, 8)
        .toUpperCase();
    }
    if (typeof window.crypto?.getRandomValues === 'function') {
      const buffer = new Uint32Array(2);
      window.crypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map((value) => value.toString(16).toUpperCase())
        .join('')
        .slice(0, 8);
    }
  }
  return `DOC-${Date.now().toString(36).toUpperCase()}`;
};

export function DocumentRenderer({ document, title = 'Employment Agreement' }: DocumentRendererProps) {
  const [docId] = React.useState(generateDocumentId);

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
      {/* Premium Document Header */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-12 border-b-4 border-slate-900 dark:border-gray-600">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none">
          <Scale className="w-96 h-96 text-gray-900" />
        </div>

        <div className="relative text-center space-y-4">
          {/* Professional Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-slate-700 rounded-full text-white text-xs font-bold tracking-widest uppercase shadow-lg">
            <Shield className="w-3.5 h-3.5" />
            <span>Legal Document</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-gray-100 uppercase tracking-wider leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {title}
          </h1>

          {/* Document Metadata */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-sm text-slate-600 dark:text-gray-400 pt-4 font-medium">
            <span className="tracking-wide">{new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
            <span className="hidden md:inline text-slate-400 dark:text-gray-600">|</span>
            <span className="font-mono text-xs tracking-wider">Doc ID: {docId}</span>
          </div>
        </div>
      </div>

      {/* Document Body - Premium Legal Typography */}
      <div className="px-6 md:px-12 py-16 bg-white dark:bg-gray-900 relative" style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif'
      }}>
        {/* Page margins indicator (visual only) */}
        <div className="absolute left-0 top-0 bottom-0 w-6 md:w-12 border-r border-slate-200 dark:border-gray-800 opacity-30"></div>
        <div className="absolute right-0 top-0 bottom-0 w-6 md:w-12 border-l border-slate-200 dark:border-gray-800 opacity-30"></div>

        <article className="relative prose prose-xl prose-slate dark:prose-invert max-w-none
          prose-headings:font-serif prose-headings:text-slate-900 dark:prose-headings:text-gray-100
          prose-h1:text-3xl prose-h1:mb-10 prose-h1:mt-16 prose-h1:text-center prose-h1:uppercase prose-h1:tracking-widest prose-h1:font-extrabold prose-h1:border-b-4 prose-h1:border-slate-800 dark:prose-h1:border-gray-300 prose-h1:pb-6
          prose-h2:text-2xl prose-h2:mb-6 prose-h2:mt-14 prose-h2:font-extrabold prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-slate-900 dark:prose-h2:text-gray-100 prose-h2:border-b-2 prose-h2:border-slate-400 dark:prose-h2:border-gray-600 prose-h2:pb-3
          prose-h3:text-xl prose-h3:mb-5 prose-h3:mt-10 prose-h3:font-bold prose-h3:text-slate-800 dark:prose-h3:text-gray-200
          prose-p:text-slate-800 dark:prose-p:text-gray-300 prose-p:leading-[1.9] prose-p:mb-6 prose-p:text-[17px]
          prose-strong:text-slate-900 dark:prose-strong:text-gray-100 prose-strong:font-bold
          prose-ul:my-6 prose-ul:pl-10
          prose-ol:my-6 prose-ol:pl-10
          prose-li:text-slate-800 dark:prose-li:text-gray-300 prose-li:mb-4 prose-li:leading-[1.85]
          prose-blockquote:border-l-4 prose-blockquote:border-slate-700 dark:prose-blockquote:border-gray-500 prose-blockquote:pl-8 prose-blockquote:italic prose-blockquote:my-8
          prose-hr:border-slate-400 dark:prose-hr:border-gray-600 prose-hr:my-12 prose-hr:border-t-2
        "
        style={{
          lineHeight: '1.9',
          textAlign: 'justify',
          hyphens: 'auto',
          wordSpacing: '0.05em',
        }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // H1: Main document title (rarely used in body as we have header)
              h1: ({node, ...props}) => (
                <h1 className="text-center uppercase tracking-[0.25em] border-b-4 border-slate-900 dark:border-gray-300 pb-8 mb-12 mt-0 text-4xl font-extrabold" {...props} />
              ),
              // H2: Article/Section headers (e.g., "ARTICLE 1. DEFINITIONS")
              h2: ({node, children, ...props}) => (
                <h2 className="uppercase tracking-[0.15em] border-b-2 border-slate-500 dark:border-gray-500 pb-4 mt-16 mb-8 text-2xl font-extrabold flex items-center gap-3" {...props}>
                  <span className="inline-block w-1.5 h-8 bg-slate-900 dark:bg-gray-300 rounded-full"></span>
                  {children}
                </h2>
              ),
              // H3: Subsection headers
              h3: ({node, children, ...props}) => (
                <h3 className="font-bold mt-10 mb-5 text-slate-900 dark:text-gray-100 text-xl tracking-wide" {...props}>
                  {children}
                </h3>
              ),
              // Paragraphs - Premium legal formatting
              p: ({node, children, ...props}) => {
                const text = children?.toString() || '';

                // Signature blocks - premium formatting
                if (text.includes('_____') || text.toLowerCase().includes('signature') || text.toLowerCase().includes('executed')) {
                  return (
                    <div className="my-12 p-8 border-l-4 border-slate-800 dark:border-gray-400 bg-slate-50 dark:bg-gray-800/30 shadow-sm">
                      <p className="font-semibold text-slate-900 dark:text-gray-100 leading-loose tracking-wide" {...props}>{children}</p>
                    </div>
                  );
                }

                // IN WITNESS WHEREOF and similar ceremonial language
                if (text.includes('IN WITNESS WHEREOF') || text.includes('EXECUTED')) {
                  return (
                    <p className="mb-8 mt-12 leading-loose text-center font-bold text-slate-900 dark:text-gray-100 uppercase tracking-widest text-sm" {...props}>
                      {children}
                    </p>
                  );
                }

                // Definitions or all-caps sections (article headers in text)
                if (text === text.toUpperCase() && text.length > 10 && text.length < 200) {
                  return (
                    <p className="font-bold text-lg mt-8 mb-5 text-slate-900 dark:text-gray-100 uppercase tracking-wide" {...props}>
                      {children}
                    </p>
                  );
                }

                // WHEREAS clauses - traditional legal formatting
                if (text.startsWith('WHEREAS') || text.startsWith('NOW, THEREFORE')) {
                  return (
                    <p
                      className="mb-5 leading-[1.9] text-justify font-serif text-slate-800 dark:text-gray-300"
                      {...props}
                    >
                      {children}
                    </p>
                  );
                }

                // Standard paragraphs
                return <p className="mb-6 leading-[1.9] text-justify" {...props}>{children}</p>;
              },
              // Lists - professional numbered clauses and bullet points
              ol: ({node, ...props}) => (
                <ol className="list-decimal pl-12 my-8 space-y-5 marker:font-bold marker:text-slate-700 dark:marker:text-gray-400" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc pl-12 my-8 space-y-4 marker:text-slate-600 dark:marker:text-gray-500" {...props} />
              ),
              li: ({node, children, ...props}) => {
                return (
                  <li className="leading-[1.85] text-justify pl-3" {...props}>
                    {children}
                  </li>
                );
              },
              // Strong/Bold for defined terms and emphasis
              strong: ({node, children, ...props}) => {
                const text = children?.toString() || '';
                // Defined terms (in quotes or all caps) - extra emphasis
                if (text.includes('"') || text === text.toUpperCase()) {
                  return <strong className="font-extrabold text-slate-900 dark:text-gray-100 tracking-wide" {...props}>{children}</strong>;
                }
                return <strong className="font-bold text-slate-900 dark:text-gray-100" {...props}>{children}</strong>;
              },
              // Blockquotes for special notices and recitals
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-slate-700 dark:border-gray-400 pl-10 py-5 my-10 bg-slate-50 dark:bg-gray-800/20 italic text-slate-700 dark:text-gray-300 shadow-sm" {...props} />
              ),
              // Section breaks with legal section symbol
              hr: ({node, ...props}) => (
                <div className="my-16 flex items-center justify-center">
                  <hr className="flex-1 border-t-2 border-slate-300 dark:border-gray-700" {...props} />
                  <span className="px-6 text-2xl text-slate-400 dark:text-gray-600 font-serif">§</span>
                  <hr className="flex-1 border-t-2 border-slate-300 dark:border-gray-700" />
                </div>
              ),
            }}
          >
            {document}
          </ReactMarkdown>
        </article>
      </div>

      {/* Premium Document Footer */}
      <div className="bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-16 py-10 border-t-4 border-slate-900 dark:border-gray-600">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-sm text-slate-600 dark:text-gray-400">
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-slate-900 dark:text-gray-100 tracking-wide">
              {title}
            </p>
            <p>Prepared for signature</p>
            <p>Keep this copy for your records.</p>
          </div>

          {/* Document Metadata */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 border-l-2 border-slate-300 dark:border-gray-700 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-gray-500">Document ID</span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-200 dark:bg-gray-800 px-2 py-1 rounded">
                {docId}
              </span>
            </div>
            <div className="text-xs">
              Generated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Shield className="w-3 h-3" />
              <span>Confidential & Proprietary</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-slate-300 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Employment Agreement</span>
          </div>
          <div className="font-mono">
            Page 1 of 1 • {document.split('\n').length} lines • {Math.ceil(document.length / 2000)} estimated pages when printed
          </div>
        </div>
      </div>
    </div>
  );
}
