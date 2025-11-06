'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText } from 'lucide-react';

interface DocumentRendererProps {
  document: string;
  title?: string;
}

export function DocumentRenderer({ document, title = 'Employment Agreement' }: DocumentRendererProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Document Header - Professional Legal Style */}
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 px-12 py-8 border-b-4 border-gray-900 dark:border-gray-600">
        <div className="text-center space-y-2">
          <div className="inline-block px-4 py-1.5 bg-gray-900 dark:bg-gray-700 rounded text-white text-xs font-semibold tracking-wider uppercase mb-4">
            Legal Document
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{title}</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            <span>AI-Assisted Draft</span>
            <span className="mx-2">•</span>
            <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Document Body - Professional Legal Formatting */}
      <div className="px-12 py-10 md:px-16 md:py-12 bg-white dark:bg-gray-900" style={{
        fontFamily: 'Georgia, "Times New Roman", Times, serif'
      }}>
        <article className="prose prose-lg prose-slate dark:prose-invert max-w-none
          prose-headings:font-serif prose-headings:text-gray-900 dark:prose-headings:text-gray-100
          prose-h1:text-3xl prose-h1:mb-8 prose-h1:mt-12 prose-h1:text-center prose-h1:uppercase prose-h1:tracking-wider prose-h1:font-bold prose-h1:border-b-2 prose-h1:border-gray-300 prose-h1:pb-4
          prose-h2:text-xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-gray-800 dark:prose-h2:text-gray-200
          prose-h3:text-lg prose-h3:mb-4 prose-h3:mt-8 prose-h3:font-semibold prose-h3:text-gray-800 dark:prose-h3:text-gray-200
          prose-p:text-gray-800 dark:prose-p:text-gray-300 prose-p:leading-loose prose-p:mb-5 prose-p:text-base
          prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-bold
          prose-ul:my-5 prose-ul:pl-8
          prose-ol:my-5 prose-ol:pl-8
          prose-li:text-gray-800 dark:prose-li:text-gray-300 prose-li:mb-3 prose-li:leading-loose
          prose-blockquote:border-l-4 prose-blockquote:border-gray-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:my-6
          prose-hr:border-gray-400 dark:prose-hr:border-gray-600 prose-hr:my-10 prose-hr:border-t-2
        "
        style={{ 
          lineHeight: '1.8',
          textAlign: 'justify',
          hyphens: 'auto'
        }}
        >
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // H1: Main document title
              h1: ({node, ...props}) => (
                <h1 className="text-center uppercase tracking-widest border-b-4 border-gray-800 dark:border-gray-400 pb-6 mb-10 mt-0 text-3xl font-bold" {...props} />
              ),
              // H2: Article/Section headers
              h2: ({node, ...props}) => (
                <h2 className="uppercase tracking-wide border-b-2 border-gray-400 dark:border-gray-600 pb-3 mt-12 mb-6 text-xl font-bold" {...props} />
              ),
              // H3: Subsection headers
              h3: ({node, ...props}) => (
                <h3 className="font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100" {...props} />
              ),
              // Paragraphs - Legal justified text
              p: ({node, children, ...props}) => {
                const text = children?.toString() || '';
                
                // Signature blocks - special formatting
                if (text.includes('_____') || text.toLowerCase().includes('signature') || text.toLowerCase().includes('executed')) {
                  return (
                    <div className="my-10 p-6 border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 leading-loose" {...props}>{children}</p>
                    </div>
                  );
                }
                
                // Definitions or all-caps sections
                if (text === text.toUpperCase() && text.length > 10 && text.length < 200) {
                  return (
                    <p className="font-bold text-base mt-6 mb-4 text-gray-900 dark:text-gray-100 uppercase tracking-wide" {...props}>
                      {children}
                    </p>
                  );
                }
                
                // WHEREAS clauses
                if (text.startsWith('WHEREAS') || text.startsWith('NOW, THEREFORE')) {
                  return (
                    <p className="mb-4 leading-loose indent-12 text-justify font-serif" {...props}>{children}</p>
                  );
                }
                
                return <p className="mb-5 leading-loose text-justify" {...props}>{children}</p>;
              },
              // Lists - numbered clauses and bullet points
              ol: ({node, ...props}) => (
                <ol className="list-decimal pl-10 my-6 space-y-4" {...props} />
              ),
              ul: ({node, ...props}) => (
                <ul className="list-disc pl-10 my-6 space-y-3" {...props} />
              ),
              li: ({node, children, ...props}) => {
                return (
                  <li className="leading-loose text-justify pl-2" {...props}>
                    {children}
                  </li>
                );
              },
              // Strong/Bold for defined terms
              strong: ({node, children, ...props}) => {
                const text = children?.toString() || '';
                // Defined terms often in quotes or all caps
                if (text.includes('"') || text === text.toUpperCase()) {
                  return <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>;
                }
                return <strong className="font-semibold" {...props}>{children}</strong>;
              },
              // Blockquotes for special notices
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-gray-700 dark:border-gray-400 pl-6 py-3 my-6 bg-gray-50 dark:bg-gray-800/30 italic text-gray-700 dark:text-gray-300" {...props} />
              ),
              // Section breaks
              hr: ({node, ...props}) => (
                <div className="my-12 flex items-center justify-center">
                  <hr className="flex-1 border-t-2 border-gray-400 dark:border-gray-600" {...props} />
                  <span className="px-4 text-gray-400 dark:text-gray-600">§</span>
                  <hr className="flex-1 border-t-2 border-gray-400 dark:border-gray-600" />
                </div>
              ),
            }}
          >
            {document}
          </ReactMarkdown>
        </article>
      </div>

      {/* Document Footer - Professional */}
      <div className="bg-gray-100 dark:bg-gray-800 px-12 py-6 border-t-4 border-gray-900 dark:border-gray-600">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-400 text-sm">⚖️</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-400 max-w-md">
              <strong className="font-semibold text-gray-900 dark:text-gray-200">Legal Notice:</strong> This AI-assisted document should be reviewed by a qualified attorney admitted to practice in the relevant jurisdiction before execution.
            </p>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-500 flex flex-col items-end gap-1">
            <span className="font-mono">Document ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            <span>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
